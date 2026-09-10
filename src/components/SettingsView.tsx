import React, { useState } from 'react';
import { AppLicense, AppSettings, Category } from '../types';
import { downloadFile } from '../lib/financialUtils';
import { maskLicenseKey, PIX_CONFIG } from '../lib/licenseUtils';
import { DynamicIcon } from './DynamicIcon';
import { 
  Settings, 
  User, 
  ShieldCheck, 
  Download, 
  Upload, 
  RotateCcw, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  Tags,
  DollarSign,
  Eye,
  EyeOff,
  Crown,
  KeyRound,
  Cpu,
  Smartphone,
  Zap,
  Sparkles,
  Tag
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  license: AppLicense;
  categories: Category[];
  allAppData: any;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenRegisterModal: () => void;
  onSaveCategory: (category: Omit<Category, 'id'>, editingId?: string) => void;
  onDeleteCategory: (id: string) => void;
  onImportBackup: (importedData: any) => void;
  onResetData: () => void;
  onClearTransactions?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  license,
  categories,
  allAppData,
  onUpdateSettings,
  onOpenRegisterModal,
  onSaveCategory,
  onDeleteCategory,
  onImportBackup,
  onResetData,
  onClearTransactions,
}) => {
  const [userNameInput, setUserNameInput] = useState(settings.userName);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Category Modal state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');
  const [catColor, setCatColor] = useState('#10b981');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catBudget, setCatBudget] = useState('500');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ userName: userNameInput });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(allAppData, null, 2);
    downloadFile(dataStr, `financas_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.transactions && json.accounts && json.categories) {
          onImportBackup(json);
          alert('Backup importado com sucesso!');
        } else {
          alert('Formato de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleOpenNewCat = () => {
    setEditingCat(null);
    setCatName('');
    setCatType('expense');
    setCatColor('#10b981');
    setCatIcon('Tag');
    setCatBudget('500');
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatColor(cat.color);
    setCatIcon(cat.icon);
    setCatBudget((cat.monthlyBudget || 0).toString());
    setIsCatModalOpen(true);
  };

  const handleSaveCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    onSaveCategory({
      name: catName.trim(),
      type: catType,
      color: catColor,
      icon: catIcon,
      monthlyBudget: parseFloat(catBudget) || 0,
      isDefault: false,
    }, editingCat?.id);

    setIsCatModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Configurações & Backup</h2>
        <p className="text-xs text-slate-400">Personalize suas preferências, gerencie categorias, controle seus dados locais e sua licença</p>
      </div>

      {/* App License & Registration Section */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0F1524] via-[#0D1220] to-[#0A0E18] border border-slate-800/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner shrink-0 ${
              license.isRegistered 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            }`}>
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white">Licenciamento & Registro do App</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  license.isRegistered
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {license.isRegistered ? 'VERSÃO FULL ATIVA' : 'VERSÃO GRATUITA'}
                </span>
                {!license.isRegistered && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ⚡ R$ {PIX_CONFIG.price.toFixed(2).replace('.', ',')} no Pix
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {license.isRegistered
                  ? 'Licença vitalícia ativada. Lançamentos, contas, metas e IA sem limitações.'
                  : 'Obtenha a Versão Full com liberação instantânea via Pix ou insira seu código de ativação.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {license.isRegistered ? (
              <button
                onClick={onOpenRegisterModal}
                id="btn_settings_open_register"
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Gerenciar Licença</span>
              </button>
            ) : (
              <>
                <button
                  onClick={onOpenRegisterModal}
                  id="btn_settings_open_pix"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Pagar com Pix (R$ {PIX_CONFIG.price.toFixed(2).replace('.', ',')})</span>
                </button>

                <button
                  onClick={onOpenRegisterModal}
                  id="btn_settings_open_register"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inserir Chave</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#080B12]/90 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-1">Status do Plano</span>
            <span className={`text-xs font-bold ${license.isRegistered ? 'text-emerald-400' : 'text-amber-400'}`}>
              {license.isRegistered ? 'Vitalício • Full Access' : 'Gratuito (Trial)'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#080B12]/90 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-1">ID do Dispositivo</span>
            <span className="text-xs font-mono font-semibold text-slate-200 truncate block">
              {license.deviceId}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#080B12]/90 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-1">Chave Registrada</span>
            <span className="text-xs font-mono font-semibold text-slate-300 truncate block">
              {license.isRegistered ? maskLicenseKey(license.licenseKey) : 'Não registrada'}
            </span>
          </div>
        </div>
      </div>

      {/* User Preferences Form */}
      <div className="p-6 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" />
          Perfil & Preferências
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Seu Nome / Apelido</label>
              <input
                type="text"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Moeda Padrão</label>
              <select
                value={settings.currency}
                onChange={(e) => onUpdateSettings({ currency: e.target.value as any })}
                className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none"
              >
                <option value="BRL">Real Brasileiro (R$ - BRL)</option>
                <option value="USD">Dólar Americano ($ - USD)</option>
                <option value="EUR">Euro (€ - EUR)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.hideValues}
                onChange={(e) => onUpdateSettings({ hideValues: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 bg-[#080B12] border-slate-800 accent-emerald-400"
              />
              <span>Modo Privacidade (Ocultar valores na tela)</span>
            </label>

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              {savedFeedback ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : null}
              <span>{savedFeedback ? 'Salvo!' : 'Salvar Perfil'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Categories Management */}
      <div className="p-6 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tags className="w-4 h-4 text-emerald-400" />
              Categorias ({categories.length})
            </h3>
            <p className="text-xs text-slate-400">Adicione ou edite cores, ícones e orçamentos de cada categoria</p>
          </div>

          <button
            onClick={handleOpenNewCat}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nova Categoria</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-3 rounded-xl bg-[#080B12]/80 border border-slate-800/70 flex items-center justify-between hover:border-slate-700/80 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5 shadow-inner"
                >
                  <DynamicIcon name={cat.icon} className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{cat.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize">
                    {cat.type === 'income' ? 'Receita' : 'Despesa'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEditCat(cat)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800/60"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {!cat.isDefault && (
                  <button
                    onClick={() => {
                      if (confirm(`Excluir categoria "${cat.name}"?`)) onDeleteCategory(cat.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800/60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backup and Data Management */}
      <div className="p-6 rounded-2xl bg-[#0F1524]/90 border border-slate-800/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Gerenciamento de Dados & Backup
        </h3>
        <p className="text-xs text-slate-400">
          Seus dados ficam salvos com segurança no seu navegador. Exporte backups regulares em JSON ou restaure quando precisar.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar Backup (JSON)</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Importar Backup (JSON)</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          {onClearTransactions && (
            <button
              onClick={() => {
                if (confirm('Deseja realmente apagar todos os lançamentos do extrato? Suas contas e categorias serão mantidas.')) {
                  onClearTransactions();
                }
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-500/20 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-amber-400" />
              <span>Limpar Todos os Lançamentos</span>
            </button>
          )}

          <button
            onClick={() => {
              if (confirm('Deseja resetar todos os dados do aplicativo para o estado inicial limpo?')) {
                onResetData();
              }
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 transition-colors flex items-center gap-2 ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Limpar App do Zero</span>
          </button>
        </div>
      </div>

      {/* Category Edit Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0F1524] border border-slate-800/90 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              {editingCat ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>

            <form onSubmit={handleSaveCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tipo</label>
                  <select
                    value={catType}
                    onChange={(e) => setCatType(e.target.value as any)}
                    className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Limite Orçado (R$)</label>
                  <input
                    type="number"
                    value={catBudget}
                    onChange={(e) => setCatBudget(e.target.value)}
                    className="w-full bg-[#080B12] border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-sm"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

