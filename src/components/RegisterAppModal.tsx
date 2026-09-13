import React, { useState } from 'react';
import { AppLicense } from '../types';
import { 
  validateLicenseKey, 
  maskLicenseKey,
  generatePixCopiaECola,
  generateKeyForDeviceId,
  PIX_CONFIG,
  FREE_LIMITS
} from '../lib/licenseUtils';
import { 
  Crown, 
  KeyRound, 
  Check, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Cpu, 
  AlertCircle,
  HelpCircle,
  Smartphone,
  CheckCircle2,
  Lock,
  Tag,
  Clock,
  Mail,
  Send,
  ArrowRight,
  MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegisterAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: AppLicense;
  onRegisterSuccess: (key: string, ownerName: string) => void;
  onUnregister: () => void;
  stats?: {
    transactionsCount: number;
    accountsCount: number;
    goalsCount: number;
  };
  triggerReason?: string;
  initialTab?: 'pix' | 'key' | 'benefits';
}

export const RegisterAppModal: React.FC<RegisterAppModalProps> = ({
  isOpen,
  onClose,
  license,
  onRegisterSuccess,
  onUnregister,
  stats,
  triggerReason,
  initialTab = 'pix',
}) => {
  const [activeTab, setActiveTab] = useState<'pix' | 'key' | 'benefits'>(initialTab);
  const [inputKey, setInputKey] = useState('');
  const [ownerName, setOwnerName] = useState(license.registeredTo || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPixKey, setCopiedPixKey] = useState(false);
  const [copiedPixCopiaECola, setCopiedPixCopiaECola] = useState(false);
  const [copiedDeviceId, setCopiedDeviceId] = useState(false);
  const [showKeyHelp, setShowKeyHelp] = useState(false);

  if (!isOpen) return null;

  const pixPayload = generatePixCopiaECola(PIX_CONFIG.price, 'FINPROFULL');
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(pixPayload)}`;

  const handleFormatKeyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setInputKey(val);
    setErrorMessage(null);
  };

  const handleValidateAndRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = validateLicenseKey(inputKey, license.deviceId);

    if (!result.isValid) {
      setErrorMessage(result.message);
      return;
    }

    const finalOwner = ownerName.trim() || 'Usuário Licenciado';
    onRegisterSuccess(inputKey.trim().toUpperCase(), finalOwner);
    setSuccessMessage('Aplicativo registrado com sucesso! Versão FULL Vitalícia desbloqueada.');
    
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1800);
  };

  const handleSendProofWhatsApp = () => {
    const priceFormatted = PIX_CONFIG.price.toFixed(2).replace('.', ',');
    const text = encodeURIComponent(
      `Olá Sigmar! Acabei de realizar o pagamento Pix de R$ ${priceFormatted} para a licença Full Vitalícia do Finanças Pro.\n\n👤 Nome: ${ownerName || 'Nome do Comprador'}\n💻 ID do Dispositivo: ${license.deviceId}\n\nSegue em anexo o comprovante do Pix. Aguardo o envio da minha chave de ativação!`
    );
    window.open(`https://wa.me/${PIX_CONFIG.supportWhatsApp}?text=${text}`, '_blank');
  };

  const handleSendProofEmail = () => {
    const priceFormatted = PIX_CONFIG.price.toFixed(2).replace('.', ',');
    const subject = encodeURIComponent(`Comprovante Pix Finanças Pro - ID: ${license.deviceId}`);
    const body = encodeURIComponent(
      `Olá Sigmar,\n\nAcabei de realizar o pagamento Pix de R$ ${priceFormatted} para a licença Full Vitalícia do Finanças Pro.\n\nNome: ${ownerName || 'Nome do Comprador'}\nID do Dispositivo: ${license.deviceId}\n\nEm anexo envio o comprovante do Pix. Por favor, envie minha chave de ativação.\n\nObrigado!`
    );
    window.open(`mailto:${PIX_CONFIG.supportEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(PIX_CONFIG.pixKey);
    setCopiedPixKey(true);
    setTimeout(() => setCopiedPixKey(false), 2000);
  };

  const handleCopyPixCopiaECola = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPixCopiaECola(true);
    setTimeout(() => setCopiedPixCopiaECola(false), 2000);
  };

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(license.deviceId);
    setCopiedDeviceId(true);
    setTimeout(() => setCopiedDeviceId(false), 2000);
  };

  const handleCopyKey = () => {
    if (license.licenseKey) {
      navigator.clipboard.writeText(license.licenseKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div 
      id="register_app_modal_overlay" 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div 
        id="register_app_modal_container" 
        className="bg-[#0F1524] border-t sm:border border-slate-800/90 rounded-t-3xl sm:rounded-2xl w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800/80 bg-[#080B12]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-inner">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  {license.isRegistered ? 'Licença do Aplicativo (FULL)' : 'Obter Versão Full Vitalícia'}
                </h2>
                {license.isRegistered ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ATIVADO
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    PIX R$ {PIX_CONFIG.price.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {license.isRegistered 
                  ? 'Todos os recursos e limites foram 100% liberados'
                  : 'Pague via Pix com liberação automática ou insira sua chave'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Reason trigger banner */}
          {triggerReason && !license.isRegistered && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-300">Limite da Versão Gratuita</p>
                <p className="text-xs text-slate-300 mt-0.5">{triggerReason}</p>
              </div>
            </div>
          )}

          {/* Success banner */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 stroke-[2.5]" />
              <div>
                <p className="text-xs font-bold text-emerald-300">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Already Registered State View */}
          {license.isRegistered ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#0C111E] to-[#0A0E18] border border-emerald-500/30 shadow-inner space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Licença Vitalícia Ativa
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    FULL ACCESS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#080B12]/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Titular da Licença</span>
                    <span className="font-semibold text-white truncate block">
                      {license.registeredTo || 'Usuário Registrado'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080B12]/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Data de Ativação</span>
                    <span className="font-semibold text-slate-200">
                      {license.registeredAt ? new Date(license.registeredAt).toLocaleDateString('pt-BR') : 'Hoje'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080B12]/80 border border-slate-800 sm:col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Chave de Ativação Registrada</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {maskLicenseKey(license.licenseKey)}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyKey}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                      title="Copiar chave"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Features Status */}
              <div className="p-4 rounded-xl bg-[#080B12] border border-slate-800/80 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Recursos Totalmente Desbloqueados
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                    <span>Lançamentos Ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                    <span>Contas & Cartões Sem Limites</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                    <span>Metas & Cofrinhos Ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                    <span>Consultor IA Completo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                    <span>Leitor OCR de Cupons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                    <span>Exportação & Backup JSON</span>
                  </div>
                </div>
              </div>

              {/* Unregister option */}
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-slate-400">Deseja transferir para outro dispositivo?</span>
                <button
                  onClick={() => {
                    if (confirm('Deseja desativar a licença deste aplicativo e voltar para o modo gratuito?')) {
                      onUnregister();
                    }
                  }}
                  className="text-rose-400 hover:text-rose-300 font-semibold hover:underline"
                >
                  Desvincular Licença
                </button>
              </div>
            </div>
          ) : (
            /* Registration Tabs & Flows */
            <div className="space-y-4">
              {/* Navigation Tabs */}
              <div className="flex rounded-xl bg-[#080B12] p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('pix')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'pix'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>⚡ Pagar com Pix</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('key')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'key'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Já Tenho Chave</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('benefits')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'benefits'
                      ? 'bg-slate-700 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Recursos Full</span>
                </button>
              </div>

              {/* TAB 1: PIX PAYMENT */}
              {activeTab === 'pix' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Offer Price Highlight Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0A111E] to-[#0A111E] border border-emerald-500/30 shadow-md flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          LICENÇA VITALÍCIA
                        </span>
                        <span className="text-[11px] text-slate-400">Pagamento Único</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-white font-mono">
                          R$ {PIX_CONFIG.price.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-xs text-emerald-400 font-bold">Sem mensalidades</span>
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-slate-400 block">Liberação</span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" /> Imediata
                      </span>
                    </div>
                  </div>

                  {/* Pix QR Code & Payment Data Box */}
                  <div className="p-4 rounded-2xl bg-[#080B12] border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Dynamic QR Code display */}
                      <div className="p-2.5 rounded-xl bg-white flex flex-col items-center justify-center shrink-0 shadow-lg border border-slate-300">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code Pix" 
                          className="w-32 h-32 object-contain"
                          onError={(e) => {
                            // Fallback in case of external network blockage
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="text-[9px] font-bold text-slate-900 mt-1 uppercase tracking-tight">
                          Escaneie no app do banco
                        </span>
                      </div>

                      {/* Pix Key Details & Copy Action */}
                      <div className="flex-1 w-full space-y-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Chave Pix ({PIX_CONFIG.keyType})</span>
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 mt-0.5">
                            <span className="font-mono font-bold text-emerald-400 text-xs truncate select-all">
                              {PIX_CONFIG.pixKey}
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyPixKey}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0 ml-2"
                            >
                              {copiedPixKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedPixKey ? 'Copiado!' : 'Copiar Chave'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 block">Beneficiário</span>
                            <span className="font-medium text-slate-200">{PIX_CONFIG.receiverName}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 block">Valor</span>
                            <span className="font-bold text-emerald-400">R$ {PIX_CONFIG.price.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyPixCopiaECola}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedPixCopiaECola ? 'Código Pix Copiado!' : 'Copiar Código Pix Copia e Cola'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step by step Instructions for Pix */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                    <h5 className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Como funciona a ativação após o Pix:
                    </h5>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                      <li>Faça o Pix de <strong className="text-emerald-400">R$ {PIX_CONFIG.price.toFixed(2).replace('.', ',')}</strong> usando o QR Code ou Chave acima.</li>
                      <li>Envie o comprovante e seu <strong className="text-white font-mono">ID: {license.deviceId}</strong> pelo WhatsApp <strong className="text-emerald-400">{PIX_CONFIG.supportWhatsAppFormatted}</strong>.</li>
                      <li>Você receberá sua <strong className="text-emerald-400">Chave de Ativação Oficial</strong> para desbloquear a versão Full permanente.</li>
                    </ol>
                  </div>

                  {/* Actions: Send Proof via WhatsApp/Email & Go to Insert Key */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      id="btn_send_proof_whatsapp"
                      onClick={handleSendProofWhatsApp}
                      className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-400 transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4 stroke-[2.5]" />
                      <span>Enviar Comprovante pelo WhatsApp ({PIX_CONFIG.supportWhatsAppFormatted})</span>
                    </button>

                    <button
                      type="button"
                      id="btn_go_to_key_tab"
                      onClick={() => setActiveTab('key')}
                      className="w-full py-2.5 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
                    >
                      <KeyRound className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                      <span>Já Recebi Minha Chave de Ativação → Inserir Chave</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendProofEmail}
                      className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ou enviar por E-mail ({PIX_CONFIG.supportEmail})</span>
                    </button>

                    <p className="text-[10px] text-slate-400 text-center pt-1">
                      A ativação é concluída mediante a inserção da chave oficial fornecida após a confirmação do pagamento.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: REGISTER EXISTING KEY */}
              {activeTab === 'key' && (
                <form onSubmit={handleValidateAndRegister} className="space-y-4 animate-fadeIn">
                  {/* Device ID Card */}
                  <div className="p-3.5 rounded-xl bg-[#080B12] border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">ID do Dispositivo / Instalação</span>
                        <span className="text-xs font-mono font-bold text-slate-200">{license.deviceId}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyDeviceId}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                    >
                      {copiedDeviceId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedDeviceId ? 'Copiado' : 'Copiar ID'}</span>
                    </button>
                  </div>

                  {/* License Key Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        Código de Licença / Ativação
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowKeyHelp(!showKeyHelp)}
                        className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Formato do código</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      id="license_key_input"
                      required
                      value={inputKey}
                      onChange={handleFormatKeyInput}
                      placeholder="Ex: FINPRO-XXXX-XXXX-XXXX"
                      className="w-full bg-[#080B12] border border-slate-800 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-sm placeholder-slate-600 outline-none uppercase tracking-wider transition-all"
                    />

                    {/* Device-bound key generator shortcut for testing/demonstration */}
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          const validKey = generateKeyForDeviceId(license.deviceId);
                          setInputKey(validKey);
                          setErrorMessage(null);
                        }}
                        className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors hover:underline"
                        title="Preencher a chave única correspondente a este ID"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Preencher Chave Vinculada a este Dispositivo (Teste)</span>
                      </button>
                    </div>

                    {errorMessage && (
                      <p className="text-xs text-rose-400 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errorMessage}
                      </p>
                    )}
                  </div>

                  {/* Owner Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      Nome do Titular
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Ex: Seu Nome Completo"
                      className="w-full bg-[#080B12] border border-slate-800 focus:border-amber-500/50 rounded-xl px-4 py-2 text-white text-xs outline-none"
                    />
                  </div>

                  {/* Instructions */}
                  {showKeyHelp && (
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 animate-fadeIn">
                      <p className="font-bold text-amber-300">Validação Estrita por Dispositivo:</p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        A licença é calculada matematicamente usando o <strong className="text-white font-mono">ID: {license.deviceId}</strong> deste aparelho. Códigos antigos, chaves mestras ou chaves de outros aparelhos serão rejeitados.
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      id="btn_submit_license_register"
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
                    >
                      <Crown className="w-4 h-4 text-slate-950" />
                      <span>Validar e Ativar Versão Full</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: BENEFITS COMPARISON */}
              {activeTab === 'benefits' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-xl bg-[#080B12] border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white">Recursos do Aplicativo</span>
                      <div className="flex gap-6 text-[11px] font-bold">
                        <span className="text-slate-400">Gratuito</span>
                        <span className="text-emerald-400">Full Pro (Pix)</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Lançamentos no Extrato</span>
                        <div className="flex gap-6 font-mono text-[11px]">
                          <span className="text-slate-400 w-14 text-center">Máx {FREE_LIMITS.maxTransactions}</span>
                          <span className="text-emerald-400 font-bold w-14 text-center">Ilimitado</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Contas Bancárias & Cartões</span>
                        <div className="flex gap-6 font-mono text-[11px]">
                          <span className="text-slate-400 w-14 text-center">Máx {FREE_LIMITS.maxAccounts}</span>
                          <span className="text-emerald-400 font-bold w-14 text-center">Ilimitado</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Metas Financeiras & Cofrinhos</span>
                        <div className="flex gap-6 font-mono text-[11px]">
                          <span className="text-slate-400 w-14 text-center">Máx {FREE_LIMITS.maxGoals}</span>
                          <span className="text-emerald-400 font-bold w-14 text-center">Ilimitado</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Consultor Financeiro com IA</span>
                        <div className="flex gap-6 font-mono text-[11px]">
                          <span className="text-slate-400 w-14 text-center">Básico</span>
                          <span className="text-emerald-400 font-bold w-14 text-center">Completo</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Leitor OCR de Cupons e Notas</span>
                        <div className="flex gap-6 font-mono text-[11px]">
                          <span className="text-slate-500 w-14 text-center">—</span>
                          <span className="text-emerald-400 font-bold w-14 text-center">Incluído</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Exportação de Dados & Backup</span>
                        <div className="flex gap-6 font-mono text-[11px]">
                          <span className="text-slate-500 w-14 text-center">—</span>
                          <span className="text-emerald-400 font-bold w-14 text-center">Incluído</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('pix')}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Ir para Pagamento Pix (R$ {PIX_CONFIG.price.toFixed(2).replace('.', ',')})</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800/80 bg-[#080B12]/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp: {PIX_CONFIG.supportWhatsAppFormatted}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400">
              {PIX_CONFIG.supportEmail}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
