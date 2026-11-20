# Pennywise requirement traceability — 20 November 2026

| Requirement | Acceptance evidence | Implementation | Current status |
|---|---|---|---|
| PNY-001 Import transactions | Valid CSV/TXT rows accepted; malformed input rejected; replacement is atomic | lib/parser.ts, lib/validation.ts, transaction API | Implemented; SQLite and PostgreSQL rollback checks pass in CI |
| PNY-002 Categorise transactions | Known merchants map deterministically; unknown categories remain safe | lib/domain.ts | Unit tests passed |
| PNY-003 Calculate financial picture | Income, expenses, estimated savings, spending score and daily budget derive from normalized inputs | lib/domain.ts | Unit tests passed |
| PNY-004 Generate plans | Three deterministic options generated from server-side metrics | lib/domain.ts, plans API | Source implemented; local checks passed |
| PNY-005 Accept plan | Server recomputes plan; one active plan per user enforced with DB partial unique index | plans API, Postgres schema, persistence adapter | Disposable PostgreSQL CI concurrency test passed; permanent Neon still pending |
| PNY-006 Financial profile | Budget, emergency target, net worth, debt payment, dependents and preferences persist | Profile API, persistence adapter | SQLite and disposable PostgreSQL CI smoke tests passed; permanent Neon/Preview unverified |
| PNY-007 Savings goals | Create/list/update progress; mutation is owner-scoped | Goals API, persistence adapter | SQLite and disposable PostgreSQL CI smoke tests passed; permanent Neon/Preview unverified |
| PNY-008 User isolation | Unauthenticated requests rejected; user A cannot access user B financial records | Auth boundary, owner predicates and Postgres RLS | SQLite and disposable PostgreSQL RLS tests passed; permanent Neon/Preview unverified |
| PNY-009 Credential/session security | Salted scrypt hash; opaque HttpOnly cookie; hashed server token | credentials.ts, auth.ts | Implemented in source; rate limiting, account recovery and operational cleanup open |
| PNY-010 Input validation | Invalid transaction, profile, goal and credential input rejected | validation.ts, credential validator | Domain tests cover impossible dates and database-safe numeric ranges; API/browser negative cases still required |
| PNY-011 Atomic statement replacement | Failed replacement leaves prior statement intact | SQLite repository; Postgres transaction | SQLite and disposable PostgreSQL rollback checks passed |
| PNY-013 Postgres RLS | Financial tables have enabled/forced RLS, user policies and runtime role is not owner/BYPASSRLS | db/schema.sql, lib/db-runtime.ts, CI PG suite | Disposable PostgreSQL 16 CI test passed; permanent Neon role/schema setup still pending |
| PNY-016 Text PDF import | Supported text rows normalize into transaction contract; oversized/invalid PDF rejected | lib/pdf.ts, PDF route | Source and local fixture exist; representative bank layouts and hostile-file tests pending |
| PNY-017 Financial assessment | Net worth, budget, emergency target, debt, dependents and preferences persist | Profile API, persistence adapter | SQLite and disposable PostgreSQL CI smoke tests passed; browser journey pending |
| PNY-018 Projection | One-year projection uses profile and selected deterministic plan, not LLM arithmetic | Existing product implementation | Source present; browser validation pending |

## Latest automated verification — GitHub Actions run #41
- Committed lockfile and clean `npm ci`: passed.
- High-severity dependency audit: passed with Next.js 16.4.6 and Zod 4.6.7.
- PostgreSQL 16 integration suite using isolated non-owner/no-BYPASSRLS role: passed. Includes no-context RLS, tenant-scoped reads, cross-user write denial, connection identity reset, rollback and concurrent accepted-plan uniqueness.
- Domain/input-security tests, local SQLite persistence/isolation checks, TypeScript typecheck and Next.js production build: passed.

## Required release evidence still missing
- Permanent Neon migration and production runtime role/grants verified against the intended persistent branch.
- Vercel project access, Preview deployment and hosted DATABASE_URL validation.
- Complete browser E2E journey across two accounts, including permissions and recovery/failure states.
- Rate limiting, credential-stuffing, account recovery and adversarial CSRF/cross-origin tests.
- Responsive/accessibility review on real browser/device viewports.
- Representative PDF compatibility and malicious-file/resource exhaustion tests.
- Audit events, observability, backup/restore and incident-response evidence.
- Independent security and release review.

Automated PostgreSQL evidence here refers to a throwaway CI database with synthetic data. It does not certify the permanent Neon environment or a deployed runtime. The release remains NOT PRODUCTION READY.
