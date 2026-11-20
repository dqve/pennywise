import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import postgres from 'postgres';
import {
  createUser, createGoal, getProfile, listGoals, listPlans, listTransactions,
  replaceTransactions, savePlan, saveProfile
} from '../lib/db-runtime.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL must point to the disposable least-privilege PostgreSQL test role');

test('PostgreSQL runtime enforces tenant RLS, rollback and accepted-plan uniqueness', async () => {
  const runtime = postgres(databaseUrl, { max: 1, idle_timeout: 5, connect_timeout: 10, prepare: false });
  try {
    const suffix = randomBytes(8).toString('hex');
    const userA = await createUser({ email: `rls-a-${suffix}@example.test`, passwordHash: 'test-hash-a', passwordSalt: 'test-salt-a' });
    const userB = await createUser({ email: `rls-b-${suffix}@example.test`, passwordHash: 'test-hash-b', passwordSalt: 'test-salt-b' });

    await replaceTransactions(userA.id, [{ id: 'a-1', date: '2026-01-01', description: 'User A row', amount: -100, category: 'Other' }]);
    await replaceTransactions(userB.id, [{ id: 'b-1', date: '2026-01-02', description: 'User B row', amount: -200, category: 'Other' }]);
    await saveProfile(userA.id, { monthlyBudget: 1000, emergencyFundTarget: 2000, currentNetWorth: 3000, monthlyDebtPayment: 100, dependents: 0, incomeStability: 'stable', primaryGoal: 'emergency' });
    await saveProfile(userB.id, { monthlyBudget: 9000, emergencyFundTarget: 8000, currentNetWorth: 7000, monthlyDebtPayment: 600, dependents: 2, incomeStability: 'variable', primaryGoal: 'debt' });
    await createGoal(userA.id, { name: 'A goal', target: 1000, current: 100 });
    await createGoal(userB.id, { name: 'B goal', target: 2000, current: 200 });
    const plan = (name: string) => ({ id: name, name, monthlySavings: 100, cut: 10, projectedGain: 1200 });
    await savePlan(userA.id, plan('A plan'));
    await savePlan(userB.id, plan('B plan'));

    const [role] = await runtime`
      SELECT rolsuper, rolbypassrls, rolcreaterole, rolcreatedb
      FROM pg_roles WHERE rolname = current_user
    `;
    assert.equal(role.rolsuper, false);
    assert.equal(role.rolbypassrls, false);
    assert.equal(role.rolcreaterole, false);
    assert.equal(role.rolcreatedb, false);

    const policies = await runtime`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relname IN ('transactions','financial_profiles','savings_goals','financial_plans')
    `;
    assert.equal(policies.length, 4);
    assert.ok(policies.every(row => row.relrowsecurity && row.relforcerowsecurity));

    const noContext = await runtime.begin(async tx => ({
      transactions: Number((await tx`SELECT count(*) AS count FROM transactions`)[0].count),
      profiles: Number((await tx`SELECT count(*) AS count FROM financial_profiles`)[0].count),
      goals: Number((await tx`SELECT count(*) AS count FROM savings_goals`)[0].count),
      plans: Number((await tx`SELECT count(*) AS count FROM financial_plans`)[0].count)
    }));
    assert.deepEqual(noContext, { transactions: 0, profiles: 0, goals: 0, plans: 0 });

    const scoped = await runtime.begin(async tx => {
      await tx`SELECT set_config('app.user_id', ${userA.id}, true)`;
      return {
        transactions: await tx`SELECT user_id FROM transactions`,
        profiles: await tx`SELECT user_id FROM financial_profiles`,
        goals: await tx`SELECT user_id FROM savings_goals`,
        plans: await tx`SELECT user_id FROM financial_plans`
      };
    });
    for (const rows of Object.values(scoped)) {
      assert.equal(rows.length, 1);
      assert.equal(rows[0].user_id, userA.id);
    }

    const crossUserUpdate = await runtime.begin(async tx => {
      await tx`SELECT set_config('app.user_id', ${userA.id}, true)`;
      return tx`UPDATE transactions SET amount = 999 WHERE user_id = ${userB.id} RETURNING id`;
    });
    assert.equal(crossUserUpdate.length, 0);

    await assert.rejects(
      runtime.begin(async tx => {
        await tx`SELECT set_config('app.user_id', ${userA.id}, true)`;
        await tx`INSERT INTO transactions(id,user_id,date,description,amount,category)
          VALUES ('forbidden-b-row', ${userB.id}, '2026-01-03', 'Cross-user insert', -1, 'Other')`;
      }),
      (error: unknown) => error instanceof Error && 'code' in error && error.code === '42501'
    );

    // Reusing the same one-connection pool must not inherit a prior transaction's identity.
    const afterIdentityReset = await runtime.begin(async tx => tx`SELECT user_id FROM transactions`);
    assert.equal(afterIdentityReset.length, 0);

    const beforeRollback = await listTransactions(userA.id);
    await assert.rejects(replaceTransactions(userA.id, [
      { id: 'duplicate-row', date: '2026-01-04', description: 'First duplicate', amount: -1, category: 'Other' },
      { id: 'duplicate-row', date: '2026-01-05', description: 'Second duplicate', amount: -2, category: 'Other' }
    ]));
    assert.deepEqual(await listTransactions(userA.id), beforeRollback);

    const goal = (await listGoals(userA.id))[0];
    assert.ok(goal);
    assert.equal((await getProfile(userA.id)).monthlyBudget, 1000);

    await Promise.allSettled([
      savePlan(userA.id, plan('Concurrent plan A')),
      savePlan(userA.id, plan('Concurrent plan B'))
    ]);
    const accepted = (await listPlans(userA.id)).filter(item => item.status === 'accepted');
    assert.equal(accepted.length, 1);
  } finally {
    await runtime.end({ timeout: 5 });
  }
});
