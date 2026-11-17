import type { CSSProperties } from 'react';

export type SpendingDatum={label:string;value:number};
const palette=['#173f2d','#47785d','#88a995','#c99a54','#b86f58','#758995'];

export function SpendingBreakdown({data,formatMoney,hideAmounts=false}:{data:SpendingDatum[];formatMoney:(value:number)=>string;hideAmounts?:boolean}){
 const visible=data.filter(d=>Number.isFinite(d.value)&&d.value>0).sort((a,b)=>b.value-a.value).slice(0,6);
 const total=visible.reduce((sum,d)=>sum+d.value,0);
 if(!total)return <div className="breakdown-empty">Your category breakdown will appear after you import transactions.</div>;
 let cursor=0;
 const stops=visible.map((d,i)=>{const start=cursor;cursor+=(d.value/total)*100;return `${palette[i%palette.length]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;});
 const style={'--donut-fill':`conic-gradient(${stops.join(', ')})`} as CSSProperties;
 return <div className="spending-breakdown">
  <div className="donut-chart" style={style} role="img" aria-label={`Spending breakdown across ${visible.length} categories, total ${formatMoney(total)}`}><div className="donut-hole"><small>Total spent</small><strong>{hideAmounts?'••••••':formatMoney(total)}</strong></div></div>
  <ul className="breakdown-legend">{visible.map((d,i)=><li key={d.label}><span className="legend-name"><i style={{background:palette[i%palette.length]}}/><span>{d.label}</span></span><span className="legend-value">{hideAmounts?'••••':formatMoney(d.value)} <small>{Math.round(d.value/total*100)}%</small></span></li>)}</ul>
 </div>;
}
