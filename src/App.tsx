import React, { useState, useEffect } from 'react';
import { 
  Account, 
  ActiveTab, 
  AppLicense,
  AppSettings, 
  Category, 
  FinancialGoal, 
  RecurringBill, 
  Transaction, 
  TransactionType 
} from './types';
import { 
  initialAccounts, 
  initialCategories, 
  initialGoals, 
  initialRecurringBills, 
  initialSettings, 
  initialTransactions 
} from './data/initialData';
import { calculateSummary } from './lib/financialUtils';
import { FREE_LIMITS, getInitialLicense } from './lib/licenseUtils';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetsView } from './components/BudgetsView';
import { GoalsView } from './components/GoalsView';
import { AccountsView } from './components/AccountsView';
import { CashFlowView } from './components/CashFlowView';
import { AIAdvisorView } from './components/AIAdvisorView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { AISmartAddModal } from './components/AISmartAddModal';
import { RegisterAppModal } from './components/RegisterAppModal';
import { BottomNav } from './components/BottomNav';

const STORAGE_KEY = 'financas_pro_app_state_v2';

export default function App() {
  // Load initial state from LocalStorage or Fallback
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_transactions`);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_categories`);
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_accounts`);
    return saved ? JSON.parse(saved) : initialAccounts;
  });

  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_goals`);
    return saved ? JSON.parse(saved) : initialGoals;
  });

  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_recurring`);
    return saved ? JSON.parse(saved) : initialRecurringBills;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : initialSettings;
  });

  // App License State (Preserve key if migrated from v1)
  const [license, setLicense] = useState<AppLicense>(() => {
    const savedV2 = localStorage.getItem(`${STORAGE_KEY}_license`);
    if (savedV2) return JSON.parse(savedV2);
    const savedV1 = localStorage.getItem('financas_pro_app_state_v1_license');
    if (savedV1) return JSON.parse(savedV1);
    return getInitialLicense();
  });

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Current selected month: defaults to current YYYY-MM
  const [currentMonthKey, setCurrentMonthKey] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [defaultTxType, setDefaultTxType] = useState<TransactionType>('expense');
  const [isAISmartAddOpen, setIsAISmartAddOpen] = useState(false);
  
  // Registration Modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerTriggerReason, setRegisterTriggerReason] = useState<string | undefined>(undefined);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_transactions`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_categories`, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_accounts`, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_goals`, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_recurring`, JSON.stringify(recurringBills));
  }, [recurringBills]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_license`, JSON.stringify(license));
  }, [license]);

  // Overall calculations
  const monthSummary = calculateSummary(transactions, currentMonthKey);

  // License Handlers
  const handleRegisterSuccess = (key: string, ownerName: string) => {
    setLicense((prev) => ({
      ...prev,
      isRegistered: true,
      plan: 'full',
      licenseKey: key,
      registeredTo: ownerName,
      registeredAt: new Date().toISOString(),
      type: 'lifetime',
    }));
  };

  const handleUnregisterLicense = () => {
    setLicense((prev) => ({
      ...prev,
      isRegistered: false,
      plan: 'free',
      licenseKey: '',
      registeredTo: '',
      registeredAt: null,
      type: 'lifetime',
    }));
  };

  const openRegisterWithReason = (reason: string) => {
    setRegisterTriggerReason(reason);
    setIsRegisterModalOpen(true);
  };

  // Handlers for Transactions
  const handleSaveTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>, editingId?: string) => {
    if (editingId) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? { ...t, ...txData }
            : t
        )
      );
    } else {
      // Check Free Limits
      if (!license.isRegistered && transactions.length >= FREE_LIMITS.maxTransactions) {
        setIsTxModalOpen(false);
        openRegisterWithReason(`Você atingiu o limite de ${FREE_LIMITS.maxTransactions} lançamentos da versão gratuita. Registre a Versão Full com seu código para lançamentos ilimitados!`);
        return;
      }

      const newTx: Transaction = {
        ...txData,
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenNewTransaction = (type: TransactionType = 'expense') => {
    if (!license.isRegistered && transactions.length >= FREE_LIMITS.maxTransactions) {
      openRegisterWithReason(`Você atingiu o limite de ${FREE_LIMITS.maxTransactions} lançamentos da versão gratuita. Registre o código da Versão Full para desbloquear lançamentos ilimitados.`);
      return;
    }
    setEditingTx(null);
    setDefaultTxType(type);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setDefaultTxType(tx.type);
    setIsTxModalOpen(true);
  };

  // AISmartAdd handler: saves multiple structured items from receipt
  const handleAISmartAddSave = (parsedItems: any[]) => {
    if (!license.isRegistered && transactions.length + parsedItems.length > FREE_LIMITS.maxTransactions) {
      openRegisterWithReason(`A importação inteligente via IA requer a Versão Full para adicionar ${parsedItems.length} novos lançamentos.`);
      return;
    }

    const newItems: Transaction[] = parsedItems.map((item, idx) => ({
      id: `ai_tx_${Date.now()}_${idx}`,
      description: item.description,
      amount: item.amount,
      type: item.type || 'expense',
      category: item.category || 'Alimentação & Mercado',
      date: item.date || new Date().toISOString().split('T')[0],
      paymentMethod: item.paymentMethod || 'credit_card',
      accountId: accounts[0]?.id || 'acc_1',
      status: 'completed',
      notes: item.notes || 'Lançado automaticamente via IA Scanner',
      tags: ['IA', 'Cupom'],
      createdAt: new Date().toISOString(),
    }));

    setTransactions((prev) => [...newItems, ...prev]);
  };

  // Handlers for Goals
  const handleSaveGoal = (goalData: Omit<FinancialGoal, 'id'>, editingId?: string) => {
    if (editingId) {
      setGoals((prev) =>
        prev.map((g) => (g.id === editingId ? { ...g, ...goalData } : g))
      );
    } else {
      if (!license.isRegistered && goals.length >= FREE_LIMITS.maxGoals) {
        openRegisterWithReason(`Você atingiu o limite de ${FREE_LIMITS.maxGoals} metas da versão gratuita. Registre a Versão Full para criar cofrinhos e metas ilimitadas!`);
        return;
      }
      const newGoal: FinancialGoal = {
        ...goalData,
        id: `goal_${Date.now()}`,
      };
      setGoals((prev) => [...prev, newGoal]);
    }
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleDepositToGoal = (goalId: string, amount: number, notes?: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const newCurrent = Math.max(0, g.currentAmount + amount);
          const newDeposit = {
            id: `dep_${Date.now()}`,
            amount,
            date: new Date().toISOString().split('T')[0],
            notes,
          };
          return {
            ...g,
            currentAmount: newCurrent,
            isCompleted: newCurrent >= g.targetAmount,
            deposits: [...(g.deposits || []), newDeposit],
          };
        }
        return g;
      })
    );

    // Also register an expense transaction if it's a deposit towards saving
    if (amount > 0) {
      const targetGoal = goals.find((g) => g.id === goalId);
      const newTx: Transaction = {
        id: `tx_goal_${Date.now()}`,
        description: `Aporte na Meta: ${targetGoal?.title || 'Cofrinho'}`,
        amount: amount,
        type: 'expense',
        category: 'Investimentos & Reserva',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'pix',
        accountId: accounts[0]?.id || 'acc_1',
        status: 'completed',
        notes: notes || 'Aporte financeiro para meta',
        tags: ['Meta', 'Poupança'],
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  // Handlers for Accounts
  const handleSaveAccount = (accData: Omit<Account, 'id'>, editingId?: string) => {
    if (editingId) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, ...accData } : a))
      );
    } else {
      if (!license.isRegistered && accounts.length >= FREE_LIMITS.maxAccounts) {
        openRegisterWithReason(`Você atingiu o limite de ${FREE_LIMITS.maxAccounts} contas bancárias da versão gratuita. Registre a Versão Full para gerenciar contas ilimitadas!`);
        return;
      }
      const newAcc: Account = {
        ...accData,
        id: `acc_${Date.now()}`,
      };
      setAccounts((prev) => [...prev, newAcc]);
    }
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  // Handlers for Recurring Bills
  const handleSaveRecurringBill = (billData: Omit<RecurringBill, 'id'>, editingId?: string) => {
    if (editingId) {
      setRecurringBills((prev) =>
        prev.map((b) => (b.id === editingId ? { ...b, ...billData } : b))
      );
    } else {
      const newBill: RecurringBill = {
        ...billData,
        id: `bill_${Date.now()}`,
      };
      setRecurringBills((prev) => [...prev, newBill]);
    }
  };

  const handleDeleteRecurringBill = (id: string) => {
    setRecurringBills((prev) => prev.filter((b) => b.id !== id));
  };

  const handleToggleRecurringBillActive = (id: string) => {
    setRecurringBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
  };

  const handleMarkBillAsPaid = (bill: RecurringBill) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newTx: Transaction = {
      id: `tx_bill_${Date.now()}`,
      description: `Pagamento: ${bill.title}`,
      amount: bill.amount,
      type: 'expense',
      category: bill.category,
      date: todayStr,
      paymentMethod: bill.paymentMethod,
      accountId: bill.accountId,
      status: 'completed',
      isRecurring: true,
      tags: ['Conta Fixa', 'Recorrente'],
      notes: 'Lançado a partir de contas fixas recorrentes',
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    alert(`Pagamento de "${bill.title}" lançado com sucesso no extrato!`);
  };

  // Handlers for Budgets
  const handleUpdateCategoryBudget = (categoryId: string, newBudget: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, monthlyBudget: newBudget } : c))
    );
  };

  // Handlers for Custom Categories
  const handleSaveCategory = (catData: Omit<Category, 'id'>, editingId?: string) => {
    if (editingId) {
      setCategories((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...catData } : c))
      );
    } else {
      const newCat: Category = {
        ...catData,
        id: `cat_${Date.now()}`,
      };
      setCategories((prev) => [...prev, newCat]);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Reset all data to clean initial state
  const handleResetData = () => {
    setTransactions([]);
    setCategories(initialCategories);
    setAccounts(initialAccounts);
    setGoals(initialGoals);
    setRecurringBills([]);
    setSettings(initialSettings);
  };

  // Clear only transactions
  const handleClearTransactions = () => {
    setTransactions([]);
  };

  // Import backup
  const handleImportBackup = (data: any) => {
    if (data.transactions) setTransactions(data.transactions);
    if (data.categories) setCategories(data.categories);
    if (data.accounts) setAccounts(data.accounts);
    if (data.goals) setGoals(data.goals);
    if (data.recurringBills) setRecurringBills(data.recurringBills);
    if (data.settings) setSettings(data.settings);
  };

  const fullAppData = {
    transactions,
    categories,
    accounts,
    goals,
    recurringBills,
    settings,
    license,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased font-sans selection:bg-emerald-500 selection:text-white">
      <div className="flex flex-1 w-full min-h-screen overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          netBalance={monthSummary.netBalance}
          settings={settings}
          license={license}
          onOpenRegisterModal={() => {
            setRegisterTriggerReason(undefined);
            setIsRegisterModalOpen(true);
          }}
          transactionCount={transactions.length}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          {/* Top Header */}
          <Header
            activeTab={activeTab}
            currentMonthKey={currentMonthKey}
            onMonthChange={setCurrentMonthKey}
            settings={settings}
            license={license}
            onToggleHideValues={() =>
              setSettings((prev) => ({ ...prev, hideValues: !prev.hideValues }))
            }
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onOpenNewTransaction={() => handleOpenNewTransaction('expense')}
            onOpenAISmartAdd={() => {
              if (!license.isRegistered && transactions.length >= FREE_LIMITS.maxTransactions) {
                openRegisterWithReason('O recurso de Scanner e Lançamento Inteligente por IA é ilimitado na Versão Full.');
                return;
              }
              setIsAISmartAddOpen(true);
            }}
            onOpenRegisterModal={() => {
              setRegisterTriggerReason(undefined);
              setIsRegisterModalOpen(true);
            }}
          />

          {/* Main Body View */}
          <main className="flex-1 px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                goals={goals}
                recurringBills={recurringBills}
                currentMonthKey={currentMonthKey}
                settings={settings}
                onOpenNewTransaction={handleOpenNewTransaction}
                onOpenAISmartAdd={() => setIsAISmartAddOpen(true)}
                onEditTransaction={handleEditTransaction}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                currentMonthKey={currentMonthKey}
                settings={settings}
                onOpenNewTransaction={handleOpenNewTransaction}
                onOpenAISmartAdd={() => setIsAISmartAddOpen(true)}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {activeTab === 'budgets' && (
              <BudgetsView
                categories={categories}
                transactions={transactions}
                currentMonthKey={currentMonthKey}
                settings={settings}
                onUpdateCategoryBudget={handleUpdateCategoryBudget}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'goals' && (
              <GoalsView
                goals={goals}
                settings={settings}
                onSaveGoal={handleSaveGoal}
                onDeleteGoal={handleDeleteGoal}
                onDepositToGoal={handleDepositToGoal}
              />
            )}

            {activeTab === 'accounts' && (
              <AccountsView
                accounts={accounts}
                transactions={transactions}
                settings={settings}
                onSaveAccount={handleSaveAccount}
                onDeleteAccount={handleDeleteAccount}
                onOpenTransferModal={() => handleOpenNewTransaction('transfer')}
              />
            )}

            {activeTab === 'cashflow' && (
              <CashFlowView
                recurringBills={recurringBills}
                transactions={transactions}
                accounts={accounts}
                currentMonthKey={currentMonthKey}
                settings={settings}
                onSaveRecurringBill={handleSaveRecurringBill}
                onDeleteRecurringBill={handleDeleteRecurringBill}
                onToggleRecurringBillActive={handleToggleRecurringBillActive}
                onMarkAsPaid={handleMarkBillAsPaid}
              />
            )}

            {activeTab === 'ai_advisor' && (
              <AIAdvisorView
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                goals={goals}
                recurringBills={recurringBills}
                currentMonthKey={currentMonthKey}
                settings={settings}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                license={license}
                categories={categories}
                allAppData={fullAppData}
                onUpdateSettings={(newS) => setSettings((prev) => ({ ...prev, ...newS }))}
                onOpenRegisterModal={() => {
                  setRegisterTriggerReason(undefined);
                  setIsRegisterModalOpen(true);
                }}
                onSaveCategory={handleSaveCategory}
                onDeleteCategory={handleDeleteCategory}
                onImportBackup={handleImportBackup}
                onResetData={handleResetData}
                onClearTransactions={handleClearTransactions}
              />
            )}
          </main>
        </div>
      </div>

      {/* Manual Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
        accounts={accounts}
        editingTransaction={editingTx}
        defaultType={defaultTxType}
      />

      {/* AI Smart Add Modal */}
      <AISmartAddModal
        isOpen={isAISmartAddOpen}
        onClose={() => setIsAISmartAddOpen(false)}
        onSaveTransactions={handleAISmartAddSave}
        categories={categories}
        accounts={accounts}
      />

      {/* App License / Registration Modal */}
      <RegisterAppModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        license={license}
        onRegisterSuccess={handleRegisterSuccess}
        onUnregister={handleUnregisterLicense}
        triggerReason={registerTriggerReason}
        stats={{
          transactionsCount: transactions.length,
          accountsCount: accounts.length,
          goalsCount: goals.length,
        }}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewTransaction={() => handleOpenNewTransaction('expense')}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        onOpenRegisterModal={() => {
          setRegisterTriggerReason(undefined);
          setIsRegisterModalOpen(true);
        }}
        license={license}
      />
    </div>
  );
}
