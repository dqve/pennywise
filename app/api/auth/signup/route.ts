import { NextResponse } from 'next/server';
import { publicUser, registerUser, startSession, validateCredentials } from '../../../../lib/auth.ts';
export const runtime='nodejs';
export async function POST(req:Request){try{const body=await req.json();const c=validateCredentials(body?.email,body?.password);const u=registerUser(c.email,c.password);await startSession(u.id);return NextResponse.json({user:publicUser(u)},{status:201});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Could not create account'},{status:400});}}
