# Pennywise MVP implementation status — 20 November 2026

## Implemented in source
- Responsive single-page Pennywise dashboard; warm off-white canvas, forest-green financial-health hero and established financial journey are preserved.
- Email/password auth using salted scrypt hashes; unknown-account login path also performs a dummy scrypt operation.
- Opaque random session tokens; only SHA-256 hashes stored server-side; HttpOnly SameSite cookies, Secure in production.
- Authenticated customer API boundary and owner-scoped transaction/profile/goal/plan access.
- Same-origin request checks on all state-changing API routes (Origin exact match; Sec-Fetch-Site same-origin fallback).
- CSV/TXT transaction import, deterministic categorisation and validation.
- Strict calendar-date validation, transaction ID/amount bounds and savings-goal target bounds.
- Text-based PDF import using a portable Node PDF parser; 10MB cap and PDF signature check.
- Deterministic income, expense, estimated savings, savings-rate, spending-score and daily-budget calculations.
- Three generated financial plan options; server recomputes accepted plan values.
- Persistent financial profile and savings goals; owner-scoped goal-progress mutations.
- Atomic statement replacement.
- Local SQLite persistence for Node 22 development and tests.
- Async PostgreSQL persistence adapter with transaction-local app.user_id.
- PostgreSQL ENABLE + FORCE RLS policies for transactions, financial_profiles, savings_goals and financial_plans in the migration source.
- Partial unique index for one accepted plan per user.
- Searchable, sortable, category-filtered and paginated full transaction history with mobile stacked-row layout.
- Expense category breakdown derived from imported transactions; balance masking; reduced-motion-aware amount feedback.
- Dependency versions pinned in package-lock.json: Next.js 16.4.6 and Zod 4.6.7.
- Per-PR high-severity dependency audit in CI.
- Isolated PostgreSQL 16 integration tests run in CI with a dedicated non-owner/no-BYPASSRLS role.
- Domain/input-security tests, local SQLite persistence/isolation checks, TypeScript typecheck and Next.js production build in CI.
- Deployment, architecture, security, traceability and UI component selection documentation.

## Verification record
Latest branch head verified by GitHub Actions run #41:
- Clean dependency install from committed lockfile (`npm ci`): passed.
- `npm audit --audit-level=high`: passed.
- PostgreSQL RLS/tenant-isolation/rollback/concurrency integration suite: passed against an ephemeral PostgreSQL 16 service and least-privilege runtime role.
- Domain/input-security unit tests: passed.
- SQLite persistence, user-isolation and atomic replacement checks: passed.
- TypeScript typecheck: passed.
- Next.js production build: passed.

The CI database contains only synthetic data and is destroyed after the run. Previous testing also validated RLS on a disposable Neon migration branch. Neither check proves the permanent/default Neon branch is migrated or the production database role has been provisioned.

## Not yet release-complete
- Confirm Vercel team/project access and the exact Pennywise project; access remains unresolved.
- Configure private server-side DATABASE_URL for the Preview environment and verify hosted runtime.
- Apply migration to permanent Neon branch, create the least-privilege production role, grant only required permissions and verify under the actual connection.
- Preview deployment and complete browser E2E, including two-account tenant isolation and unauthorized/forbidden failures.
- Authentication rate limiting, credential-stuffing protection and account recovery.
- Dedicated adversarial CSRF/cross-origin review beyond the implemented origin guard and unit tests.
- Audit logging, alerting, session cleanup, backup/restore and incident-response runbook.
- Accessibility and real-device responsive review.
- PDF compatibility across representative bank statements and malicious-file/resource-exhaustion testing.
- Independent security review and production operational monitoring.

## Release decision
NOT PRODUCTION READY. Do not process real customer financial data until all release gates are completed and evidence is retained.
