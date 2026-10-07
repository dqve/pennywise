import { mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Plan, Transaction } from './domain.ts';

export type User = { id:string; email:string; passwordHash:string; passwordSalt:string };
export type SessionUser = { id:string; email:string };

const file = process.env.PENNYWISE_DB_PATH ?? join(process.cwd(), 'data', 'pennywise.sqlite');
let db: DatabaseSync | undefined;

function getDb() {
  if (!db) {
    mkdirSync(dirname(file), { recursive: true });
    db = new DatabaseSync(file);
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS transactions (id TEXT NOT NULL,user_id TEXT NOT NULL,date TEXT NOT NULL,description TEXT NOT NULL,amount REAL NOT NULL,category TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY (user_id,id));
      CREATE TABLE IF NOT EXISTS financial_profiles (user_id TEXT PRIMARY KEY,monthly_budget REAL NOT NULL DEFAULT 600000,emergency_fund_target REAL NOT NULL DEFAULT 1000000,current_net_worth REAL NOT NULL DEFAULT 0,monthly_debt_payment REAL NOT NULL DEFAULT 0,dependents INTEGER NOT NULL DEFAULT 0,income_stability TEXT NOT NULL DEFAULT 'stable',primary_goal TEXT NOT NULL DEFAULT 'emergency',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS savings_goals (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,name TEXT NOT NULL,target REAL NOT NULL,current REAL NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS financial_plans (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,name TEXT NOT NULL,monthly_savings REAL NOT NULL,discretionary_cut REAL NOT NULL,projected_gain REAL NOT NULL,status TEXT NOT NULL DEFAULT 'proposed',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    `);
    const cols = getDb().prepare('PRAGMA table_info(transactions)').all() as Array<{name:string;pk:number}>;
    const userIdCol = cols.find(c => c.name === 'user_id');
    const compositePk = cols.some(c => c.name === 'user_id' && c.pk === 1) && cols.some(c => c.name === 'id' && c.pk === 2);
    const profileCols = db.prepare('PRAGMA table_info(financial_profiles)').all() as Array<{name:string}>;
    const profileNames = new Set(profileCols.map(c=>c.name));
    const profileAdditions: Record<string,string> = {
      current_net_worth: "REAL NOT NULL DEFAULT 0",
      monthly_debt_payment: "REAL NOT NULL DEFAULT 0",
      dependents: "INTEGER NOT NULL DEFAULT 0",
      income_stability: "TEXT NOT NULL DEFAULT 'stable'",
      primary_goal: "TEXT NOT NULL DEFAULT 'emergency'"
    };
    for (const [name, definition] of Object.entries(profileAdditions)) if (!profileNames.has(name)) db.exec(`ALTER TABLE financial_profiles ADD COLUMN ${name} ${definition}`);
    if (!userIdCol || !compositePk) {
      if (!userIdCol) {
        const legacyOwner = process.env.PENNYWISE_LEGACY_USER_ID;
        if (!legacyOwner) throw new Error('Legacy transaction table requires PENNYWISE_LEGACY_USER_ID before migration');
        db.exec(`CREATE TABLE transactions_migrated (id TEXT NOT NULL,user_id TEXT NOT NULL,date TEXT NOT NULL,description TEXT NOT NULL,amount REAL NOT NULL,category TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY (user_id,id));`); db.prepare('INSERT INTO transactions_migrated(id,user_id,date,description,amount,category,created_at) SELECT id, ?, date, description, amount, category, created_at FROM transactions').run(legacyOwner); db.exec(`DROP TABLE transactions; ALTER TABLE transactions_migrated RENAME TO transactions;`);
      } else {
        db.exec(`CREATE TABLE transactions_migrated (id TEXT NOT NULL,user_id TEXT NOT NULL,date TEXT NOT NULL,description TEXT NOT NULL,amount REAL NOT NULL,category TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY (user_id,id)); INSERT INTO transactions_migrated(id,user_id,date,description,amount,category,created_at) SELECT id, user_id, date, description, amount, category, created_at FROM transactions; DROP TABLE transactions; ALTER TABLE transactions_migrated RENAME TO transactions;`);
      }
    }
  }
  return db;
}

export function createUser(input:{email:string;passwordHash:string;passwordSalt:string}): User {
  const id = `usr-${randomId()}`;
  getDb().prepare('INSERT INTO users(id,email,password_hash,password_salt) VALUES(?,?,?,?)').run(id,input.email,input.passwordHash,input.passwordSalt);
  return { id, email: input.email, passwordHash: input.passwordHash, passwordSalt: input.passwordSalt };
}
export function getUserByEmail(email:string): User|undefined { return getDb().prepare('SELECT id,email,password_hash as passwordHash,password_salt as passwordSalt FROM users WHERE email=?').get(email) as User|undefined; }
export function getUserById(id:string): SessionUser|undefined { return getDb().prepare('SELECT id,email FROM users WHERE id=?').get(id) as SessionUser|undefined; }
export function createSession(userId:string, tokenHash:string, expiresAt:string) { getDb().prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(tokenHash,userId,expiresAt); }
export function deleteSession(tokenHash:string) { getDb().prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash); }
export function getSessionUser(tokenHash:string): SessionUser|null { const row=getDb().prepare('SELECT u.id,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(tokenHash,new Date().toISOString()) as SessionUser|undefined; return row??null; }
function randomId(){ return `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}`; }

export function listTransactions(userId:string): Transaction[] { return getDb().prepare('SELECT id,date,description,amount,category FROM transactions WHERE user_id=? ORDER BY date DESC, created_at DESC').all(userId) as unknown as Transaction[]; }
export function replaceTransactions(userId:string, rows: Transaction[]) {
 const d=getDb(); d.exec('BEGIN'); try { d.prepare('DELETE FROM transactions WHERE user_id=?').run(userId); const s=d.prepare('INSERT INTO transactions(id,user_id,date,description,amount,category) VALUES(?,?,?,?,?,?)'); for(const t of rows)s.run(t.id,userId,t.date,t.description,t.amount,t.category); d.exec('COMMIT'); } catch(e){d.exec('ROLLBACK');throw e;} return listTransactions(userId);
}
export type Profile = {monthlyBudget:number;emergencyFundTarget:number;currentNetWorth:number;monthlyDebtPayment:number;dependents:number;incomeStability:'stable'|'variable'|'uncertain';primaryGoal:'emergency'|'debt'|'savings'|'investing'};
export function getProfile(userId:string):Profile { const row=getDb().prepare('SELECT monthly_budget as monthlyBudget, emergency_fund_target as emergencyFundTarget, current_net_worth as currentNetWorth, monthly_debt_payment as monthlyDebtPayment, dependents, income_stability as incomeStability, primary_goal as primaryGoal FROM financial_profiles WHERE user_id=?').get(userId) as Profile|undefined; return row??{monthlyBudget:600000,emergencyFundTarget:1000000,currentNetWorth:0,monthlyDebtPayment:0,dependents:0,incomeStability:'stable',primaryGoal:'emergency'}; }
export function saveProfile(userId:string,profile:Profile) { getDb().prepare(`INSERT INTO financial_profiles(user_id,monthly_budget,emergency_fund_target,current_net_worth,monthly_debt_payment,dependents,income_stability,primary_goal) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET monthly_budget=excluded.monthly_budget, emergency_fund_target=excluded.emergency_fund_target, current_net_worth=excluded.current_net_worth, monthly_debt_payment=excluded.monthly_debt_payment, dependents=excluded.dependents, income_stability=excluded.income_stability, primary_goal=excluded.primary_goal, updated_at=CURRENT_TIMESTAMP`).run(userId,profile.monthlyBudget,profile.emergencyFundTarget,profile.currentNetWorth,profile.monthlyDebtPayment,profile.dependents,profile.incomeStability,profile.primaryGoal); return getProfile(userId); }

export type Goal = {id:string;name:string;target:number;current:number};
export function listGoals(userId:string):Goal[] { return getDb().prepare('SELECT id,name,target,current FROM savings_goals WHERE user_id=? ORDER BY created_at DESC').all(userId) as unknown as Goal[]; }
export function createGoal(userId:string,goal:Omit<Goal,'id'>) { const id = `goal-${Date.now()}-${randomBytes(6).toString('hex')}`; getDb().prepare('INSERT INTO savings_goals(id,user_id,name,target,current) VALUES(?,?,?,?,?)').run(id,userId,goal.name,goal.target,goal.current); return { ...goal, id }; }

export function savePlan(userId:string,plan:Plan) { const id=`plan-${Date.now()}-${randomBytes(6).toString('hex')}`; getDb().prepare('UPDATE financial_plans SET status=\'archived\' WHERE user_id=? AND status=\'accepted\'').run(userId); getDb().prepare('INSERT INTO financial_plans(id,user_id,name,monthly_savings,discretionary_cut,projected_gain,status) VALUES(?,?,?,?,?,?,?)').run(id,userId,plan.name,plan.monthlySavings,plan.cut,plan.projectedGain,'accepted'); return {id,...plan,status:'accepted' as const}; }
export function listPlans(userId:string) { return getDb().prepare('SELECT id,name,monthly_savings as monthlySavings,discretionary_cut as cut,projected_gain as projectedGain,status,created_at as createdAt FROM financial_plans WHERE user_id=? ORDER BY created_at DESC').all(userId); }
