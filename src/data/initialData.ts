import { Account, AppSettings, Category, FinancialGoal, RecurringBill, Transaction } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Despesas
  { id: 'cat_alimentacao', name: 'Alimentação & Supermercado', type: 'expense', icon: 'Utensils', color: '#f97316', monthlyBudget: 1400, isDefault: true },
  { id: 'cat_moradia', name: 'Moradia & Contas', type: 'expense', icon: 'Home', color: '#0ea5e9', monthlyBudget: 2200, isDefault: true },
  { id: 'cat_transporte', name: 'Transporte & Combustível', type: 'expense', icon: 'Car', color: '#eab308', monthlyBudget: 600, isDefault: true },
  { id: 'cat_saude', name: 'Saúde & Farmácia', type: 'expense', icon: 'HeartPulse', color: '#ef4444', monthlyBudget: 450, isDefault: true },
  { id: 'cat_lazer', name: 'Lazer & Restaurantes', type: 'expense', icon: 'Coffee', color: '#a855f7', monthlyBudget: 600, isDefault: true },
  { id: 'cat_compras', name: 'Compras & Vestuário', type: 'expense', icon: 'ShoppingBag', color: '#ec4899', monthlyBudget: 500, isDefault: true },
  { id: 'cat_educacao', name: 'Educação & Cursos', type: 'expense', icon: 'GraduationCap', color: '#3b82f6', monthlyBudget: 350, isDefault: true },
  { id: 'cat_assinaturas', name: 'Assinaturas & Serviços', type: 'expense', icon: 'Tv', color: '#6366f1', monthlyBudget: 180, isDefault: true },
  { id: 'cat_outros_desp', name: 'Outras Despesas', type: 'expense', icon: 'MoreHorizontal', color: '#64748b', monthlyBudget: 300, isDefault: true },
  
  // Receitas
  { id: 'cat_salario', name: 'Salário Principal', type: 'income', icon: 'Briefcase', color: '#10b981', isDefault: true },
  { id: 'cat_freelance', name: 'Freelance & Serviços Extras', type: 'income', icon: 'Laptop', color: '#14b8a6', isDefault: true },
  { id: 'cat_investimentos', name: 'Rendimentos & Dividendos', type: 'income', icon: 'TrendingUp', color: '#22c55e', isDefault: true },
  { id: 'cat_outros_rec', name: 'Outras Receitas', type: 'income', icon: 'Coins', color: '#84cc16', isDefault: true },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc_corrente',
    name: 'Conta Principal (Corrente)',
    type: 'checking',
    initialBalance: 0,
    bankName: 'Banco Principal',
    color: '#8b5cf6',
    icon: 'CreditCard',
  },
  {
    id: 'acc_reserva',
    name: 'Reserva & Poupança',
    type: 'investment',
    initialBalance: 0,
    bankName: 'Investimentos / Poupança',
    color: '#10b981',
    icon: 'PiggyBank',
  },
  {
    id: 'acc_cartao',
    name: 'Cartão de Crédito',
    type: 'credit_card',
    initialBalance: 0,
    bankName: 'Cartão de Crédito',
    color: '#475569',
    icon: 'CreditCard',
    creditLimit: 5000.00,
    statementClosingDay: 28,
    paymentDueDay: 5,
  },
  {
    id: 'acc_carteira',
    name: 'Dinheiro em Espécie (Carteira)',
    type: 'wallet',
    initialBalance: 0,
    bankName: 'Carteira Física',
    color: '#059669',
    icon: 'Wallet',
  },
];

export const DEFAULT_GOALS: FinancialGoal[] = [
  {
    id: 'goal_reserva',
    title: 'Reserva de Emergência',
    targetAmount: 10000.00,
    currentAmount: 0,
    deadline: '2026-12-31',
    category: 'Segurança Financeira',
    color: '#10b981',
    icon: 'ShieldCheck',
    notes: 'Manter em CDB 100% CDI ou Tesouro Selic.',
    isCompleted: false,
    priority: 'high',
    deposits: [],
  },
  {
    id: 'goal_viagem',
    title: 'Viagem & Lazer',
    targetAmount: 5000.00,
    currentAmount: 0,
    deadline: '2026-12-31',
    category: 'Lazer',
    color: '#0ea5e9',
    icon: 'Palmtree',
    notes: 'Planejamento de férias.',
    isCompleted: false,
    priority: 'medium',
    deposits: [],
  },
];

export const DEFAULT_RECURRING_BILLS: RecurringBill[] = [];

export const DEFAULT_TRANSACTIONS: Transaction[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Meu Usuário',
  currency: 'BRL',
  hideValues: false,
  defaultMonthOffset: 0,
};

export const initialCategories = DEFAULT_CATEGORIES;
export const initialAccounts = DEFAULT_ACCOUNTS;
export const initialGoals = DEFAULT_GOALS;
export const initialRecurringBills = DEFAULT_RECURRING_BILLS;
export const initialSettings = DEFAULT_SETTINGS;
export const initialTransactions = DEFAULT_TRANSACTIONS;

