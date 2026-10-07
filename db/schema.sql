-- Production target: PostgreSQL / Supabase.
-- Apply RLS and policies before exposing customer data.
create table if not exists profiles (user_id uuid primary key references auth.users(id) on delete cascade, monthly_budget numeric(18,2) not null default 600000, emergency_fund_target numeric(18,2) not null default 1000000, current_net_worth numeric(18,2) not null default 0, monthly_debt_payment numeric(18,2) not null default 0, dependents integer not null default 0, income_stability text not null default 'stable', primary_goal text not null default 'emergency', updated_at timestamptz not null default now());
create table if not exists transactions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, external_id text, date date not null, description text not null, amount numeric(18,2) not null, category text not null, created_at timestamptz not null default now());
create unique index if not exists transactions_user_external_id_idx on transactions(user_id, external_id) where external_id is not null;
create index if not exists transactions_user_date_idx on transactions(user_id,date desc);
create table if not exists savings_goals (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, name text not null, target numeric(18,2) not null, current numeric(18,2) not null default 0, created_at timestamptz not null default now());
create table if not exists financial_plans (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, name text not null, monthly_savings numeric(18,2) not null, discretionary_cut numeric(18,2) not null, projected_gain numeric(18,2) not null, status text not null default 'proposed', created_at timestamptz not null default now());

alter table profiles enable row level security;
alter table transactions enable row level security;
alter table savings_goals enable row level security;
alter table financial_plans enable row level security;

create policy profiles_owner on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy transactions_owner on transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy goals_owner on savings_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy plans_owner on financial_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
