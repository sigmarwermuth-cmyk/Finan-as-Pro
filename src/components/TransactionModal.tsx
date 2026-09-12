import React, { useState, useEffect } from 'react';
import { Account, Category, PaymentMethod, Transaction, TransactionType } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { X, Plus, Trash2, Calendar, DollarSign, Tag, FileText, ArrowRightLeft, CreditCard, Check } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>, editingId?: string) => void;
  onDelete?: (id: string) => void;
  editingTransaction?: Transaction | null;
  categories: Category[];
  accounts: Account[];
  defaultType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingTransaction,
  categories,
  accounts,
  defaultType = 'expense',
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<'completed' | 'pending'>('completed');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setDate(editingTransaction.date);
      setCategory(editingTransaction.category);
      setAccountId(editingTransaction.accountId);
      setToAccountId(editingTransaction.toAccountId || '');
      setPaymentMethod(editingTransaction.paymentMethod);
      setStatus(editingTransaction.status);
      setIsRecurring(!!editingTransaction.isRecurring);
      setRecurringFrequency(editingTransaction.recurringFrequency || 'monthly');
      setIsInstallment(!!editingTransaction.installments && editingTransaction.installments.total > 1);
      setInstallmentsCount(editingTransaction.installments?.total || 2);
      setTags(editingTransaction.tags || []);
      setNotes(editingTransaction.notes || '');
    } else {
      setType(defaultType);
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      
      const filteredCategories = categories.filter(c => c.type === defaultType);
      setCategory(filteredCategories[0]?.name || (defaultType === 'income' ? 'Salário Principal' : 'Alimentação & Supermercado'));
      
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || '');
      setPaymentMethod('pix');
      setStatus('completed');
      setIsRecurring(false);
      setIsInstallment(false);
      setInstallmentsCount(2);
      setTags([]);
      setNotes('');
    }
  }, [editingTransaction, defaultType, isOpen, categories, accounts]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const clean = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor, insira um valor válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      alert('Por favor, informe a descrição da transação.');
      return;
    }

    const payload: Omit<Transaction, 'id' | 'createdAt'> = {
      description: description.trim(),
      amount: numAmount,
      type,
      category: type === 'transfer' ? 'Transferência' : category,
      date,
      paymentMethod,
      accountId: accountId || accounts[0]?.id || 'acc_default',
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      status,
      isRecurring: isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      installments: isInstallment && type === 'expense' ? {
        total: installmentsCount,
        current: editingTransaction?.installments?.current || 1,
      } : undefined,
      tags,
      notes: notes.trim(),
    };

    onSave(payload, editingTransaction?.id);
    onClose();
  };

  const filteredCategories = categories.filter(c => c.type === (type === 'transfer' ? 'expense' : type));

  return (
    <div id="transaction_modal_overlay" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="transaction_modal_container" 
        className="bg-[#0F1524] border-t sm:border border-slate-800/90 rounded-t-3xl sm:rounded-2xl w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800/80 bg-[#080B12]/80">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {type === 'income' && <Plus className="w-5 h-5 stroke-[2.5]" />}
              {type === 'expense' && <DollarSign className="w-5 h-5" />}
              {type === 'transfer' && <ArrowRightLeft className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <p className="text-xs text-slate-400">
                {editingTransaction ? 'Atualize as informações do lançamento' : 'Cadastre receita, despesa ou transferência'}
              </p>
            </div>
          </div>
          <button
            id="close_transaction_modal_btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#080B12] rounded-xl border border-slate-800/80">
            <button
              type="button"
              id="type_expense_tab"
              onClick={() => {
                setType('expense');
                const expCats = categories.filter(c => c.type === 'expense');
                if (!expCats.some(c => c.name === category)) {
                  setCategory(expCats[0]?.name || 'Alimentação & Supermercado');
                }
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Despesa
            </button>
            <button
              type="button"
              id="type_income_tab"
              onClick={() => {
                setType('income');
                const incCats = categories.filter(c => c.type === 'income');
                if (!incCats.some(c => c.name === category)) {
                  setCategory(incCats[0]?.name || 'Salário Principal');
                }
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              Receita
            </button>
            <button
              type="button"
              id="type_transfer_tab"
              onClick={() => setType('transfer')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === 'transfer'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Transferência
            </button>
          </div>

          {/* Amount & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Valor (R$) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                  R$
                </span>
                <input
                  id="tx_amount_input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl pl-10 pr-4 py-2 text-white font-mono font-bold text-base placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Data do Lançamento <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="tx_date_input"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Descrição do Lançamento <span className="text-rose-400">*</span>
            </label>
            <input
              id="tx_description_input"
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Aluguel, Salário, Jantar..."
              className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs placeholder-slate-600 outline-none transition-all"
            />
          </div>

          {/* Category & Payment Method (if not transfer) */}
          {type !== 'transfer' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Categoria
                </label>
                <select
                  id="tx_category_select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none transition-all"
                >
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.name} className="bg-slate-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Forma de Pagamento
                </label>
                <select
                  id="tx_payment_method_select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none transition-all"
                >
                  <option value="pix" className="bg-slate-900">Pix Instantâneo</option>
                  <option value="credit_card" className="bg-slate-900">Cartão de Crédito</option>
                  <option value="debit_card" className="bg-slate-900">Cartão de Débito</option>
                  <option value="cash" className="bg-slate-900">Dinheiro em Espécie</option>
                  <option value="boleto" className="bg-slate-900">Boleto Bancário</option>
                  <option value="transfer" className="bg-slate-900">Transferência / TED</option>
                </select>
              </div>
            </div>
          ) : null}

          {/* Accounts selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {type === 'transfer' ? 'Conta de Origem (Sai)' : 'Conta / Cartão'}
              </label>
              <select
                id="tx_account_select"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none transition-all"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-slate-900">
                    {acc.name} ({acc.type === 'credit_card' ? 'Cartão' : 'Saldo'})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Conta de Destino (Entra)
                </label>
                <select
                  id="tx_to_account_select"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none transition-all"
                >
                  {accounts
                    .filter((acc) => acc.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id} className="bg-slate-900">
                        {acc.name}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Status do Lançamento
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('completed')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      status === 'completed'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                        : 'bg-[#080B12] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Efetivado / Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('pending')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      status === 'pending'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
                        : 'bg-[#080B12] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Pendente / Agendado
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Installments & Recurring options for expense */}
          {type === 'expense' && (
            <div className="p-4 bg-[#080B12]/80 border border-slate-800/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={(e) => {
                      setIsInstallment(e.target.checked);
                      if (e.target.checked) setIsRecurring(false);
                    }}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 accent-emerald-400"
                  />
                  Compra Parcelada no Cartão
                </label>
                {isInstallment && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Total de Parcelas:</span>
                    <select
                      value={installmentsCount}
                      onChange={(e) => setInstallmentsCount(parseInt(e.target.value, 10))}
                      className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs outline-none"
                    >
                      {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((n) => (
                        <option key={n} value={n}>
                          {n}x de R$ {(parseFloat(amount || '0') / n).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => {
                      setIsRecurring(e.target.checked);
                      if (e.target.checked) setIsInstallment(false);
                    }}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 accent-emerald-400"
                  />
                  Despesa Recorrente / Assinatura Fixa
                </label>
                {isRecurring && (
                  <select
                    value={recurringFrequency}
                    onChange={(e) => setRecurringFrequency(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs outline-none"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="weekly">Semanal</option>
                    <option value="yearly">Anual</option>
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tags / Etiquetas (Opcional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Adicionar tag (ex: lazer, fixo) e aperte Enter"
                className="flex-1 bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-medium transition-colors"
              >
                Adicionar
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800/60 text-slate-300 border border-slate-700/60"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Observações & Detalhes (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais, chave Pix, número de recibo, local..."
              className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl p-3 text-white text-xs placeholder-slate-600 outline-none transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            {editingTransaction && onDelete ? (
              <button
                type="button"
                id="delete_transaction_btn"
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta transação?')) {
                    onDelete(editingTransaction.id);
                    onClose();
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="cancel_transaction_btn"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="save_transaction_btn"
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                {editingTransaction ? 'Salvar Alterações' : 'Confirmar Lançamento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
