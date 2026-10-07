# Pennywise MVP — Initial Data-Driven Slice

## Product slice
This version moves Pennywise from a static demo toward a real data-driven MVP journey:

**CSV statement → normalized transactions → categorisation → deterministic financial analytics → dashboard update**.

The existing plan, savings, assessment and transaction experiences remain available as the product shell.

## Implemented
- Financial overview dashboard
- Net worth, spending score, income, savings metrics
- Daily budget view
- Transaction review
- CSV/TXT statement ingestion in-browser
- Basic transaction normalization and validation
- Deterministic merchant/category inference
- Income, expense, savings and retained-income calculations from imported data
- Dashboard values update from imported data
- Financial-plan comparison and enrolment interaction
- Savings goal tracking
- Financial assessment inputs
- Responsive mobile/tablet/desktop layout

## Input contract for the current slice
CSV rows should be:

```csv
date,description,amount,category
2026-10-01,Salary - Acme,850000,Income
2026-10-02,Shoprite Ikeja,-24600,Food
2026-10-03,Bolt,-8400,Transport
```

`category` is optional. If omitted, Pennywise applies deterministic merchant/category rules and falls back to `Other`.

Positive amounts are treated as income/credits. Negative amounts are treated as expenses/debits.

## Deliberately not implemented yet
- Authentication / user accounts
- Persistent database
- Real bank/open-banking connections
- Production PDF table extraction
- LLaMA/RAG integration
- Server-side financial calculation service
- Notifications
- Real recurring savings execution
- Production security/compliance controls
- Automated test suite

## Product truth vs assumptions
Numeric values are demo data until a statement is imported. The financial calculations are deterministic and explainable. LLM output must not become the source of truth for balances, transaction amounts, scoring inputs or arithmetic.

## Run
No package dependency is required for this slice:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Next vertical slice
1. Move ingestion and analytics behind a typed server API.
2. Add persistent storage for users, transactions, assessments, goals and plans.
3. Add authentication and authorization.
4. Implement production PDF extraction behind the same ingestion contract.
5. Version the scoring/planning rules and add unit/API tests.
6. Add generated financial plans from normalized transaction data.
7. Add an AI recommendation service behind a feature flag; AI explains/recommends, deterministic services calculate.
8. Add E2E, permission, negative, security and recovery tests.
