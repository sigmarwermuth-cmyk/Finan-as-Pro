import React, { useState, useEffect } from 'react';
import { Account, AppSettings, Category, FinancialGoal, RecurringBill, Transaction } from '../types';
import { 
  calculateCategoryExpenses, 
  calculateRule503020, 
  calculateSummary, 
  formatCurrency 
} from '../lib/financialUtils';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Lightbulb, 
  CheckCircle2, 
  Zap,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AIAdvisorViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  goals: FinancialGoal[];
  recurringBills: RecurringBill[];
  currentMonthKey: string;
  settings: AppSettings;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAdvisorView: React.FC<AIAdvisorViewProps> = ({
  transactions,
  categories,
  accounts,
  goals,
  recurringBills,
  currentMonthKey,
  settings,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: `Olá, ${settings.userName}! Sou seu **Consultor Financeiro Pessoal com Inteligência Artificial**. Analisei seus dados de ${currentMonthKey}. Você pode me fazer perguntas sobre onde economizar, como atingir suas metas ou estratégias para otimizar seus orçamentos.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Automated AI Diagnostic state
  const [aiReport, setAiReport] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const monthSummary = calculateSummary(transactions, currentMonthKey);
  const categoryExpenses = calculateCategoryExpenses(transactions, currentMonthKey);
  const rule503020 = calculateRule503020(transactions, currentMonthKey);

  // Calculate dynamic Health Score (0-100)
  let calculatedScore = 50;
  if (monthSummary.savingsRate >= 20) calculatedScore += 25;
  else if (monthSummary.savingsRate > 0) calculatedScore += 10;
  else calculatedScore -= 20;

  if (monthSummary.netBalance > 0) calculatedScore += 15;
  if (rule503020.necessities.actualPct <= 55) calculatedScore += 10;
  calculatedScore = Math.max(10, Math.min(98, calculatedScore));

  const fetchAIReport = async () => {
    setIsLoadingReport(true);
    setReportError(null);

    const snapshot = {
      user: settings.userName,
      month: currentMonthKey,
      income: monthSummary.totalIncome,
      expenses: monthSummary.totalExpense,
      netBalance: monthSummary.netBalance,
      savingsRate: monthSummary.savingsRate,
      topCategories: categoryExpenses.categories.slice(0, 5),
      rule503020,
      goalsCount: goals.length,
      goalsSaved: goals.reduce((s, g) => s + g.currentAmount, 0),
      recurringBillsCount: recurringBills.length,
    };

    try {
      const res = await fetch('/api/gemini/financial-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialData: snapshot }),
      });

      if (!res.ok) throw new Error('Erro ao gerar relatório com IA');
      const data = await res.json();
      setAiReport(data);
    } catch (err: any) {
      console.error(err);
      // Fallback local insightful analysis if offline or backend key not yet populated
      setAiReport({
        healthScore: calculatedScore,
        summary: `Sua taxa de economia no momento é de ${monthSummary.savingsRate.toFixed(1)}%. O maior volume de gastos está concentrado em ${categoryExpenses.categories[0]?.category || 'despesas gerais'}.`,
        positives: [
          'Controle ativo e registro sistemático das despesas e receitas.',
          'Saldo líquido positivo com margem para investimentos.',
          'Metas financeiras configuradas com acompanhamento de progresso.',
        ],
        warnings: [
          categoryExpenses.categories[0]?.percentage > 40
            ? `A categoria ${categoryExpenses.categories[0]?.category} representa ${categoryExpenses.categories[0]?.percentage.toFixed(0)}% de todos os seus gastos.`
            : 'Mantenha vigilância nos gastos com delivery e assinaturas não utilizadas.',
        ],
        actionableSteps: [
          'Destinar os primeiros 15% a 20% da receita diretamente para a Reserva de Emergência no dia do recebimento.',
          'Revisar serviços de assinatura e planos recorrentes para renegociação.',
          'Estabelecer um teto semanal para despesas variáveis como lazer e alimentação fora de casa.',
        ],
      });
    } finally {
      setIsLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchAIReport();
  }, [currentMonthKey]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || isSendingChat) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setIsSendingChat(true);

    const snapshot = {
      user: settings.userName,
      income: monthSummary.totalIncome,
      expenses: monthSummary.totalExpense,
      netBalance: monthSummary.netBalance,
      savingsRate: monthSummary.savingsRate,
      topExpenses: categoryExpenses.categories.slice(0, 4),
      goals: goals.map(g => ({ title: g.title, current: g.currentAmount, target: g.targetAmount })),
    };

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          contextData: snapshot,
        }),
      });

      if (!res.ok) throw new Error('Erro na resposta do chat');
      const data = await res.json();

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply || 'Entendido. Com base nos seus números, recomendo manter o foco no corte de supérfluos.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `Com base no seu saldo atual de ${formatCurrency(monthSummary.netBalance, settings.currency)}, recomendo direcionar ao menos 20% para a reserva de emergência antes de despesas discricionárias.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const quickPrompts = [
    'Onde posso cortar 15% das despesas este mês?',
    'Como atingir minha Reserva de Emergência mais rápido?',
    'Minha proporção 50/30/20 está saudável?',
    'Estratégia para evitar compras por impulso',
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Consultor IA & Diagnóstico
          </h2>
          <p className="text-xs text-slate-400">
            Inteligência Artificial que analisa seu comportamento financeiro e recomenda melhorias
          </p>
        </div>

        <button
          onClick={fetchAIReport}
          disabled={isLoadingReport}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#0F1524] hover:bg-slate-800/80 border border-slate-800 transition-all flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReport ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Atualizar Diagnóstico</span>
        </button>
      </div>

      {/* AI Diagnostic Dashboard Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0F1524] via-[#0F1524] to-[#0B0F19] border border-emerald-500/20 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-2xl bg-[#080B12] border border-slate-800 flex flex-col items-center justify-center shadow-inner">
              <span className="text-2xl font-black font-mono tabular-nums text-emerald-400">
                {aiReport?.healthScore || calculatedScore}
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-500">Score / 100</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Score de Saúde Financeira</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {calculatedScore >= 80 ? 'Excelente' : calculatedScore >= 60 ? 'Saudável' : 'Atenção'}
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
                {aiReport?.summary || 'Calculando diagnóstico personalizado baseado nos seus lançamentos e orçamentos...'}
              </p>
            </div>
          </div>
        </div>

        {/* 3 Columns: Positives, Warnings, Action Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Positives */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Pontos Fortes
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(aiReport?.positives || [
                'Taxa de economia positiva no mês',
                'Metas financeiras em andamento',
              ]).map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 text-xs font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Warnings */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Pontos de Atenção
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(aiReport?.warnings || [
                'Vigilância com limites de cartões e faturas',
              ]).map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-400 text-xs font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actionable Steps */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-2">
            <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              Próximos Passos
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(aiReport?.actionableSteps || [
                'Poupar ao menos 20% da renda líquida',
                'Ajustar limites de despesas variáveis',
              ]).map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-blue-400 text-xs font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Chat Assistant Container */}
      <div className="bg-[#0F1524]/90 border border-slate-800/80 rounded-2xl shadow-sm flex flex-col h-[520px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#080B12]/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md">
              <Bot className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Assistente Financeiro IA</h3>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online e pronto para responder dúvidas
              </p>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isBot = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isBot ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-white'
                  }`}
                >
                  {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed space-y-1 ${
                    isBot
                      ? 'bg-[#080B12] border border-slate-800/80 text-slate-200'
                      : 'bg-emerald-400 text-slate-950 font-semibold shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className="block text-[9px] opacity-60 text-right">{msg.timestamp}</span>
                </div>
              </div>
            );
          })}

          {isSendingChat && (
            <div className="flex gap-3 mr-auto">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#080B12] border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                <span>Analisando suas finanças...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts Carousel */}
        <div className="p-2 border-t border-slate-800/80 bg-[#080B12]/60 flex items-center gap-2 overflow-x-auto">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800/80 bg-[#080B12]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Pergunte ao seu consultor financeiro IA..."
              className="flex-1 bg-[#0F1524] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-white text-xs outline-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSendingChat}
              className="p-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all shadow-sm"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
