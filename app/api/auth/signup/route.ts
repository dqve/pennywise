import { NextResponse } from 'next/server';
import { publicUser, registerUser, startSession, validateCredentials } from '../../../../lib/auth.ts';
export const runtime='nodejs';
export async function POST(req:Request){
  let credentials;
  try { const body=await req.json(); credentials=validateCredentials(body?.email,body?.password); }
  catch(e){ return NextResponse.json({error:e instanceof Error?e.message:'Invalid registration details'},{status:400}); }
  try { const user=await registerUser(credentials.email,credentials.password); await startSession(user.id); return NextResponse.json({user:publicUser(user)},{status:201}); }
  catch(e){ const message=e instanceof Error?e.message:'Registration service unavailable'; const duplicate=message==='An account with this email already exists'; return NextResponse.json({error:duplicate?message:'Registration service temporarily unavailable'},{status:duplicate?409:503}); }
}
