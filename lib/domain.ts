export const CATEGORIES = ['Income','Housing','Food','Transport','Entertainment','Utilities','Health','Education','Shopping','Other'] as const;
export type Category = typeof CATEGORIES[number];
export type Transaction = {id:string;date:string;description:string;amount:number;category?:Category};
export type FinancialMetrics = {income:number;expenses:number;savings:number;savingsRate:number;discretionary:number;spendingScore:number;dailyBudget:number};

const rules: Array<[RegExp, Category]> = [
  [/salary|payroll|wage|income/i,'Income'],[/rent|landlord|mortgage/i,'Housing'],[/shoprite|restaurant|food|market|grocery/i,'Food'],[/bolt|uber|fuel|transport/i,'Transport'],[/netflix|spotify|cinema|entertainment/i,'Entertainment'],[/airtime|electric|internet|utility/i,'Utilities'],[/pharmacy|hospital|health/i,'Health'],[/school|tuition|education/i,'Education'],[/amazon|jumia|shopping/i,'Shopping']
];
export function isCategory(value:string):value is Category{return (CATEGORIES as readonly string[]).includes(value)}
export function inferCategory(description:string, amount:number):Category { if(amount>0)return 'Income'; for(const [rx,cat] of rules) if(rx.test(description)) return cat; return 'Other'; }
export function normalizeTransactions(rows:Transaction[]):Transaction[]{ return rows.map((r,i)=>({...r,id:r.id||`tx-${i+1}`,category:r.category&&isCategory(r.category)?r.category:inferCategory(r.description,r.amount)})); }
export function calculateMetrics(tx:Transaction[], monthlyBudget=600000):FinancialMetrics{
 const income=tx.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
 const expenses=Math.abs(tx.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0));
 const savings=Math.max(0,income-expenses); const savingsRate=income? savings/income:0;
 const discretionary=tx.filter(t=>t.amount<0 && ['Entertainment','Shopping','Food'].includes(t.category??inferCategory(t.description,t.amount))).reduce((s,t)=>s+Math.abs(t.amount),0);
 const budgetPressure=monthlyBudget?Math.min(1,expenses/monthlyBudget):0;
 const score=Math.max(0,Math.min(100,Math.round(85 + savingsRate*30 - budgetPressure*35 - (income?discretionary/income:0)*20)));
 return {income,expenses,savings,savingsRate,discretionary,spendingScore:score,dailyBudget:Math.max(0,(monthlyBudget-expenses)/30)};
}
export type Plan={id:string;name:string;monthlySavings:number;cut:number;projectedGain:number};
export function generatePlans(metrics:FinancialMetrics):Plan[]{
 const base=metrics.savings;
 return [
  {id:'balanced',name:'Balanced Builder',monthlySavings:Math.round(Math.max(300000,base*.88)/1000)*1000,cut:Math.round(Math.min(45000,metrics.discretionary*.12)/1000)*1000,projectedGain:Math.round((base*1.15+300000)/1000)*1000},
  {id:'fast',name:'Fast Track',monthlySavings:Math.round(Math.max(390000,base*1.08)/1000)*1000,cut:Math.round(Math.min(90000,metrics.discretionary*.24)/1000)*1000,projectedGain:Math.round((base*1.45+400000)/1000)*1000},
  {id:'comfort',name:'Comfort First',monthlySavings:Math.round(Math.max(240000,base*.70)/1000)*1000,cut:Math.round(Math.min(15000,metrics.discretionary*.05)/1000)*1000,projectedGain:Math.round((base*.9+180000)/1000)*1000}
 ];
}
