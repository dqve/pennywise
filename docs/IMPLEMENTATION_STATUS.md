# Pennywise MVP implementation status

## Implemented and verified
- Responsive consumer financial-health dashboard.
- Email/password authentication with salted scrypt password hashes.
- HttpOnly opaque session cookie with server-side hashed session token.
- Authenticated API boundary for all customer financial data.
- Per-user ownership on transactions, profiles, goals and plans.
- CSV/TXT transaction ingestion with deterministic categorisation.
- Transaction validation and user-scoped duplicate-ID protection.
- Deterministic income, expense, savings, savings-rate, spending-score and daily-budget calculations.
- Three generated financial-plan options.
- Persistent plan acceptance with one active plan per user.
- Persistent financial assessment/profile including net worth, debt payment, dependents, income stability and primary goal.
- Deterministic 12-month cash/net-worth projection from the selected plan.
- Persistent savings goals.
- Atomic statement replacement.
- Local Node 22 SQLite persistence for executable development.
- Production Postgres/Supabase schema with ownership and RLS policies.
- Formal requirement/acceptance matrix and QA cases.
- Domain, validation, credentials, persistence and cross-user isolation verification.
- First-run state no longer seeds demo financial data.

## Not yet release-complete
- Text-based PDF statement extraction using a Node PDF-to-text adapter; OCR and bank-specific statement adapters remain outstanding.
- Bank/open-banking integrations.
- LLaMA/RAG recommendation service.
- Notifications, recurring savings execution and progress automation.
- Production rate limiting, abuse controls, audit logging, key-management policy and deployment secrets.
- Full browser E2E/accessibility/recovery testing.
- Full Next.js typecheck/build in this environment because npm dependency installation timed out.
- Production Postgres/Supabase integration and live RLS verification.

## Release decision
The application is a stronger authenticated MVP engineering slice, but it is **not declared production-ready** until the blocked release gates in `docs/REQUIREMENTS.md` are executed successfully.

## Toolchain

The MVP pins Next.js 16.3.8, React 19.3.0, Zod 4.6.5 and TypeScript 5.9.3 rather than floating on `latest`.
