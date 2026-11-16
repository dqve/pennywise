# Pennywise MVP architecture

## Runtime shape
Browser / React UI → Next.js App Router API handlers → session authentication and validation → deterministic finance domain → persistence adapter.
The adapter uses PostgreSQL on Vercel and SQLite for local development.

## Product and data boundaries
The finance engine is deterministic. Income, expenditure, savings, score and plan values are calculated from validated user inputs and imported transactions. An AI explanation layer must not become authoritative for financial arithmetic or account balances.

Every request that reads or mutates customer financial data resolves the current session first. The persistence adapter scopes financial data operations to the authenticated user_id. PostgreSQL parameters are bound through postgres.js tagged queries. The browser has no database connection.

## Authentication
- Email is normalized and validated before lookup or registration.
- Passwords use per-user random salts and Node scrypt hashes.
- The browser receives an opaque random token in an HttpOnly, SameSite=Lax cookie; only its SHA-256 hash is stored.
- Production cookies use Secure.
- Sessions expire after 30 days.
- users and sessions are server-only authentication tables.

## Persistence and database isolation
- lib/db.ts: Node 22 SQLite, for local development and deterministic tests.
- lib/db-runtime.ts: async repository facade; uses PostgreSQL when DATABASE_URL exists and refuses local-disk fallback on Vercel.
- db/schema.sql: PostgreSQL schema for the application's own users, sessions and financial data.
- PostgreSQL RLS is enabled and forced on transactions, financial_profiles, savings_goals and financial_plans.
- After resolving the opaque session token, each financial-table operation starts a transaction and calls set_config('app.user_id', userId, true). The value is transaction-local, so pooled connections do not retain a prior request's identity.
- RLS policies use that context for both USING and WITH CHECK. Queries additionally include explicit user_id predicates.
- The runtime role must not be superuser, table owner or BYPASSRLS. FORCE ROW LEVEL SECURITY does not constrain superusers or roles with BYPASSRLS.
- The custom GUC is an application trust boundary, not a replacement for parameterized SQL or server-side authorization. Never expose direct DB access to the browser or accept app.user_id from a request body/header.

## Consistency and failures
Statement replacement is transactional and does not report success until persistence completes. Plan acceptance is recomputed from server-side transactions and profile values; submitted monetary values are not trusted. A partial unique index permits only one accepted plan per user. Goal updates include both the authenticated user ID and goal ID in the mutation predicate.

## Constraints
PDF parsing supports text-based transaction rows in a limited date/description/amount layout. OCR and bank-specific adapters are not implemented. The financial model is an MVP estimate, not a bank ledger or regulated financial advice.
