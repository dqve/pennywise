import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMetrics, generatePlans, inferCategory, normalizeTransactions } from '../lib/domain.ts';
import { validateGoal, validateTransactions } from '../lib/validation.ts';
import { isSameOriginMutation } from '../lib/request-security.ts';


test('known merchants categorise deterministically', () => {
  assert.equal(inferCategory('Bolt ride', -8000), 'Transport');
  assert.equal(inferCategory('Salary ACME', 850000), 'Income');
});

test('core metrics derive from normalized transactions', () => {
  const m = calculateMetrics(normalizeTransactions([
    { id:'1', date:'2026-01-01', description:'Salary', amount:100000 },
    { id:'2', date:'2026-01-02', description:'Shoprite', amount:-25000 }
  ]));
  assert.equal(m.income, 100000);
  assert.equal(m.expenses, 25000);
  assert.equal(m.savings, 75000);
  assert.equal(m.savingsRate, .75);
});

test('financial engine produces three actionable plans', () => {
  const plans = generatePlans(calculateMetrics([{id:'1',date:'2026-01-01',description:'salary',amount:850000,category:'Income'}]));
  assert.equal(plans.length, 3);
  assert.ok(plans.every(p => p.monthlySavings > 0));
});


test('mutation request guard accepts same-origin browser requests only', () => {
  assert.equal(isSameOriginMutation(new Request('https://pennywise.test/api/profile', {
    method: 'PUT', headers: { origin: 'https://pennywise.test' }
  })), true);
  assert.equal(isSameOriginMutation(new Request('https://pennywise.test/api/profile', {
    method: 'PUT', headers: { origin: 'https://attacker.test', 'sec-fetch-site': 'cross-site' }
  })), false);
  assert.equal(isSameOriginMutation(new Request('https://pennywise.test/api/profile', {
    method: 'PUT', headers: { origin: 'null' }
  })), false);
  assert.equal(isSameOriginMutation(new Request('https://pennywise.test/api/profile', {
    method: 'PUT', headers: { 'sec-fetch-site': 'same-origin' }
  })), true);
  assert.equal(isSameOriginMutation(new Request('https://pennywise.test/api/profile', {
    method: 'PUT', headers: { 'sec-fetch-site': 'same-site' }
  })), false);
});

test('transaction validation rejects impossible calendar dates and unsupported numeric ranges', () => {
  assert.doesNotThrow(() => validateTransactions([
    { id: 'leap-day', date: '2024-02-29', description: 'Valid transaction', amount: 100 }
  ]));
  assert.throws(() => validateTransactions([
    { id: 'impossible-day', date: '2026-02-31', description: 'Invalid date', amount: 100 }
  ]), /Invalid transaction date/);
  assert.throws(() => validateTransactions([
    { id: 'oversized-amount', date: '2026-02-28', description: 'Unsupported amount', amount: 1e16 }
  ]), /Invalid transaction amount/);
});

test('goal validation enforces the supported database numeric range', () => {
  assert.doesNotThrow(() => validateGoal({ name: 'Emergency fund', target: 1e15, current: 0 }));
  assert.throws(() => validateGoal({ name: 'Unbounded target', target: 1e16 }), /supported range/);
});
