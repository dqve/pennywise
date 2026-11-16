import { randomBytes } from 'node:crypto';
import type { Plan, Transaction } from './domain.ts';
import * as local from './db.ts';
import type { Goal, Profile, SessionUser, User } from './db.ts';

const isHosted = Boolean(process.env.VERCEL);
const databaseUrl = process.env.DATABASE_URL;
if (isHosted && !databaseUrl) console.error('Pennywise: DATABASE_URL is required on Vercel');
function hasPostgres() { if (isHosted && !databaseUrl) throw new Error('DATABASE_NOT_CONFIGURED'); return Boolean(databaseUrl); }
let client: ReturnType<typeof import('postgres').default> | undefined;
async function sql() {
  if (!databaseUrl) throw new Error('DATABASE_NOT_CONFIGURED');
  if (!client) { const {default: postgres} = await import('postgres'); client = postgres(databaseUrl, {max: 5, idle_timeout: 20, connect_timeout: 10, prepare: false}); }
  return client;
}
const makeId=(prefix:string)=>`${prefix}-${Date.now().toString(36)}-${randomBytes(8).toString('hex')}`;
const asNum=(value:unknown)=>Number(value);
const asProfile=(r:Record<string,unknown>):Profile=>({monthlyBudget:asNum(r.monthlyBudget),emergencyFundTarget:asNum(r.emergencyFundTarget),currentNetWorth:asNum(r.currentNetWorth),monthlyDebtPayment:asNum(r.monthlyDebtPayment),dependents:asNum(r.dependents),incomeStability:r.incomeStability as Profile['incomeStability'],primaryGoal:r.primaryGoal as Profile['primaryGoal']});
async function withUser<T>(userId:string, task:(tx:any)=>Promise<T>):Promise<T>{
  const db=await sql();
  return await db.begin(async tx=>{
    await tx`SELECT set_config('app.user_id', ${userId}, true)`;
    return task(tx);
  }) as T;
}
export type { User, SessionUser, Profile, Goal };
export async function createUser(input:{email:string;passwordHash:string;passwordSalt:string}):Promise<User>{
  if(!hasPostgres()) return local.createUser(input);
  const id=makeId('usr'); const db=await sql();
  await db`INSERT INTO users(id,email,password_hash,password_salt) VALUES(${id},${input.email},${input.passwordHash},${input.passwordSalt})`;
  return {id,email:input.email,passwordHash:input.passwordHash,passwordSalt:input.passwordSalt};
}
export async function getUserByEmail(email:string):Promise<User|undefined>{
  if(!hasPostgres()) return local.getUserByEmail(email);
  const db=await sql();const rows=await db`SELECT id,email,password_hash AS "passwordHash",password_salt AS "passwordSalt" FROM users WHERE email=${email}`;return rows[0] as User|undefined;
}
export async function getUserById(id:string):Promise<SessionUser|undefined>{
  if(!hasPostgres()) return local.getUserById(id);
  const db=await sql();const rows=await db`SELECT id,email FROM users WHERE id=${id}`;return rows[0] as SessionUser|undefined;
}
export async function createSession(userId:string,tokenHash:string,expiresAt:string):Promise<void>{
  if(!hasPostgres()){local.createSession(userId,tokenHash,expiresAt);return;}
  const db=await sql();await db`INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(${tokenHash},${userId},${expiresAt})`;
}
export async function deleteSession(tokenHash:string):Promise<void>{
  if(!hasPostgres()){local.deleteSession(tokenHash);return;}
  const db=await sql();await db`DELETE FROM sessions WHERE token_hash=${tokenHash}`;
}
export async function getSessionUser(tokenHash:string):Promise<SessionUser|null>{
  if(!hasPostgres())return local.getSessionUser(tokenHash);
  const db=await sql();const rows=await db`SELECT u.id,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=${tokenHash} AND s.expires_at > NOW()`;return (rows[0] as SessionUser|undefined) ?? null;
}
export async function listTransactions(userId:string):Promise<Transaction[]>{
  if(!hasPostgres())return local.listTransactions(userId);
  return withUser(userId,async tx=>{const rows=await tx`SELECT id,date::text AS date,description,amount::float8 AS amount,category FROM transactions WHERE user_id=${userId} ORDER BY date DESC,created_at DESC`;return rows as unknown as Transaction[];});
}
export async function replaceTransactions(userId:string,items:Transaction[]):Promise<Transaction[]>{
  if(!hasPostgres())return local.replaceTransactions(userId,items);
  return withUser(userId,async tx=>{
    await tx`DELETE FROM transactions WHERE user_id=${userId}`;
    for(const t of items) await tx`INSERT INTO transactions(id,user_id,date,description,amount,category) VALUES(${t.id},${userId},${t.date},${t.description},${t.amount},${t.category??'Other'})`;
    const rows=await tx`SELECT id,date::text AS date,description,amount::float8 AS amount,category FROM transactions WHERE user_id=${userId} ORDER BY date DESC,created_at DESC`;
    return rows as unknown as Transaction[];
  });
}
export async function getProfile(userId:string):Promise<Profile>{
  if(!hasPostgres())return local.getProfile(userId);
  return withUser(userId,async tx=>{
    const rows=await tx`SELECT monthly_budget AS "monthlyBudget",emergency_fund_target AS "emergencyFundTarget",current_net_worth AS "currentNetWorth",monthly_debt_payment AS "monthlyDebtPayment",dependents,income_stability AS "incomeStability",primary_goal AS "primaryGoal" FROM financial_profiles WHERE user_id=${userId}`;
    return rows[0]?asProfile(rows[0]):{monthlyBudget:600000,emergencyFundTarget:1000000,currentNetWorth:0,monthlyDebtPayment:0,dependents:0,incomeStability:'stable',primaryGoal:'emergency'};
  });
}
export async function saveProfile(userId:string,p:Profile):Promise<Profile>{
  if(!hasPostgres())return local.saveProfile(userId,p);
  return withUser(userId,async tx=>{
    await tx`INSERT INTO financial_profiles(user_id,monthly_budget,emergency_fund_target,current_net_worth,monthly_debt_payment,dependents,income_stability,primary_goal) VALUES(${userId},${p.monthlyBudget},${p.emergencyFundTarget},${p.currentNetWorth},${p.monthlyDebtPayment},${p.dependents},${p.incomeStability},${p.primaryGoal}) ON CONFLICT(user_id) DO UPDATE SET monthly_budget=EXCLUDED.monthly_budget,emergency_fund_target=EXCLUDED.emergency_fund_target,current_net_worth=EXCLUDED.current_net_worth,monthly_debt_payment=EXCLUDED.monthly_debt_payment,dependents=EXCLUDED.dependents,income_stability=EXCLUDED.income_stability,primary_goal=EXCLUDED.primary_goal,updated_at=NOW()`;
    return p;
  });
}
export async function listGoals(userId:string):Promise<Goal[]>{
  if(!hasPostgres())return local.listGoals(userId);
  return withUser(userId,async tx=>{const rows=await tx`SELECT id,name,target::float8 AS target,current::float8 AS current FROM savings_goals WHERE user_id=${userId} ORDER BY created_at DESC`;return rows as unknown as Goal[];});
}
export async function createGoal(userId:string,g:Omit<Goal,'id'>):Promise<Goal>{
  if(!hasPostgres())return local.createGoal(userId,g);
  const id=makeId('goal');
  await withUser(userId,async tx=>tx`INSERT INTO savings_goals(id,user_id,name,target,current) VALUES(${id},${userId},${g.name},${g.target},${g.current})`);
  return {...g,id};
}
export async function savePlan(userId:string,p:Plan){
  if(!hasPostgres())return local.savePlan(userId,p);
  const id=makeId('plan');
  await withUser(userId,async tx=>{
    await tx`UPDATE financial_plans SET status='archived' WHERE user_id=${userId} AND status='accepted'`;
    await tx`INSERT INTO financial_plans(id,user_id,name,monthly_savings,discretionary_cut,projected_gain,status) VALUES(${id},${userId},${p.name},${p.monthlySavings},${p.cut},${p.projectedGain},'accepted')`;
  });
  return {...p,id,status:'accepted' as const};
}
export async function listPlans(userId:string){
  if(!hasPostgres())return local.listPlans(userId);
  return withUser(userId,async tx=>tx`SELECT id,name,monthly_savings::float8 AS "monthlySavings",discretionary_cut::float8 AS cut,projected_gain::float8 AS "projectedGain",status,created_at AS "createdAt" FROM financial_plans WHERE user_id=${userId} ORDER BY created_at DESC`);
}
export async function updateGoal(userId:string,id:string,current:number):Promise<Goal|undefined>{
  if(!hasPostgres())return local.updateGoal(userId,id,current);
  return withUser(userId,async tx=>{
    const existing=await tx`SELECT target::float8 AS target FROM savings_goals WHERE user_id=${userId} AND id=${id}`;
    if(!existing.length)return undefined;
    if(current>Number(existing[0].target))throw new Error('GOAL_TARGET_EXCEEDED');
    const rows=await tx`UPDATE savings_goals SET current=${current} WHERE user_id=${userId} AND id=${id} RETURNING id,name,target::float8 AS target,current::float8 AS current`;
    return rows[0] as Goal|undefined;
  });
}
