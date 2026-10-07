import { NextResponse } from 'next/server';
import { requireCurrentUser } from '../../../lib/auth.ts';
import { getProfile, saveProfile } from '../../../lib/db.ts';
import { validateProfile } from '../../../lib/validation.ts';
export const runtime='nodejs';
export async function GET(){try{const u=await requireCurrentUser();return NextResponse.json({profile:getProfile(u.id)});}catch{return NextResponse.json({error:'Unauthenticated'},{status:401});}}
export async function PUT(req:Request){try{const u=await requireCurrentUser();return NextResponse.json({profile:saveProfile(u.id,validateProfile(await req.json()))});}catch(e){if(e instanceof Error&&e.message==='UNAUTHENTICATED')return NextResponse.json({error:'Unauthenticated'},{status:401});return NextResponse.json({error:e instanceof Error?e.message:'Invalid profile'},{status:400});}}
