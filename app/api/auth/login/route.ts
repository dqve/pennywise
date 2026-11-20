import { NextResponse } from 'next/server';
import { isSameOriginMutation } from '../../../../lib/request-security.ts';
import { publicUser, startSession, validateCredentials, verifyUser } from '../../../../lib/auth.ts';
export const runtime='nodejs';
export async function POST(req:Request){
  if (!isSameOriginMutation(req)) return NextResponse.json({error:'Cross-origin request rejected'},{status:403});
  let credentials;
  try { const body=await req.json(); credentials=validateCredentials(body?.email,body?.password); }
  catch(e){ return NextResponse.json({error:e instanceof Error?e.message:'Invalid credentials'},{status:400}); }
  try { const user=await verifyUser(credentials.email,credentials.password); await startSession(user.id); return NextResponse.json({user:publicUser(user)}); }
  catch(e){ const message=e instanceof Error?e.message:'Authentication service unavailable'; const known=message==='Email or password is incorrect'; return NextResponse.json({error:known?message:'Authentication service temporarily unavailable'},{status:known?401:503}); }
}
