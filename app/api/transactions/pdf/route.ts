import { NextResponse } from 'next/server';
import { requireCurrentUser } from '../../../../lib/auth.ts';
import { replaceTransactions } from '../../../../lib/db-runtime.ts';
import { extractPdfTransactions } from '../../../../lib/pdf.ts';
export const runtime='nodejs';
export async function POST(req:Request){
  let user;try{user=await requireCurrentUser();}catch(e){const unauth=e instanceof Error&&e.message==='UNAUTHENTICATED';return NextResponse.json({error:unauth?'Unauthenticated':'Service temporarily unavailable'},{status:unauth?401:503});}
  let rows;try{
    const form=await req.formData();const file=form.get('file');
    if(!(file instanceof File))return NextResponse.json({error:'PDF file is required'},{status:400});
    if(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf'))return NextResponse.json({error:'Only PDF statements are accepted'},{status:415});
    if(file.size>10*1024*1024)return NextResponse.json({error:'PDF must be 10MB or smaller'},{status:413});
    rows=await extractPdfTransactions(Buffer.from(await file.arrayBuffer()));
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Could not extract PDF statement'},{status:400});}
  try{return NextResponse.json({transactions:await replaceTransactions(user.id,rows),count:rows.length});}
  catch{return NextResponse.json({error:'Could not save imported transactions right now'},{status:503});}
}
