# Pennywise MVP security review

## Reviewed boundaries

- Authentication credentials
- Session cookie/token handling
- Customer-data authorization
- Transaction ownership
- Statement replacement
- Input validation
- Production database ownership/RLS design

## Controls implemented

- Passwords are stored as salted scrypt hashes; plaintext passwords are never persisted.
- Login verification uses constant-time comparison for derived password hashes.
- Session cookies are HttpOnly, SameSite=Lax and Secure in production.
- Only a SHA-256 hash of the opaque session token is persisted server-side.
- Every customer financial query resolves the authenticated user first and scopes records by `user_id`.
- Transaction IDs are unique within a user rather than globally, preventing cross-user source-ID collisions.
- Statement replacement is performed inside a SQLite transaction and rolls back on persistence failure.
- Financial input is validated before persistence.
- Production SQL schema includes ownership foreign keys and RLS policies.
- Legacy transaction migration refuses to guess ownership; it requires an explicit `PENNYWISE_LEGACY_USER_ID`.

## Not yet release-complete

- Rate limiting and credential-abuse controls.
- Production secret/key management.
- Audit logging for security-sensitive actions.
- Live Postgres/Supabase RLS execution test.
- PDF conversion currently depends on the `pdftotext` executable; production deployment must either package/allow this binary or replace it with a portable library/service.
- Dependency/SCA scan after packages are installed.
- Browser-level CSRF/authorization regression suite.
- Production observability and alerting.

These remain release gates rather than being represented as completed controls.
