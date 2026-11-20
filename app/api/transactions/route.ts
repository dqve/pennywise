import { NextResponse } from 'next/server';
import { isSameOriginMutation } from '../../../lib/request-security.ts';
import { requireCurrentUser } from '../../../lib/auth.ts';
import { listTransactions, replaceTransactions } from '../../../lib/db-runtime.ts';
import { normalizeTransactions } from '../../../lib/domain.ts';
import { validateTransactions } from '../../../lib/validation.ts';
export const runtime='nodejs';
export async function GET(){
  try{const u=await requireCurrentUser();return NextResponse.json({transactions:await listTransactions(u.id)});}
  catch(e){const unauth=e instanceof Error&&e.message==='UNAUTHENTICATED';return NextResponse.json({error:unauth?'Unauthenticated':'Service temporarily unavailable'},{status:unauth?401:503});}
}
export async function PUT(req:Request){
  if (!isSameOriginMutation(req)) return NextResponse.json({error:'Cross-origin request rejected'},{status:403});
  let user;try{user=await requireCurrentUser();}catch(e){const unauth=e instanceof Error&&e.message==='UNAUTHENTICATED';return NextResponse.json({error:unauth?'Unauthenticated':'Service temporarily unavailable'},{status:unauth?401:503});}
  let rows;try{const body=await req.json();rows=normalizeTransactions(validateTransactions(body?.transactions));}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Invalid transaction import'},{status:400});}
  try{return NextResponse.json({transactions:await replaceTransactions(user.id,rows)});}
  catch{return NextResponse.json({error:'Could not save transactions right now'},{status:503});}
}
