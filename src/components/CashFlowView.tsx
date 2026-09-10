import React, { useState } from 'react';
import { Account, AppSettings, PaymentMethod, RecurringBill, Transaction } from '../types';
import { formatCurrency } from '../lib/financialUtils';
import { DynamicIcon } from './DynamicIcon';
import { 
  CalendarDays, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle, 
  TrendingDown, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  AlertCircle,
  Repeat
} from 'lucide-react';

interface CashFlowViewProps {
  recurringBills: RecurringBill[];
  transactions: Transaction[];
  accounts: Account[];
  currentMonthKey: string;
  settings: AppSettings;
  onSaveRecurringBill: (bill: Omit<RecurringBill, 'id'>, editingId?: string) => void;
  onDeleteRecurringBill: (id: string) => void;
  onToggleRecurringBillActive: (id: string) => void;
  onMarkAsPaid: (bill: RecurringBill) => void;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({
  recurringBills,
  transactions,
  accounts,
  currentMonthKey,
  settings,
  onSaveRecurringBill,
  onDeleteRecurringBill,
  onToggleRecurringBillActive,
  onMarkAsPaid,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Moradia & Contas');
  const [dueDay, setDueDay] = useState(10);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [notes, setNotes] = useState('');

  const [selectedDayDetail, setSelectedDayDetail] = useState<number | null>(null);

  const handleOpenNew = () => {
    setEditingBill(null);
    setTitle('');
    setAmount('');
    setCategory('Moradia & Contas');
    setDueDay(10);
    setAccountId(accounts[0]?.id || '');
    setPaymentMethod('pix');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bill: RecurringBill) => {
    setEditingBill(bill);
    setTitle(bill.title);
    setAmount(bill.amount.toString());
    setCategory(bill.category);
    setDueDay(bill.dueDay);
    setAccountId(bill.accountId);
    setPaymentMethod(bill.paymentMethod);
    setNotes(bill.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    const payload: Omit<RecurringBill, 'id'> = {
      title: title.trim(),
      amount: num,
      type: 'expense',
      category,
      dueDay,
      accountId,
      paymentMethod,
      isActive: true,
      notes: notes.trim(),
    };

    onSaveRecurringBill(payload, editingBill?.id);
    setIsModalOpen(false);
  };

  const totalMonthlyBills = recurringBills
    .filter(b => b.isActive)
    .reduce((acc, b) => acc + b.amount, 0);

  // Days in month matrix for calendar
  const daysInMonth = 31;
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Fluxo de Caixa & Vencimentos</h2>
          <p className="text-xs text-slate-400">Contas fixas, datas de vencimento e calendário financeiro</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conta Fixa</span>
        </button>
      </div>

      {/* Overview Top Card */}
      <div className="p-6 rounded-2xl bg-[#0F1524]/90 backdrop-blur-xl border border-slate-800/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total de Contas Fixas Mensais
          </span>
          <div className="text-2xl font-extrabold font-mono text-white mt-1">
            {formatCurrency(totalMonthlyBills, settings.currency, settings.hideValues)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {recurringBills.filter(b => b.isActive).length} contas recorrentes cadastradas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#080B12] border border-slate-800 text-center min-w-[110px]">
            <span className="text-[10px] text-slate-400 block">Hoje é dia</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">
              {new Date().getDate()} de {new Date().toLocaleString('pt-BR', { month: 'short' })}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Interactive Calendar Grid */}
      <div className="p-6 rounded-2xl bg-[#0F1524]/90 backdrop-blur-xl border border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            Mapa de Vencimentos do Mês
          </h3>
          <span className="text-xs text-slate-400">Clique em um dia com marcador para ver detalhes</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarDays.map((day) => {
            const billsOnDay = recurringBills.filter(b => b.isActive && b.dueDay === day);
            const totalOnDay = billsOnDay.reduce((s, b) => s + b.amount, 0);
            const isToday = day === new Date().getDate();
            const isPast = day < new Date().getDate();
            const hasBills = billsOnDay.length > 0;
            const isSelected = selectedDayDetail === day;

            return (
              <div
                key={day}
                onClick={() => hasBills && setSelectedDayDetail(isSelected ? null : day)}
                className={`min-h-[58px] sm:min-h-[64px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/80 bg-emerald-500/10'
                    : isToday
                    ? 'border-emerald-500/50 bg-[#080B12]'
                    : hasBills
                    ? 'border-slate-800/90 bg-[#080B12]/80 hover:border-slate-700'
                    : 'border-slate-800/50 bg-[#080B12]/40 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-bold ${
                    isToday ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {day}
                  </span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>

                {hasBills && (
                  <div className="mt-1">
                    <span className="text-[10px] font-mono font-bold text-rose-400 block truncate">
                      -{formatCurrency(totalOnDay, settings.currency, settings.hideValues)}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      {billsOnDay.length} {billsOnDay.length === 1 ? 'conta' : 'contas'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Day Details drawer */}
        {selectedDayDetail && (
          <div className="p-4 rounded-xl bg-[#080B12] border border-emerald-500/30 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">
                Vencimentos do Dia {selectedDayDetail}
              </h4>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {recurringBills
                .filter(b => b.dueDay === selectedDayDetail)
                .map(bill => (
                  <div key={bill.id} className="p-2.5 rounded-lg bg-[#0F1524] border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">{bill.title}</p>
                      <p className="text-[10px] text-slate-400">{bill.category} • {bill.paymentMethod}</p>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-xs font-bold text-rose-400">
                        {formatCurrency(bill.amount, settings.currency, settings.hideValues)}
                      </span>
                      <button
                        onClick={() => onMarkAsPaid(bill)}
                        className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded text-[10px] font-bold"
                      >
                        Pagar
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Recurring Bills List */}
      <div className="p-6 rounded-2xl bg-[#0F1524]/90 backdrop-blur-xl border border-slate-800/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Repeat className="w-4 h-4 text-emerald-400" />
          Contas Fixas & Recorrentes
        </h3>

        <div className="divide-y divide-slate-800/80">
          {recurringBills.map((bill) => {
            const acc = accounts.find(a => a.id === bill.accountId);
            return (
              <div
                key={bill.id}
                className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/20 px-3 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#080B12] border border-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    Dia {bill.dueDay}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{bill.title}</h4>
                    <p className="text-[11px] text-slate-400">
                      {bill.category} • {acc?.name || 'Conta'} • <span className="capitalize">{bill.paymentMethod}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-sm font-bold font-mono text-rose-400">
                    {formatCurrency(bill.amount, settings.currency, settings.hideValues)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onMarkAsPaid(bill)}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                      title="Lançar pagamento no extrato"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Efetivar</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(bill)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir a conta fixa "${bill.title}"?`)) {
                          onDeleteRecurringBill(bill.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0F1524] border border-slate-800/90 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingBill ? 'Editar Conta Recorrente' : 'Nova Conta Recorrente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Título da Conta <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Aluguel, Internet Fibra, Netflix, Luz..."
                  className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Valor Mensal (R$) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white font-mono text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Dia do Vencimento (1 a 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(parseInt(e.target.value, 10))}
                    className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white font-mono text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-white text-xs outline-none"
                  >
                    <option value="pix">Pix</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="boleto">Boleto</option>
                    <option value="debit_card">Débito Automático</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Conta de Débito
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-white text-xs outline-none"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
