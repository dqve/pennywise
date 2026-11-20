# Pennywise MVP QA cases

| ID | Scenario | Expected result |
|---|---|---|
| QA-001 | Open app while signed out | Authentication screen is shown; private APIs return 401 |
| QA-002 | Create account with invalid email | 400 and actionable validation message |
| QA-003 | Create account with <8-character password | 400; account is not created |
| QA-004 | Create valid account | Session cookie is created; dashboard becomes accessible |
| QA-005 | Login with wrong password | 401; no session established |
| QA-006 | Logout | Session cookie is cleared; private API returns 401 |
| QA-007 | Import valid CSV | Transactions replace current statement and metrics recalculate |
| QA-008 | Import malformed CSV | Import fails without replacing existing statement |
| QA-009 | Import duplicate IDs | Request is rejected |
| QA-010 | Save profile | Profile persists after reload |
| QA-011 | Create savings goal | Goal persists and is visible after reload |
| QA-012 | Accept plan A, then plan B | B becomes active; A is archived |
| QA-013 | User A requests user B's data | No B data is returned |
| QA-014 | Expired session | Private API returns 401 |
| QA-015 | Mobile dashboard | Layout remains usable without horizontal overflow |
| QA-016 | Keyboard navigation | Interactive controls are reachable and have usable focus states |
| QA-017 | Empty account | Clear first-run state prompts statement import and contains no seeded financial transactions |
| QA-018 | Server/database failure | UI shows recoverable error state; no partial success is claimed |
| QA-019 | Financial assessment | User can save net worth, budget, debt, dependents, income stability and primary goal; values survive reload |
| QA-020 | 12-month projection | Selected plan produces deterministic savings/net-worth projection; projection changes when plan changes |
| QA-021 | Text-based PDF import | PDF rows are extracted, normalized, categorised and atomically replace the user's current statement |
| QA-022 | Unsupported PDF | Scanned/image-only or unsupported layouts return a clear extraction error and do not replace existing transactions |
| QA-023 | PostgreSQL RLS, no identity context | App role sees zero rows in the four protected financial tables |
| QA-024 | PostgreSQL RLS, user A context | App role sees only user A records in every protected table |
| QA-025 | PostgreSQL RLS, cross-user write | App role cannot insert/update/delete a user B row while context is user A |
| QA-026 | Pooled connection identity reset | A transaction for user B cannot inherit user A's transaction-local app.user_id |
| QA-027 | App DB role privilege check | Runtime role is not superuser, table owner or BYPASSRLS |
| QA-028 | Transaction table search | Search returns only matching transactions, ignoring case and matching description/category/date/amount |
| QA-029 | Transaction category filter | Only the selected category is shown; clearing filter returns all matching rows |
| QA-030 | Transaction sorting and pagination | Date, amount, category and description sort consistently; pagination does not skip or duplicate rows |
| QA-031 | Mobile transaction table | Rows become readable stacked cards without horizontal overflow |
| QA-032 | Balance privacy toggle | Primary displayed monetary values are masked/unmasked without changing stored values or calculations |
| QA-033 | Reduced-motion preference | Amount transitions and other non-essential animation are suppressed |
| QA-034 | Expense-category breakdown | Category shares are based on imported negative amounts; no synthetic historical trend is shown |
| QA-035 | Goal progress above target | API rejects values above the goal target and existing progress remains unchanged |

RLS checks passed on a disposable Neon migration branch using a scoped read/write role; the permanent Neon branch has not yet received the migration. The latest UI CI run and browser E2E are pending.

| QA-036 | Cross-origin or opaque-origin state-changing API request | 403; the requested mutation does not occur |
| QA-037 | Invalid calendar date, oversized transaction ID or amount outside the supported numeric range | 400; existing financial data remains unchanged |
| QA-038 | Goal target exceeds the supported database numeric range | 400; goal is not persisted |

## Latest automated verification — GitHub Actions run #41
- `npm ci` from the committed lockfile and `npm audit --audit-level=high`: passed.
- PostgreSQL integration suite on a disposable PostgreSQL 16 service: passed. Covers non-owner/no-BYPASSRLS role flags, table ownership, ENABLE + FORCE RLS, no-context reads, tenant-scoped reads, cross-user UPDATE/DELETE denial, cross-user INSERT rejection, transaction-local identity reset, atomic replacement rollback and one accepted plan under concurrent attempts.
- Domain/input-security unit tests, local SQLite persistence/isolation, TypeScript typecheck and production build: passed.
- This CI database is ephemeral and contains synthetic test data. Permanent Neon migration and Vercel runtime verification remain separate release gates.

The suite does not replace manual browser E2E, real-device accessibility/responsive review, adversarial CSRF and abuse testing, representative PDF testing or production recovery drills.
