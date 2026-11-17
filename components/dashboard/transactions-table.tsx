'use client';
import { useMemo, useState } from 'react';
import type { Transaction } from '../../lib/domain.ts';

type SortKey='date'|'description'|'category'|'amount';
type Props={rows:Transaction[];formatMoney:(value:number)=>string;hideAmounts?:boolean};

export function TransactionsTable({rows,formatMoney,hideAmounts=false}:Props){
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('all');
 const [sortKey,setSortKey]=useState<SortKey>('date');
 const [descending,setDescending]=useState(true);
 const [page,setPage]=useState(1);
 const pageSize=10;
 const categories=useMemo(()=>Array.from(new Set(rows.map(r=>r.category||'Other'))).sort((a,b)=>a.localeCompare(b)),[rows]);
 const filtered=useMemo(()=>{
  const q=query.trim().toLowerCase();
  return rows.filter(row=>{
   const rowCategory=row.category||'Other';
   const matchesCategory=category==='all'||rowCategory===category;
   const haystack=[row.description,rowCategory,row.date,String(row.amount)].join(' ').toLowerCase();
   return matchesCategory&&(!q||haystack.includes(q));
  }).sort((a,b)=>{
   let result=0;
   if(sortKey==='amount')result=a.amount-b.amount;
   else if(sortKey==='date')result=a.date.localeCompare(b.date);
   else if(sortKey==='category')result=(a.category||'Other').localeCompare(b.category||'Other');
   else result=a.description.localeCompare(b.description);
   return descending?-result:result;
  });
 },[rows,query,category,sortKey,descending]);
 const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
 const safePage=Math.min(page,totalPages);
 const visible=filtered.slice((safePage-1)*pageSize,safePage*pageSize);
 function sortBy(key:SortKey){if(sortKey===key)setDescending(v=>!v);else{setSortKey(key);setDescending(key==='date'||key==='amount');}setPage(1);}
 function header(key:SortKey,label:string){return <button type="button" className="table-sort" aria-label={`Sort by ${label}`} onClick={()=>sortBy(key)}>{label}<span aria-hidden="true">{sortKey===key?(descending?'↓':'↑'):'↕'}</span></button>}
 return <section id="all-transactions" className="panel transactions-full" aria-labelledby="all-transactions-title">
  <div className="panel-head table-heading"><div><span className="eyebrow">YOUR FULL MONEY HISTORY</span><h3 id="all-transactions-title">All transactions <span className="pill">{rows.length}</span></h3><p>Search, filter and sort the activity you imported.</p></div></div>
  <div className="table-toolbar">
   <label className="table-search"><span aria-hidden="true">⌕</span><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="Search transactions" aria-label="Search transactions"/>{query&&<button type="button" onClick={()=>{setQuery('');setPage(1)}} aria-label="Clear search">×</button>}</label>
   <label className="filter-select"><span>Category</span><select value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}><option value="all">All categories</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
  </div>
  {visible.length?<div className="table-wrap"><table className="transactions-table"><thead><tr><th>{header('date','Date')}</th><th>{header('description','Description')}</th><th>{header('category','Category')}</th><th className="amount-cell">{header('amount','Amount')}</th></tr></thead><tbody>{visible.map(row=><tr key={row.id}><td data-label="Date">{row.date}</td><td data-label="Description" className="description-cell">{row.description}</td><td data-label="Category"><span className="category-pill">{row.category||'Other'}</span></td><td data-label="Amount" className={`amount-cell ${row.amount<0?'negative':'positive'}`}>{hideAmounts?'••••••':`${row.amount<0?'−':'+'}${formatMoney(Math.abs(row.amount))}`}</td></tr>)}</tbody></table></div>:<div className="table-empty"><strong>{rows.length?'No matching transactions':'No transactions yet'}</strong><span>{rows.length?'Try another search or category.':'Import a statement to see your transaction history here.'}</span></div>}
  <div className="table-pagination"><span>Showing {filtered.length?((safePage-1)*pageSize)+1:0}–{Math.min(safePage*pageSize,filtered.length)} of {filtered.length}</span><div><button type="button" disabled={safePage<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>← Previous</button><span>Page {safePage} of {totalPages}</span><button type="button" disabled={safePage>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next →</button></div></div>
 </section>;
}
