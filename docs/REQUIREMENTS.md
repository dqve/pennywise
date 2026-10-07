# Pennywise MVP — Requirements & Acceptance Matrix

## Requirement classification

- **Confirmed Requirement:** explicitly established in the Pennywise product discussions.
- **Derived Requirement:** necessary to make a confirmed requirement reliable and testable.
- **Proposed Implementation:** engineering choice, not a product requirement.
- **Open Decision:** deliberately unresolved product/integration choice.

| ID | Classification | Requirement | Acceptance criteria | Evidence / status |
|---|---|---|---|---|
| PNY-001 | Confirmed | User can ingest transaction history | Valid CSV/TXT imports; malformed rows are rejected; imported data becomes the financial source | `lib/parser.ts`, `lib/validation.ts`, verification PASS |
| PNY-002 | Confirmed | Transactions are categorised | Known merchants categorise deterministically; unknown merchants become Other | `lib/domain.ts`, verification PASS |
| PNY-003 | Confirmed | Financial health is calculated | Income, spend, savings, savings rate, spending score and daily budget derive from transactions | `lib/domain.ts`, verification PASS |
| PNY-004 | Confirmed | User receives financial plans | Three distinct plans are generated from deterministic metrics | `lib/domain.ts`, verification PASS |
| PNY-005 | Confirmed | User can accept a plan | Accepted plan persists and only one active plan remains per user | `lib/db.ts`, API route, verification PASS |
| PNY-006 | Confirmed | User can set financial guardrails | Monthly budget and emergency-fund target persist per user | `app/api/profile`, verification PASS |
| PNY-007 | Confirmed | User can create savings goals | Goal name/target/current are validated and persisted per user | `app/api/goals`, verification PASS |
| PNY-017 | Confirmed | User can complete a financial assessment | Current net worth, budget, emergency-fund target, debt payment, dependents, income stability and primary goal persist per user | `app/api/profile`, profile schema, validation PASS |
| PNY-018 | Confirmed | User can see a one-year financial projection | Projection uses verified starting net worth and the selected deterministic plan; no LLM arithmetic | `app/page.tsx`, deterministic projection implementation |
| PNY-008 | Derived | Financial data must be user-isolated | Unauthenticated requests are rejected; authenticated user A cannot read user B data | Auth boundary + isolation verification PASS |
| PNY-009 | Derived | Credentials must not be stored in plaintext | Passwords use salted scrypt hashes; session token is stored hashed server-side; cookie is HttpOnly | `lib/auth.ts` |
| PNY-010 | Derived | Invalid financial inputs must fail closed | API rejects invalid dates, amounts, categories, budgets and goals with 4xx responses | `lib/validation.ts` + route handlers |
| PNY-011 | Derived | Statement replacement must be atomic | Failed replacement leaves the previous statement intact | `lib/db.ts`; transaction boundary implemented; failure-path test remains required in full HTTP suite |
| PNY-012 | Proposed Implementation | Local MVP persistence uses Node SQLite | App runs without a cloud database dependency; schema has migration target | `lib/db.ts`, `db/schema.sql` |
| PNY-013 | Proposed Implementation | Production persistence uses Postgres/Supabase | Production schema includes user ownership and RLS policies before customer exposure | `db/schema.sql`; deployment gate |
| PNY-014 | Open Decision | Production bank/open-banking provider | Provider and contract must be selected before live bank connectivity | Not implemented by design |
| PNY-015 | Open Decision | LLaMA/RAG recommendation layer | AI may explain/recommend verified metrics; deterministic engine remains authoritative | Architecture boundary documented |
| PNY-016 | Open Decision | PDF statement extraction | Parser adapter must output the same normalized transaction contract as CSV | Not yet implemented |

## Release gates

A production MVP release is **not** complete until all of these are green:

1. Domain tests
2. API tests
3. Authentication/session tests
4. User-isolation tests
5. Atomic replacement failure test
6. Next.js typecheck
7. Next.js production build
8. Browser E2E happy path
9. Browser E2E negative/recovery paths
10. Accessibility smoke test
11. Security review of auth/session/data boundaries
12. Production Postgres/RLS verification
13. PDF ingestion verification

Current environment limitation: npm dependencies were unavailable because package installation timed out. Therefore gates 6–10 and production deployment gates are explicitly **blocked**, not passed.
