import { NextResponse } from 'next/server';
import { isSameOriginMutation } from '../../../../lib/request-security.ts';
import { endSession } from '../../../../lib/auth.ts';
export const runtime='nodejs';
export async function POST(req:Request){
  if (!isSameOriginMutation(req)) return NextResponse.json({error:'Cross-origin request rejected'},{status:403});
  try{await endSession();}catch{/* endSession clears the browser cookie in a finally block */}
  return NextResponse.json({ok:true});
}
