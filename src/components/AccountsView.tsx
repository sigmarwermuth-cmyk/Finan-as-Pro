import React, { useState } from 'react';
import { Account, AccountType, AppSettings, Transaction } from '../types';
import { calculateAccountBalances, formatCurrency } from '../lib/financialUtils';
import { DynamicIcon } from './DynamicIcon';
import { 
  CreditCard, 
  Plus, 
  ArrowRightLeft, 
  Edit2, 
  Trash2, 
  Landmark, 
  Wallet, 
  TrendingUp, 
  X, 
  Check, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface AccountsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  settings: AppSettings;
  onSaveAccount: (account: Omit<Account, 'id'>, editingId?: string) => void;
  onDeleteAccount: (id: string) => void;
  onOpenTransferModal: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  transactions,
  settings,
  onSaveAccount,
  onDeleteAccount,
  onOpenTransferModal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [initialBalance, setInitialBalance] = useState('');
  const [bankName, setBankName] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [icon, setIcon] = useState('CreditCard');
  const [creditLimit, setCreditLimit] = useState('');
  const [statementClosingDay, setStatementClosingDay] = useState(28);
  const [paymentDueDay, setPaymentDueDay] = useState(5);

  const accountBalances = calculateAccountBalances(accounts, transactions);

  const handleOpenNew = () => {
    setEditingAccount(null);
    setName('');
    setType('checking');
    setInitialBalance('0');
    setBankName('');
    setColor('#8b5cf6');
    setIcon('CreditCard');
    setCreditLimit('5000');
    setStatementClosingDay(28);
    setPaymentDueDay(5);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setInitialBalance((acc.initialBalance || 0).toString());
    setBankName(acc.bankName || '');
    setColor(acc.color);
    setIcon(acc.icon);
    setCreditLimit((acc.creditLimit || 0).toString());
    setStatementClosingDay(acc.statementClosingDay || 28);
    setPaymentDueDay(acc.paymentDueDay || 5);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numBal = parseFloat(initialBalance.replace(',', '.')) || 0;
    const numLimit = parseFloat(creditLimit.replace(',', '.')) || 0;

    const payload: Omit<Account, 'id'> = {
      name: name.trim(),
      type,
      initialBalance: numBal,
      bankName: bankName.trim(),
      color,
      icon,
      creditLimit: type === 'credit_card' ? numLimit : undefined,
      statementClosingDay: type === 'credit_card' ? statementClosingDay : undefined,
      paymentDueDay: type === 'credit_card' ? paymentDueDay : undefined,
    };

    onSaveAccount(payload, editingAccount?.id);
    setIsModalOpen(false);
  };

  const bankAccounts = accounts.filter(a => a.type !== 'credit_card');
  const creditCards = accounts.filter(a => a.type === 'credit_card');

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Contas & Cartões</h2>
          <p className="text-xs text-slate-400">Gerencie saldos bancários, carteiras e limites de cartão</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenTransferModal}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#0F1524] hover:bg-slate-800/80 border border-slate-800 shadow-sm transition-all flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transferir</span>
          </button>
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Nova Conta/Cartão</span>
          </button>
        </div>
      </div>

      {/* Checking & Savings Accounts Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Landmark className="w-4 h-4 text-emerald-400" />
          Contas Correntes, Carteira & Investimentos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankAccounts.map((acc) => {
            const bal = accountBalances[acc.id] || { currentBalance: 0 };
            return (
              <div
                key={acc.id}
                className="p-5 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${acc.color}15`, color: acc.color }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 shadow-inner"
                    >
                      <DynamicIcon name={acc.icon || 'Landmark'} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[140px]">{acc.name}</h4>
                      <p className="text-[11px] text-slate-400 capitalize">{acc.bankName || acc.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir a conta "${acc.name}"?`)) {
                          onDeleteAccount(acc.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/80 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-0.5">Saldo Disponível</span>
                  <p className="text-xl font-bold font-mono tabular-nums text-emerald-400">
                    {formatCurrency(bal.currentBalance, settings.currency, settings.hideValues)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Credit Cards Section */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-amber-400" />
          Cartões de Crédito
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creditCards.map((card) => {
            const bal = accountBalances[card.id] || { currentBalance: 0 };
            const limit = card.creditLimit || 5000;
            const currentInvoice = bal.currentBalance;
            const availableLimit = Math.max(0, limit - currentInvoice);
            const usagePct = limit > 0 ? (currentInvoice / limit) * 100 : 0;

            return (
              <div
                key={card.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-[#0F1524] via-[#0F1524] to-[#0B0F19] border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: `${card.color}15`, color: card.color }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 shadow-inner"
                      >
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[140px]">{card.name}</h4>
                        <p className="text-[11px] text-slate-400">{card.bankName || 'Cartão'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(card)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja excluir o cartão "${card.name}"?`)) {
                            onDeleteAccount(card.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/80 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Balance & Limit */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block mb-0.5">Fatura Atual</span>
                        <span className="text-lg font-bold font-mono tabular-nums text-amber-400">
                          {formatCurrency(currentInvoice, settings.currency, settings.hideValues)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block mb-0.5">Limite Total</span>
                        <span className="text-xs font-mono font-medium tabular-nums text-slate-300">
                          {formatCurrency(limit, settings.currency, settings.hideValues)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-[#080B12] rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(usagePct, 100)}%` }}
                        className={`h-full rounded-full transition-all ${
                          usagePct > 80 ? 'bg-rose-500' : usagePct > 50 ? 'bg-amber-500' : 'bg-emerald-400'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{usagePct.toFixed(0)}% do limite usado</span>
                      <span className="tabular-nums">Disponível: {formatCurrency(availableLimit, settings.currency, settings.hideValues)}</span>
                    </div>
                  </div>
                </div>

                {/* Closing and Due days */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Fecha dia: <strong className="text-slate-200">{card.statementClosingDay}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Vence dia: <strong className="text-slate-200">{card.paymentDueDay}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Account / Card Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0F1524] border border-slate-800/90 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingAccount ? 'Editar Conta/Cartão' : 'Nova Conta Bancária ou Cartão'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nome da Conta / Cartão <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Nubank, Itaú, Carteira, Cartão Black..."
                  className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Tipo
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none"
                  >
                    <option value="checking">Conta Corrente</option>
                    <option value="savings">Poupança</option>
                    <option value="investment">Investimento / Reserva</option>
                    <option value="wallet">Carteira Física</option>
                    <option value="credit_card">Cartão de Crédito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Instituição / Banco
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ex: Nubank, Bradesco..."
                    className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none"
                  />
                </div>
              </div>

              {type === 'credit_card' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Limite de Crédito Total (R$)
                    </label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      placeholder="5000.00"
                      className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white font-mono text-xs outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Dia do Fechamento
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={statementClosingDay}
                        onChange={(e) => setStatementClosingDay(parseInt(e.target.value, 10))}
                        className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Dia do Vencimento
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={paymentDueDay}
                        onChange={(e) => setPaymentDueDay(parseInt(e.target.value, 10))}
                        className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Saldo Inicial (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white font-mono text-xs outline-none"
                  />
                </div>
              )}

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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
