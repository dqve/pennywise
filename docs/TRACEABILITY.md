# Pennywise requirement traceability

| Requirement | Acceptance evidence | Implementation | Current status |
|---|---|---|---|
| PNY-001 Import transactions | Valid CSV/TXT rows accepted; malformed input rejected; replacement is atomic | lib/parser.ts, lib/validation.ts, transaction API | Local verification passed |
| PNY-002 Categorise transactions | Known merchants map deterministically; unknown categories remain safe | lib/domain.ts | Unit tests passed |
| PNY-003 Calculate financial picture | Income, expenses, estimated savings, spending score and daily budget derive from normalized inputs | lib/domain.ts | Unit tests passed |
| PNY-004 Generate plans | Three deterministic options generated from server-side metrics | lib/domain.ts, plans API | Local source verified |
| PNY-005 Accept plan | Server recomputes plan; one active plan per user enforced with a DB partial unique index | plans API, Postgres schema, persistence adapter | Source implemented; hosted Postgres unverified |
| PNY-006 Financial profile | Budget, emergency target, net worth, debt payment, dependents and preferences persist | Profile API, persistence adapter | SQLite verification passed; Postgres unverified |
| PNY-007 Savings goals | Create/list/update progress; mutation is owner-scoped | Goals API, persistence adapter | SQLite verification passed; Postgres unverified |
| PNY-008 User isolation | Unauthenticated requests rejected; user A cannot access user B financial records | Auth boundary, user predicates and Postgres RLS | SQLite verification passed; hosted RLS unverified |
| PNY-009 Credential/session security | Salted scrypt hash; opaque HttpOnly cookie; hashed server token | credentials.ts, auth.ts | Local source verification; abuse controls open |
| PNY-010 Input validation | Invalid transaction, profile, goal and credential input rejected | validation.ts, credential validator | Local verification passed |
| PNY-011 Atomic statement replacement | Failed replacement leaves prior statement intact | SQLite repository; Postgres transaction | SQLite verification passed; Postgres unverified |
| PNY-013 Postgres RLS | Financial tables have enabled/forced RLS, user policies and runtime role is not owner/BYPASSRLS | db/schema.sql, lib/db-runtime.ts, deployment setup | Source implemented; database role/configuration unverified |
| PNY-016 Text PDF import | Supported text rows normalize into transaction contract; oversized/invalid PDF rejected | lib/pdf.ts, PDF route | Local dev fixture verified; hosted parser unverified |
| PNY-017 Financial assessment | Net worth, budget, emergency target, debt, dependents and preferences persist | Profile API, persistence adapter | SQLite verification passed |
| PNY-018 Projection | One-year projection uses profile and selected deterministic plan, not LLM arithmetic | Existing product implementation | Browser validation pending |

## Required release evidence still missing
- Dependency install, full typecheck and Next.js production build.
- Postgres integration tests under the intended runtime role, including transaction-local identity reset and RLS tenant isolation.
- Preview deployment and full browser E2E journey across at least two accounts.
- Responsive review on actual mobile viewport/device and accessibility checks.
- Negative permission tests for every customer-owned API.
- CSRF, brute-force, upload-abuse and dependency security review.
- Production database backup/restore and incident-response evidence.
- Observability and redacted operational logging.

Statuses above refer to local checks/source review only. No hosted Postgres or Vercel result is implied.
