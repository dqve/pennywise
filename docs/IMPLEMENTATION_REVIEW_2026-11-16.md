# Pennywise implementation review — 2026-11-16

## Scope and baseline
- Repository: `dqve/pennywise`
- Base: `main` at `95142f583c9bab59771b4a10735bc628eee9ec09`
- Review branch: `feat/violet-postgres-auth-hardening`
- Candidate implementation inspected from the locally prepared violet/Postgres upgrade archive.

## Verified checks
- Domain unit tests: 3/3 passed.
- Local persistence and cross-user isolation verification: passed.
- Node runtime used for these checks: 22.16.0.

## Defects / release gates found during review
1. Candidate `lib/credentials.ts` declared two `async` functions with synchronous `User` return annotations. They must return `Promise<User>`. This was corrected in the local review copy; it has not yet been published.
2. Dependency installation timed out in this environment. Typecheck and production build therefore remain unverified.
3. The Postgres schema uses application-enforced user scoping, not Postgres RLS. The database role must be private and least-privileged; do not describe this schema as RLS-protected.
4. Production database connectivity, schema migration, backup/restore, concurrent-session behavior and cross-account isolation against the hosted database remain unverified.
5. Login/signup abuse controls, rate limiting, CSRF review, audit logging and alerting remain release gates.
6. PDF extraction supports text-based statements only; OCR and bank-specific parsing are not implemented. Hosted parser compatibility and upload resource limits require validation.
7. A successful Vercel build/deployment is not yet available as a verification signal because the connected Vercel integration cannot discover the Pennywise project.

## Release decision
Not production-ready. Do not use real customer financial data until the outstanding security, database, deployment and end-to-end gates have passed.

## Next implementation sequence
1. Apply the candidate source changes to this branch and resolve type/build failures.
2. Add Postgres integration tests for auth, persistence, transaction replacement and tenant isolation.
3. Complete security controls and failure-state handling.
4. Run browser E2E and real-device responsive/accessibility review.
5. Deploy to Preview, validate the complete journey, then request explicit production release approval.
