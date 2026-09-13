import React from 'react';
import { createPortal } from 'react-dom';
import { ActiveTab, AppLicense, AppSettings } from '../types';
import { 
  LayoutDashboard, 
  ReceiptText, 
  PieChart, 
  Target, 
  CreditCard, 
  CalendarDays, 
  Sparkles, 
  Settings, 
  ShieldCheck, 
  X,
  Wallet,
  Crown
} from 'lucide-react';
import { formatCurrency } from '../lib/financialUtils';
import { FREE_LIMITS, PIX_CONFIG } from '../lib/licenseUtils';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  netBalance: number;
  settings: AppSettings;
  license: AppLicense;
  onOpenRegisterModal: () => void;
  transactionCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
  netBalance,
  settings,
  license,
  onOpenRegisterModal,
  transactionCount = 0,
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

  const usagePercent = Math.min(100, Math.round((transactionCount / FREE_LIMITS.maxTransactions) * 100));

  const renderContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full bg-[#0C101B]">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
            <Wallet className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1">
              Finanças<span className="text-emerald-400">Pro</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400">
              {license.isRegistered ? 'Versão FULL Vitalícia' : 'Gestão Inteligente'}
            </p>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={onCloseMobile}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
            title="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4.5 h-4.5 transition-transform group-hover:scale-105 ${
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
      <div className="p-4 mx-3 mb-2 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0A0E18] border border-slate-800/80 shadow-sm shrink-0">
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

      {/* App License Status Box */}
      <div className="mx-3 mb-3 shrink-0">
        {license.isRegistered ? (
          <div 
            onClick={() => {
              onOpenRegisterModal();
              onCloseMobile();
            }}
            className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-[#0A0E18] border border-emerald-500/30 hover:border-emerald-500/50 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white">Versão FULL</span>
                  <Crown className="w-3 h-3 text-amber-400" />
                </div>
                <p className="text-[10px] text-emerald-400/90 font-medium">Licença Vitalícia Ativa</p>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-emerald-300 transition-colors">
              Ver →
            </span>
          </div>
        ) : (
          <div 
            onClick={() => {
              onOpenRegisterModal();
              onCloseMobile();
            }}
            className="p-3.5 rounded-xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-[#080B12] border border-amber-500/30 hover:border-amber-400/60 cursor-pointer transition-all space-y-2 group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-white">Versão Gratuita</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-semibold">
                {transactionCount}/{FREE_LIMITS.maxTransactions}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  usagePercent >= 90 ? 'bg-rose-500' : usagePercent >= 60 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-slate-400">Lançamentos</span>
              <span className="text-[10px] font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-0.5">
                ⚡ Pix R$ {PIX_CONFIG.price.toFixed(2).replace('.', ',')} →
              </span>
            </div>
          </div>
        )}
      </div>

      {/* User Card */}
      <div className="p-3.5 mx-3 mb-3 border-t border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-emerald-400 shadow-inner shrink-0">
            {settings.userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{settings.userName}</p>
            <p className="text-[10px] text-slate-400 truncate">
              {license.isRegistered ? 'Plano Full Pro' : 'Plano Gratuito'}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleNavClick('settings')}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          title="Abrir configurações"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar (Visible only on lg and larger) */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-[#0C101B] border-r border-slate-800/80 sticky top-0 h-screen overflow-hidden">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer via Portal attached to document.body (Bypasses any overflow/clipping constraints) */}
      {isOpenMobile && createPortal(
        <div className="fixed inset-0 z-[9999] lg:hidden flex items-stretch w-full h-full h-[100dvh] overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onCloseMobile();
            }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fadeIn cursor-pointer"
          />

          {/* Slide-over Drawer */}
          <aside 
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-80 max-w-[85vw] h-full min-h-full bg-[#0C101B] border-r border-slate-800/80 flex flex-col shadow-2xl animate-slideInLeft overflow-hidden"
          >
            {renderContent(true)}
          </aside>
        </div>,
        document.body
      )}
    </>
  );
};
