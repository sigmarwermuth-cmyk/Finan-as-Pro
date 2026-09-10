import React, { useState } from 'react';
import { AppSettings, FinancialGoal } from '../types';
import { formatCurrency, formatDateBR } from '../lib/financialUtils';
import { DynamicIcon } from './DynamicIcon';
import confetti from 'canvas-confetti';
import { 
  Target, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  X, 
  Check, 
  ArrowDownCircle, 
  ArrowUpCircle 
} from 'lucide-react';

interface GoalsViewProps {
  goals: FinancialGoal[];
  settings: AppSettings;
  onSaveGoal: (goal: Omit<FinancialGoal, 'id'>, editingId?: string) => void;
  onDeleteGoal: (id: string) => void;
  onDepositToGoal: (goalId: string, amount: number, notes?: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  settings,
  onSaveGoal,
  onDeleteGoal,
  onDepositToGoal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  // Deposit/Withdraw modal state
  const [depositGoal, setDepositGoal] = useState<FinancialGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [isWithdraw, setIsWithdraw] = useState(false);

  // Goal form state
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Reserva & Segurança');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('ShieldCheck');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [notes, setNotes] = useState('');

  const handleOpenNew = () => {
    setEditingGoal(null);
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
    setCategory('Segurança Financeira');
    setColor('#10b981');
    setIcon('ShieldCheck');
    setPriority('high');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setDeadline(goal.deadline || '');
    setCategory(goal.category);
    setColor(goal.color);
    setIcon(goal.icon);
    setPriority(goal.priority);
    setNotes(goal.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount.replace(',', '.'));
    const numCurrent = parseFloat(currentAmount.replace(',', '.')) || 0;

    if (isNaN(numTarget) || numTarget <= 0) {
      alert('Informe um valor alvo válido.');
      return;
    }

    const payload: Omit<FinancialGoal, 'id'> = {
      title: title.trim(),
      targetAmount: numTarget,
      currentAmount: numCurrent,
      deadline: deadline || undefined,
      category,
      color,
      icon,
      priority,
      notes: notes.trim(),
      isCompleted: numCurrent >= numTarget,
      deposits: editingGoal?.deposits || [],
    };

    if (numCurrent >= numTarget) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    onSaveGoal(payload, editingGoal?.id);
    setIsModalOpen(false);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const num = parseFloat(depositAmount.replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    const finalAmount = isWithdraw ? -num : num;
    onDepositToGoal(depositGoal.id, finalAmount, depositNotes);

    if (!isWithdraw && depositGoal.currentAmount + num >= depositGoal.targetAmount) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }

    setDepositGoal(null);
    setDepositAmount('');
    setDepositNotes('');
  };

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Metas & Objetivos</h2>
          <p className="text-xs text-slate-400">Acompanhe suas economias, reservas e sonhos futuros</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* Overview Progress Card */}
      <div className="p-6 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Acumulado em Metas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold font-mono tabular-nums text-emerald-400">
                {formatCurrency(totalSaved, settings.currency, settings.hideValues)}
              </span>
              <span className="text-xs text-slate-400">
                de {formatCurrency(totalTarget, settings.currency, settings.hideValues)} planejado
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400">Status</span>
            <p className="text-sm font-semibold text-white">
              <span className="text-emerald-400 font-bold">{goals.filter(g => !g.isCompleted).length}</span> ativas • <span className="text-slate-400">{goals.filter(g => g.isCompleted).length}</span> concluídas
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-2.5 w-full bg-[#080B12] rounded-full overflow-hidden p-0.5 border border-slate-800/60">
            <div
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{overallProgress.toFixed(1)}% do total conquistado</span>
            <span className="tabular-nums">Restam {formatCurrency(Math.max(0, totalTarget - totalSaved), settings.currency, settings.hideValues)}</span>
          </div>
        </div>
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((goal) => {
          const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className={`p-5 rounded-2xl bg-[#0F1524]/90 border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                goal.isCompleted ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      style={{ backgroundColor: `${goal.color}15`, color: goal.color }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner"
                    >
                      <DynamicIcon name={goal.icon || 'Target'} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-white truncate">{goal.title}</h3>
                      <p className="text-[11px] text-slate-400 truncate">{goal.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(goal)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                      title="Editar meta"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir a meta "${goal.title}"?`)) {
                          onDeleteGoal(goal.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/80 transition-colors"
                      title="Excluir meta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Values & Progress */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono tabular-nums text-white">
                      {formatCurrency(goal.currentAmount, settings.currency, settings.hideValues)}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-slate-400">
                      de {formatCurrency(goal.targetAmount, settings.currency, settings.hideValues)}
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-[#080B12] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: goal.color || '#34d399' }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="font-bold text-emerald-400">{pct.toFixed(0)}% concluído</span>
                    <span className="tabular-nums">
                      {goal.isCompleted ? 'Meta atingida! 🎉' : `Faltam ${formatCurrency(remaining, settings.currency, settings.hideValues)}`}
                    </span>
                  </div>
                </div>

                {/* Deadline & Notes */}
                {goal.deadline && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Prazo: <strong className="text-slate-200">{formatDateBR(goal.deadline)}</strong></span>
                  </div>
                )}
              </div>

              {/* Action Deposit Button */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => {
                    setDepositGoal(goal);
                    setIsWithdraw(false);
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" />
                  <span>Aportar</span>
                </button>
                <button
                  onClick={() => {
                    setDepositGoal(goal);
                    setIsWithdraw(true);
                  }}
                  className="py-2 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/70 hover:bg-slate-800 transition-all"
                  title="Resgatar valor da meta"
                >
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit/Withdraw Modal */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0F1524] border border-slate-800/90 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {isWithdraw ? 'Resgatar da Meta' : 'Aportar na Meta'}
              </h3>
              <button
                onClick={() => setDepositGoal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <p className="text-xs text-slate-300">
                Meta: <strong>{depositGoal.title}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Valor do {isWithdraw ? 'Resgate' : 'Aporte'} (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl pl-10 pr-4 py-2 text-white font-mono text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descrição ou Origem (Opcional)
                </label>
                <input
                  type="text"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  placeholder="Ex: Aporte do salário, sobra do mês..."
                  className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
                    isWithdraw ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                  }`}
                >
                  {isWithdraw ? 'Confirmar Resgate' : 'Confirmar Aporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0F1524] border border-slate-800/90 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingGoal ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Título da Meta <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reserva de Emergência, Viagem para Disney, Carro Novo..."
                  className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Valor Alvo (R$) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="20000.00"
                    className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white font-mono text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Saldo Atual Já Poupado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white font-mono text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Data Limite Estimada
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none"
                  >
                    <option value="high">Alta Prioridade</option>
                    <option value="medium">Média Prioridade</option>
                    <option value="low">Baixa Prioridade</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Observações e Estratégia (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Aportar R$ 500 todo dia 5 após o salário..."
                  className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl p-3 text-white text-xs outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-sm"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
