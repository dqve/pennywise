# Pennywise MVP implementation status

## Implemented in source
- Responsive single-page Pennywise dashboard; warm off-white canvas, forest-green financial-health hero and established financial journey are preserved.
- Email/password auth using salted scrypt hashes.
- Opaque random session tokens; only SHA-256 hashes stored server-side; HttpOnly cookies.
- Authenticated customer API boundary.
- User-scoped transaction/profile/goal/plan access.
- CSV/TXT transaction import, deterministic categorisation and validation.
- Text-based PDF import using a portable Node PDF parser.
- Transaction ownership and duplicate-ID validation.
- Deterministic income, expense, estimated savings, savings-rate, spending-score and daily-budget calculations.
- Three generated financial plan options; server recomputes accepted plan values.
- Persistent financial profile and savings goals.
- Goal progress owner-scoped mutations.
- Atomic statement replacement.
- Local SQLite persistence for Node 22 development and tests.
- Async PostgreSQL persistence adapter with transaction-local app.user_id.
- PostgreSQL ENABLE + FORCE RLS policies for transactions, financial_profiles, savings_goals and financial_plans in the migration source.
- Partial unique index for one accepted plan per user.
- Searchable, sortable, category-filtered and paginated full transaction history with mobile stacked-row layout.
- Expense category breakdown derived from imported transactions; balance masking; reduced-motion-aware amount feedback.
- Deployment, architecture, security, traceability and UI component selection documentation.
- Domain and local SQLite persistence/user-isolation checks.

## Not yet release-complete
- Hosted PostgreSQL schema and role setup; connection to the already-provisioned Neon project is not yet verified.
- RLS runtime test under the exact dedicated non-owner/no-BYPASSRLS role on the permanent branch.
- Preview deployment and complete browser E2E, including two-account isolation.
- Authentication rate limiting and CSRF/cross-origin adversarial review.
- Audit logging, alerting, session cleanup and recovery flows.
- Dependency/SCA scan, accessibility and real-device responsive review.
- PDF compatibility testing across representative bank statements; OCR and bank-specific parsers.
- Backup/restore and failure-recovery drill.
- Vercel Preview and production deployment.

## Verification record
- Node.js 22 CI workflow added.
- Previous CI run: domain tests 3/3, persistence/isolation verification, TypeScript typecheck and Next.js production build passed before the latest visual UI refinements.
- Final UI revision CI and rendered Preview review: pending.
- Neon RLS behaviour passed on a disposable migration branch using a scoped non-owner role; permanent branch remains unchanged.
- Production Postgres and Vercel runtime: not verified.

## Release decision
NOT PRODUCTION READY. Do not process real customer financial data until all release gates are completed and evidence is retained.
