# Pennywise implementation review — 2026-11-16

## Scope and branch
- Repository: dqve/pennywise
- Base: main at 95142f583c9bab59771b4a10735bc628eee9ec09
- Feature branch: feat/violet-postgres-auth-hardening
- Changes are isolated from main.

## Implemented on this branch
- Violet responsive app shell, Overview, Transactions, Plans, Savings Goals and Financial Profile.
- Restored the one-year projection view using the current net worth plus the selected plan's monthly savings target × 12. It is clearly labelled illustrative and excludes returns, inflation, debt changes and unimported activity.
- Async Postgres adapter for hosted runtime; local SQLite remains for development and deterministic tests.
- Fail-closed hosted behavior when DATABASE_URL is missing.
- PostgreSQL ENABLE + FORCE RLS policies on transactions, financial_profiles, savings_goals and financial_plans using transaction-local app.user_id derived from the verified server session.
- One accepted financial plan per user enforced by a partial unique index.
- Salted scrypt password hashes, hashed opaque session tokens and HttpOnly cookies.
- Signup/login response handling distinguishes validation, duplicate credentials and service failure.
- Documentation, traceability, QA cases and GitHub Actions quality checks.

## Locally verified
- Node.js 22.16.0.
- Domain tests: 3/3 passed.
- scripts/verify.ts: domain, local SQLite persistence, atomic replacement, credential validation and user-isolation verification passed.

## Neon migration validation
A schema migration was prepared on disposable Neon branch br-long-heart-zaqka3zz. Under a dedicated read/write application role:
- app role flags: rolsuper=false, rolbypassrls=false, rolcreaterole=false, rolcreatedb=false.
- With no app.user_id context, SELECT on transactions returned zero rows.
- With rls-test-a context, only rls-test-a rows were visible in transactions, financial_profiles, savings_goals and financial_plans.
- A cross-user UPDATE returned no rows.
- A cross-user INSERT was rejected by the transactions RLS policy (SQLSTATE 42501).
- Migration branch contains only synthetic test records; the production/default Neon branch was not changed.
- Permanent migration and runtime role provisioning are awaiting explicit approval.

## Open release gates
1. Install dependencies in CI, generate/commit a lockfile and pass typecheck/build.
2. Run the Postgres integration suite on the permanent branch with its dedicated runtime role.
3. Configure server-only DATABASE_URL in Vercel Preview and Production and deploy a Preview.
4. Run full browser E2E across two accounts, including login, logout, import, profile, plans, goals, projection and unauthorized/forbidden states.
5. Complete login/signup rate limiting, CSRF, upload-abuse and dependency security review.
6. Implement audit logging, alerting, session cleanup, backup/restore and incident runbook.
7. Validate real-device responsive behavior, accessibility and representative PDF formats.

## Release decision
NOT PRODUCTION READY. Do not process real customer financial data until the open gates are closed and evidence is retained.
