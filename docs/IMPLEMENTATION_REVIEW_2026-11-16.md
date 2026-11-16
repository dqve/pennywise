# Pennywise implementation review — 2026-11-16

## Scope and branch
- Repository: dqve/pennywise
- Base: main at 95142f583c9bab59771b4a10735bc628eee9ec09
- Feature branch: feat/violet-postgres-auth-hardening
- Draft PR: https://github.com/dqve/pennywise/pull/1
- Changes are isolated from main.

## Implemented on this branch
- Violet responsive app shell: Overview, Transactions, Plans, Savings Goals and Financial Profile.
- One-year deterministic projection uses current net worth + selected plan monthly savings × 12, explicitly labelled illustrative with exclusions.
- Async PostgreSQL repository for hosted runtime; local SQLite for development and tests.
- Vercel fails closed when DATABASE_URL is absent.
- PostgreSQL ENABLE + FORCE RLS policies on transactions, financial_profiles, savings_goals and financial_plans. A transaction-local app.user_id is set only after the server resolves the verified session. Queries also carry explicit owner predicates.
- Partial unique index enforces one accepted plan per user.
- Salted scrypt hashes, hashed opaque session tokens and HttpOnly cookies.
- API error mapping distinguishes unauthenticated, invalid input and service failures.
- PDF extraction uses pdf-parse in the same path used locally and in hosted runtime.
- GitHub Actions CI, requirements/traceability, QA, architecture, deployment and security documentation.

## CI verification — GitHub Actions run #3
- Dependency installation: passed.
- Domain unit tests: 3/3 passed.
- Local persistence, credential, atomic replacement and user-isolation script: passed.
- TypeScript typecheck: passed.
- Next.js production build: passed.
- A prior run exposed PDF date-regex escaping; corrected before run #3.
- Run URL: https://github.com/dqve/pennywise/actions/runs/43972759552

## Neon RLS migration validation
A schema migration was prepared and tested on disposable Neon branch br-long-heart-zaqka3zz. Under a dedicated read/write runtime role:
- Role flags: rolsuper=false, rolbypassrls=false, rolcreaterole=false, rolcreatedb=false.
- With no app.user_id context, protected financial reads returned zero rows.
- With user A context, protected tables returned only user A rows.
- Cross-user UPDATE returned no rows.
- Cross-user INSERT was rejected by the RLS policy (SQLSTATE 42501).
- Temporary branch contains only synthetic verification records; default Neon branch remains unchanged.
- Applying the permanent migration and creating the production runtime role are pending explicit approval.

## Remaining release gates
1. Apply RLS/unique-index migration to the default Neon branch, create the least-privilege runtime role, and verify grants/flags.
2. Configure that role's server-only DATABASE_URL in Vercel Preview and Production.
3. Deploy Preview and execute the complete browser E2E across two accounts.
4. Add login/signup rate limiting and complete CSRF/cross-origin, upload-abuse and dependency security review.
5. Add audit logging, alerting, session cleanup, backup/restore and incident runbook.
6. Complete real-device responsive, accessibility and representative statement-parser validation.
7. Add Postgres integration tests for RLS and concurrent/rollback behavior to automated CI.

## Release decision
NOT PRODUCTION READY. Do not process real customer financial data until the open gates are closed and evidenced.
