# Pennywise UI review — EasyUI component selection

Date: 17 November 2026
Scope: the Pennywise web dashboard and the EasyUI component catalogue at easyui.site.

## Product UI guardrail

The existing Pennywise dashboard is the visual and interaction baseline. Preserve its warm off-white canvas, forest-green financial-health hero, restrained green accents, neutral cards, and single-page financial journey.

The dashboard's established journey remains:
1. Import a statement.
2. Understand the financial picture and recent activity.
3. Review and accept a financial plan.
4. Set financial guardrails and savings goals.
5. Inspect the 12-month illustration and transaction history.

This work must improve clarity, feedback, density and touch/keyboard usability without moving the product to a new visual brand or hiding established sections behind a different navigation model.

## EasyUI review findings

The public EasyUI registry exposes a large set of source-owned React components, installed individually through the shadcn registry. The component repository is MIT-licensed and uses React, TypeScript, Framer Motion and Tailwind CSS. The EasyUI design-system specification is dark-neutral by default. That styling is a library showcase choice, not a Pennywise design requirement.

The current Pennywise app uses a deliberately small custom CSS system and does not use Tailwind. Pulling EasyUI's dark theme or Tailwind utility layer into the whole product for a few components would introduce broad styling and dependency impact without a product benefit. The selected approach is to adapt the useful interaction patterns to Pennywise's existing tokens and CSS.

## Component selection

| EasyUI option | Pennywise decision | Rationale |
|---|---|---|
| Data Table / Advanced Data Table | Adopt the interaction pattern | The previous activity list exposed only a short recent subset. A complete transaction table with search, category filter, sortable columns, pagination and small-screen stacked rows materially improves this journey. Implemented in components/dashboard/transactions-table.tsx. |
| Donut Chart | Adopt a restrained version | Category distribution is a meaningful view over real imported expense rows. Implemented as a lightweight conic-gradient chart and readable category legend in components/dashboard/spending-breakdown.tsx. The total includes all categories; smaller categories are grouped into Other when necessary. |
| Animated Number Morph / Stat Card | Adapt the motion principle | KPI values animate gently when actual values change. No synthetic trend or comparison data is fabricated. The current implementation respects prefers-reduced-motion. |
| Wallet Balance | Adapt the privacy interaction | Added a dashboard-wide Hide balances / Show balances control for the primary monetary displays. It does not change stored data or calculations. |
| Animated File Upload | Defer | The EasyUI uploader can simulate progress when no custom upload handler is supplied. Pennywise should never show invented upload progress. The existing single-statement replacement confirmation and explicit processing/result state are retained. Revisit with real byte-progress and processing callbacks if the upload flow needs them. |
| Velocity Toast / Alert | Defer | Import and save feedback remains in the dashboard context, where the message is associated with the financial action. The existing inline notice also exposes an explicit error state and dismissal. |
| Animated Tabs / Sidebar / Glass Navbar | Do not adopt for this pass | They would replace the existing single-dashboard information architecture and hide content behind a new navigation model without evidence that this improves the current journey. |
| Money Card / Wallet Card | Do not adopt as-is | Their dark/blue wallet-card treatment conflicts with the existing Pennywise palette and adds decorative weight to a financial dashboard. |
| AI Chat, Activity Feed, Activity Heatmap and novelty motion effects | Not relevant to the current journey | No requirement currently justifies those elements. Reconsider only when a related product capability is defined. |

## Implemented UI changes on the feature branch

- Retains the single-page dashboard content flow and the original financial-health hero / metrics / recent activity / plan / profile / projection / savings-goal sections.
- Retains the existing forest-green and warm off-white design tokens; does not introduce a purple theme, dark global theme, or sidebar navigation.
- Adds a searchable, category-filterable, sortable and paginated full transaction table, with stacked rows on narrow screens.
- Adds a spending-category breakdown derived from actual negative transaction amounts.
- Adds Hide balances / Show balances to the dashboard monetary displays.
- Adds restrained amount-change animation with reduced-motion support.
- Improves visual hierarchy, focus states, empty state, responsive layout and feedback contrast without changing finance calculations or API contracts.

## Compatibility and implementation notes

- These are adapted interaction patterns, not a wholesale EasyUI theme import.
- No Tailwind CSS or Framer Motion dependency has been introduced for this pass.
- Existing product styles remain owned by app/globals.css.
- No mock transactions, generated trends, or artificial performance indicators are used.
- The statement-import flow still replaces the current transaction history only after the user confirms. Server validation and transactional persistence remain authoritative.

## Verification still required

- GitHub Actions run #14 passed on the final UI commit: domain tests 3/3, SQLite persistence/isolation verification, TypeScript typecheck and Next.js production build.
- Still review the rendered Preview at desktop and mobile widths; specifically check table density, category chart sizing, long descriptions, empty/loading/error states and keyboard focus.
- Still run browser E2E for signup/login, statement replacement, profile save, plan acceptance, savings-goal progress, balance masking and user isolation.
- Do not describe the UI as fully accepted or the release as production-ready until rendered review and remaining backend/security/operations gates are evidenced.
