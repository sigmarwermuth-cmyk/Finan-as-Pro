import React, { useState, useMemo } from 'react';
import { Account, AppSettings, Category, PaymentMethod, Transaction, TransactionType } from '../types';
import { 
  formatCurrency, 
  formatDateBR, 
  formatRelativeDate, 
  exportTransactionsToCSV, 
  downloadFile 
} from '../lib/financialUtils';
import { DynamicIcon } from './DynamicIcon';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Sparkles, 
  Calendar, 
  ArrowUpDown, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  SlidersHorizontal,
  X,
  Layers
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currentMonthKey: string;
  settings: AppSettings;
  onOpenNewTransaction: (defaultType?: TransactionType) => void;
  onOpenAISmartAdd: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  accounts,
  currentMonthKey,
  settings,
  onOpenNewTransaction,
  onOpenAISmartAdd,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [dateFilter, setDateFilter] = useState<'current_month' | 'all' | 'custom'>('current_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(query);
        const matchCat = tx.category.toLowerCase().includes(query);
        const matchNotes = (tx.notes || '').toLowerCase().includes(query);
        const matchTags = (tx.tags || []).some((t) => t.toLowerCase().includes(query));
        if (!matchDesc && !matchCat && !matchNotes && !matchTags) return false;
      }

      // Type filter
      if (selectedType !== 'all' && tx.type !== selectedType) return false;

      // Category filter
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

      // Account filter
      if (selectedAccount !== 'all' && tx.accountId !== selectedAccount && tx.toAccountId !== selectedAccount) return false;

      // Payment method filter
      if (selectedPaymentMethod !== 'all' && tx.paymentMethod !== selectedPaymentMethod) return false;

      // Status filter
      if (selectedStatus !== 'all' && tx.status !== selectedStatus) return false;

      // Date range filter
      if (dateFilter === 'current_month') {
        if (!tx.date.startsWith(currentMonthKey)) return false;
      } else if (dateFilter === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [
    transactions,
    searchTerm,
    selectedType,
    selectedCategory,
    selectedAccount,
    selectedPaymentMethod,
    selectedStatus,
    dateFilter,
    currentMonthKey,
    customStartDate,
    customEndDate,
    sortBy,
  ]);

  // Statistics for current filtered view
  const summary = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') inc += t.amount;
      if (t.type === 'expense') exp += t.amount;
    }
    return {
      income: inc,
      expense: exp,
      balance: inc - exp,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    const csvContent = exportTransactionsToCSV(filteredTransactions, categories, accounts);
    const filename = `extrato_financeiro_${currentMonthKey}.csv`;
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  };

  const handleSelectAll = () => {
    if (selectedTxIds.length === filteredTransactions.length) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(filteredTransactions.map((t) => t.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedTxIds.length === 0) return;
    if (confirm(`Deseja realmente excluir as ${selectedTxIds.length} transações selecionadas?`)) {
      selectedTxIds.forEach((id) => onDeleteTransaction(id));
      setSelectedTxIds([]);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedAccount('all');
    setSelectedPaymentMethod('all');
    setSelectedStatus('all');
    setDateFilter('current_month');
    setCustomStartDate('');
    setCustomEndDate('');
    setShowFiltersModal(false);
  };

  const activeFiltersCount = [
    selectedType !== 'all',
    selectedCategory !== 'all',
    selectedAccount !== 'all',
    selectedPaymentMethod !== 'all',
    selectedStatus !== 'all',
    dateFilter !== 'current_month',
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Extrato & Lançamentos</h2>
          <p className="text-xs text-slate-400">Gerencie todas as suas movimentações financeiras</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#0F1524] hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 shadow-sm transition-all flex items-center gap-1.5"
            title="Exportar dados filtrados para CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={onOpenAISmartAdd}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Lançar com IA</span>
          </button>

          <button
            onClick={() => onOpenNewTransaction('expense')}
            id="btn_add_transaction_main"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Filter Stats Mini Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">Total Receitas:</span>
          <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">
            +{formatCurrency(summary.income, settings.currency, settings.hideValues)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">Total Despesas:</span>
          <span className="text-sm font-bold font-mono tabular-nums text-rose-400">
            -{formatCurrency(summary.expense, settings.currency, settings.hideValues)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">Saldo do Período:</span>
          <span className={`text-sm font-bold font-mono tabular-nums ${
            summary.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {summary.balance >= 0 ? '+' : ''}
            {formatCurrency(summary.balance, settings.currency, settings.hideValues)}
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, categoria, tag, notas..."
              className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 rounded-xl pl-10 pr-4 py-2 text-white text-xs placeholder-slate-500 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Type Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#080B12] rounded-xl border border-slate-800/80 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedType === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedType === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Receitas
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedType === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Despesas
            </button>
            <button
              onClick={() => setSelectedType('transfer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedType === 'transfer'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Transferências
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#080B12] border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500/50 w-full md:w-auto"
            >
              <option value="date_desc">Mais Recentes</option>
              <option value="date_asc">Mais Antigas</option>
              <option value="amount_desc">Maior Valor</option>
              <option value="amount_asc">Menor Valor</option>
            </select>

            <button
              onClick={() => setShowFiltersModal(!showFiltersModal)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all relative ${
                activeFiltersCount > 0
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-[#080B12] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Extended Advanced Filters Panel */}
        {showFiltersModal && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
              >
                <option value="all">Todas as Categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Conta / Cartão</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
              >
                <option value="all">Todas as Contas</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Forma de Pagamento</label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
              >
                <option value="all">Todas as Formas</option>
                <option value="pix">Pix</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="cash">Dinheiro</option>
                <option value="boleto">Boleto</option>
                <option value="transfer">Transferência</option>
              </select>
            </div>

            {/* Date Range Selection */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Período</label>
              <div className="flex items-center gap-2">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                >
                  <option value="current_month">Mês Selecionado</option>
                  <option value="all">Todo o Histórico</option>
                  <option value="custom">Personalizado</option>
                </select>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-[11px] text-rose-400 hover:underline whitespace-nowrap"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {dateFilter === 'custom' && (
              <div className="sm:col-span-2 md:col-span-4 grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Data Final</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Action Bar if items selected */}
      {selectedTxIds.length > 0 && (
        <div className="p-3 bg-slate-800/90 border border-slate-700/80 rounded-2xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-xs text-white font-medium">
            <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-bold text-[10px]">
              {selectedTxIds.length}
            </span>
            <span>transação(ões) selecionada(s)</span>
          </div>
          <button
            onClick={handleBulkDelete}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir Selecionadas
          </button>
        </div>
      )}

      {/* Transaction List Table / Cards */}
      <div className="bg-[#0F1524]/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto text-slate-400 border border-slate-700/60">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Nenhum lançamento encontrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Não encontramos transações com os filtros aplicados. Tente ajustar os termos de busca ou cadastrar um novo lançamento.
            </p>
            <button
              onClick={() => onOpenNewTransaction('expense')}
              className="mt-2 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              + Criar Lançamento
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {/* Table Header */}
            <div className="px-5 py-3 bg-[#080B12]/80 hidden md:grid grid-cols-12 gap-4 text-[11px] font-semibold text-slate-400">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTxIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                  onChange={handleSelectAll}
                  className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-900 border-slate-700"
                />
              </div>
              <div className="col-span-4">Descrição & Categoria</div>
              <div className="col-span-2">Data & Forma</div>
              <div className="col-span-2">Conta</div>
              <div className="col-span-2 text-right">Valor</div>
              <div className="col-span-1 text-center">Status</div>
            </div>

            {/* Rows */}
            {filteredTransactions.map((tx) => {
              const cat = categories.find((c) => c.name === tx.category);
              const acc = accounts.find((a) => a.id === tx.accountId);
              const toAcc = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';
              const isSelected = selectedTxIds.includes(tx.id);

              return (
                <div
                  key={tx.id}
                  className={`px-5 py-3 hover:bg-slate-800/30 transition-colors flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center ${
                    isSelected ? 'bg-slate-800/50' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (isSelected) {
                          setSelectedTxIds(selectedTxIds.filter((id) => id !== tx.id));
                        } else {
                          setSelectedTxIds([...selectedTxIds, tx.id]);
                        }
                      }}
                      className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-900 border-slate-700"
                    />
                  </div>

                  {/* Description & Category */}
                  <div
                    onClick={() => onEditTransaction(tx)}
                    className="col-span-4 flex items-center gap-3 cursor-pointer min-w-0"
                  >
                    <div
                      style={{
                        backgroundColor: `${cat?.color || '#0ea5e9'}15`,
                        color: cat?.color || '#0ea5e9',
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/5"
                    >
                      <DynamicIcon name={cat?.icon || (isIncome ? 'TrendingUp' : 'ShoppingBag')} className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate hover:text-emerald-400 transition-colors">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                        <span className="truncate">{tx.category}</span>
                        {tx.installments && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                            {tx.installments.current}/{tx.installments.total}x
                          </span>
                        )}
                        {tx.isRecurring && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-medium">
                            Fixa
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date & Payment */}
                  <div
                    onClick={() => onEditTransaction(tx)}
                    className="col-span-2 text-xs text-slate-300 cursor-pointer"
                  >
                    <p className="font-medium">{formatDateBR(tx.date)}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{tx.paymentMethod.replace('_', ' ')}</p>
                  </div>

                  {/* Account */}
                  <div
                    onClick={() => onEditTransaction(tx)}
                    className="col-span-2 text-xs text-slate-300 cursor-pointer truncate"
                  >
                    {isTransfer ? (
                      <p className="text-[11px] text-blue-300 font-medium truncate">
                        {acc?.name || 'Origem'} → {toAcc?.name || 'Destino'}
                      </p>
                    ) : (
                      <p className="truncate font-medium">{acc?.name || 'Conta'}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div
                    onClick={() => onEditTransaction(tx)}
                    className="col-span-2 text-right cursor-pointer"
                  >
                    <span
                      className={`text-sm font-bold font-mono tabular-nums ${
                        isIncome ? 'text-emerald-400' : isTransfer ? 'text-blue-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '' : '-'}
                      {formatCurrency(tx.amount, settings.currency, settings.hideValues)}
                    </span>
                  </div>

                  {/* Status */}
                  <div
                    onClick={() => onEditTransaction(tx)}
                    className="col-span-1 flex items-center justify-center cursor-pointer"
                  >
                    {tx.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="hidden lg:inline">Pago</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        <span className="hidden lg:inline">Pendente</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
