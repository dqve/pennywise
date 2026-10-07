import { NextResponse } from 'next/server';
import { requireCurrentUser } from '../../../../lib/auth.ts';
import { replaceTransactions } from '../../../../lib/db.ts';
import { extractPdfTransactions } from '../../../../lib/pdf.ts';
export const runtime='nodejs';
export async function POST(req:Request){
  try{
    const u=await requireCurrentUser();
    const form=await req.formData();
    const file=form.get('file');
    if(!(file instanceof File)) return NextResponse.json({error:'PDF file is required'},{status:400});
    if(file.type!=='application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return NextResponse.json({error:'Only PDF statements are accepted'},{status:415});
    if(file.size>10*1024*1024) return NextResponse.json({error:'PDF must be 10MB or smaller'},{status:413});
    const tx=await extractPdfTransactions(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({transactions:replaceTransactions(u.id,tx),count:tx.length});
  }catch(e){
    if(e instanceof Error&&e.message==='UNAUTHENTICATED') return NextResponse.json({error:'Unauthenticated'},{status:401});
    return NextResponse.json({error:e instanceof Error?e.message:'Could not extract PDF statement'},{status:400});
  }
}
