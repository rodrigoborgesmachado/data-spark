import {
  describePeriod,
  formatDate,
  formatMoney,
  formatMonthKey,
  formatPercent,
  getMonthKey,
  normalizeDescription,
  normalizeText,
  toIsoDate,
} from "./formatters.js";

export const DEFAULT_FILTERS = {
  startDate: "",
  endDate: "",
  account: "",
  status: "",
  category: "",
  subcategory: "",
  tag: "",
  type: "expense",
  search: "",
  minValue: "",
  maxValue: "",
  includePending: true,
  comparePrevious: false,
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export function createInitialFilters(transactions) {
  const period = getTransactionPeriod(transactions);

  return {
    ...DEFAULT_FILTERS,
    startDate: period.start ? toIsoDate(period.start) : "",
    endDate: period.end ? toIsoDate(period.end) : "",
  };
}

export function getTransactionPeriod(transactions) {
  if (!transactions.length) return { start: null, end: null };
  const sorted = [...transactions].sort((a, b) => a.date - b.date);
  return { start: sorted[0].date, end: sorted[sorted.length - 1].date };
}

function parseDateInput(value, endOfDay = false) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0);
}

function getComparableAmount(transaction) {
  return transaction.type === "expense" ? transaction.expenseAmount : transaction.absoluteValue;
}

export function filterTransactions(transactions, filters) {
  const start = parseDateInput(filters.startDate);
  const end = parseDateInput(filters.endDate, true);
  const search = normalizeText(filters.search);
  const minValue = filters.minValue === "" ? null : Number(String(filters.minValue).replace(",", "."));
  const maxValue = filters.maxValue === "" ? null : Number(String(filters.maxValue).replace(",", "."));

  return transactions.filter((transaction) => {
    if (start && transaction.date < start) return false;
    if (end && transaction.date > end) return false;
    if (filters.account && transaction.account !== filters.account) return false;
    if (filters.status && transaction.status !== filters.status) return false;
    if (filters.category && transaction.category !== filters.category) return false;
    if (filters.subcategory && transaction.subcategory !== filters.subcategory) return false;
    if (filters.tag && !transaction.tags.includes(filters.tag)) return false;
    if (filters.type !== "all" && transaction.type !== filters.type) return false;
    if (!filters.includePending && transaction.isPending) return false;
    if (search && !normalizeText(transaction.description).includes(search)) return false;

    const amount = getComparableAmount(transaction);
    if (Number.isFinite(minValue) && amount < minValue) return false;
    if (Number.isFinite(maxValue) && amount > maxValue) return false;

    return true;
  });
}

export function getFilterOptions(transactions) {
  const unique = (selector) =>
    Array.from(new Set(transactions.map(selector).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));

  return {
    accounts: unique((transaction) => transaction.account),
    statuses: unique((transaction) => transaction.status),
    categories: unique((transaction) => transaction.category),
    subcategories: unique((transaction) => transaction.subcategory),
    tags: Array.from(new Set(transactions.flatMap((transaction) => transaction.tags))).sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    ),
  };
}

export function applyDatePreset(filters, transactions, preset) {
  const period = getTransactionPeriod(transactions);
  if (!period.start || !period.end) return filters;

  if (preset === "all") {
    return { ...filters, startDate: toIsoDate(period.start), endDate: toIsoDate(period.end) };
  }

  const maxDate = period.end;
  let start;
  let end = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());

  if (preset === "data-month") {
    start = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  } else {
    const months = preset === "3m" ? 2 : preset === "6m" ? 5 : 11;
    start = new Date(maxDate.getFullYear(), maxDate.getMonth() - months, 1);
  }

  if (start < period.start) start = period.start;

  return { ...filters, startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

export function getPreviousPeriod(filters) {
  const start = parseDateInput(filters.startDate);
  const end = parseDateInput(filters.endDate);
  if (!start || !end || end < start) return null;

  const days = Math.round((end - start) / 86400000) + 1;
  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - days + 1);

  return {
    startDate: toIsoDate(previousStart),
    endDate: toIsoDate(previousEnd),
  };
}

export function getExpenses(transactions) {
  return transactions.filter((transaction) => transaction.type === "expense");
}

export function getIncomes(transactions) {
  return transactions.filter((transaction) => transaction.type === "income");
}

