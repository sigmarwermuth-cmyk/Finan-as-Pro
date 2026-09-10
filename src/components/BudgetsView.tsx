import React, { useState } from 'react';
import { AppSettings, Category, Transaction } from '../types';
import { calculateCategoryBudgets, formatCurrency } from '../lib/financialUtils';
import { DynamicIcon } from './DynamicIcon';
import { PieChart, Plus, Edit2, AlertTriangle, CheckCircle, Sparkles, X, Check } from 'lucide-react';

interface BudgetsViewProps {
  categories: Category[];
  transactions: Transaction[];
  currentMonthKey: string;
  settings: AppSettings;
  onUpdateCategoryBudget: (categoryId: string, newBudget: number) => void;
  onNavigateTab: (tab: any) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  categories,
  transactions,
  currentMonthKey,
  settings,
  onUpdateCategoryBudget,
  onNavigateTab,
}) => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [budgetLimitInput, setBudgetLimitInput] = useState('');

  const budgetItems = calculateCategoryBudgets(categories, transactions, currentMonthKey);

  const totalBudgeted = budgetItems.reduce((acc, item) => acc + item.budget, 0);
  const totalSpent = budgetItems.reduce((acc, item) => acc + item.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setBudgetLimitInput((cat.monthlyBudget || 0).toString());
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const num = parseFloat(budgetLimitInput.replace(',', '.'));
    onUpdateCategoryBudget(editingCategory.id, isNaN(num) ? 0 : num);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Header & Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Orçamentos & Metas</h2>
          <p className="text-xs text-slate-400">Defina limites mensais para controlar despesas por categoria</p>
        </div>

        <button
          onClick={() => onNavigateTab('ai_advisor')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-sm transition-all flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Otimizar com IA</span>
        </button>
      </div>

      {/* Global Budget Card */}
      <div className="p-6 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Orçamento Geral do Mês
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold font-mono tabular-nums text-white">
                {formatCurrency(totalSpent, settings.currency, settings.hideValues)}
              </span>
              <span className="text-xs text-slate-400">
                de {formatCurrency(totalBudgeted, settings.currency, settings.hideValues)} orçado
              </span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs text-slate-400">Saldo Restante Disponível</span>
            <p className={`text-lg font-bold font-mono tabular-nums ${
              totalRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatCurrency(totalRemaining, settings.currency, settings.hideValues)}
            </p>
          </div>
        </div>

        {/* Big Overall Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full bg-[#080B12] rounded-full overflow-hidden p-0.5 border border-slate-800/60">
            <div
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercentage >= 100
                  ? 'bg-rose-500'
                  : overallPercentage >= 80
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{overallPercentage.toFixed(1)}% utilizado</span>
            <span>{Math.max(0, 100 - overallPercentage).toFixed(1)}% livre</span>
          </div>
        </div>
      </div>

      {/* Category Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetItems.map(({ category, spent, budget, percentage, remaining, isOverBudget, isNearLimit }) => {
          return (
            <div
              key={category.id}
              className="p-5 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${category.color}15`, color: category.color }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 shadow-inner"
                    >
                      <DynamicIcon name={category.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white truncate max-w-[150px]">{category.name}</h3>
                      <p className="text-[11px] text-slate-400">Limite mensal</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(category)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                    title="Editar limite"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Values */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">Gasto atual</span>
                    <span className="text-base font-bold font-mono tabular-nums text-white">
                      {formatCurrency(spent, settings.currency, settings.hideValues)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block mb-0.5">Limite</span>
                    <span className="text-xs font-mono font-medium tabular-nums text-slate-300">
                      {formatCurrency(budget, settings.currency, settings.hideValues)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="h-1.5 w-full bg-[#080B12] rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: isOverBudget ? '#f43f5e' : isNearLimit ? '#fbbf24' : (category.color || '#34d399'),
                      }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{percentage.toFixed(0)}%</span>
                    <span className="tabular-nums">
                      {isOverBudget
                        ? `Estourado por ${formatCurrency(Math.abs(remaining), settings.currency, settings.hideValues)}`
                        : `Resta ${formatCurrency(remaining, settings.currency, settings.hideValues)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                {isOverBudget ? (
                  <span className="inline-flex items-center gap-1 text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 text-[10px]">
                    <AlertTriangle className="w-3 h-3" />
                    Limite Ultrapassado
                  </span>
                ) : isNearLimit ? (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-[10px]">
                    <AlertTriangle className="w-3 h-3" />
                    Atenção (80%+)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
                    <CheckCircle className="w-3 h-3" />
                    Dentro da Meta
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0F1524] border border-slate-800/90 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white">Editar Limite de Orçamento</h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Categoria: {editingCategory.name}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    required
                    value={budgetLimitInput}
                    onChange={(e) => setBudgetLimitInput(e.target.value)}
                    className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl pl-10 pr-4 py-2 text-white font-mono text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-sm"
                >
                  Salvar Limite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
