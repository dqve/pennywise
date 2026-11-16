# Pennywise MVP — Requirements & Acceptance Matrix

## Requirement classification
- **Confirmed Requirement:** explicitly established in Pennywise product discussions.
- **Derived Requirement:** necessary to make a confirmed requirement reliable and testable.
- **Proposed Implementation:** engineering choice, not a product requirement.
- **Open Decision:** deliberately unresolved product/integration choice.

| ID | Classification | Requirement | Acceptance criteria | Evidence / status |
|---|---|---|---|---|
| PNY-001 | Confirmed | User can ingest transaction history | Valid CSV/TXT imports; malformed rows rejected; imported data is the financial source | Parser, validation and local verification implemented |
| PNY-002 | Confirmed | Transactions are categorised | Known merchants categorise deterministically; unknown merchants become Other | Domain tests passed |
| PNY-003 | Confirmed | Financial health is calculated | Income, spend, savings, savings rate, spending score and daily budget derive from transactions | Domain tests passed |
| PNY-004 | Confirmed | User receives financial plans | Three distinct plans are generated from deterministic metrics | Source implemented; local verification passed |
| PNY-005 | Confirmed | User can accept a plan | Accepted plan persists and only one active plan remains per user | SQLite verification passed; Postgres unique index pending permanent migration |
| PNY-006 | Confirmed | User can set financial guardrails | Monthly budget and emergency-fund target persist per user | SQLite verification passed; Postgres unverified |
| PNY-007 | Confirmed | User can create savings goals | Goal name/target/current are validated and persisted per user | SQLite verification passed; Postgres unverified |
| PNY-017 | Confirmed | User can complete a financial assessment | Net worth, budget, emergency-fund target, debt payment, dependents, income stability and primary goal persist | SQLite verification passed |
| PNY-018 | Confirmed | User can see a one-year financial projection | Projection uses current net worth and selected deterministic plan; no LLM arithmetic; assumptions are visible | Projection restored in overview; browser validation pending |
| PNY-008 | Derived | Financial data must be user-isolated | Unauthenticated requests rejected; user A cannot read or mutate user B financial data | SQLite verification passed; Neon RLS tested on temporary branch |
| PNY-009 | Derived | Credentials must not be stored in plaintext | Passwords use salted scrypt hashes; session tokens are stored hashed; cookie is HttpOnly | Source implemented; abuse controls open |
| PNY-010 | Derived | Invalid financial inputs fail closed | API rejects invalid dates, amounts, categories, budgets and goals with 4xx responses | Validation and local checks implemented |
| PNY-011 | Derived | Statement replacement is atomic | Failed replacement leaves previous statement intact | SQLite atomic failure check passed; Postgres transaction unverified on permanent branch |
| PNY-012 | Proposed Implementation | Local MVP persistence uses Node SQLite | App runs without cloud DB dependency in Node 22 development | SQLite adapter and verification passed |
| PNY-013 | Proposed Implementation | Production persistence uses Postgres with RLS | Financial tables use user ownership and RLS; runtime role is non-owner and has no BYPASSRLS | Schema/adapter implemented; RLS validated on temporary Neon branch; permanent migration and role setup pending |
| PNY-014 | Open Decision | Production bank/open-banking provider | Provider and contract selected before live bank connectivity | Not implemented by design |
| PNY-015 | Open Decision | LLaMA/RAG recommendation layer | AI may explain verified metrics; deterministic engine remains authoritative | Not implemented; architecture boundary documented |
| PNY-016 | Open Decision | PDF statement extraction | If retained in product scope, PDF adapter outputs same normalized transaction contract as CSV | Limited text-PDF parser implemented as candidate capability; product decision and bank-layout validation remain open |

## Release gates
A production MVP release is not complete until all of these are green:
1. Domain tests and API tests
2. Authentication/session tests
3. SQLite and Postgres tenant-isolation/RLS tests under the intended runtime role
4. Atomic replacement and concurrent-write tests
5. Next.js typecheck and production build
6. Browser E2E happy, negative and recovery paths
7. Accessibility and real-device responsive review
8. CSRF, brute-force, upload-abuse and dependency security review
9. Production Postgres role/configuration and migration verification
10. Backup/restore, observability, operations and incident-recovery readiness
11. PDF ingestion verification if PNY-016 is adopted

## Verification snapshot — 2026-11-16
- Local domain tests: 3/3 passed.
- Local SQLite persistence/user-isolation/atomic replacement script: passed.
- Neon RLS migration: prepared and tested on a disposable branch; no permanent Neon schema changes made.
- Full dependency installation, TypeScript typecheck, Next.js build and browser E2E: pending GitHub Actions / deployment.
- Vercel Preview and Production deployment: blocked until project connector access and runtime DATABASE_URL configuration are resolved.

No item is Production Ready solely because source code exists. Test evidence and deployed behavior remain required.
