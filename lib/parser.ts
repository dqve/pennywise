import type { Transaction, Category } from './domain.ts';
import { CATEGORIES, inferCategory } from './domain.ts';

function splitCSVLine(line:string):string[]{
  const cells:string[]=[]; let cell=''; let quoted=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){
      if(quoted && line[i+1]==='"'){cell+='"';i++;}
      else quoted=!quoted;
    } else if(ch===',' && !quoted){cells.push(cell.trim());cell='';}
    else cell+=ch;
  }
  if(quoted) throw new Error('Invalid CSV: unmatched quote');
  cells.push(cell.trim()); return cells;
}

export function parseCSV(input:string):Transaction[]{
  const lines=input.replace(/^\uFEFF/,'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length)return [];
  const first=splitCSVLine(lines[0]).map(x=>x.toLowerCase());
  const start=first.includes('date')&&first.some(x=>['description','merchant','narration'].includes(x))?1:0;
  return lines.slice(start).map((line,i)=>{
    const p=splitCSVLine(line);
    if(p.length<3) throw new Error(`Invalid row ${i+1}: expected date, description, amount`);
    const amount=Number(p[2].replace(/[₦,\s]/g,''));
    if(!Number.isFinite(amount)) throw new Error(`Invalid amount on row ${i+1}`);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(p[0])) throw new Error(`Invalid date on row ${i+1}`);
    const category=p[3] && (CATEGORIES as readonly string[]).includes(p[3]) ? p[3] as Category : undefined;
    return {id:`import-${i+1}`,date:p[0],description:p[1],amount,category:category??inferCategory(p[1],amount)};
  });
}
