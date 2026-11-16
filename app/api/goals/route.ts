import { NextResponse } from 'next/server';
import { requireCurrentUser } from '../../../lib/auth.ts';
import { createGoal, listGoals, updateGoal } from '../../../lib/db-runtime.ts';
import { validateGoal } from '../../../lib/validation.ts';
export const runtime='nodejs';
export async function GET(){
  try{const u=await requireCurrentUser();return NextResponse.json({goals:await listGoals(u.id)});}
  catch(e){const unauth=e instanceof Error&&e.message==='UNAUTHENTICATED';return NextResponse.json({error:unauth?'Unauthenticated':'Service temporarily unavailable'},{status:unauth?401:503});}
}
export async function POST(req:Request){
  let user;try{user=await requireCurrentUser();}catch(e){const unauth=e instanceof Error&&e.message==='UNAUTHENTICATED';return NextResponse.json({error:unauth?'Unauthenticated':'Service temporarily unavailable'},{status:unauth?401:503});}
  let goalInput;try{goalInput=validateGoal(await req.json());}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Invalid goal'},{status:400});}
  try{return NextResponse.json({goal:await createGoal(user.id,goalInput)},{status:201});}
  catch{return NextResponse.json({error:'Could not create goal right now'},{status:503});}
}
export async function PATCH(req:Request){
  let user;try{user=await requireCurrentUser();}catch(e){const unauth=e instanceof Error&&e.message==='UNAUTHENTICATED';return NextResponse.json({error:unauth?'Unauthenticated':'Service temporarily unavailable'},{status:unauth?401:503});}
  let body;try{body=await req.json();}catch{return NextResponse.json({error:'Invalid goal update'},{status:400});}
  if(typeof body?.id!=='string'||body.id.length>120||!Number.isFinite(body.current)||body.current<0||body.current>1e15)return NextResponse.json({error:'Invalid goal update'},{status:400});
  try{
    const existing=(await listGoals(user.id)).find(g=>g.id===body.id);
    if(!existing)return NextResponse.json({error:'Goal not found or update not permitted'},{status:404});
    if(body.current>existing.target)return NextResponse.json({error:'Savings progress cannot exceed the goal target'},{status:400});
    const goal=await updateGoal(user.id,body.id,body.current);
    if(!goal)return NextResponse.json({error:'Goal not found or update not permitted'},{status:404});
    return NextResponse.json({goal});
  }catch{return NextResponse.json({error:'Could not update goal right now'},{status:503});}
}
