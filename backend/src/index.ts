import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";
import { jsonrepair } from "jsonrepair";
import OpenAI from "openai";
import vision from "@google-cloud/vision";

// Load environment variables (local overrides .env and fallback to process env)
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const PORT = parseInt(process.env.PORT || "3001", 10);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1";
const openaiKey = process.env.OPENAI_API_KEY;

const openaiClient = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
const visionClient = new vision.ImageAnnotatorClient();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json({ limit: "15mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    openai: !!openaiClient,
    vision: true,
    model: OPENAI_MODEL,
  });
});

app.post("/ocr-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ ok: false, error: "Falta archivo 'file'." });
    }

    const [result] = await visionClient.documentTextDetection({
      image: { content: req.file.buffer },
    });

    const text = result.fullTextAnnotation?.text || "";
    console.log("[OCR] Texto extraído:", text.length, "caracteres");

    res.json({ ok: true, text });
  } catch (error: any) {
    console.error("[OCR ERROR]", error?.message || error);
    res.status(500).json({
      ok: false,
      error: "Error al procesar OCR con Google Vision.",
      details: error?.message || String(error),
    });
  }
});

app.post("/openai", async (req, res) => {
  try {
    if (!openaiClient) {
      return res.status(500).json({
        ok: false,
        error: "OPENAI_API_KEY no está configurada en el servidor.",
      });
    }

    const { prompt, system, temperature = 0.1, maxTokens = 2000 } = req.body || {};
    if (!prompt) {
      return res.status(400).json({
        ok: false,
        error: "Debes enviar 'prompt' en el cuerpo de la petición.",
      });
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (system) {
      messages.push({ role: "system", content: system });
    }
    messages.push({ role: "user", content: prompt });

    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      temperature,
      max_tokens: Math.min(maxTokens, 4000),
    });

    const content = completion.choices?.[0]?.message?.content || "";
    console.log("[OPENAI] Tokens usados:", completion.usage);

    res.json({
      ok: true,
      content,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error("[OPENAI ERROR]", error?.message || error);
    res.status(500).json({
      ok: false,
      error: "Error al llamar a OpenAI.",
      details: error?.message || String(error),
    });
  }
});

app.post("/ocr-and-analyze", upload.single("file"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ ok: false, error: "Falta archivo 'file'." });
    }

    if (!openaiClient) {
      return res.status(500).json({
        ok: false,
        error: "OPENAI_API_KEY no está configurada en el servidor.",
      });
    }

    const {
      systemPrompt,
      userPrompt,
      temperature = 0.1,
      maxTokens = 2000,
    } = req.body || {};

    const [ocrResult] = await visionClient.documentTextDetection({
      image: { content: req.file.buffer },
    });
    const ocrText = ocrResult.fullTextAnnotation?.text || "";

    const systemMessage =
      systemPrompt ||
      "Eres un auditor experto en cuentas clínicas chilenas. Analiza el texto y responde siguiendo las indicaciones del usuario.";

    const userMessage =
      userPrompt ||
      "Usa el texto OCR para devolver un JSON bien estructurado e identificable.";

    const finalPrompt = `${userMessage}\n\n=== TEXTO OCR ===\n${ocrText}`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemMessage },
      { role: "user", content: finalPrompt },
    ];

    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      temperature,
      max_tokens: Math.min(maxTokens, 4000),
    });

    const rawContent = completion.choices?.[0]?.message?.content || "";
    let repairedJson: any = null;
    try {
      const repaired = jsonrepair(rawContent);
      repairedJson = JSON.parse(repaired);
    } catch {
      repairedJson = null;
    }

    res.json({
      ok: true,
      ocrText,
      openaiRaw: rawContent,
      openaiJson: repairedJson,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error("[OCR+OPENAI ERROR]", error?.message || error);
    res.status(500).json({
      ok: false,
      error: "Error en el flujo OCR + OpenAI.",
      details: error?.message || String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log("\n==================================================");
  console.log(`✅ Backend RevisaTuCuenta escuchando en puerto ${PORT}`);
  console.log(`OPENAI configurado: ${!!openaiClient}`);
  console.log(`==================================================\n`);
});
