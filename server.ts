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

// AI Financial Advisor Endpoint
app.post("/api/gemini/advisor", async (req, res) => {
  try {
    const { summary, transactions, categories, budgets, goals } = req.body;
    const ai = getAi();

    const prompt = `Você é um Consultor Financeiro Pessoal certificado e experiente (CFP®).
Analise os seguintes dados financeiros do usuário e forneça um diagnóstico financeiro aprofundado, prático, motivador e acionável em português do Brasil (BRL - R$).

DADOS DO USUÁRIO:
- Resumo Financeiro Geral: ${JSON.stringify(summary, null, 2)}
- Orçamentos por Categoria: ${JSON.stringify(budgets, null, 2)}
- Metas Financeiras: ${JSON.stringify(goals, null, 2)}
- Despesas por Categoria: ${JSON.stringify(categories, null, 2)}
- Últimas Transações Relevantes: ${JSON.stringify(transactions?.slice(0, 25), null, 2)}

Sua resposta deve ser estruturada em formato JSON estrito com os seguintes campos:
{
  "healthScore": number (0 a 100 indicando a nota da saúde financeira),
  "healthStatus": string ("Excelente", "Muito Bom", "Estável", "Atenção", "Crítico"),
  "summaryHeadline": string (frase de impacto com o diagnóstico principal),
  "keyInsights": [
    {
      "type": "positive" | "warning" | "opportunity",
      "title": string,
      "description": string,
      "impact": string
    }
  ],
  "spendingLeaks": [
    {
      "category": string,
      "issue": string,
      "recommendation": string,
      "potentialMonthlySavings": number
    }
  ],
  "budgetAdvice": [
    {
      "category": string,
      "currentSpent": number,
      "recommendedLimit": number,
      "reason": string
    }
  ],
  "goalsStrategy": [
    {
      "goalName": string,
      "status": string,
      "advice": string,
      "estimatedMonthsToComplete": number
    }
  ],
  "actionPlan": [
    {
      "step": number,
      "title": string,
      "description": string,
      "priority": "Alta" | "Média" | "Baixa"
    }
  ],
  "rule503020": {
    "necessitiesPercentage": number,
    "wantsPercentage": number,
    "savingsPercentage": number,
    "evaluation": string
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    res.json({ success: true, analysis: data });
  } catch (error: any) {
    console.error("Error in financial advisor API:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Falha ao gerar diagnóstico financeiro com IA",
    });
  }
});

// AI Smart Transaction Parser (Text or Receipt Image)
app.post("/api/gemini/parse-transaction", async (req, res) => {
  try {
    const { textPrompt, imageBase64, imageMimeType, availableCategories, availableAccounts } = req.body;
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
    res.json({ success: true, result: data });
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
    const { messages, userFinancialContext } = req.body;
    const ai = getAi();

    const systemInstruction = `Você é o Consultor Financeiro Virtual do aplicativo 'Controle Financeiro Pessoal'.
Seu objetivo é ajudar o usuário a tomar melhores decisões financeiras, economizar, investir com segurança (foco em renda fixa, tesouro direto, CDBs, reserva de emergência e regras como 50/30/20), sair de dívidas e planejar metas.
Responda de forma clara, educada, amigável e estruturada com formatação Markdown (negrito, tópicos, tabelas quando útil).

Contexto financeiro atual do usuário:
${JSON.stringify(userFinancialContext || {}, null, 2)}
`;

    // Convert messages to history and latest prompt
    const contents: any[] = [];
    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: contents.length > 0 ? contents : [{ role: "user", parts: [{ text: "Olá!" }] }],
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || "Desculpe, não consegui processar a resposta no momento.";
    res.json({ success: true, reply });
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
