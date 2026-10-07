# Pennywise — Initial MVP

Pennywise is an AI-powered personal financial-management product. This repository contains the first executable MVP vertical slice: ingest financial activity, derive a deterministic financial picture, generate actionable plans, and persist the user's core financial state.

## Product loop implemented

`UNDERSTAND → SCORE → PLAN → CHOOSE → TRACK`

### Implemented
- Responsive financial-health dashboard
- CSV/TXT statement import
- Text-based PDF statement import via the existing transaction contract
- Quoted-CSV parsing and validation
- Deterministic merchant/category inference
- Deterministic income, expense, savings and savings-rate calculations
- Spending score and daily-budget calculation
- Three financial-plan options
- Persisted plan acceptance
- Persisted financial profile
- Persisted savings goals
- Atomic transaction replacement
- Server-side Node API boundary
- Local SQLite persistence for executable development
- Postgres/Supabase migration schema
- Domain + persistence verification script

## Architecture

`statement → parser → validated transactions → financial engine → projections/plans/goals → persistence → UI`

The financial engine is deterministic. AI is deliberately outside the financial-truth boundary: an eventual LLaMA/RAG service may explain verified metrics and recommend actions, but it must not become authoritative for balances, arithmetic, scoring inputs or projections.

## Local persistence boundary

The development API uses Node 22's built-in SQLite implementation. Customer-facing routes now require email/password authentication and a server-side opaque session cookie. SQLite remains a development persistence choice; it is not the production database.

## Production migration target

`db/schema.sql` defines the intended Postgres/Supabase model for:
- transactions
- financial profiles
- savings goals
- financial plans

The production implementation must add authentication, RLS, auditability, encryption/key-management controls, rate limits and operational observability before customer financial data is accepted.

## Remaining release slices

1. Production Postgres/Supabase repository implementation + live RLS verification
2. OCR and bank-specific PDF statement adapters behind the existing parser contract
3. Transaction review/re-categorisation UX
4. LLaMA/RAG recommendation service behind a feature flag
5. Bank/open-banking provider adapter
6. Notifications, recurring savings and streak/progress tracking
7. Full browser E2E/accessibility/security/recovery suite

## Verification

The environment available for this build could not complete `npm install` within the execution limit, so a full Next.js production build could not honestly be claimed. The executable Node domain/persistence/validation/isolation verification does pass:

```bash
node --experimental-strip-types scripts/verify.ts
```

Expected result:

`Pennywise domain + persistence + user-isolation verification: PASS`

Once dependencies are installed in a normal development environment, run:

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

## CSV contract

```csv
date,description,amount,category
2026-10-01,Salary - Acme,850000,Income
2026-10-02,"Shoprite, Ikeja",-24600,Food
2026-10-03,Bolt,-8400,Transport
```

Category is optional. Positive amounts are treated as income; negative amounts are treated as expenses. Dates must use `YYYY-MM-DD`.


## Engineering governance

The current implementation is governed by `docs/REQUIREMENTS.md`, `docs/TRACEABILITY.md`, `docs/QA_CASES.md` and `docs/ARCHITECTURE.md`. The release gate is deliberately stricter than “the page renders”: authentication, isolation, financial correctness, failure recovery, build, browser QA and production database security must all be evidenced before production release.
