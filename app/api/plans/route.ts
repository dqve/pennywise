import { NextResponse } from 'next/server';
import { requireCurrentUser } from '../../../lib/auth.ts';
import { listPlans, savePlan } from '../../../lib/db.ts';
import type { Plan } from '../../../lib/domain.ts';
export const runtime='nodejs';
function validPlan(p:unknown):p is Plan { if(!p||typeof p!=='object')return false;const x=p as Record<string,unknown>;return typeof x.id==='string'&&typeof x.name==='string'&&Number.isFinite(x.monthlySavings)&&Number.isFinite(x.cut)&&Number.isFinite(x.projectedGain); }
export async function GET(){try{const u=await requireCurrentUser();return NextResponse.json({plans:listPlans(u.id)});}catch{return NextResponse.json({error:'Unauthenticated'},{status:401});}}
export async function POST(req:Request){try{const u=await requireCurrentUser();const body=await req.json();if(!validPlan(body?.plan))throw new Error('Invalid plan');return NextResponse.json({plan:savePlan(u.id,body.plan)},{status:201});}catch(e){if(e instanceof Error&&e.message==='UNAUTHENTICATED')return NextResponse.json({error:'Unauthenticated'},{status:401});return NextResponse.json({error:e instanceof Error?e.message:'Invalid plan'},{status:400});}}
