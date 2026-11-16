import { NextResponse } from 'next/server';
import { endSession } from '../../../../lib/auth.ts';
export const runtime='nodejs';
export async function POST(){
  try{await endSession();}catch{/* endSession clears the browser cookie in a finally block */}
  return NextResponse.json({ok:true});
}
