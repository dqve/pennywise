# Pennywise deployment guide — 20 November 2026

## Release status
NOT PRODUCTION READY. The feature branch passes its current CI suite, including an ephemeral PostgreSQL RLS test service, but the permanent Neon database and Vercel Preview runtime have not been configured or verified. Do not use real customer financial statements until all release gates pass.

## Required setup
1. Confirm access to the exact Pennywise Vercel project and production team.
2. Provision or select managed PostgreSQL in a region close to Vercel Functions. Enable TLS and determine separate Preview and Production database targets.
3. Apply `db/schema.sql` with a privileged migration/DDL role to the intended persistent database only after the migration plan and target are reviewed.
4. Create a dedicated application runtime role that is not a superuser, does not own the protected tables and does not have BYPASSRLS. Grant schema USAGE and only required SELECT, INSERT, UPDATE and DELETE permissions. Do not share the migration role with the app.
5. Confirm the four financial tables have ENABLE ROW LEVEL SECURITY and FORCE ROW LEVEL SECURITY, with user-isolation policies installed. Users/sessions are auth-control tables and should only be accessed by server-side auth routines.
6. Configure DATABASE_URL as a server-only Vercel environment variable for Preview and Production. Prefer separate databases. Never prefix it with NEXT_PUBLIC_.
7. Set the Vercel project Node.js runtime to 22.x and verify the GitHub production branch.
8. Deploy to Preview. Confirm `/api/auth/me` returns 401 for a logged-out visitor (not 503).
9. Run signup → logout → login → refresh → import CSV → view metrics → save profile → accept plan → create goal → update goal progress → logout/login. Verify persistence and isolation across two accounts, including direct API attempts using a different user's record ID.
10. Run cross-origin mutation, unauthorized/forbidden, rate-limit, PDF abuse and failure-recovery tests.
11. Verify text-based PDF upload with representative statements. Scanned/image PDFs are not supported; reject safely.
12. Review deployment logs without logging financial statements, passwords, session tokens or database URLs.

## Persistence
- Local development without DATABASE_URL: SQLite using `lib/db.ts`.
- Hosted Vercel: PostgreSQL via `lib/db-runtime.ts`. If DATABASE_URL is missing, requests fail closed rather than writing to ephemeral disk.
- Passwords are salted scrypt hashes; session tokens are stored only as SHA-256 hashes and sent via HttpOnly SameSite cookies.
- Each protected data operation sets `app.user_id` transaction-locally from the server-resolved session. PostgreSQL RLS policies filter and constrain writes for the four financial tables. The database role must not bypass or own RLS tables.
- Mutating API routes enforce same-origin intent using Origin exact-match validation and a Sec-Fetch-Site same-origin fallback.
- The app does not use Supabase Auth or auth.uid() policies; it uses its own sessions and a private server connection.

## CI evidence — GitHub Actions run #41
- Clean install from committed package-lock.json using `npm ci`: passed.
- `npm audit --audit-level=high` with Next.js 16.4.6 and Zod 4.6.7: passed.
- PostgreSQL 16 integration suite with a disposable non-owner/no-BYPASSRLS runtime role: passed.
- Domain tests, SQLite persistence/isolation checks, TypeScript typecheck and Next.js production build: passed.
- The PostgreSQL service is ephemeral and contains synthetic records. It does not apply or modify the permanent Neon project.

## Outstanding release gates
- Vercel project/team access, Preview environment and private runtime DATABASE_URL.
- Permanent Neon migration, production role/grants and verification against the actual production-equivalent connection.
- Full browser E2E and two-account authorization/isolation tests against Preview.
- Login/signup rate limiting, credential-stuffing protection and recovery flows.
- Adversarial CSRF/cross-origin verification beyond unit-tested same-origin guards.
- PDF parser malicious-file/resource-exhaustion and representative statement testing.
- Accessibility and real-device responsive review.
- Structured redacted audit events, alerting, session cleanup, backup/restore drill and incident runbook.
- Independent security review and operational readiness sign-off.

## Known caveats
- PDF extraction supports a limited text-row format; OCR and bank-specific statement adapters are not implemented.
- The user-facing financial model uses imported transaction totals and illustrative plan targets. It must not be described as a bank-grade predictive model or financial advice. Revisit plan constraints and time-period normalization before general release.
