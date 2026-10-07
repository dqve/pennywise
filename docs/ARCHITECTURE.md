# Pennywise MVP architecture

```text
Browser
  |
  +-- Auth UI --------------------> /api/auth/*
  |
  +-- Statement import -----------> parser + validation
  |                                  |
  |                                  v
  |                            normalized transactions
  |                                  |
  |                                  v
  |                            deterministic engine
  |                           /        |        \
  |                      metrics     plans     goals
  |                           \        |        /
  |                            persistent store
  |
  +-- Profile / Goals / Plans ----> authenticated API
```

## Truth boundary

The financial engine is authoritative for money arithmetic, categorisation rules, scores and projections. An LLM must never be trusted with those calculations.

## Authentication boundary

The MVP uses email/password authentication with salted scrypt password hashes and opaque, hashed server-side session tokens. Production must replace the local persistence layer with Postgres/Supabase and enforce RLS using the authenticated subject.

## Data boundary

Every customer-owned record carries `user_id`. API handlers resolve the current user from the session before reading or mutating financial data.

## Failure boundary

Statement replacement is transactional. Validation occurs before persistence. The application should never report an import as successful unless the persistence operation succeeds.
