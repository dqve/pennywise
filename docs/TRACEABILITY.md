# Pennywise MVP traceability

| Requirement | Acceptance evidence | Implementation | Status |
|---|---|---|---|
| PNY-001 Import transactions | CSV/TXT parser, malformed input rejection, atomic replacement | `lib/parser.ts`, `lib/validation.ts`, `app/api/transactions/route.ts` | PASS locally |
| PNY-002 Categorise transactions | Known merchants map deterministically; unknowns become Other | `lib/domain.ts` | PASS locally |
| PNY-003 Calculate financial health | Income, expenses, savings, rate, score and daily budget derive from transactions | `lib/domain.ts` | PASS locally |
| PNY-004 Generate plans | Three distinct deterministic plans generated from verified metrics | `lib/domain.ts` | PASS locally |
| PNY-005 Accept a plan | Accepted plan persists and prior accepted plan is archived per user | `lib/db.ts`, `app/api/plans/route.ts` | PASS locally |
| PNY-006 Financial guardrails | Budget and emergency-fund target persist | `lib/db.ts`, `app/api/profile/route.ts` | PASS locally |
| PNY-007 Savings goals | Goal validation and user-scoped persistence | `lib/validation.ts`, `lib/db.ts`, `app/api/goals/route.ts` | PASS locally |
| PNY-008 User isolation | User A cannot read user B transactions/profile/goals/plans | `lib/auth.ts`, `lib/db.ts`, API routes | PASS locally |
| PNY-009 Credential/session security | Salted scrypt password hash; opaque HttpOnly cookie; hashed server session token | `lib/credentials.ts`, `lib/auth.ts` | Code review + credential test |
| PNY-010 Invalid input rejection | Invalid dates, amounts, categories, profiles and goals rejected | `lib/validation.ts` | PASS locally |
| PNY-011 Atomic replacement | Failed duplicate insert leaves previous statement intact | `lib/db.ts`, `scripts/verify.ts` | PASS locally |
| PNY-017 Financial assessment | Net worth, debt payment, dependents, stability and primary goal persist | `lib/validation.ts`, `lib/db.ts`, `app/api/profile/route.ts`, `app/page.tsx` | PASS locally |
| PNY-018 12-month projection | Projection uses starting net worth and selected plan; no LLM arithmetic | `app/page.tsx` | Source verified; browser gate blocked |

## Explicitly blocked gates

- Full dependency-backed Next.js typecheck
- Next.js production build
- Browser E2E and accessibility smoke tests
- Production Postgres/Supabase/RLS verification
- PDF ingestion

The dependency-backed gates are blocked by the execution environment's inability to resolve the npm registry. They are not represented as passing merely because the source compiles at a syntax level.
| PNY-016 | Text-based PDF extraction normalizes rows to the same transaction contract | `lib/pdf.ts`, `app/api/transactions/pdf/route.ts` | Local generated-PDF verification PASS; production binary portability blocked |
