# Pennywise MVP security review — 20 November 2026

## Scope
Reviewed application-managed authentication, session handling, financial API authorization, cross-origin mutation controls, input validation, local persistence, hosted PostgreSQL adapter, statement import and deployment configuration.

## Controls implemented in source
- Per-user random salts with scrypt password hashes; password comparison uses timing-safe equality.
- Unknown-account login attempts perform a dummy scrypt operation to reduce account-enumeration timing differences.
- Cryptographically random opaque session tokens; only SHA-256 token hashes are persisted.
- HttpOnly, SameSite=Lax cookies; production cookies use Secure.
- All state-changing customer/auth API routes enforce same-origin intent: an Origin header must exactly match the request origin; when Origin is absent, only Sec-Fetch-Site: same-origin is accepted. Cross-origin or opaque-origin mutations return 403.
- Unit tests cover same-origin, cross-origin, Origin:null, same-origin fetch metadata and rejection of same-site-but-not-same-origin requests.
- Customer routes resolve the authenticated session before financial access. Financial reads and writes include explicit owner predicates.
- PostgreSQL RLS is ENABLED and FORCED on transactions, financial_profiles, savings_goals and financial_plans. Policies use transaction-local app.user_id set only after the server resolves a valid session.
- SQL parameters are bound through postgres.js tagged queries.
- Plan acceptance is recomputed server-side; a partial unique index limits accepted plans to one per user.
- Transaction validation rejects impossible calendar dates, duplicate/oversized IDs and amounts outside the supported database numeric range. Goal targets are bounded to the supported database range.
- Hosted Vercel requests fail closed without DATABASE_URL; no ephemeral SQLite fallback is used on Vercel.
- PDF upload is limited to 10MB, checks the PDF magic signature before parsing and uses a portable parser.

## Verification evidence
- npm audit --audit-level=high passes with Next.js 16.4.6 and Zod 4.6.7 pinned in package-lock.json. Earlier pinned versions were found by the audit to have critical/high advisories and were upgraded.
- GitHub Actions run #41 passed npm ci, dependency audit, PostgreSQL RLS integration tests, domain tests, SQLite persistence/isolation checks, TypeScript typecheck and Next.js production build.
- The disposable PostgreSQL CI suite uses a non-owner role with NOSUPERUSER, NOBYPASSRLS, NOCREATEROLE and NOCREATEDB. It verifies role/table ownership, ENABLE + FORCE RLS on all four financial tables, zero rows without tenant context, tenant-scoped reads, cross-user UPDATE/DELETE denial, cross-user INSERT rejection, transaction-local identity reset, transaction rollback and the one-accepted-plan constraint under concurrent attempts.
- PostgreSQL CI uses a throwaway service/database and synthetic data. It is not evidence that the permanent Neon branch or Vercel runtime has been migrated or configured.

## RLS trust boundary
The PostgreSQL role used by the app must not be a superuser, table owner or BYPASSRLS. FORCE ROW LEVEL SECURITY constrains table owners but does not constrain superusers or roles with BYPASSRLS. Auth tables users/sessions are intentionally server-only and do not use the financial RLS context.
The app sets app.user_id transaction-locally after session resolution. This prevents connection-pool identity leakage and adds a database-level safety net for missing owner predicates. The custom GUC is not a security barrier against arbitrary SQL execution under the app role; keep parameterized SQL, deny browser DB access and never accept user context from client-controlled headers/body.

## Open security and operational gates
- Login/signup rate limiting, credential-stuffing protection, throttling strategy and account lockout policy are not implemented.
- The same-origin guard and unit cases are implemented, but a dedicated adversarial browser/CSRF review and cross-origin E2E pass remain outstanding.
- No formal audit trail for security-sensitive actions.
- No verified expired-session cleanup job or account recovery flow.
- Permanent Neon branch migration, least-privilege production role/grants and RLS verification against the exact production connection remain outstanding.
- No proven backup/restore procedure, point-in-time recovery evidence or incident runbook.
- No production alerting, security monitoring or structured redacted audit events.
- PDF parser still needs malicious-file, decompression/resource-exhaustion and representative bank-statement testing.
- Browser E2E, accessibility, real-device mobile and unauthorized/forbidden regression tests remain outstanding.
- Independent security review remains outstanding before processing real customer financial data.

## Release decision
NOT PRODUCTION READY. Do not onboard customers or process real customer financial data until the open gates are resolved and evidenced.
