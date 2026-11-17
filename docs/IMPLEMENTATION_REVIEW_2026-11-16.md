# Pennywise implementation review — 17 November 2026

## Scope and branch
- Repository: dqve/pennywise
- Base: main at 95142f583c9bab59771b4a10735bc628eee9ec09
- Feature branch: feat/violet-postgres-auth-hardening
- Draft PR: https://github.com/dqve/pennywise/pull/1
- Changes are isolated from main.

## Product UI direction
Following the product owner's direction, this is a progressive enhancement, not a visual or navigation replacement.
- Retains the single-page dashboard structure from main.
- Retains the warm off-white background, forest-green health hero, neutral cards and existing visual identity.
- Does not introduce the previously drafted purple redesign, sidebar, or hidden page-based navigation.
- Adds complete transaction search/filter/sort/pagination, category spending breakdown, privacy balance masking and subtle amount-change feedback.
- The EasyUI component review and selection rationale are recorded in docs/UI_REVIEW_EASYUI_2026-11-17.md.

## Implemented on this branch
- Authenticated email/password flow with salted scrypt hashes and hashed opaque session tokens.
- HttpOnly, SameSite=Lax session cookie with Secure in production.
- Async PostgreSQL repository for hosted runtime; local SQLite for development.
- Vercel requests fail closed when DATABASE_URL is absent.
- PostgreSQL ENABLE + FORCE RLS policies on transactions, financial_profiles, savings_goals and financial_plans. Transaction-local app.user_id is set only after the server resolves the verified session. Queries also carry explicit owner predicates.
- Partial unique index enforces one accepted plan per user.
- User-scoped profile, goal and transaction APIs; goal-progress updates cannot exceed target.
- Atomic transaction replacement.
- Portable pdf-parse extraction for a limited text-based statement row format.
- Requirements, QA, architecture, deployment, security and UI selection documentation.
- Responsive single-page dashboard refinement; no product data model or financial calculation changes.
- Full transaction table, expense category breakdown and Hide balances / Show balances control.

## CI evidence
- Previous complete quality run: https://github.com/dqve/pennywise/actions/runs/43972759552
- That run passed dependency installation, 3/3 domain tests, local SQLite persistence/isolation verification, TypeScript typecheck and Next.js production build.
- A final run is required after the latest progressive UI changes; do not reuse the earlier pass as evidence for the latest commit.

## Neon RLS migration validation
A schema migration was prepared and tested on disposable Neon branch br-long-heart-zaqka3zz. Under a dedicated read/write runtime role:
- Role flags: rolsuper=false, rolbypassrls=false, rolcreaterole=false, rolcreatedb=false.
- With no app.user_id context, protected financial reads returned zero rows.
- With user A context, protected tables returned only user A rows.
- Cross-user UPDATE returned no rows.
- Cross-user INSERT was rejected by the RLS policy (SQLSTATE 42501).
- The temporary branch contains only synthetic verification records; the default Neon branch remains unchanged.
- Applying the permanent migration and creating the production runtime role remain pending explicit approval.

## Remaining release gates
1. Apply and verify the permanent Neon migration, least-privilege runtime role and RLS configuration.
2. Configure the private runtime DATABASE_URL in Vercel Preview and Production.
3. Deploy Preview and complete browser E2E across two accounts, including transaction replacement, profile, plans, goals, balance masking and authorization failures.
4. Complete login/signup rate limiting, CSRF/cross-origin, upload-abuse and dependency security review.
5. Add audit logging, alerting, session cleanup, backup/restore and incident runbook.
6. Complete rendered desktop/mobile, keyboard and screen-reader review.
7. Add automated Postgres RLS/concurrency/recovery integration tests to CI.

## Release decision
NOT PRODUCTION READY. Do not process real customer financial data until the open gates are closed and evidenced.
