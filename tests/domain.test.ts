import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMetrics, generatePlans, inferCategory, normalizeTransactions } from '../lib/domain.ts';

test('known merchants categorise deterministically', () => {
  assert.equal(inferCategory('Bolt ride', -8000), 'Transport');
  assert.equal(inferCategory('Salary ACME', 850000), 'Income');
});

test('core metrics derive from normalized transactions', () => {
  const m = calculateMetrics(normalizeTransactions([
    { id:'1', date:'2026-01-01', description:'Salary', amount:100000 },
    { id:'2', date:'2026-01-02', description:'Shoprite', amount:-25000 }
  ]));
  assert.equal(m.income, 100000);
  assert.equal(m.expenses, 25000);
  assert.equal(m.savings, 75000);
  assert.equal(m.savingsRate, .75);
});

test('financial engine produces three actionable plans', () => {
  const plans = generatePlans(calculateMetrics([{id:'1',date:'2026-01-01',description:'salary',amount:850000,category:'Income'}]));
  assert.equal(plans.length, 3);
  assert.ok(plans.every(p => p.monthlySavings > 0));
});
