import { Account, Category, FinancialGoal, RecurringBill, Transaction } from '../types';

export function formatCurrency(
  amount: number,
  currency: 'BRL' | 'USD' | 'EUR' = 'BRL',
  hideValues: boolean = false
): string {
  if (hideValues) return '••••••';

  const localeMap = {
    BRL: 'pt-BR',
    USD: 'en-US',
    EUR: 'de-DE',
  };

  try {
    return new Intl.NumberFormat(localeMap[currency] || 'pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `R$ ${amount.toFixed(2)}`;
  }
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '';
  const today = new Date();
  const date = new Date(dateStr + 'T00:00:00');
  
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays === -1) return 'Amanhã';
  if (diffDays > 1 && diffDays < 7) return `Há ${diffDays} dias`;
  
  return formatDateBR(dateStr);
}

export function getMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getMonthNamePT(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const idx = parseInt(month, 10) - 1;
  return `${monthNames[idx] || ''} de ${year}`;
}

export function calculateSummary(transactions: Transaction[], monthKey?: string) {
  let filtered = transactions;
  if (monthKey) {
    filtered = transactions.filter(t => t.date.startsWith(monthKey));
  }

  let totalIncome = 0;
  let totalExpense = 0;
  let totalTransfer = 0;

  for (const t of filtered) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else if (t.type === 'expense') {
      totalExpense += t.amount;
    } else if (t.type === 'transfer') {
      totalTransfer += t.amount;
    }
  }

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpense,
    totalTransfer,
    netBalance,
    savingsRate: Math.max(0, savingsRate),
    transactionCount: filtered.length,
  };
}

export function calculateAccountBalances(accounts: Account[], transactions: Transaction[]) {
  const balances: Record<string, { currentBalance: number; spentThisMonth: number; creditLimit?: number }> = {};

  for (const acc of accounts) {
    balances[acc.id] = {
      currentBalance: acc.initialBalance || 0,
      spentThisMonth: 0,
      creditLimit: acc.creditLimit,
    };
  }

  const currentMonth = getMonthKey();

  for (const tx of transactions) {
    if (tx.status !== 'completed') continue;

    if (tx.type === 'income' && balances[tx.accountId]) {
      balances[tx.accountId].currentBalance += tx.amount;
    } else if (tx.type === 'expense' && balances[tx.accountId]) {
      const isCard = accounts.find(a => a.id === tx.accountId)?.type === 'credit_card';
      if (isCard) {
        balances[tx.accountId].currentBalance += tx.amount; // for credit cards, balance represents current statement debt
      } else {
        balances[tx.accountId].currentBalance -= tx.amount;
      }

      if (tx.date.startsWith(currentMonth)) {
        balances[tx.accountId].spentThisMonth += tx.amount;
      }
    } else if (tx.type === 'transfer') {
      if (balances[tx.accountId]) {
        balances[tx.accountId].currentBalance -= tx.amount;
      }
      if (tx.toAccountId && balances[tx.toAccountId]) {
        balances[tx.toAccountId].currentBalance += tx.amount;
      }
    }
  }

  return balances;
}

export function calculateCategoryExpenses(transactions: Transaction[], monthKey?: string) {
  let filtered = transactions.filter(t => t.type === 'expense');
  if (monthKey) {
    filtered = filtered.filter(t => t.date.startsWith(monthKey));
  }

  const categoryMap: Record<string, number> = {};
  let totalExpense = 0;

  for (const tx of filtered) {
    categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
    totalExpense += tx.amount;
  }

  const sortedCategories = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    categories: sortedCategories,
    totalExpense,
  };
}

