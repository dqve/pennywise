# Pennywise deployment guide — 2026-11-16

## Release status
NOT PRODUCTION READY. A managed PostgreSQL connection and live deployment verification are required. Do not use real customer financial statements until all release gates pass.

## Required setup
1. Provision managed PostgreSQL in a region close to the Vercel Functions. Enable TLS.
2. Apply db/schema.sql with a privileged migration/DDL role.
3. Create a dedicated runtime role that is not a superuser, does not own the protected tables and does not have BYPASSRLS. Grant schema USAGE and only the required SELECT, INSERT, UPDATE and DELETE permissions on application tables. Do not share the migration role with the app.
4. Confirm the four financial tables have ENABLE ROW LEVEL SECURITY and FORCE ROW LEVEL SECURITY, with their user-isolation policies installed. Users/sessions are auth-control tables and should only be accessed by server-side auth routines.
5. Configure DATABASE_URL as a server-only Vercel environment variable for Preview and Production (prefer separate databases). Never prefix it with NEXT_PUBLIC_.
6. Set the Vercel project Node.js runtime to 22.x and verify the GitHub production branch.
7. Deploy to Preview. Confirm /api/auth/me returns 401 for a logged-out visitor (not 503).
8. Run signup → logout → login → refresh → import CSV → view metrics → save profile → accept plan → create goal → update goal progress → logout/login. Verify persistence and RLS isolation across two accounts, including direct API attempts using a different user's record ID.
9. Verify text-based PDF upload with a representative statement. Scanned/image PDFs are not supported; reject safely.
10. Review deployment logs without logging financial statements, passwords, session tokens or database URLs.

## Persistence
- Local development without DATABASE_URL: SQLite using lib/db.ts.
- Hosted Vercel: PostgreSQL via lib/db-runtime.ts. If DATABASE_URL is missing, requests fail closed rather than writing to ephemeral disk.
- Passwords are salted scrypt hashes; session tokens are stored only as SHA-256 hashes and sent via HttpOnly SameSite cookies.
- Each protected data operation sets app.user_id transaction-locally from the server-resolved session. PostgreSQL RLS policies filter and constrain writes for the four financial tables. The database role must not bypass or own RLS tables.
- The app does not use Supabase Auth or auth.uid() policies; it uses its own sessions and a private server connection.

## Outstanding gates
- Dependency install, full typecheck and Next.js build on a network-enabled CI runner.
- Postgres integration tests against the exact runtime role, including RLS bypass attempts, tenant isolation, concurrent sessions and SQL failure recovery.
- Auth brute-force protection, CSRF defense review and dependency security scan.
- PDF parser malicious-file/resource-exhaustion and representative statement testing.
- Real-device responsive/accessibility review and browser E2E.
- Database backup/restore drill, operational runbook, structured redacted logs and production alerting.

## Known caveats
- PDF extraction supports a limited text-row format; OCR and bank-specific statement adapters are not implemented.
- The user-facing financial model uses imported transaction totals and illustrative plan targets. It must not be described as a bank-grade predictive model or financial advice. Revisit plan constraints and time-period normalization before general release.
