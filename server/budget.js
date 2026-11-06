const round = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function monthBounds(month) {
  const suppliedMonth = typeof month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : null;
  const key = suppliedMonth || new Date().toISOString().slice(0, 7);
  const [year, index] = key.split('-').map(Number);
  return { key, start: new Date(Date.UTC(year, index - 1, 1)), end: new Date(Date.UTC(year, index, 1)) };
}

function validDate(value) {
  return !Number.isNaN(new Date(value).getTime());
}

// The single source of truth for the 5% savings / 95% monthly budget rule.
function calculateBudget({ income, expenses = [], loans = [], month }) {
  const { key, start, end } = monthBounds(month);
  const monthlyIncome = Number(income);
  const monthExpenses = expenses.filter(expense => {
    if (!validDate(expense.date)) return false;
    const date = new Date(expense.date);
    return date >= start && date < end;
  });
  const totalExpenses = round(monthExpenses.reduce((sum, expense) => sum + Math.max(0, Number(expense.amount) || 0), 0));
  const totalEmi = round(loans
    .filter(loan => Number(loan.outstandingPrincipal) > 0)
    .reduce((sum, loan) => sum + Math.max(0, Number(loan.emi) || 0), 0));
  const mandatorySavings = round(Math.max(0, monthlyIncome) * 0.05);
  const maximumBudget = round(Math.max(0, monthlyIncome) * 0.95);
  const used = round(totalExpenses + totalEmi);
  const remainingBudget = round(maximumBudget - used);
  const usagePercentage = maximumBudget > 0 ? round((used / maximumBudget) * 100) : 0;
  const exceededBy = round(Math.max(0, used - maximumBudget));
  const status = monthlyIncome <= 0 ? 'invalid' : exceededBy > 0 ? 'exceeded' : usagePercentage >= 85 ? 'approaching' : 'satisfied';
  return { month: key, monthlyIncome, mandatorySavings, maximumBudget, totalExpenses, totalEmi, monthlyBudgetUsed: used, remainingBudget, usagePercentage, exceededBy, actualSavings: round(monthlyIncome - used), status };
}

module.exports = { calculateBudget, monthBounds, validDate };