export function calculateCategoryBudgets(
  categories: Category[],
  transactions: Transaction[],
  monthKey: string
) {
  const monthTransactions = transactions.filter(
    t => t.type === 'expense' && t.date.startsWith(monthKey)
  );

  const spentPerCategory: Record<string, number> = {};
  for (const t of monthTransactions) {
    spentPerCategory[t.category] = (spentPerCategory[t.category] || 0) + t.amount;
  }

  return categories
    .filter(c => c.type === 'expense' && c.monthlyBudget && c.monthlyBudget > 0)
    .map(c => {
      const spent = spentPerCategory[c.name] || 0;
      const budget = c.monthlyBudget || 0;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      const remaining = budget - spent;
      const isOverBudget = spent > budget;
      const isNearLimit = percentage >= 80 && !isOverBudget;

      return {
        category: c,
        spent,
        budget,
        percentage,
        remaining,
        isOverBudget,
        isNearLimit,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

export function calculateRule503020(transactions: Transaction[], monthKey: string) {
  const summary = calculateSummary(transactions, monthKey);
  const monthExpenses = transactions.filter(
    t => t.type === 'expense' && t.date.startsWith(monthKey)
  );

  // Group into Necessities (50%), Wants (30%), Savings (20%)
  const necessitiesKeywords = ['moradia', 'aluguel', 'contas', 'supermercado', 'alimentação', 'transporte', 'combustível', 'saúde', 'farmácia', 'energia', 'luz', 'água', 'internet'];
  const wantsKeywords = ['lazer', 'restaurante', 'compras', 'vestuário', 'assinaturas', 'streaming', 'viagem', 'jogos', 'cinema'];

  let necessitiesTotal = 0;
  let wantsTotal = 0;

  for (const t of monthExpenses) {
    const catLower = (t.category || '').toLowerCase();
    const isNecessity = necessitiesKeywords.some(kw => catLower.includes(kw));
    const isWant = wantsKeywords.some(kw => catLower.includes(kw));

    if (isNecessity) {
      necessitiesTotal += t.amount;
    } else if (isWant) {
      wantsTotal += t.amount;
    } else {
      // Default split or uncategorized
      necessitiesTotal += t.amount * 0.7;
      wantsTotal += t.amount * 0.3;
    }
  }

  const income = summary.totalIncome > 0 ? summary.totalIncome : (necessitiesTotal + wantsTotal);
  const savings = Math.max(0, income - (necessitiesTotal + wantsTotal));

  const necessitiesPct = income > 0 ? (necessitiesTotal / income) * 100 : 0;
  const wantsPct = income > 0 ? (wantsTotal / income) * 100 : 0;
  const savingsPct = income > 0 ? (savings / income) * 100 : 0;

  return {
    income,
    necessities: { amount: necessitiesTotal, targetPct: 50, actualPct: necessitiesPct },
    wants: { amount: wantsTotal, targetPct: 30, actualPct: wantsPct },
    savings: { amount: savings, targetPct: 20, actualPct: savingsPct },
  };
}

export function exportTransactionsToCSV(transactions: Transaction[], categories: Category[], accounts: Account[]): string {
  const headers = ['ID', 'Data', 'Descrição', 'Tipo', 'Valor', 'Categoria', 'Forma de Pagamento', 'Conta', 'Status', 'Tags', 'Notas'];
  
  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || id;

  const typeMap: Record<string, string> = {
    income: 'Receita',
    expense: 'Despesa',
    transfer: 'Transferência'
  };

  const paymentMap: Record<string, string> = {
    pix: 'Pix',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    cash: 'Dinheiro',
    boleto: 'Boleto Bancário',
    transfer: 'Transferência'
  };

  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    `"${typeMap[t.type] || t.type}"`,
    t.amount.toFixed(2),
    `"${t.category.replace(/"/g, '""')}"`,
    `"${paymentMap[t.paymentMethod] || t.paymentMethod}"`,
    `"${getAccountName(t.accountId).replace(/"/g, '""')}"`,
    `"${t.status === 'completed' ? 'Concluído' : 'Pendente'}"`,
    `"${(t.tags || []).join(';')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function downloadFile(content: string, fileName: string, contentType: string = 'text/plain') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
