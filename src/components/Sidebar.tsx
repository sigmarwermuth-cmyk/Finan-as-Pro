import React from 'react';
import { ActiveTab, AppSettings } from '../types';
import { 
  LayoutDashboard, 
  ReceiptText, 
  PieChart, 
  Target, 
  CreditCard, 
  CalendarDays, 
  Sparkles, 
  Settings, 
  TrendingUp, 
  ShieldCheck, 
  X,
  Wallet
} from 'lucide-react';
import { formatCurrency } from '../lib/financialUtils';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  netBalance: number;
  settings: AppSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
  netBalance,
  settings,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as ActiveTab, label: 'Transações', icon: ReceiptText },
    { id: 'budgets' as ActiveTab, label: 'Orçamentos', icon: PieChart },
    { id: 'goals' as ActiveTab, label: 'Metas & Cofrinhos', icon: Target },
    { id: 'accounts' as ActiveTab, label: 'Contas & Cartões', icon: CreditCard },
    { id: 'cashflow' as ActiveTab, label: 'Fluxo & Vencimentos', icon: CalendarDays },
    { id: 'ai_advisor' as ActiveTab, label: 'Consultor Financeiro IA', icon: Sparkles, badge: 'IA' },
    { id: 'settings' as ActiveTab, label: 'Configurações & Backup', icon: Settings },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-72 bg-[#0C101B] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
              <Wallet className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1">
                Finanças<span className="text-emerald-400">Pro</span>
              </h1>
              <p className="text-[11px] font-medium text-slate-400">Gestão Inteligente</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar_nav_${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-emerald-400' : item.id === 'ai_advisor' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Balance Summary Box */}
        <div className="p-4 mx-3 mb-3 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0A0E18] border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400">Patrimônio Atual</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-base font-bold font-mono tabular-nums text-white tracking-tight">
            {formatCurrency(netBalance, settings.currency, settings.hideValues)}
          </p>
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Análise da IA</span>
            <button
              onClick={() => handleNavClick('ai_advisor')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5 transition-colors"
            >
              Relatório →
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3.5 mx-3 mb-3 border-t border-slate-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-emerald-400 shadow-inner">
            {settings.userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{settings.userName}</p>
            <p className="text-[10px] text-slate-400 truncate">FinançasPro</p>
          </div>
        </div>
      </aside>
    </>
  );
};
