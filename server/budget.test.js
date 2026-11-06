const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateBudget } = require('./budget');

const month = '2026-11';
const expense = amount => ({ amount, date: '2026-11-06' });
const loan = emi => ({ outstandingPrincipal: 100000, emi });

test('passes when expenses and regular EMI use exactly 95% of income', () => {
  const budget = calculateBudget({ income: 50000, expenses: [expense(27500)], loans: [loan(20000)], month });
  assert.equal(budget.mandatorySavings, 2500);
  assert.equal(budget.maximumBudget, 47500);
  assert.equal(budget.remainingBudget, 0);
  assert.equal(budget.status, 'approaching');
});

test('flags a budget overrun by the precise decimal-safe amount', () => {
  const budget = calculateBudget({ income: 50000, expenses: [expense(30000)], loans: [loan(18000)], month });
  assert.equal(budget.exceededBy, 500);
  assert.equal(budget.status, 'exceeded');
});

test('calculates the fixed savings and maximum budget limits for changed income', () => {
  assert.deepEqual(
    [60000, 40000].map(income => { const budget = calculateBudget({ income, month }); return [budget.mandatorySavings, budget.maximumBudget]; }),
    [[3000, 57000], [2000, 38000]]
  );
});

test('handles no loans, no expenses, multiple loans, and excludes other months', () => {
  const empty = calculateBudget({ income: 40000, month });
  assert.equal(empty.totalExpenses, 0);
  assert.equal(empty.totalEmi, 0);
  const budget = calculateBudget({ income: 50000, expenses: [expense(1000), { amount: 9999, date: '2026-10-31' }], loans: [loan(2000), loan(3000)], month });
  assert.equal(budget.totalExpenses, 1000);
  assert.equal(budget.totalEmi, 5000);
  assert.equal(budget.monthlyBudgetUsed, 6000);
});
