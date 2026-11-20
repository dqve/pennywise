import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

const adminUrl = process.env.PENNYWISE_TEST_ADMIN_DATABASE_URL;
if (!adminUrl) throw new Error('PENNYWISE_TEST_ADMIN_DATABASE_URL is required for isolated PostgreSQL tests');

const admin = postgres(adminUrl, { max: 1, connect_timeout: 10, prepare: false });
try {
  const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  await admin.unsafe(schema);
  await admin.unsafe(`
    CREATE ROLE pennywise_test_runtime
      LOGIN PASSWORD 'pennywise_test_password'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  `);
  await admin.unsafe('GRANT CONNECT ON DATABASE pennywise_ci TO pennywise_test_runtime');
  await admin.unsafe('GRANT USAGE ON SCHEMA public TO pennywise_test_runtime');
  await admin.unsafe('GRANT SELECT, INSERT, UPDATE, DELETE ON users, sessions, transactions, financial_profiles, savings_goals, financial_plans TO pennywise_test_runtime');
  const [role] = await admin`
    SELECT rolsuper, rolbypassrls, rolcreaterole, rolcreatedb
    FROM pg_roles WHERE rolname = 'pennywise_test_runtime'
  `;
  if (!role || role.rolsuper || role.rolbypassrls || role.rolcreaterole || role.rolcreatedb) {
    throw new Error('PostgreSQL test runtime role is not least-privileged');
  }
  console.log('Prepared disposable PostgreSQL schema and non-owner runtime role');
} finally {
  await admin.end({ timeout: 5 });
}
