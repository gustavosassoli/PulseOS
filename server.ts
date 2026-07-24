import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function generateWithFallbackAndRetry(prompt: any, schema?: any) {
  const modelsToTry = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            ...(schema ? { responseSchema: schema } : {})
          }
        });

        if (response.text) {
          let cleaned = response.text.trim();
          if (cleaned.startsWith("```json")) {
            cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
          } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
          }
          return JSON.parse(cleaned);
        }
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.code || (typeof err?.message === 'string' && (err.message.includes('503') || err.message.includes('UNAVAILABLE')) ? 503 : 0);
        console.warn(`[Gemini API] Attempt ${attempt + 1} for model ${model} failed:`, err?.message || err);
        
        // If transient 503 or 429 error, wait before retrying or switching models
        if (attempt < 2 && (status === 503 || status === 429 || status === 'UNAVAILABLE')) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        } else {
          break; // Try next fallback model
        }
      }
    }
  }

  throw lastError || new Error("Não foi possível obter resposta da IA após várias tentativas. Por favor, tente novamente em alguns instantes.");
}

// Gemini generic API
app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt, schema } = req.body;
    const result = await generateWithFallbackAndRetry(prompt, schema);
    res.json(result);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Erro de conexão com a API da Gemini" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
