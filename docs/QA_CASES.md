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

RLS checks were executed against a disposable Neon migration branch using a scoped read/write role; the permanent Neon branch has not yet received the migration. Full automated CI, typecheck/build and browser E2E results are still pending.