function sumBy(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function groupBy(items, selector) {
  return items.reduce((groups, item) => {
    const key = selector(item) || "Sem informacao";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
    return groups;
  }, new Map());
}

function daysBetween(start, end) {
  if (!start || !end || end < start) return 0;
  return Math.round((end - start) / 86400000) + 1;
}

function monthsBetween(start, end) {
  if (!start || !end || end < start) return 0;
  return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1;
}

function topGroup(transactions, selector) {
  const groups = groupBy(transactions, selector);
  return Array.from(groups.entries())
    .map(([name, items]) => ({
      name,
      total: sumBy(items, (item) => item.expenseAmount),
      count: items.length,
    }))
    .sort((a, b) => b.total - a.total)[0] ?? null;
}

export function calculateMetrics(filteredTransactions, filters, previousTransactions = []) {
  const expenses = getExpenses(filteredTransactions);
  const incomes = getIncomes(filteredTransactions);
  const totalSpent = sumBy(expenses, (transaction) => transaction.expenseAmount);
  const periodStart = parseDateInput(filters.startDate) ?? getTransactionPeriod(filteredTransactions).start;
  const periodEnd = parseDateInput(filters.endDate) ?? getTransactionPeriod(filteredTransactions).end;
  const dayCount = daysBetween(periodStart, periodEnd) || 1;
  const monthCount = monthsBetween(periodStart, periodEnd) || 1;
  const pendingExpenses = expenses.filter((transaction) => transaction.isPending);
  const previousSpent = sumBy(getExpenses(previousTransactions), (transaction) => transaction.expenseAmount);
  const variation = previousSpent > 0 ? (totalSpent - previousSpent) / previousSpent : null;

  return {
    periodStart,
    periodEnd,
    totalSpent,
    monthlyAverage: totalSpent / monthCount,
    dailyAverage: totalSpent / dayCount,
    expenseCount: expenses.length,
    ticketAverage: expenses.length ? totalSpent / expenses.length : 0,
    largestExpense: [...expenses].sort((a, b) => b.expenseAmount - a.expenseAmount)[0] ?? null,
    totalIncome: sumBy(incomes, (transaction) => transaction.absoluteValue),
    topCategory: topGroup(expenses, (transaction) => transaction.category),
    topAccount: topGroup(expenses, (transaction) => transaction.account),
    topMonth: topGroup(expenses, (transaction) => formatMonthKey(getMonthKey(transaction.date))),
    pendingPercent: expenses.length ? pendingExpenses.length / expenses.length : 0,
    pendingTotal: sumBy(pendingExpenses, (transaction) => transaction.expenseAmount),
    variation,
    previousSpent,
  };
}

export function aggregateMonthly(transactions, previousTransactions = []) {
  const monthly = groupBy(getExpenses(transactions), (transaction) => getMonthKey(transaction.date));
  const currentRows = Array.from(monthly.entries())
    .map(([month, items]) => ({
      month,
      label: formatMonthKey(month),
      total: sumBy(items, (item) => item.expenseAmount),
      count: items.length,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const average = currentRows.length
    ? currentRows.reduce((total, item) => total + item.total, 0) / currentRows.length
    : 0;

  const previousRows = Array.from(groupBy(getExpenses(previousTransactions), (transaction) => getMonthKey(transaction.date)).entries())
    .map(([, items], index) => ({
      index,
      previousTotal: sumBy(items, (item) => item.expenseAmount),
    }))
    .sort((a, b) => a.index - b.index);

  return currentRows.map((row, index) => ({
    ...row,
    average,
    previousTotal: previousRows[index]?.previousTotal ?? null,
  }));
}

export function aggregateByCategory(transactions, limit = "10") {
  const rows = Array.from(groupBy(getExpenses(transactions), (transaction) => transaction.category).entries())
    .map(([category, items]) => ({
      category,
      total: sumBy(items, (item) => item.expenseAmount),
      count: items.length,
    }))
    .sort((a, b) => b.total - a.total);

  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const limited = limit === "all" ? rows : rows.slice(0, Number(limit));

  return limited.map((row) => ({
    ...row,
    percent: total ? row.total / total : 0,
  }));
}

export function aggregateCategoryDistribution(transactions, maxSlices = 6) {
  const rows = aggregateByCategory(transactions, "all");
  if (rows.length <= maxSlices) return rows;

  const visible = rows.slice(0, maxSlices - 1);
  const other = rows.slice(maxSlices - 1).reduce(
    (acc, item) => ({
      category: "Outras",
      total: acc.total + item.total,
      count: acc.count + item.count,
      percent: acc.percent + item.percent,
    }),
    { category: "Outras", total: 0, count: 0, percent: 0 },
  );

  return [...visible, other];
}

export function aggregateByAccount(transactions) {
  return Array.from(groupBy(getExpenses(transactions), (transaction) => transaction.account).entries())
    .map(([account, items]) => ({
      account,
      total: sumBy(items, (item) => item.expenseAmount),
      count: items.length,
    }))
    .sort((a, b) => b.total - a.total);
}

export function aggregateByWeekday(transactions) {
  const expenses = getExpenses(transactions);

  return WEEKDAY_LABELS.map((weekday, index) => {
    const items = expenses.filter((transaction) => transaction.date.getDay() === index);
    return {
      weekday,
      total: sumBy(items, (item) => item.expenseAmount),
      average: items.length ? sumBy(items, (item) => item.expenseAmount) / items.length : 0,
      count: items.length,
    };
  });
}

export function aggregateByMonthDay(transactions) {
  const expenses = getExpenses(transactions);

  return Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;
    const items = expenses.filter((transaction) => transaction.date.getDate() === day);
    return {
      day,
      total: sumBy(items, (item) => item.expenseAmount),
      count: items.length,
    };
  });
}

export function getTopExpenses(transactions, limit = 10) {
  return getExpenses(transactions)
    .slice()
    .sort((a, b) => b.expenseAmount - a.expenseAmount)
    .slice(0, limit);
}

export function aggregateByDescription(transactions, limit = 10) {
  return Array.from(groupBy(getExpenses(transactions), (transaction) => normalizeDescription(transaction.description)).entries())
    .map(([normalized, items]) => ({
      description: items[0]?.description ?? normalized,
      normalized,
      total: sumBy(items, (item) => item.expenseAmount),
      count: items.length,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function aggregateStackedCategories(transactions, selectedCategories = []) {
  const expenses = getExpenses(transactions);
  const topCategories = selectedCategories.length
    ? selectedCategories
    : aggregateByCategory(transactions, "all")
        .slice(0, 5)
        .map((row) => row.category);

  const months = Array.from(groupBy(expenses, (transaction) => getMonthKey(transaction.date)).entries())
    .map(([month, items]) => {
      const row = { month, label: formatMonthKey(month) };
      topCategories.forEach((category) => {
        row[category] = sumBy(
          items.filter((item) => item.category === category),
          (item) => item.expenseAmount,
        );
      });
      return row;
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  return { categories: topCategories, rows: months };
}

export function detectOutliers(transactions) {
  const expenses = getExpenses(transactions);
  if (expenses.length < 8) return new Set();

  const values = expenses.map((transaction) => transaction.expenseAmount);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  const threshold = mean + standardDeviation * 2;

  return new Set(expenses.filter((transaction) => transaction.expenseAmount > threshold).map((transaction) => transaction.id));
}

export function detectRecurrences(transactions) {
  const expenses = getExpenses(transactions);

  return Array.from(groupBy(expenses, (transaction) => normalizeDescription(transaction.description)).entries())
    .map(([description, items]) => {
      const months = new Set(items.map((item) => getMonthKey(item.date)));
      const values = items.map((item) => item.expenseAmount);
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      const closeValues = values.filter((value) => Math.abs(value - average) <= Math.max(5, average * 0.1));

      return {
        description: items[0]?.description ?? description,
        months: months.size,
        count: items.length,
        average,
        isRecurring: months.size >= 3 && closeValues.length >= Math.min(3, values.length),
      };
    })
    .filter((item) => item.isRecurring)
    .sort((a, b) => b.average - a.average)
    .slice(0, 8);
}

function getCategoryMovements(currentTransactions, previousTransactions) {
  const current = aggregateByCategory(currentTransactions, "all");
  const previous = new Map(aggregateByCategory(previousTransactions, "all").map((row) => [row.category, row.total]));

  return current
    .map((row) => {
      const previousTotal = previous.get(row.category) ?? 0;
      return {
        category: row.category,
        change: previousTotal > 0 ? (row.total - previousTotal) / previousTotal : null,
        absoluteChange: row.total - previousTotal,
      };
    })
    .filter((row) => row.change !== null && Math.abs(row.absoluteChange) > 0)
    .sort((a, b) => b.absoluteChange - a.absoluteChange);
}

export function generateInsights(currentTransactions, metrics, previousTransactions = [], outlierIds = new Set()) {
  const insights = [];
  const expenses = getExpenses(currentTransactions);
  if (!expenses.length) return insights;

  if (metrics.topCategory) {
    insights.push(`A categoria com maior gasto foi ${metrics.topCategory.name}, com ${formatMoney(metrics.topCategory.total)}.`);
  }

  if (metrics.variation !== null) {
    const direction = metrics.variation >= 0 ? "cresceu" : "reduziu";
    insights.push(`O total gasto ${direction} ${formatPercent(Math.abs(metrics.variation))} em relacao ao periodo anterior.`);
  }

  const monthly = aggregateMonthly(currentTransactions);
  if (monthly.length >= 2) {
    const mostExpensive = [...monthly].sort((a, b) => b.total - a.total)[0];
    const cheapest = [...monthly].sort((a, b) => a.total - b.total)[0];
    insights.push(`${mostExpensive.label} foi o mes mais caro, e ${cheapest.label} foi o mes mais economico.`);
  }

  if (metrics.largestExpense) {
    insights.push(
      `A maior despesa foi ${formatMoney(metrics.largestExpense.expenseAmount)} em ${metrics.largestExpense.description}, no dia ${formatDate(metrics.largestExpense.date)}.`,
    );
  }

  const weekday = aggregateByWeekday(currentTransactions).sort((a, b) => b.total - a.total)[0];
  if (weekday?.total > 0) {
    insights.push(`${weekday.weekday} concentrou o maior gasto por dia da semana, com ${formatMoney(weekday.total)}.`);
  }

  const categories = aggregateByCategory(currentTransactions, "all");
  const totalSpent = categories.reduce((sum, category) => sum + category.total, 0);
  const topThree = categories.slice(0, 3).reduce((sum, category) => sum + category.total, 0);
  if (categories.length >= 3 && totalSpent > 0) {
    insights.push(`As tres maiores categorias representaram ${formatPercent(topThree / totalSpent)} dos gastos.`);
  }

  if (metrics.topAccount) {
    insights.push(`A conta com maior gasto foi ${metrics.topAccount.name}, com ${formatMoney(metrics.topAccount.total)}.`);
  }

  if (metrics.pendingTotal > 0) {
    insights.push(`${metrics.pendingPercent > 0 ? formatPercent(metrics.pendingPercent) : "Parte"} das despesas esta pendente, somando ${formatMoney(metrics.pendingTotal)}.`);
  }

  const movements = getCategoryMovements(currentTransactions, previousTransactions);
  if (movements[0]) {
    insights.push(`A categoria que mais cresceu foi ${movements[0].category}, com aumento de ${formatMoney(movements[0].absoluteChange)}.`);
  }
  const reductions = movements.filter((movement) => movement.absoluteChange < 0).sort((a, b) => a.absoluteChange - b.absoluteChange);
  if (reductions[0]) {
    insights.push(`A categoria que mais reduziu foi ${reductions[0].category}, com queda de ${formatMoney(Math.abs(reductions[0].absoluteChange))}.`);
  }

  const outliers = expenses.filter((transaction) => outlierIds.has(transaction.id));
  if (outliers.length) {
    insights.push(`${outliers.length} despesas ficaram fora do padrao pela regra media + 2 desvios-padrao.`);
  }

  const recurrences = detectRecurrences(currentTransactions);
  if (recurrences.length) {
    insights.push(`${recurrences.length} descricoes aparecem como possivel recorrencia em multiplos meses.`);
  }

  return insights.slice(0, 12);
}

export function createFinancialSummary(transactions, metrics) {
  const expenses = getExpenses(transactions);
  if (!expenses.length) return "Nenhuma despesa encontrada para os filtros atuais.";

  const categories = aggregateByCategory(transactions, "all").slice(0, 3);
  const categoriesTotal = categories.reduce((sum, item) => sum + item.total, 0);
  const categoryNames = categories.map((item) => item.category).join(", ");

  return `Entre ${describePeriod(metrics.periodStart, metrics.periodEnd)}, foram identificadas ${expenses.length.toLocaleString(
    "pt-BR",
  )} despesas, totalizando ${formatMoney(metrics.totalSpent)}. A media mensal foi de ${formatMoney(
    metrics.monthlyAverage,
  )}. As categorias com maior participacao foram ${categoryNames}, que juntas representaram ${formatPercent(
    categoriesTotal / metrics.totalSpent,
  )} dos gastos.`;
}

export function exportTransactionsToCsv(transactions) {
  const headers = ["Data", "Descricao", "Valor", "Conta", "Situacao", "Categoria", "Subcategoria", "Tags", "Tipo"];
  const rows = transactions.map((transaction) => [
    transaction.dateIso,
    transaction.description,
    String(transaction.value).replace(".", ","),
    transaction.account,
    transaction.status,
    transaction.category,
    transaction.subcategory,
    transaction.tagsRaw,
    transaction.type,
  ]);

  return [headers, ...rows]
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return /[",;\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(";"),
    )
    .join("\n");
}
