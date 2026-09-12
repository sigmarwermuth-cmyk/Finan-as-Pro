import React from 'react';
import { ActiveTab, AppLicense } from '../types';
import { 
  LayoutDashboard, 
  ReceiptText, 
  CreditCard, 
  Plus, 
  Sparkles,
  Menu,
  Crown
} from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenNewTransaction: () => void;
  onOpenMobileMenu: () => void;
  onOpenRegisterModal: () => void;
  license: AppLicense;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenNewTransaction,
  onOpenMobileMenu,
  onOpenRegisterModal,
  license,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 lg:hidden safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'dashboard'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 mb-0.5 ${activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="text-[10px] tracking-tight">Início</span>
        </button>

        {/* Tab 2: Transações */}
        <button
          onClick={() => onTabChange('transactions')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'transactions'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ReceiptText className={`w-5 h-5 mb-0.5 ${activeTab === 'transactions' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="text-[10px] tracking-tight">Extrato</span>
        </button>

        {/* Central Floating Action Button (FAB): Add Transaction */}
        <div className="relative -top-4 flex items-center justify-center px-1">
          <button
            onClick={onOpenNewTransaction}
            id="btn_mobile_fab_new_tx"
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform border-2 border-[#0B0F19]"
            title="Nova Transação"
            aria-label="Nova Transação"
          >
            <Plus className="w-6 h-6 stroke-[3] text-slate-950" />
          </button>
        </div>

        {/* Tab 4: Contas & Cartões */}
        <button
          onClick={() => onTabChange('accounts')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'accounts'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className={`w-5 h-5 mb-0.5 ${activeTab === 'accounts' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="text-[10px] tracking-tight">Contas</span>
        </button>

        {/* Tab 5: Menu completo (Gaveta) */}
        <button
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
        >
          <Menu className="w-5 h-5 mb-0.5 text-slate-400" />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};
