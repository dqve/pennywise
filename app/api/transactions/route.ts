import { NextResponse } from 'next/server';
import { requireCurrentUser } from '../../../lib/auth.ts';
import { listTransactions, replaceTransactions } from '../../../lib/db.ts';
import { normalizeTransactions } from '../../../lib/domain.ts';
import { validateTransactions } from '../../../lib/validation.ts';
export const runtime='nodejs';
export async function GET(){try{const u=await requireCurrentUser();return NextResponse.json({transactions:listTransactions(u.id)});}catch{return NextResponse.json({error:'Unauthenticated'},{status:401});}}
export async function PUT(req:Request){try{const u=await requireCurrentUser();const body=await req.json();const tx=normalizeTransactions(validateTransactions(body?.transactions));return NextResponse.json({transactions:replaceTransactions(u.id,tx)});}catch(e){if(e instanceof Error&&e.message==='UNAUTHENTICATED')return NextResponse.json({error:'Unauthenticated'},{status:401});return NextResponse.json({error:e instanceof Error?e.message:'Invalid request'},{status:400});}}
