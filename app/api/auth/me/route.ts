import { NextResponse } from 'next/server';
import { getCurrentUser, publicUser } from '../../../../lib/auth.ts';
export const runtime='nodejs';
export async function GET(){try{const u=await getCurrentUser();if(!u)return NextResponse.json({error:'Unauthenticated'},{status:401});return NextResponse.json({user:publicUser(u)});}catch{return NextResponse.json({error:'Authentication service unavailable'},{status:503});}}
