import { NextResponse } from 'next/server';
import { requireCurrentUser } from '../../../lib/auth.ts';
import { listPlans, savePlan, listTransactions, getProfile } from '../../../lib/db-runtime.ts';
import { calculateMetrics, generatePlans, type Plan } from '../../../lib/domain.ts';
export const runtime='nodejs';
function validPlan(p:unknown):p is Plan{if(!p||typeof p!=='object')return false;const x=p as Record<string,unknown>;return typeof x.id==='string'&&typeof x.name==='string'&&Number.isFinite(x.monthlySavings)&&Number.isFinite(x.cut)&&Number.isFinite(x.projectedGain);}
export async function GET(){try{const u=await requireCurrentUser();return NextResponse.json({plans:await listPlans(u.id)});}catch(e){const unauth=e instanceof Error&&e.message==='UNAUTHENTICATED';return NextResponse.json({error:unauth?'Unauthenticated':'Service temporarily unavailable'},{status:unauth?401:503});}}
export async function POST(req:Request){
  let user;try{user=await requireCurrentUser();}catch(e){const unauth=e instanceof Error&&e.message==='UNAUTHENTICATED';return NextResponse.json({error:unauth?'Unauthenticated':'Service temporarily unavailable'},{status:unauth?401:503});}
  let submitted;try{submitted=(await req.json())?.plan;if(!validPlan(submitted))throw new Error('Invalid plan');}catch{return NextResponse.json({error:'Invalid plan selection'},{status:400});}
  try{const [tx,profile]=await Promise.all([listTransactions(user.id),getProfile(user.id)]);const actual=generatePlans(calculateMetrics(tx,profile.monthlyBudget)).find(p=>p.id===submitted.id);if(!actual)return NextResponse.json({error:'Unknown plan selection'},{status:400});return NextResponse.json({plan:await savePlan(user.id,actual)},{status:201});}
  catch{return NextResponse.json({error:'Could not save the selected plan right now'},{status:503});}
}
