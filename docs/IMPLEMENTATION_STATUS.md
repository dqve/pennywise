# Pennywise MVP implementation status

## Implemented in source
- Responsive violet app shell for Overview, Transactions, Plans, Savings Goals and Financial Profile.
- Email/password auth using salted scrypt hashes.
- Opaque random session tokens; only SHA-256 hashes stored server-side; HttpOnly cookies.
- Authenticated customer API boundary.
- User-scoped transaction/profile/goal/plan access.
- CSV/TXT transaction import, deterministic categorisation and validation.
- Transaction ownership and duplicate-ID validation.
- Deterministic income, expense, estimated savings, savings-rate, spending-score and daily-budget calculations.
- Three generated financial plan options; server recomputes accepted plan values.
- Persistent financial profile and savings goals.
- Goal progress owner-scoped mutations.
- Atomic statement replacement.
- Local SQLite persistence for Node 22 development and tests.
- Async PostgreSQL persistence adapter with transaction-local app.user_id.
- PostgreSQL ENABLE + FORCE RLS policies for transactions, financial_profiles, savings_goals and financial_plans.
- Partial unique index for one accepted plan per user.
- Deployment, architecture, security and traceability documentation.
- Domain and local SQLite persistence/user-isolation checks.

## Not yet release-complete
- Hosted PostgreSQL schema and role setup; connection to the already-provisioned Neon project is not yet verified.
- RLS runtime test under the exact dedicated non-owner/no-BYPASSRLS role.
- Full dependency installation, typecheck, Next.js build and dependency scan.
- Browser E2E, accessibility and real-device responsive review.
- Login/signup rate limiting and CSRF adversarial review.
- Audit logging, alerting, session cleanup and recovery flows.
- PDF extraction fixture in hosted runtime; OCR and bank-specific parsers.
- Backup/restore and failure-recovery drill.
- Vercel Preview and production deployment.

## Verification record
- Node.js 22.16.0 local environment.
- Domain tests: 3/3 passed.
- scripts/verify.ts: passed for domain, local SQLite persistence, duplicate/atomic replacement and user isolation.
- Full typecheck/build: blocked locally because dependencies are unavailable in this environment.
- Production Postgres and Vercel runtime: not verified.

## Release decision
NOT PRODUCTION READY. Do not process real customer financial data until all release gates are completed and evidence is retained.
