import React from 'react';
import { Account, AppSettings, Category, FinancialGoal, RecurringBill, Transaction } from '../types';
import { 
  formatCurrency, 
  calculateSummary, 
  calculateCategoryExpenses, 
  calculateRule503020, 
  formatRelativeDate,
  calculateAccountBalances
} from '../lib/financialUtils';
import { DynamicIcon } from './DynamicIcon';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Plus, 
  ChevronRight, 
  Calendar, 
  Target, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DashboardViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  goals: FinancialGoal[];
  recurringBills: RecurringBill[];
  currentMonthKey: string;
  settings: AppSettings;
  onOpenNewTransaction: (defaultType?: 'income' | 'expense' | 'transfer') => void;
  onOpenAISmartAdd: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  categories,
  accounts,
  goals,
  recurringBills,
  currentMonthKey,
  settings,
  onOpenNewTransaction,
  onOpenAISmartAdd,
  onEditTransaction,
  onNavigateTab,
}) => {
  const monthSummary = calculateSummary(transactions, currentMonthKey);
  const categoryExpenses = calculateCategoryExpenses(transactions, currentMonthKey);
  const rule503020 = calculateRule503020(transactions, currentMonthKey);
  const accountBalances = calculateAccountBalances(accounts, transactions);

  // Calculate total net wealth
  let totalNetWealth = 0;
  for (const acc of accounts) {
    const b = accountBalances[acc.id];
    if (b) {
      if (acc.type === 'credit_card') {
        totalNetWealth -= b.currentBalance;
      } else {
        totalNetWealth += b.currentBalance;
      }
    }
  }

  // Get recent 6 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // Group daily transactions for month inflow/outflow bar visualization
  const daysInMonth = 31;
  const dailyFlow: { day: number; income: number; expense: number }[] = [];
  for (let d = 1; d <= 31; d++) {
    const dayStr = `${currentMonthKey}-${String(d).padStart(2, '0')}`;
    const dayTxs = transactions.filter(t => t.date === dayStr && t.status === 'completed');
    const inc = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    if (inc > 0 || exp > 0 || d <= new Date().getDate()) {
      dailyFlow.push({ day: d, income: inc, expense: exp });
    }
  }

  const maxDailyVal = Math.max(...dailyFlow.map(d => Math.max(d.income, d.expense)), 100);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* AI Smart Welcome Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0F1524] to-[#0F1524] border border-emerald-500/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20 shrink-0">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Olá, {settings.userName}! {transactions.length === 0 ? 'Bem-vindo ao Finanças Pro.' : 'Seu resumo mensal está atualizado.'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {transactions.length === 0 ? (
                <span className="text-slate-300">
                  Cadastre suas receitas e despesas para acompanhar seu patrimônio, fluxo de caixa e relatórios em tempo real.
                </span>
              ) : monthSummary.savingsRate >= 20 ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 inline" /> Sua taxa de poupança está em {monthSummary.savingsRate.toFixed(1)}% (acima da meta recomendada de 20%).
                </span>
              ) : (
                <span className="text-amber-300 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 inline" /> Taxa de poupança atual: {monthSummary.savingsRate.toFixed(1)}%. Recomendamos poupar ao menos 20%.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => onNavigateTab('ai_advisor')}
            className="flex-1 md:flex-none px-3.5 py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <span>Consultar IA</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenAISmartAdd}
            className="flex-1 md:flex-none px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Escanear Cupom</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Patrimônio Líquido */}
        <div className="p-5 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Patrimônio Líquido</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-white tracking-tight">
            {formatCurrency(totalNetWealth, settings.currency, settings.hideValues)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">Contas e investimentos</span> ativos
          </p>
        </div>

        {/* Card 2: Receitas do Mês */}
        <div className="p-5 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Receitas do Mês</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-400 tracking-tight">
            +{formatCurrency(monthSummary.totalIncome, settings.currency, settings.hideValues)}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>Entradas no mês</span>
            <button
              onClick={() => onOpenNewTransaction('income')}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              + Receita
            </button>
          </div>
        </div>

        {/* Card 3: Despesas do Mês */}
        <div className="p-5 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Despesas do Mês</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-rose-400 tracking-tight">
            -{formatCurrency(monthSummary.totalExpense, settings.currency, settings.hideValues)}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>Saídas e faturas</span>
            <button
              onClick={() => onOpenNewTransaction('expense')}
              className="text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              + Despesa
            </button>
          </div>
        </div>

        {/* Card 4: Economia / Saldo Líquido do Mês */}
        <div className="p-5 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Resultado do Mês</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold font-mono tabular-nums tracking-tight ${
            monthSummary.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {monthSummary.netBalance >= 0 ? '+' : ''}
            {formatCurrency(monthSummary.netBalance, settings.currency, settings.hideValues)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Taxa de economia:</span>
            <span className="font-bold text-slate-200">{monthSummary.savingsRate.toFixed(1)}%</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cash Inflow/Outflow Timeline + 50/30/20 Rule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Flow Chart */}
          <div className="p-6 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-white">Fluxo Diário do Mês</h3>
                <p className="text-xs text-slate-400">Evolução de entradas e saídas ao longo dos dias</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Receitas
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Despesas
                </span>
              </div>
            </div>

            {/* Custom SVG / Bar Chart Representation */}
            <div className="h-44 w-full flex items-end gap-1 pt-6 pb-2 border-b border-slate-800/80 overflow-x-auto">
              {dailyFlow.map((dayItem) => {
                const incHeight = maxDailyVal > 0 ? (dayItem.income / maxDailyVal) * 120 : 0;
                const expHeight = maxDailyVal > 0 ? (dayItem.expense / maxDailyVal) * 120 : 0;
                const isToday = dayItem.day === new Date().getDate();

                return (
                  <div
                    key={dayItem.day}
                    className="flex-1 min-w-[14px] flex flex-col items-center justify-end h-full gap-0.5 group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-[#080B12] border border-slate-700/80 text-[10px] p-2.5 rounded-xl shadow-xl z-20 pointer-events-none whitespace-nowrap">
                      <span className="font-bold text-slate-200 mb-1">Dia {dayItem.day}</span>
                      <span className="text-emerald-400 font-mono">Entrada: R$ {dayItem.income.toFixed(2)}</span>
                      <span className="text-rose-400 font-mono">Saída: R$ {dayItem.expense.toFixed(2)}</span>
                    </div>

                    <div className="w-full flex items-end justify-center gap-0.5">
                      {dayItem.income > 0 && (
                        <div
                          style={{ height: `${Math.max(incHeight, 4)}px` }}
                          className="w-1.5 sm:w-2 bg-emerald-400 rounded-t-sm transition-all group-hover:brightness-125"
                        />
                      )}
                      {dayItem.expense > 0 && (
                        <div
                          style={{ height: `${Math.max(expHeight, 4)}px` }}
                          className="w-1.5 sm:w-2 bg-rose-400 rounded-t-sm transition-all group-hover:brightness-125"
                        />
                      )}
                    </div>
                    <span className={`text-[9px] mt-1 font-mono ${isToday ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                      {dayItem.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Regra 50/30/20 Financial Health Bar */}
          <div className="p-6 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Equilíbrio Financeiro (Regra 50 / 30 / 20)</span>
                </h3>
                <p className="text-xs text-slate-400">Ideal: 50% Necessidades • 30% Desejos • 20% Poupança/Investimentos</p>
              </div>
              <button
                onClick={() => onNavigateTab('ai_advisor')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Detalhar →
              </button>
            </div>

            {/* Segmented Progress Bar */}
            <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800/80 gap-0.5">
              <div
                style={{ width: `${Math.min(rule503020.necessities.actualPct, 100)}%` }}
                className="bg-blue-500 rounded-l-full transition-all"
                title={`Necessidades: ${rule503020.necessities.actualPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${Math.min(rule503020.wants.actualPct, 100)}%` }}
                className="bg-purple-500 transition-all"
                title={`Desejos: ${rule503020.wants.actualPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${Math.min(rule503020.savings.actualPct, 100)}%` }}
                className="bg-emerald-400 rounded-r-full transition-all"
                title={`Poupança: ${rule503020.savings.actualPct.toFixed(1)}%`}
              />
            </div>

            {/* 3 Metric breakdowns */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800/80">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[11px] font-medium text-slate-300">Necessidades (50%)</span>
                </div>
                <p className="text-xs font-bold font-mono tabular-nums text-white">
                  {formatCurrency(rule503020.necessities.amount, settings.currency, settings.hideValues)}
                </p>
                <span className={`text-[10px] font-semibold ${
                  rule503020.necessities.actualPct <= 55 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {rule503020.necessities.actualPct.toFixed(1)}% da renda
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-[11px] font-medium text-slate-300">Desejos (30%)</span>
                </div>
                <p className="text-xs font-bold font-mono tabular-nums text-white">
                  {formatCurrency(rule503020.wants.amount, settings.currency, settings.hideValues)}
                </p>
                <span className={`text-[10px] font-semibold ${
                  rule503020.wants.actualPct <= 35 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {rule503020.wants.actualPct.toFixed(1)}% da renda
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-medium text-slate-300">Poupança (20%)</span>
                </div>
                <p className="text-xs font-bold font-mono tabular-nums text-white">
                  {formatCurrency(rule503020.savings.amount, settings.currency, settings.hideValues)}
                </p>
                <span className={`text-[10px] font-semibold ${
                  rule503020.savings.actualPct >= 20 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {rule503020.savings.actualPct.toFixed(1)}% da renda
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Category Expenses Breakdown & Accounts */}
        <div className="space-y-6">
          {/* Expenses by Category */}
          <div className="p-6 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Despesas por Categoria</h3>
              <button
                onClick={() => onNavigateTab('budgets')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Orçamentos →
              </button>
            </div>

            {categoryExpenses.categories.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Nenhuma despesa registrada neste mês.
              </div>
            ) : (
              <div className="space-y-3.5 flex-1">
                {categoryExpenses.categories.slice(0, 5).map((cat) => {
                  const catConfig = categories.find(c => c.name === cat.category);
                  const color = catConfig?.color || '#0ea5e9';
                  const icon = catConfig?.icon || 'Tag';

                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            style={{ backgroundColor: `${color}15`, color }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center border border-white/5"
                          >
                            <DynamicIcon name={icon} className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-slate-200 truncate max-w-[140px]">
                            {cat.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-400 text-[11px]">{cat.percentage.toFixed(0)}%</span>
                          <span className="font-bold tabular-nums text-white">
                            {formatCurrency(cat.amount, settings.currency, settings.hideValues)}
                          </span>
                        </div>
                      </div>

                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: color }}
                          className="h-full rounded-full transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Accounts & Cards Widget */}
          <div className="p-6 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Contas & Cartões</h3>
              <button
                onClick={() => onNavigateTab('accounts')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Gerenciar →
              </button>
            </div>

            <div className="space-y-2.5">
              {accounts.slice(0, 3).map((acc) => {
                const bal = accountBalances[acc.id] || { currentBalance: 0 };
                const isCard = acc.type === 'credit_card';

                return (
                  <div
                    key={acc.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between hover:border-slate-700/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        style={{ backgroundColor: `${acc.color}15`, color: acc.color }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/5"
                      >
                        <DynamicIcon name={acc.icon || 'CreditCard'} className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white truncate max-w-[130px]">{acc.name}</p>
                        <p className="text-[10px] text-slate-400">{acc.bankName || acc.type}</p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <p className={`text-xs font-bold tabular-nums ${
                        isCard ? 'text-amber-400' : 'text-white'
                      }`}>
                        {formatCurrency(bal.currentBalance, settings.currency, settings.hideValues)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {isCard ? 'Fatura Atual' : 'Disponível'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Goals & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals Mini Widget */}
        <div className="p-6 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Metas & Cofrinhos
            </h3>
            <button
              onClick={() => onNavigateTab('goals')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Ver todas ({goals.length}) →
            </button>
          </div>

          <div className="space-y-3.5 flex-1">
            {goals.slice(0, 3).map((goal) => {
              const pct = (goal.currentAmount / goal.targetAmount) * 100;
              return (
                <div key={goal.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 truncate">{goal.title}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {pct.toFixed(0)}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: goal.color }}
                      className="h-full rounded-full transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="tabular-nums">{formatCurrency(goal.currentAmount, settings.currency, settings.hideValues)}</span>
                    <span className="text-slate-500 tabular-nums">Alvo: {formatCurrency(goal.targetAmount, settings.currency, settings.hideValues)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Últimos Lançamentos</h3>
              <p className="text-xs text-slate-400">Atividades financeiras recentes</p>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Extrato Completo →
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Nenhuma transação cadastrada ainda.
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const cat = categories.find(c => c.name === tx.category);
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';

                return (
                  <div
                    key={tx.id}
                    onClick={() => onEditTransaction(tx)}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${
                        isIncome ? 'bg-emerald-500/15 text-emerald-400' :
                        isTransfer ? 'bg-blue-500/15 text-blue-400' :
                        'bg-rose-500/15 text-rose-400'
                      }`}>
                        <DynamicIcon name={cat?.icon || (isIncome ? 'TrendingUp' : 'ShoppingBag')} className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{tx.category}</span>
                          <span>•</span>
                          <span>{formatRelativeDate(tx.date)}</span>
                          {tx.installments && (
                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">
                              {tx.installments.current}/{tx.installments.total}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <p className={`text-xs font-bold font-mono tabular-nums ${
                        isIncome ? 'text-emerald-400' :
                        isTransfer ? 'text-blue-400' :
                        'text-rose-400'
                      }`}>
                        {isIncome ? '+' : isTransfer ? '' : '-'}
                        {formatCurrency(tx.amount, settings.currency, settings.hideValues)}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {tx.paymentMethod.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
