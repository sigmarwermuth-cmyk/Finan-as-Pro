import React from 'react';
import { ActiveTab, AppSettings } from '../types';
import { getMonthNamePT } from '../lib/financialUtils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Plus, 
  Sparkles, 
  Menu, 
  Calendar,
  Bell
} from 'lucide-react';

interface HeaderProps {
  currentMonthKey: string;
  onMonthChange: (newMonthKey: string) => void;
  settings: AppSettings;
  onToggleHideValues: () => void;
  onOpenNewTransaction: () => void;
  onOpenAISmartAdd: () => void;
  onToggleMobileSidebar: () => void;
  activeTab: ActiveTab;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonthKey,
  onMonthChange,
  settings,
  onToggleHideValues,
  onOpenNewTransaction,
  onOpenAISmartAdd,
  onToggleMobileSidebar,
  activeTab,
}) => {
  const handlePrevMonth = () => {
    const [year, month] = currentMonthKey.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${y}-${m}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonthKey.split('-').map(Number);
    const date = new Date(year, month, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${y}-${m}`);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${y}-${m}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0B0F19]/85 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3 flex items-center justify-between transition-all">
      {/* Left: Mobile Menu & Month Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Month Picker Controls */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800/90 rounded-xl p-1 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleCurrentMonth}
            className="px-3 py-1 text-xs font-semibold text-slate-200 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            title="Voltar para o mês atual"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span className="capitalize">{getMonthNamePT(currentMonthKey)}</span>
          </button>

          <button
            onClick={handleNextMonth}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Quick Action Buttons & Privacy Mode */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Hide values toggle */}
        <button
          onClick={onToggleHideValues}
          className={`px-3 py-1.5 rounded-xl border transition-all text-xs font-medium flex items-center gap-1.5 ${
            settings.hideValues
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-slate-900/80 border-slate-800/80 text-slate-300 hover:text-white hover:border-slate-700'
          }`}
          title={settings.hideValues ? 'Mostrar valores' : 'Ocultar valores (Modo Privacidade)'}
        >
          {settings.hideValues ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Valores Ocultos</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Privacidade</span>
            </>
          )}
        </button>

        {/* AI Smart Add Button */}
        <button
          onClick={onOpenAISmartAdd}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 shadow-sm transition-all flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Lançar com IA</span>
        </button>

        {/* New Transaction Button */}
        <button
          onClick={onOpenNewTransaction}
          id="btn_header_new_transaction"
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span>Nova Transação</span>
        </button>
      </div>
    </header>
  );
};
