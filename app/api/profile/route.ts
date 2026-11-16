import { NextResponse } from 'next/server';
import { requireCurrentUser } from '../../../lib/auth.ts';
import { getProfile, saveProfile } from '../../../lib/db-runtime.ts';
import { validateProfile } from '../../../lib/validation.ts';
export const runtime='nodejs';
export async function GET(){
  try{const u=await requireCurrentUser();return NextResponse.json({profile:await getProfile(u.id)});}
  catch(e){const unauth=e instanceof Error&&e.message==='UNAUTHENTICATED';return NextResponse.json({error:unauth?'Unauthenticated':'Service temporarily unavailable'},{status:unauth?401:503});}
}
export async function PUT(req:Request){
  let user;try{user=await requireCurrentUser();}catch(e){const unauth=e instanceof Error&&e.message==='UNAUTHENTICATED';return NextResponse.json({error:unauth?'Unauthenticated':'Service temporarily unavailable'},{status:unauth?401:503});}
  let profile;try{profile=validateProfile(await req.json());}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Invalid profile'},{status:400});}
  try{return NextResponse.json({profile:await saveProfile(user.id,profile)});}
  catch{return NextResponse.json({error:'Could not save profile right now'},{status:503});}
}
