import React, { useState, useRef } from 'react';
import { Account, Category, Transaction } from '../types';
import { Sparkles, Upload, FileText, Check, AlertCircle, Loader2, ArrowRight, X, Image as ImageIcon, Mic } from 'lucide-react';

interface AISmartAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransactions: (transactions: Omit<Transaction, 'id' | 'createdAt'>[]) => void;
  categories: Category[];
  accounts: Account[];
}

export const AISmartAddModal: React.FC<AISmartAddModalProps> = ({
  isOpen,
  onClose,
  onSaveTransactions,
  categories,
  accounts,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [rawSummary, setRawSummary] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessWithAI = async () => {
    if (!inputText.trim() && !selectedImage) {
      setError('Por favor, digite uma descrição ou anexe uma foto do comprovante.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setParsedData(null);

    try {
      const res = await fetch('/api/gemini/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textPrompt: inputText.trim(),
          imageBase64: selectedImage,
          imageMimeType: imageMime,
          availableCategories: categories.map((c) => c.name),
          availableAccounts: accounts.map((a) => a.name),
        }),
      });

      const data = await res.json();
      if (data.success && data.result?.transactions) {
        setParsedData(data.result.transactions);
        setRawSummary(data.result.rawSummary || '');
      } else {
        setError(data.error || 'Não foi possível extrair os dados. Tente descrever com mais detalhes.');
      }
    } catch (err: any) {
      setError(err?.message || 'Falha na conexão com o assistente de IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndSave = () => {
    if (!parsedData || parsedData.length === 0) return;

    const formattedList: Omit<Transaction, 'id' | 'createdAt'>[] = parsedData.map((item) => {
      // Find matching account or fallback to first
      const matchedAccount = accounts.find(
        (a) => a.name.toLowerCase().includes((item.account || '').toLowerCase()) ||
               (item.account || '').toLowerCase().includes(a.name.toLowerCase())
      ) || accounts[0];

      return {
        description: item.description || 'Lançamento IA',
        amount: Number(item.amount) || 0,
        type: item.type === 'income' ? 'income' : 'expense',
        category: item.category || 'Outras Despesas',
        date: item.date || new Date().toISOString().split('T')[0],
        paymentMethod: item.paymentMethod || 'pix',
        accountId: matchedAccount?.id || accounts[0]?.id || 'acc_default',
        status: 'completed',
        tags: item.tags || ['ia-scan'],
        notes: item.notes || (item.rawSummary ? `Extraído por IA: ${item.rawSummary}` : 'Lançado via IA Inteligente'),
      };
    });

    onSaveTransactions(formattedList);
    onClose();
  };

  const samplePrompts = [
    'Gastei R$ 68,50 no almoço no Outback no cartão de crédito',
    'Recebi R$ 1.800 de freelance no Nubank via Pix ontem',
    'Abasteci 150 reais de gasolina no posto Ipiranga',
    'Comprei remédios na Drogasil R$ 42,90 no débito',
  ];

  return (
    <div id="ai_smart_add_modal_overlay" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div id="ai_smart_add_modal_container" className="bg-[#0F1524] border-t sm:border border-slate-800/90 rounded-t-3xl sm:rounded-2xl w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800/80 bg-[#080B12]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Lançamento Inteligente com IA
              </h2>
              <p className="text-xs text-slate-400">
                Digite em linguagem natural ou anexe foto do cupom/comprovante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!parsedData ? (
            <>
              {/* Natural Text Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Descreva o que você gastou ou recebeu:
                </label>
                <textarea
                  rows={3}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ex: Paguei 85 reais no supermercado hoje à tarde no cartão nubank e 25 reais de farmácia..."
                  className="w-full bg-[#080B12] border border-slate-800 focus:border-emerald-500/50 rounded-xl p-3.5 text-white text-xs placeholder-slate-600 outline-none transition-all resize-none"
                />
              </div>

              {/* Sample Quick Chips */}
              <div>
                <span className="text-xs text-slate-400 block mb-2 font-medium">Exemplos rápidos:</span>
                <div className="flex flex-wrap gap-1.5">
                  {samplePrompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(p)}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[#080B12] hover:bg-slate-800/60 text-slate-300 hover:text-white border border-slate-800 transition-colors text-left"
                    >
                      "{p}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Receipt Image Upload */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Ou anexe uma foto de Nota Fiscal / Comprovante Pix:
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {selectedImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-[#080B12] p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedImage}
                        alt="Comprovante"
                        className="w-14 h-14 object-cover rounded-lg"
                      />
                      <div>
                        <p className="text-xs font-medium text-slate-200">Imagem selecionada</p>
                        <p className="text-[11px] text-emerald-400 font-semibold">Pronta para leitura com OCR IA</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 text-center cursor-pointer hover:bg-[#080B12]/60 transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-300">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-300">
                        Clique para anexar foto ou comprovante
                      </p>
                      <p className="text-[11px] text-slate-500">PNG, JPG, JPEG ou comprovante bancário</p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            /* Parsed Results Preview */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                <Check className="w-4 h-4 shrink-0" />
                <span>IA identificou <strong>{parsedData.length}</strong> transação(ões) com sucesso!</span>
              </div>

              <div className="space-y-3">
                {parsedData.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#080B12] border border-slate-800 rounded-xl flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{item.description}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            item.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {item.type === 'income' ? 'Receita' : 'Despesa'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Categoria: <strong className="text-slate-200">{item.category}</strong>
                          </span>
                        </div>
                      </div>
                      <span className={`text-base font-bold font-mono ${
                        item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {item.type === 'income' ? '+' : '-'} R$ {Number(item.amount).toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <div>
                        Data: <span className="text-slate-200">{item.date}</span>
                      </div>
                      <div>
                        Pagamento: <span className="text-slate-200 capitalize">{item.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800/80 bg-[#080B12]/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/50 transition-colors"
          >
            Cancelar
          </button>

          {!parsedData ? (
            <button
              type="button"
              id="ai_process_btn"
              disabled={isLoading}
              onClick={handleProcessWithAI}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando com Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Processar com IA
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors"
              >
                Voltar / Editar
              </button>
              <button
                type="button"
                id="ai_confirm_save_btn"
                onClick={handleConfirmAndSave}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Confirmar e Salvar Lançamento
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
