import { CATEGORIES, isCategory, type Transaction } from './domain.ts';

export function validateTransactions(value: unknown): Transaction[] {
  if (!Array.isArray(value)) throw new Error('transactions must be an array');
  const seen = new Set<string>();
  return value.map((item, index) => {
    if (!item || typeof item !== 'object') throw new Error(`Invalid transaction at index ${index}`);
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? `tx-${index + 1}`).trim();
    const date = String(row.date ?? '').trim();
    const description = String(row.description ?? '').trim();
    const amount = typeof row.amount === 'number' ? row.amount : Number(row.amount);
    const category = row.category == null ? undefined : String(row.category);
    if (!id || seen.has(id)) throw new Error(`Duplicate or missing transaction id at index ${index}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error(`Invalid transaction date at index ${index}`);
    if (!description || description.length > 240) throw new Error(`Invalid transaction description at index ${index}`);
    if (!Number.isFinite(amount)) throw new Error(`Invalid transaction amount at index ${index}`);
    if (category && !isCategory(category)) throw new Error(`Invalid category at index ${index}; expected one of ${CATEGORIES.join(', ')}`);
    seen.add(id);
    return { id, date, description, amount, category: category as Transaction['category'] };
  });
}

export function validateProfile(value: unknown) {
  const row = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const monthlyBudget = Number(row.monthlyBudget);
  const emergencyFundTarget = Number(row.emergencyFundTarget);
  const currentNetWorth = Number(row.currentNetWorth ?? 0);
  const monthlyDebtPayment = Number(row.monthlyDebtPayment ?? 0);
  const dependents = Number(row.dependents ?? 0);
  const incomeStability = String(row.incomeStability ?? 'stable');
  const primaryGoal = String(row.primaryGoal ?? 'emergency');
  if (!Number.isFinite(monthlyBudget) || monthlyBudget < 0 || monthlyBudget > 1_000_000_000) throw new Error('monthlyBudget must be a valid non-negative amount');
  if (!Number.isFinite(emergencyFundTarget) || emergencyFundTarget < 0 || emergencyFundTarget > 10_000_000_000) throw new Error('emergencyFundTarget must be a valid non-negative amount');
  if (!Number.isFinite(currentNetWorth) || currentNetWorth < -100_000_000_000 || currentNetWorth > 100_000_000_000) throw new Error('currentNetWorth must be a valid amount');
  if (!Number.isFinite(monthlyDebtPayment) || monthlyDebtPayment < 0 || monthlyDebtPayment > 1_000_000_000) throw new Error('monthlyDebtPayment must be a valid non-negative amount');
  if (!Number.isInteger(dependents) || dependents < 0 || dependents > 50) throw new Error('dependents must be a whole number between 0 and 50');
  if (!['stable','variable','uncertain'].includes(incomeStability)) throw new Error('incomeStability is invalid');
  if (!['emergency','debt','savings','investing'].includes(primaryGoal)) throw new Error('primaryGoal is invalid');
  return { monthlyBudget, emergencyFundTarget, currentNetWorth, monthlyDebtPayment, dependents, incomeStability: incomeStability as 'stable'|'variable'|'uncertain', primaryGoal: primaryGoal as 'emergency'|'debt'|'savings'|'investing' };
}

export function validateGoal(value: unknown) {
  const row = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const name = String(row.name ?? '').trim();
  const target = Number(row.target);
  const current = Number(row.current ?? 0);
  if (!name || name.length > 100) throw new Error('Goal name is required');
  if (!Number.isFinite(target) || target <= 0) throw new Error('Goal target must be greater than zero');
  if (!Number.isFinite(current) || current < 0 || current > target) throw new Error('Goal current amount is invalid');
  return { name, target, current };
}
