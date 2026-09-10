import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy initializer for Gemini client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Financial Advisor Endpoint (supports both route aliases)
app.post(["/api/gemini/advisor", "/api/gemini/financial-advice"], async (req, res) => {
  try {
    const body = req.body || {};
    const financialData = body.financialData || body;
    const {
      user = "Usuário",
      month = new Date().toISOString().slice(0, 7),
      income = 0,
      expenses = 0,
      netBalance = 0,
      savingsRate = 0,
      topCategories = [],
      rule503020,
      goalsCount = 0,
      goalsSaved = 0,
      recurringBillsCount = 0,
      summary,
      transactions,
      categories,
      budgets,
      goals
    } = financialData;

    const totalInc = income || summary?.totalIncome || 0;
    const totalExp = expenses || summary?.totalExpense || 0;
    const totalNet = netBalance ?? summary?.netBalance ?? (totalInc - totalExp);
    const saveRate = savingsRate || (totalInc > 0 ? Math.max(0, ((totalInc - totalExp) / totalInc) * 100) : 0);

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = getAi();
        const prompt = `Você é um Consultor Financeiro Pessoal certificado (CFP®) no Brasil.
Analise os seguintes dados financeiros do usuário para o mês ${month} e forneça um diagnóstico aprofundado, motivador e acionável em português do Brasil (BRL - R$).

DADOS DO USUÁRIO:
- Nome/Usuário: ${user}
- Mês de Referência: ${month}
- Receitas Totais: R$ ${Number(totalInc).toFixed(2)}
- Despesas Totais: R$ ${Number(totalExp).toFixed(2)}
- Saldo Líquido: R$ ${Number(totalNet).toFixed(2)}
- Taxa de Poupança: ${Number(saveRate).toFixed(1)}%
- Maiores Gastos por Categoria: ${JSON.stringify(topCategories || categories || [])}
- Divisão Orçamentária 50-30-20: ${JSON.stringify(rule503020 || {})}
- Metas Financeiras: ${JSON.stringify(goals || [])}
- Contas Recorrentes: ${recurringBillsCount} contas cadastradas
- Amostra de Transações: ${JSON.stringify((transactions || []).slice(0, 15))}

Responda OBRIGATORIAMENTE em formato JSON estrito com esta estrutura:
{
  "healthScore": number (0 a 100 com nota da saúde financeira),
  "healthStatus": string ("Excelente", "Muito Bom", "Estável", "Atenção", "Crítico"),
  "summary": string (resumo executivo do diagnóstico em 2 a 3 frases claras),
  "summaryHeadline": string (uma frase curta de impacto com a conclusão principal),
  "positives": [
    string,
    string,
    string
  ] (3 principais conquistas ou pontos fortes identificados),
  "warnings": [
    string,
    string
  ] (2 principais pontos de atenção ou alertas de gastos),
  "actionableSteps": [
    string,
    string,
    string
  ] (3 passos práticos, claros e prioritários para o usuário executar)
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.text || "{}";
        const parsed = JSON.parse(text);

        return res.json({
          success: true,
          healthScore: typeof parsed.healthScore === "number" ? parsed.healthScore : 75,
          healthStatus: parsed.healthStatus || (totalNet >= 0 ? "Muito Bom" : "Atenção"),
          summary: parsed.summary || parsed.summaryHeadline || `Sua taxa de poupança está em ${Number(saveRate).toFixed(1)}%. Saldo líquido de R$ ${Number(totalNet).toFixed(2)}.`,
          summaryHeadline: parsed.summaryHeadline || "Diagnóstico Financeiro Personalizado",
          positives: Array.isArray(parsed.positives) && parsed.positives.length > 0 
            ? parsed.positives 
            : ["Controle ativo de lançamentos e orçamentos", "Acompanhamento contínuo de fluxo de caixa"],
          warnings: Array.isArray(parsed.warnings) && parsed.warnings.length > 0 
            ? parsed.warnings 
            : ["Monitore despesas com alimentação fora e assinaturas"],
          actionableSteps: Array.isArray(parsed.actionableSteps) && parsed.actionableSteps.length > 0 
            ? parsed.actionableSteps 
            : [
                "Destinar 15% a 20% da renda diretamente para a Reserva de Emergência.",
                "Revisar orçamentos de categorias de maior consumo.",
                "Evitar novas parcelas no cartão de crédito este mês."
              ],
          ...parsed
        });
      } catch (geminiErr) {
        console.warn("Gemini API call encountered an issue, generating fallback diagnostic:", geminiErr);
      }
    }

    // Heuristic Smart Fallback if Gemini key is absent or offline
    let calculatedScore = 50;
    if (saveRate >= 20) calculatedScore += 25;
    else if (saveRate > 0) calculatedScore += 10;
    else calculatedScore -= 20;

    if (totalNet > 0) calculatedScore += 15;
    calculatedScore = Math.max(15, Math.min(98, Math.round(calculatedScore)));

    const topCat = topCategories?.[0] || { category: "Despesas Gerais", percentage: 30 };
    const topCatName = topCat.category || "Despesas Gerais";
    const topCatPct = topCat.percentage || 30;

    return res.json({
      success: true,
      healthScore: calculatedScore,
      healthStatus: calculatedScore >= 80 ? "Excelente" : calculatedScore >= 60 ? "Muito Bom" : "Atenção",
      summary: `Sua taxa de economia no momento é de ${saveRate.toFixed(1)}%. O maior volume de gastos está concentrado em ${topCatName} (${Number(topCatPct).toFixed(0)}% do total).`,
      summaryHeadline: calculatedScore >= 70 ? "Finanças equilibradas com capacidade de investimento" : "Ajustes necessários para fortalecer a reserva financeira",
      positives: [
        "Registro sistemático e controle de receitas e despesas",
        totalNet >= 0 ? "Saldo líquido do mês no azul, mantendo margem operacional" : "Identificação precisa de todas as saídas financeiras",
        goalsCount > 0 ? `${goalsCount} metas ativas cadastradas no planejamento` : "Estrutura pronta para alocação de reserva de emergência",
      ],
      warnings: [
        topCatPct > 35 ? `A categoria ${topCatName} consome ${Number(topCatPct).toFixed(0)}% do orçamento total` : "Mantenha atenção a pequenos gastos diários recorrentes",
        saveRate < 15 ? "Taxa de poupança abaixo do patamar ideal de 20% da renda" : "Cuidado com o acúmulo de parcelamentos nos cartões de crédito",
      ],
      actionableSteps: [
        "Destinar os primeiros 15% a 20% da receita diretamente para a Reserva de Emergência no dia do recebimento.",
        "Revisar serviços de assinatura e planos recorrentes para renegociação ou cancelamento.",
        "Estabelecer um teto semanal para despesas variáveis e compras discricionárias.",
      ],
    });
  } catch (error: any) {
    console.error("Error in financial advisor API:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Falha ao gerar relatório financeiro com IA",
    });
  }
});

// AI Smart Transaction Parser (Text or Receipt Image)
app.post("/api/gemini/parse-transaction", async (req, res) => {
  try {
    const { textPrompt, imageBase64, imageMimeType, availableCategories, availableAccounts } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = getAi();
        const parts: any[] = [];
        if (imageBase64) {
          parts.push({
            inlineData: {
              mimeType: imageMimeType || "image/jpeg",
              data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
            },
          });
        }

        const instructions = `Você é um assistente especialista em extrair dados de transações financeiras (comprovantes de pagamento, notas fiscais, cupons, extratos ou texto livre do usuário).
Categorias disponíveis no app: ${JSON.stringify(availableCategories || ["Alimentação", "Moradia", "Transporte", "Saúde", "Educação", "Lazer", "Compras", "Assinaturas", "Salário", "Investimentos", "Outros"])}.
Contas disponíveis: ${JSON.stringify(availableAccounts || ["Conta Corrente", "Carteira", "Nubank", "Inter", "Itaú", "Bradesco", "Reserva"])}.

Extraia ou interprete as transações e responda em JSON estrito:
{
  "transactions": [
    {
      "description": string (ex: "Supermercado Pão de Açúcar", "Almoço Restaurante"),
      "amount": number (sempre valor positivo, ex: 45.90),
      "type": "expense" | "income",
      "category": string (escolha a mais aderente da lista fornecida ou crie uma apropriada),
      "date": string (formato YYYY-MM-DD, se não especificado use a data atual ${new Date().toISOString().split("T")[0]}),
      "paymentMethod": "pix" | "credit_card" | "debit_card" | "cash" | "boleto" | "transfer",
      "account": string (escolha a mais apropriada),
      "notes": string,
      "tags": string[] (ex: ["mercado", "semanal"])
    }
  ],
  "confidence": number (0 a 100),
  "rawSummary": string
}`;

        if (textPrompt) {
          parts.push({ text: `Texto do usuário: "${textPrompt}"\n\n${instructions}` });
        } else {
          parts.push({ text: instructions });
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: { parts },
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsedText = response.text || "{}";
        const data = JSON.parse(parsedText);
        return res.json({ success: true, result: data });
      } catch (geminiErr) {
        console.warn("Gemini parse failed, attempting regex fallback:", geminiErr);
      }
    }

    // Heuristic Fallback parser for text if Gemini API is offline
    if (textPrompt) {
      const text = textPrompt;
      const amountMatch = text.match(/(?:R\$|\$|reais|valor de)?\s*(\d+[\.,]?\d*)/i);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 50;
      const isIncome = /recebi|salário|pix recebido|freelance|venda|depósito/i.test(text);

      let matchedCat = availableCategories?.[0] || 'Alimentação';
      if (/almoço|jantar|lanche|restaurante|outback|mcdonald|mercado|comida|supermercado|pão/i.test(text)) matchedCat = 'Alimentação';
      else if (/gasolina|posto|combustível|uber|99|táxi|passagem|ônibus|metrô/i.test(text)) matchedCat = 'Transporte';
      else if (/remédio|farmácia|drogasil|consulta|médico|exame/i.test(text)) matchedCat = 'Saúde';
      else if (/aluguel|condomínio|luz|água|internet|iptu/i.test(text)) matchedCat = 'Moradia';
      else if (/cinema|show|festa|jogo|viagem|lazer/i.test(text)) matchedCat = 'Lazer';
      else if (/netflix|spotify|amazon|assinatura/i.test(text)) matchedCat = 'Assinaturas';
      else if (isIncome) matchedCat = 'Salário';

      let matchedAcc = availableAccounts?.[0] || 'Conta Principal';
      if (/nubank/i.test(text)) matchedAcc = availableAccounts?.find((a: string) => /nubank/i.test(a)) || matchedAcc;
      if (/inter/i.test(text)) matchedAcc = availableAccounts?.find((a: string) => /inter/i.test(a)) || matchedAcc;
      if (/itaú|itau/i.test(text)) matchedAcc = availableAccounts?.find((a: string) => /itaú|itau/i.test(a)) || matchedAcc;

      let paymentMethod = 'pix';
      if (/crédito|cartão de crédito/i.test(text)) paymentMethod = 'credit_card';
      else if (/débito|cartão de débito/i.test(text)) paymentMethod = 'debit_card';
      else if (/dinheiro|espécie/i.test(text)) paymentMethod = 'cash';
      else if (/boleto/i.test(text)) paymentMethod = 'boleto';

      return res.json({
        success: true,
        result: {
          transactions: [
            {
              description: text.slice(0, 40),
              amount: isNaN(amount) ? 0 : amount,
              type: isIncome ? 'income' : 'expense',
              category: matchedCat,
              date: new Date().toISOString().split('T')[0],
              paymentMethod,
              account: matchedAcc,
              notes: 'Interpretado automaticamente',
              tags: ['smart-scan']
            }
          ],
          confidence: 85,
          rawSummary: text
        }
      });
    }

    res.status(400).json({
      success: false,
      error: "Por favor, forneça um texto ou imagem para processamento.",
    });
  } catch (error: any) {
    console.error("Error in parse transaction API:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Falha ao processar dados da transação com IA",
    });
  }
});

// AI Financial Chat Assistant
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, messages, contextData, userFinancialContext } = req.body;
    const financialContext = userFinancialContext || contextData || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = getAi();
        const systemInstruction = `Você é o Consultor Financeiro Virtual do aplicativo 'Controle Financeiro Pessoal'.
Seu objetivo é ajudar o usuário a tomar melhores decisões financeiras, economizar, investir com segurança (foco em renda fixa, tesouro direto, CDBs, reserva de emergência e regras como 50/30/20), sair de dívidas e planejar metas.
Responda de forma clara, educada, amigável e estruturada com formatação Markdown (negrito, tópicos, tabelas quando útil).

Contexto financeiro atual do usuário:
${JSON.stringify(financialContext, null, 2)}
`;

        const contents: any[] = [];
        if (messages && Array.isArray(messages)) {
          for (const msg of messages) {
            contents.push({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content || msg.text }],
            });
          }
        } else if (message) {
          contents.push({
            role: "user",
            parts: [{ text: message }],
          });
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: contents.length > 0 ? contents : [{ role: "user", parts: [{ text: "Olá! Como você pode me ajudar a organizar minhas finanças?" }] }],
          config: {
            systemInstruction,
          },
        });

        const reply = response.text || "Com base nos seus dados financeiros, recomendo manter a disciplina na reserva de emergência e nos limites de gastos.";
        return res.json({ success: true, reply });
      } catch (geminiErr) {
        console.warn("Gemini chat encountered an error, falling back to smart reply:", geminiErr);
      }
    }

    // Contextual Fallback Response
    const userPrompt = message || (messages && messages[messages.length - 1]?.content) || "";
    let reply = `Com base nas suas finanças atuais, seu saldo líquido é de **R$ ${Number(financialContext.netBalance || 0).toFixed(2)}** e sua taxa de poupança é de **${Number(financialContext.savingsRate || 0).toFixed(1)}%**.`;

    if (/cortar|economizar|reduzir/i.test(userPrompt)) {
      reply += `\n\n📌 **Dicas práticas para economizar:**\n1. **Revisar assinaturas:** Cancele serviços de streaming e apps recorrentes que não usou nos últimos 30 dias.\n2. **Alimentação fora de casa:** Estabeleça um teto semanal para refeições e delivery.\n3. **Regra das 24 horas:** Antes de qualquer compra não essencial acima de R$ 100, aguarde 24h para evitar o impulso.`;
    } else if (/reserva|emergência|emergencia/i.test(userPrompt)) {
      reply += `\n\n🎯 **Estratégia para Reserva de Emergência:**\n- O ideal é acumular entre **3 a 6 meses do seu custo de vida mensal** em aplicações de liquidez diária (como Tesouro Selic ou CDB 100% do CDI).\n- Automatize a transferência de 15% a 20% do seu salário assim que ele cair na conta.`;
    } else if (/50\/30\/20|regra/i.test(userPrompt)) {
      reply += `\n\n📊 **A Regra 50/30/20 explicada:**\n- **50% Necessidades:** Moradia, alimentação básica, saúde, transporte essencial.\n- **30% Desejos Pessoais:** Lazer, restaurantes, compras, passeios.\n- **20% Futuro & Dívidas:** Reserva de emergência, quitação de dívidas e investimentos.`;
    } else {
      reply += `\n\n💡 **Recomendação prioritária:** Mantenha os lançamentos diários atualizados e priorize atingir a sua primeira meta de reserva antes de assumir novos parcelamentos no cartão de crédito.`;
    }

    return res.json({ success: true, reply });
  } catch (error: any) {
    console.error("Error in financial chat API:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Erro no assistente financeiro",
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Controle Financeiro Server running on port ${PORT}`);
  });
}

startServer();
