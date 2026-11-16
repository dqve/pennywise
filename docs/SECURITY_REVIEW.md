# Pennywise MVP security review

## Scope
Reviewed application-managed authentication, session handling, financial API authorization, input validation, local persistence, hosted PostgreSQL adapter, statement import and deployment configuration.

## Controls implemented in source
- Salted scrypt password hashes and timingSafeEqual verification; plaintext passwords are not persisted.
- Cryptographically random opaque session tokens; only SHA-256 token hashes are stored.
- HttpOnly, SameSite=Lax cookies; production cookies use Secure.
- Customer routes resolve the authenticated session before accessing financial data.
- Transaction, profile, savings-goal and plan reads/writes include user ownership predicates.
- PostgreSQL RLS is ENABLED and FORCED on transactions, financial_profiles, savings_goals and financial_plans. Policies use a transaction-local app.user_id set only after the server resolves a valid session.
- SQL parameters are bound through postgres.js tagged queries.
- Plan acceptance recomputes values server-side; a partial unique index limits active accepted plans to one per user.
- Hosted Vercel requests fail closed without DATABASE_URL; no ephemeral SQLite fallback is used on Vercel.
- PDF upload is limited to 10MB and checks the PDF signature before parsing.

## RLS trust boundary
The PostgreSQL role used by the app must not be a superuser, table owner or BYPASSRLS. FORCE ROW LEVEL SECURITY constrains table owners but does not constrain superusers or roles with BYPASSRLS. Auth tables users/sessions are intentionally server-only and do not use the financial RLS context.
The app sets app.user_id transaction-locally after session resolution. This prevents connection-pool identity leakage and adds a database-level safety net for missing owner predicates. The custom GUC is not a security barrier against arbitrary SQL execution under the app role; keep parameterized SQL, deny browser DB access and never accept user context from client-controlled headers/body.

## Open security and operational gates
- Login/signup rate limiting, credential-stuffing protection and account lockout policy are not implemented.
- CSRF and cross-origin request protections have not had a dedicated adversarial test pass. SameSite=Lax alone is not complete CSRF evidence.
- No formal audit trail for security-sensitive actions.
- No verified expired-session cleanup job or account recovery flow.
- No production Postgres integration/tenant-isolation test, RLS test under the exact runtime role, or concurrent-write test has run.
- No proven backup/restore procedure, point-in-time recovery evidence or incident runbook.
- No production alerting, security monitoring or structured redacted audit events.
- Dependency/SCA scan and Next.js production build must pass in CI.
- PDF parser needs malicious-file, decompression/resource-exhaustion and representative bank-statement testing.
- Browser E2E, accessibility, mobile and unauthorized/forbidden regression tests remain outstanding.

## Release decision
NOT PRODUCTION READY. Do not onboard customers or process real customer financial data until the open gates are resolved and evidenced. Passing local tests is not evidence of hosted Postgres RLS, Preview/Production isolation or production security.
