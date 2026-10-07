import { NextResponse } from 'next/server';
import { publicUser, startSession, validateCredentials, verifyUser } from '../../../../lib/auth.ts';
export const runtime='nodejs';
export async function POST(req:Request){try{const body=await req.json();const c=validateCredentials(body?.email,body?.password);const u=verifyUser(c.email,c.password);await startSession(u.id);return NextResponse.json({user:publicUser(u)});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Could not sign in'},{status:401});}}
