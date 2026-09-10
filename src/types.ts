export type TransactionType = 'income' | 'expense' | 'transfer';

export type PaymentMethod = 
  | 'pix' 
  | 'credit_card' 
  | 'debit_card' 
  | 'cash' 
  | 'boleto' 
  | 'transfer';

export type AccountType = 
  | 'checking' 
  | 'savings' 
  | 'investment' 
  | 'wallet' 
  | 'credit_card';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  accountId: string;
  toAccountId?: string; // for transfers
  status: 'completed' | 'pending';
  isRecurring?: boolean;
  recurringFrequency?: 'monthly' | 'weekly' | 'yearly';
  installments?: {
    total: number;
    current: number;
    parentGroupId?: string;
  };
  tags: string[];
  notes?: string;
  receiptAttachment?: string; // base64 or URL
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  monthlyBudget?: number;
  isDefault?: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  icon: string;
  bankName?: string;
  creditLimit?: number;
  statementClosingDay?: number;
  paymentDueDay?: number;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // YYYY-MM-DD
  category: string;
  color: string;
  icon: string;
  notes?: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  deposits: {
    id: string;
    amount: number;
    date: string;
    notes?: string;
  }[];
}

export interface BudgetLimit {
  categoryId: string;
  monthlyLimit: number;
  warningPercentage: number; // e.g. 80
}

export interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  dueDay: number; // 1 - 31
  accountId: string;
  paymentMethod: PaymentMethod;
  isActive: boolean;
  notes?: string;
}

export interface AIInsightItem {
  type: 'positive' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact: string;
}

export interface AISpendingLeak {
  category: string;
  issue: string;
  recommendation: string;
  potentialMonthlySavings: number;
}

export interface AIBudgetAdvice {
  category: string;
  currentSpent: number;
  recommendedLimit: number;
  reason: string;
}

export interface AIGoalStrategy {
  goalName: string;
  status: string;
  advice: string;
  estimatedMonthsToComplete: number;
}

export interface AIActionStep {
  step: number;
  title: string;
  description: string;
  priority: 'Alta' | 'Média' | 'Baixa';
}

export interface AIAdvisorReport {
  healthScore: number;
  healthStatus: 'Excelente' | 'Muito Bom' | 'Estável' | 'Atenção' | 'Crítico' | string;
  summaryHeadline: string;
  keyInsights: AIInsightItem[];
  spendingLeaks: AISpendingLeak[];
  budgetAdvice: AIBudgetAdvice[];
  goalsStrategy: AIGoalStrategy[];
  actionPlan: AIActionStep[];
  rule503020?: {
    necessitiesPercentage: number;
    wantsPercentage: number;
    savingsPercentage: number;
    evaluation: string;
  };
  generatedAt?: string;
}

export interface AppLicense {
  isRegistered: boolean;
  plan: 'free' | 'full';
  licenseKey: string;
  registeredTo: string;
  registeredAt: string | null;
  deviceId: string;
  type: 'lifetime' | 'annual' | 'trial';
  expiresAt?: string | null;
}

export interface AppSettings {
  currency: 'BRL' | 'USD' | 'EUR';
  hideValues: boolean;
  defaultMonthOffset: number; // 0 = current month
  userName: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'transactions' 
  | 'budgets' 
  | 'goals' 
  | 'accounts' 
  | 'cashflow' 
  | 'ai_advisor' 
  | 'settings';
