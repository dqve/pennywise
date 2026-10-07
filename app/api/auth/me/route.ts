import { NextResponse } from 'next/server';
import { getCurrentUser, publicUser } from '../../../../lib/auth.ts';
export const runtime='nodejs';
export async function GET(){const u=await getCurrentUser();if(!u)return NextResponse.json({error:'Unauthenticated'},{status:401});return NextResponse.json({user:publicUser(u)});}
