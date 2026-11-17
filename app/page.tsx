'use client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { parseCSV } from '../lib/parser.ts';
import { calculateMetrics, generatePlans, inferCategory, type Plan, type Transaction } from '../lib/domain.ts';
import { SpendingBreakdown } from '../components/dashboard/spending-breakdown.tsx';
import { TransactionsTable } from '../components/dashboard/transactions-table.tsx';

type Profile={monthlyBudget:number;emergencyFundTarget:number;currentNetWorth:number;monthlyDebtPayment:number;dependents:number;incomeStability:'stable'|'variable'|'uncertain';primaryGoal:'emergency'|'debt'|'savings'|'investing'};
type Goal={id:string;name:string;target:number;current:number};
type User={id:string;email:string};
type SavedPlan={id:string;name:string;status:string};
type Notice={kind:'success'|'error'|'info';text:string};
const initialProfile:Profile={monthlyBudget:600000,emergencyFundTarget:1000000,currentNetWorth:0,monthlyDebtPayment:0,dependents:0,incomeStability:'stable',primaryGoal:'emergency'};
const money=(value:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(Number.isFinite(value)?value:0);

function AnimatedAmount({value,hidden=false}:{value:number;hidden?:boolean}){
 const [display,setDisplay]=useState(value);
 useEffect(()=>{
  if(typeof window==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches){setDisplay(value);return}
  const startValue=display;const started=performance.now();const duration=460;let frame=0;
  const tick=(now:number)=>{const t=Math.min(1,(now-started)/duration);const eased=1-Math.pow(1-t,3);setDisplay(startValue+(value-startValue)*eased);if(t<1)frame=requestAnimationFrame(tick)};
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[value]);
 return <span aria-label={hidden?'Balance hidden':money(value)}>{hidden?'••••••':money(display)}</span>;
}

export default function Home(){
 const [user,setUser]=useState<User|null>(null);
 const [authMode,setAuthMode]=useState<'login'|'signup'>('login');
 const [authEmail,setAuthEmail]=useState(''),[authPassword,setAuthPassword]=useState(''),[authMessage,setAuthMessage]=useState('');
 const [authLoading,setAuthLoading]=useState(true),[authBusy,setAuthBusy]=useState(false);
 const [transactions,setTransactions]=useState<Transaction[]>([]);
 const [profile,setProfile]=useState<Profile>(initialProfile);
 const [goals,setGoals]=useState<Goal[]>([]);
 const [savedPlans,setSavedPlans]=useState<SavedPlan[]>([]);
 const [selectedPlanId,setSelectedPlanId]=useState('balanced');
 const [workspaceLoading,setWorkspaceLoading]=useState(false);
 const [importing,setImporting]=useState(false);
 const [importedFile,setImportedFile]=useState('');
 const [notice,setNotice]=useState<Notice|null>(null);
 const [balancesHidden,setBalancesHidden]=useState(false);

 const metrics=useMemo(()=>calculateMetrics(transactions,profile.monthlyBudget),[transactions,profile.monthlyBudget]);
 const plans=useMemo(()=>generatePlans(metrics),[metrics]);
 const selectedPlan=plans.find(p=>p.id===selectedPlanId)??plans[0];
 const projectedNetWorth=profile.currentNetWorth+selectedPlan.monthlySavings*12;
 const categorySpend=useMemo(()=>{
  const totals=new Map<string,number>();
  for(const tx of transactions){if(tx.amount>=0)continue;const category=tx.category??inferCategory(tx.description,tx.amount);totals.set(category,(totals.get(category)??0)+Math.abs(tx.amount));}
  return [...totals.entries()].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
 },[transactions]);

 function notify(text:string,kind:Notice['kind']='info'){setNotice({text,kind});}
 async function api(path:string,method:string,body?:unknown){
  const response=await fetch(path,{method,headers:body===undefined?undefined:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error??`Request failed (${response.status})`);
  return data;
 }

 useEffect(()=>{
  let active=true;
  fetch('/api/auth/me').then(async response=>{
   if(response.status===401)return;
   if(!response.ok)throw new Error('Pennywise is temporarily unavailable. Please try again.');
   const data=await response.json();if(active)setUser(data.user);
  }).catch(error=>{if(active)setAuthMessage(error instanceof Error?error.message:'Could not reach Pennywise. Check your connection and try again.')})
   .finally(()=>{if(active)setAuthLoading(false)});
  return()=>{active=false};
 },[]);

 useEffect(()=>{
  if(!user)return;
  let active=true;setWorkspaceLoading(true);setNotice(null);
  Promise.all(['/api/transactions','/api/profile','/api/goals','/api/plans'].map(async path=>{
   const response=await fetch(path);const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error??'Could not load your financial workspace');
   return data;
  })).then(([t,p,g,pl])=>{
   if(!active)return;
   setTransactions(t.transactions??[]);setProfile(p.profile??initialProfile);setGoals(g.goals??[]);setSavedPlans(pl.plans??[]);
  }).catch(error=>{if(active)notify(error instanceof Error?error.message:'Could not load your data','error')})
   .finally(()=>{if(active)setWorkspaceLoading(false)});
  return()=>{active=false};
 },[user]);

 async function authenticate(event:FormEvent){
  event.preventDefault();setAuthBusy(true);setAuthMessage('');
  try{
   const data=await api(`/api/auth/${authMode}`,'POST',{email:authEmail,password:authPassword});
   setTransactions([]);setProfile(initialProfile);setGoals([]);setSavedPlans([]);setNotice(null);setUser(data.user);setAuthPassword('');
  }catch(error){setAuthMessage(error instanceof Error?error.message:'Could not authenticate')}
  finally{setAuthBusy(false)}
 }
 async function logout(){
  try{await api('/api/auth/logout','POST');setUser(null);setTransactions([]);setGoals([]);setSavedPlans([]);setProfile(initialProfile);setImportedFile('');setNotice(null);}
  catch(error){notify(error instanceof Error?error.message:'Could not sign out','error')}
 }
 async function importStatement(file:File){
  if(file.size>20*1024*1024){notify('Statements must be 20MB or smaller.','error');return}
  if(file.name.toLowerCase().endsWith('.pdf')&&file.size>10*1024*1024){notify('PDF statements must be 10MB or smaller.','error');return}
  if(transactions.length&&!window.confirm('Importing this statement will replace your current transaction history. Continue?'))return;
  setImporting(true);setImportedFile(file.name);setNotice(null);
  try{
   if(file.name.toLowerCase().endsWith('.pdf')){
    const form=new FormData();form.set('file',file);
    const response=await fetch('/api/transactions/pdf',{method:'POST',body:form});const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error??'PDF import failed');
    setTransactions(data.transactions??[]);notify(`Imported ${data.count??data.transactions?.length??0} transactions from ${file.name}.`,'success');
   }else{
    const parsed=parseCSV(await file.text()).map(row=>({...row,category:row.category??inferCategory(row.description,row.amount)}));
    const data=await api('/api/transactions','PUT',{transactions:parsed});
    setTransactions(data.transactions??[]);notify(`Imported ${parsed.length} transactions from ${file.name}.`,'success');
   }
  }catch(error){notify(error instanceof Error?error.message:'Could not import statement. Your existing transactions were not replaced.','error')}
  finally{setImporting(false)}
 }
 async function saveProfile(){
  try{const data=await api('/api/profile','PUT',profile);setProfile(data.profile);notify('Your financial profile has been saved.','success')}
  catch(error){notify(error instanceof Error?error.message:'Could not save your financial profile.','error')}
 }
 async function acceptPlan(plan:Plan){
  try{const data=await api('/api/plans','POST',{plan});setSavedPlans(previous=>[{id:data.plan.id,name:data.plan.name,status:'accepted'},...previous.map(p=>({...p,status:'archived'}))]);notify(`${plan.name} is now your active plan.`,'success')}
  catch(error){notify(error instanceof Error?error.message:'Could not save your plan.','error')}
 }
 async function addGoal(){
  const name=window.prompt('What are you saving for?','Emergency fund')?.trim();if(!name)return;
  const target=Number(window.prompt('Savings target in NGN','1000000'));
  if(!Number.isFinite(target)||target<=0){notify('Enter a valid positive savings target.','error');return}
  try{const data=await api('/api/goals','POST',{name,target,current:0});setGoals(previous=>[data.goal,...previous]);notify('Your savings goal has been created.','success')}
  catch(error){notify(error instanceof Error?error.message:'Could not create this savings goal.','error')}
 }
 async function updateGoal(goal:Goal){
  const raw=window.prompt(`Current amount saved for ${goal.name} (NGN)`,String(goal.current));if(raw===null)return;
  const current=Number(raw);
  if(!Number.isFinite(current)||current<0||current>goal.target){notify(`Enter an amount between ₦0 and ${money(goal.target)}.`,'error');return}
  try{const data=await api('/api/goals','PATCH',{id:goal.id,current});setGoals(previous=>previous.map(g=>g.id===goal.id?data.goal:g));notify('Savings goal progress updated.','success')}
  catch(error){notify(error instanceof Error?error.message:'Could not update your savings goal.','error')}
 }

 const importControl=<label className={`upload ${importing?'is-busy':''}`} aria-busy={importing}><span aria-hidden="true">{importing?'◌':'↥'}</span>{importing?'Importing statement…':'Import statement'}<input type="file" accept=".csv,.txt,.pdf" disabled={importing||workspaceLoading} onChange={event=>{const file=event.target.files?.[0];if(file)void importStatement(file);event.target.value=''}}/></label>;

 if(authLoading)return <main className="app-loading"><section className="auth-card"><span className="eyebrow">PENNYWISE</span><h1>Opening your financial space…</h1><div className="loading-skeleton"/></section></main>;
 if(!user)return <main className="auth-shell"><div className="auth-brand"><span className="brand-mark">P</span><span>Pennywise</span></div><section className="auth-card"><span className="eyebrow">YOUR MONEY, WITH A PLAN</span><h1>{authMode==='login'?'Welcome back.':'Start your financial plan.'}</h1><p>{authMode==='login'?'Sign in to continue to your private financial dashboard.':'Create your private Pennywise workspace.'}</p><form onSubmit={authenticate}><label>Email address<input type="email" required autoComplete="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" required minLength={8} autoComplete={authMode==='login'?'current-password':'new-password'} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="At least 8 characters"/></label>{authMessage&&<div className="notice error" role="alert">{authMessage}</div>}<button className="primary" disabled={authBusy} type="submit">{authBusy?'Please wait…':authMode==='login'?'Sign in':'Create account'} <span>→</span></button></form><p className="auth-switch">{authMode==='login'?'New to Pennywise?':'Already have an account?'} <button type="button" onClick={()=>{setAuthMode(authMode==='login'?'signup':'login');setAuthMessage('')}}>{authMode==='login'?'Create an account':'Sign in'}</button></p><p className="auth-privacy">Your financial information is accessible only through your private account.</p></section></main>;

 return <main className="dashboard-shell">
  <header className="dashboard-header"><div className="brand-lockup"><span className="brand-mark">P</span><div><span className="eyebrow">PERSONAL FINANCE</span><h1>Pennywise</h1></div></div><div className="header-copy"><h2>Your money, with a plan.</h2><p>Understand your behaviour → score it → plan your next move.</p></div><div className="header-actions"><span className="account">{user.email}</span><button className="secondary privacy-toggle" type="button" aria-pressed={balancesHidden} onClick={()=>setBalancesHidden(v=>!v)}>{balancesHidden?'◉ Show balances':'◌ Hide balances'}</button>{importControl}<button className="secondary sign-out" type="button" onClick={()=>void logout()}>Sign out</button></div></header>
  {notice&&<div className={`notice notice-${notice.kind}`} role={notice.kind==='error'?'alert':'status'}><span>{notice.text}</span><button type="button" onClick={()=>setNotice(null)} aria-label="Dismiss message">×</button></div>}
  {workspaceLoading&&<div className="loading-line" role="status">Refreshing your financial workspace…</div>}

  {!transactions.length?<section className="empty-state"><div className="empty-icon">↥</div><span className="eyebrow">YOUR FIRST STEP</span><h2>Bring your financial picture into focus.</h2><p>Import a CSV, TXT or text-based PDF statement. Pennywise will organise your transactions, calculate your current financial picture and suggest plans built around the information you provide.</p>{importControl}<small>CSV and TXT statements · Text-based PDF statements up to 10MB</small></section>:<>
   <section className="hero"><div className="hero-score-block"><span className="eyebrow">FINANCIAL HEALTH SCORE</span><div className="hero-score">{metrics.spendingScore}<small>/100</small></div><p>{metrics.spendingScore>=70?'You are building good financial momentum.':'There is room to strengthen your financial habits.'}</p></div><div className="hero-summary"><span className="hero-summary-label">YOUR CURRENT PICTURE</span><strong>{balancesHidden?'••••••':money(metrics.savings)}</strong><span>Estimated savings from {transactions.length} imported transactions</span><div className="hero-summary-foot"><span>Monthly budget</span><b>{balancesHidden?'••••••':money(profile.monthlyBudget)}</b></div></div><div className="hero-accent" aria-hidden="true">✳</div></section>

   <section className="grid stats" aria-label="Financial summary"><article className="card"><div className="stat-label"><span>Income</span><span className="stat-symbol">↗</span></div><strong><AnimatedAmount value={metrics.income} hidden={balancesHidden}/></strong><small>From imported activity</small></article><article className="card"><div className="stat-label"><span>Monthly spend</span><span className="stat-symbol spend">↘</span></div><strong><AnimatedAmount value={metrics.expenses} hidden={balancesHidden}/></strong><small>From imported activity</small></article><article className="card"><div className="stat-label"><span>Estimated savings</span><span className="stat-symbol savings">✳</span></div><strong><AnimatedAmount value={metrics.savings} hidden={balancesHidden}/></strong><small>Income minus spending</small></article><article className="card"><div className="stat-label"><span>Daily budget</span><span className="stat-symbol budget">◷</span></div><strong><AnimatedAmount value={metrics.dailyBudget} hidden={balancesHidden}/></strong><small>Based on your monthly budget</small></article></section>

   <div className="layout"><section className="panel"><div className="panel-head"><div><span className="eyebrow">TRANSACTIONS</span><h3>Recent activity</h3></div><span className="pill">{transactions.length} imported</span></div><div className="transactions">{transactions.slice(0,6).map(transaction=><div className="tx" key={transaction.id}><span className="tx-avatar">{(transaction.category??'O').slice(0,1)}</span><div className="tx-description"><strong>{transaction.description}</strong><span>{transaction.date} · {transaction.category??'Other'}</span></div><b className={transaction.amount<0?'negative':'positive'}>{balancesHidden?'••••••':`${transaction.amount<0?'−':'+'}${money(Math.abs(transaction.amount))}`}</b></div>)}</div>{transactions.length>6&&<a className="panel-link" href="#all-transactions">Explore all transactions ↓</a>}</section>
    <section className="panel"><div className="panel-head"><div><span className="eyebrow">YOUR NEXT MOVE</span><h3>Choose a plan</h3></div></div><div className="plans">{plans.map(plan=><button className={`plan ${selectedPlanId===plan.id?'selected':''}`} key={plan.id} type="button" onClick={()=>setSelectedPlanId(plan.id)} aria-pressed={selectedPlanId===plan.id}><div><strong>{plan.name}</strong><span>Save {balancesHidden?'••••••':money(plan.monthlySavings)}/month</span></div><b>+{balancesHidden?'••••••':money(plan.projectedGain)}</b><small>12-month projected improvement · discretionary cut {balancesHidden?'••••••':money(plan.cut)}</small></button>)}</div><button className="primary" type="button" onClick={()=>void acceptPlan(selectedPlan)}>Accept {selectedPlan.name} <span>→</span></button>{savedPlans.length>0&&<div className="saved-plans"><span className="eyebrow">SAVED PLAN HISTORY</span>{savedPlans.slice(0,2).map(plan=><div key={plan.id}><span>{plan.name}</span><span className={plan.status==='accepted'?'status-active':'status-archived'}>{plan.status}</span></div>)}</div>}</section></div>

   <section className="insights-grid"><section className="panel"><div className="panel-head"><div><span className="eyebrow">SPENDING PATTERNS</span><h3>Where your money goes</h3></div><span className="pill">By category</span></div><SpendingBreakdown data={categorySpend} formatMoney={money} hideAmounts={balancesHidden}/></section><section className="panel"><div className="panel-head"><div><span className="eyebrow">SAVINGS GOALS</span><h3>Turn plans into outcomes</h3></div><button className="secondary" type="button" onClick={()=>void addGoal()}>＋ Add goal</button></div>{goals.length?<div className="goals">{goals.map(goal=><div className="goal" key={goal.id}><div className="goal-header"><strong>{goal.name}</strong><span>{balancesHidden?'••••••':money(goal.current)} of {balancesHidden?'••••••':money(goal.target)}</span></div><div className="bar"><i style={{width:`${Math.min(100,goal.current/goal.target*100)}%`}}/></div><div className="goal-foot"><small>{Math.round(goal.current/goal.target*100)}% complete</small><button type="button" onClick={()=>void updateGoal(goal)}>Update progress</button></div></div>)}</div>:<div className="goals-empty"><p>Create a savings goal to track progress alongside your financial plan.</p><button className="secondary" type="button" onClick={()=>void addGoal()}>Create your first goal →</button></div>}</section></section>

   <section className="panel projection-panel"><div className="panel-head"><div><span className="eyebrow">12-MONTH PROJECTION</span><h3>Where your selected plan points</h3><p>A simple illustration using your current net worth and selected monthly savings target.</p></div><span className="pill">Deterministic projection</span></div><div className="projection-grid"><article><span>Current net worth</span><strong><AnimatedAmount value={profile.currentNetWorth} hidden={balancesHidden}/></strong></article><article><span>Planned 12-month savings</span><strong><AnimatedAmount value={selectedPlan.monthlySavings*12} hidden={balancesHidden}/></strong></article><article><span>Projected net worth</span><strong><AnimatedAmount value={projectedNetWorth} hidden={balancesHidden}/></strong></article><article><span>Selected plan</span><strong className="projection-plan">{selectedPlan.name}</strong></article></div><p className="disclaimer">Illustrative only. This projection excludes investment returns, inflation, changes in income or debt and financial activity not included in your imported statement. It is not a guaranteed outcome or financial advice.</p></section>

   <TransactionsTable rows={transactions} formatMoney={money} hideAmounts={balancesHidden}/>
  </>}

  <section className="panel profile-panel"><div className="panel-head"><div><span className="eyebrow">FINANCIAL ASSESSMENT</span><h3>Set the guardrails Pennywise plans against</h3><p>Your profile helps put the imported transactions into context.</p></div><button className="secondary" type="button" onClick={()=>void saveProfile()}>Save assessment</button></div><div className="form-grid"><label>Current net worth (₦)<input type="number" min="0" value={profile.currentNetWorth} onChange={e=>setProfile({...profile,currentNetWorth:Number(e.target.value)})}/></label><label>Monthly budget (₦)<input type="number" min="0" value={profile.monthlyBudget} onChange={e=>setProfile({...profile,monthlyBudget:Number(e.target.value)})}/></label><label>Emergency fund target (₦)<input type="number" min="0" value={profile.emergencyFundTarget} onChange={e=>setProfile({...profile,emergencyFundTarget:Number(e.target.value)})}/></label><label>Monthly debt payment (₦)<input type="number" min="0" value={profile.monthlyDebtPayment} onChange={e=>setProfile({...profile,monthlyDebtPayment:Number(e.target.value)})}/></label><label>Dependents<input type="number" min="0" step="1" value={profile.dependents} onChange={e=>setProfile({...profile,dependents:Math.max(0,Math.floor(Number(e.target.value)))})}/></label><label>Income stability<select value={profile.incomeStability} onChange={e=>setProfile({...profile,incomeStability:e.target.value as Profile['incomeStability']})}><option value="stable">Stable</option><option value="variable">Variable</option><option value="uncertain">Uncertain</option></select></label><label>Primary financial goal<select value={profile.primaryGoal} onChange={e=>setProfile({...profile,primaryGoal:e.target.value as Profile['primaryGoal']})}><option value="emergency">Emergency fund</option><option value="debt">Debt reduction</option><option value="savings">Grow savings</option><option value="investing">Start investing</option></select></label></div><div className="profile-footnote">Your assessment is private to your account and can be updated at any time.</div></section>
  <footer className="dashboard-footer"><span>Pennywise · Your money, with a plan.</span><span>Financial estimates use only the information you provide.</span></footer>
 </main>;
}
