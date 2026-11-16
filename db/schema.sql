-- Pennywise application-managed identity schema. Apply with a migration/DDL role.
-- Runtime role must be a dedicated, non-owner role without BYPASSRLS.
CREATE TABLE IF NOT EXISTS users (id text PRIMARY KEY, email text NOT NULL UNIQUE, password_hash text NOT NULL, password_salt text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS transactions (id text NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, date date NOT NULL, description text NOT NULL, amount numeric(18,2) NOT NULL, category text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,id));
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON transactions(user_id,date DESC);
CREATE TABLE IF NOT EXISTS financial_profiles (user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, monthly_budget numeric(18,2) NOT NULL DEFAULT 600000, emergency_fund_target numeric(18,2) NOT NULL DEFAULT 1000000, current_net_worth numeric(18,2) NOT NULL DEFAULT 0, monthly_debt_payment numeric(18,2) NOT NULL DEFAULT 0, dependents integer NOT NULL DEFAULT 0, income_stability text NOT NULL DEFAULT 'stable', primary_goal text NOT NULL DEFAULT 'emergency', updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS savings_goals (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, name text NOT NULL, target numeric(18,2) NOT NULL, current numeric(18,2) NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS savings_goals_user_idx ON savings_goals(user_id);
CREATE TABLE IF NOT EXISTS financial_plans (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, name text NOT NULL, monthly_savings numeric(18,2) NOT NULL, discretionary_cut numeric(18,2) NOT NULL, projected_gain numeric(18,2) NOT NULL, status text NOT NULL DEFAULT 'proposed', created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS financial_plans_user_idx ON financial_plans(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_plan_per_user ON financial_plans(user_id) WHERE status='accepted';

-- Database-level tenant isolation. app.user_id is assigned transaction-locally by the server
-- only after it resolves an opaque, hashed session token to a user.
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS transactions_user_isolation ON transactions;
CREATE POLICY transactions_user_isolation ON transactions
  USING (user_id = NULLIF(current_setting('app.user_id', true), ''))
  WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), ''));

ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_profiles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS financial_profiles_user_isolation ON financial_profiles;
CREATE POLICY financial_profiles_user_isolation ON financial_profiles
  USING (user_id = NULLIF(current_setting('app.user_id', true), ''))
  WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), ''));

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS savings_goals_user_isolation ON savings_goals;
CREATE POLICY savings_goals_user_isolation ON savings_goals
  USING (user_id = NULLIF(current_setting('app.user_id', true), ''))
  WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), ''));

ALTER TABLE financial_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_plans FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS financial_plans_user_isolation ON financial_plans;
CREATE POLICY financial_plans_user_isolation ON financial_plans
  USING (user_id = NULLIF(current_setting('app.user_id', true), ''))
  WITH CHECK (user_id = NULLIF(current_setting('app.user_id', true), ''));

-- users and sessions are auth-control tables queried exclusively by server-side auth routines.
-- Keep database credentials private; do not expose direct table access to browser clients.
