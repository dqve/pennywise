# Pennywise — personal finance MVP

Pennywise helps a user understand imported financial activity, calculate a deterministic financial snapshot, and compare suggested savings plans.

## Current capabilities
- Violet responsive application shell: Overview, Transactions, Plans, Savings Goals and Financial Profile
- Email/password signup and login using salted scrypt password hashes
- HttpOnly session cookie; only a SHA-256 session-token hash is persisted
- CSV/TXT import, validation and deterministic category inference
- Text-based PDF statement extraction (no OCR or bank-specific layouts)
- Income, expenses, estimated savings, spending-score and daily-budget calculations
- Three deterministic plan options; server recomputes selected plan values before acceptance
- Persistent user profile, plans, transactions and savings goals
- Goal-progress updates with user-scoped ownership checks

## Architecture and persistence
- Next.js App Router and Node.js route handlers.
- Local development and automated persistence tests use Node 22 SQLite in lib/db.ts.
- Hosted Vercel deployments require a private server-side PostgreSQL DATABASE_URL; runtime fails closed when it is missing.
- Apply db/schema.sql using a privileged migration role; use a separate least-privilege application role at runtime.
- Financial tables have PostgreSQL RLS enabled and forced. Each authenticated data operation sets app.user_id transaction-locally after resolving the opaque session token. Every query also includes its user_id predicate.
- The runtime database role must not own the tables and must not have BYPASSRLS. Never expose DATABASE_URL or SQL access to browser clients.
- Authentication tables (users and sessions) are server-only and are not governed by the financial-table RLS policies.
- Never expose DATABASE_URL through a NEXT_PUBLIC_* variable.

## Local setup
Requires Node.js 22. Run npm install, copy .env.example to .env.local, then run npm test, npm run verify, npm run typecheck, npm run build and npm run dev.

For local development, leave DATABASE_URL unset and set PENNYWISE_DB_PATH to a writable local path if needed.

## Hosted setup
1. Provision PostgreSQL and apply db/schema.sql.
2. Create a restricted application database role. It must not own the tables and must not have BYPASSRLS. Grant only required DML access to the app schema/tables and set its connection string as server-only DATABASE_URL in Vercel Preview and Production.
3. Deploy using Node.js 22.x.
4. Verify signup, logout, login, refresh, import, profile, plan acceptance, savings-goal progress and RLS isolation against the hosted database before enabling real users.

See docs/DEPLOYMENT.md, docs/ARCHITECTURE.md, docs/SECURITY_REVIEW.md and docs/TRACEABILITY.md.

## Financial-product limitations
Pennywise is an MVP financial-organisation aid, not a bank-balance source, regulated financial adviser or bank-grade predictive model. Calculations are based only on transactions and profile details supplied by the user. The PDF parser supports a limited text-row format; scanned statements and institution-specific layouts are not supported.

## Release state
NOT PRODUCTION READY. Hosted database integration, browser E2E, accessibility, abuse prevention, independent security review, backups/recovery, observability and production deployment checks remain open release gates. Do not use real customer financial data until those gates have passed.
