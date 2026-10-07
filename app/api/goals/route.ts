import { NextResponse } from 'next/server';
import { requireCurrentUser } from '../../../lib/auth.ts';
import { createGoal, listGoals } from '../../../lib/db.ts';
import { validateGoal } from '../../../lib/validation.ts';
export const runtime='nodejs';
export async function GET(){try{const u=await requireCurrentUser();return NextResponse.json({goals:listGoals(u.id)});}catch{return NextResponse.json({error:'Unauthenticated'},{status:401});}}
export async function POST(req:Request){try{const u=await requireCurrentUser();return NextResponse.json({goal:createGoal(u.id,validateGoal(await req.json()))},{status:201});}catch(e){if(e instanceof Error&&e.message==='UNAUTHENTICATED')return NextResponse.json({error:'Unauthenticated'},{status:401});return NextResponse.json({error:e instanceof Error?e.message:'Invalid goal'},{status:400});}}
