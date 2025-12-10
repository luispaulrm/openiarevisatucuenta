
import { GoogleGenAI, Type } from "@google/genai";
import { ContractAnalysisResult } from "./types";
import { Buffer } from "buffer";
import { 
    CONTRACT_ANALYSIS_PROMPT, 
    CONTRACT_ANALYSIS_SCHEMA,
    CLASSIFICATION_PROMPT,
    CLASSIFICATION_SCHEMA
} from "./constants";

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
}

const fileToGenerativePart = (file: UploadedFile) => {
  return {
    inlineData: {
      data: file.buffer.toString("base64"),
      mimeType: file.mimetype,
    },
  };
};

// Model Definitions
const FAST_MODEL = 'gemini-2.5-flash'; // Used for general analysis and classification
const REASONING_MODEL = 'gemini-2.5-pro'; // Used for deep contract analysis

export const analyzeDocument = async (files: UploadedFile[], prompt: string, schema: any): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("❌ API_KEY no encontrada en process.env");
    throw new Error("API key for Gemini is not configured.");
  }

  console.log(`[GeminiService] Preparando análisis general con modelo: ${FAST_MODEL}`);
  console.log(`[GeminiService] Procesando ${files.length} archivo(s)...`);

  const ai = new GoogleGenAI({ apiKey });
  const fileParts = files.map(fileToGenerativePart);

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: { 
        parts: [
          ...fileParts,
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0,
        maxOutputTokens: 8192, // CRITICAL: Force max tokens to prevent truncation on large bills
      },
    });

    console.log(`[GeminiService] Respuesta recibida de Gemini.`);
    const responseText = response.text;
    
    if (!responseText) {
      throw new Error("Gemini API returned an empty response.");
    }
    return responseText;
  } catch (err: any) {
    console.error("[GeminiService] Error llamando a API:", err);
    throw new Error(`Error Gemini: ${err.message || err}`);
  }
};

/**
 * Phase 1: Classify the document to identify Isapre and Layout.
 */
const classifyDocument = async (file: UploadedFile, apiKey: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    const filePart = fileToGenerativePart(file);

    try {
        console.log('[GeminiService] Phase 1: Classifying document...');
        const response = await ai.models.generateContent({
            model: FAST_MODEL, // Use Flash for speed
            contents: {
                parts: [{ text: CLASSIFICATION_PROMPT }, filePart],
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: CLASSIFICATION_SCHEMA,
                temperature: 0,
                maxOutputTokens: 1000,
            },
        });

        const resultText = response.text;
        if (!resultText) return 'desconocido_desconocido';

        const resultJson = JSON.parse(resultText.trim());
        const tag = `${resultJson.isapre || 'desconocido'}_${resultJson.formato || 'desconocido'}`.toLowerCase().replace(/\s+/g, '_');
        
        console.log(`[GeminiService] Document classified as: ${tag} (Confidence: ${resultJson.confianza})`);
        return tag;

    } catch (error) {
        console.warn('[GeminiService] Classification failed, using fallback.', error);
        return 'desconocido_error';
    }
};

/**
 * Helper to select specific prompts if needed based on classification.
 * Currently defaults to the robust generic prompt.
 */
const getAnalysisPrompt = (classificationTag: string): string => {
    console.log(`[GeminiService] Selecting prompt for tag: ${classificationTag}`);
    // Future: Add specific case statements here (e.g., case 'masvida_tabla_horizontal': return MASVIDA_PROMPT)
    return CONTRACT_ANALYSIS_PROMPT; 
};

/**
 * Phase 2: Perform Deep Analysis on a single contract
 */
const analyzeSingleContract = async (file: UploadedFile, apiKey: string): Promise<ContractAnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey });
    const filePart = fileToGenerativePart(file);

    // 1. Classify
    const classificationTag = await classifyDocument(file, apiKey);

    // 2. Select Prompt
    const selectedPrompt = getAnalysisPrompt(classificationTag);

    // 3. Deep Analysis using Pro model
    try {
        console.log(`[GeminiService] Phase 2: Starting Deep Analysis with ${REASONING_MODEL}...`);
        const response = await ai.models.generateContent({
            model: REASONING_MODEL, // Use Pro for complex table reasoning
            contents: {
                parts: [
                    filePart,
                    { text: selectedPrompt },
                ]
            },
            config: {
                responseMimeType: 'application/json',
                temperature: 0,
                responseSchema: CONTRACT_ANALYSIS_SCHEMA,
                maxOutputTokens: 8192, // Ensure sufficient output for complex contracts
            },
        });

        const responseText = response.text;
        if (!responseText) throw new Error("Gemini API returned an empty response.");
        
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanText);
        
        // Inject classification metadata into result if needed, or just return
        return result;

    } catch (err: any) {
        console.error("[GeminiService] Error en análisis de contrato individual:", err);
        throw err;
    }
};

// Modificado para devolver un Array de resultados, uno por cada archivo
export const analyzePdfDocument = async (files: UploadedFile[]): Promise<ContractAnalysisResult[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API key for Gemini is not configured.");
  }

  console.log(`[GeminiService] Iniciando análisis de ${files.length} contratos por separado...`);

  // Procesar cada archivo en paralelo pero independiente
  const promises = files.map(file => analyzeSingleContract(file, apiKey));
  const results = await Promise.all(promises);

  console.log(`[GeminiService] Análisis de contratos finalizado.`);
  return results;
};
