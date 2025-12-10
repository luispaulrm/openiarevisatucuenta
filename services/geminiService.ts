import { GoogleGenAI, Type } from "@google/genai";
import { ContractAnalysisResult } from "../types";
import { 
    GENERAL_ANALYSIS_PROMPT, 
    GENERAL_ANALYSIS_SCHEMA,
    PAM_ANALYSIS_PROMPT,
    PAM_ANALYSIS_SCHEMA,
    CONTRACT_ANALYSIS_PROMPT,
    CONTRACT_ANALYSIS_SCHEMA,
    CLASSIFICATION_PROMPT,
    CLASSIFICATION_SCHEMA
} from '../constants';
import { calculateFileHash, getCachedAnalysis, saveCachedAnalysis } from './cacheService';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker (uses CDN to avoid complex Vite worker config in this setup)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Initialize the API client using the environment variable injected by Vite.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Models for Two-Phase Analysis
const FAST_MODEL = 'gemini-2.5-flash';
const REASONING_MODEL = 'gemini-2.5-pro';

// Helper to convert File to Base64
const fileToPart = async (file: File) => {
    return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve({
                inlineData: {
                    data: base64String,
                    mimeType: file.type || 'application/pdf',
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Helper: Hybrid OCR Strategy - Extract Text locally to save Gemini "Visual" tokens
const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        // Extract text from the first 20 pages (usually sufficient for rules/definitions)
        const pagesToScan = Math.min(pdf.numPages, 20);
        
        for (let i = 1; i <= pagesToScan; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            
            if (pageText.trim().length > 0) {
                fullText += `\n--- PÁGINA ${i} ---\n${pageText}\n`;
            }
        }
        return fullText;
    } catch (e) {
        console.warn("Local PDF Text Extraction failed, falling back to Vision only:", e);
        return "";
    }
};

const cleanJsonString = (str: string) => {
    try {
        let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');
        let startIndex = -1;
        
        if (firstBrace !== -1 && firstBracket !== -1) {
            startIndex = Math.min(firstBrace, firstBracket);
        } else if (firstBrace !== -1) {
            startIndex = firstBrace;
        } else {
            startIndex = firstBracket;
        }

        if (startIndex !== -1) {
             cleaned = cleaned.substring(startIndex);
        }

        const lastBrace = cleaned.lastIndexOf('}');
        const lastBracket = cleaned.lastIndexOf(']');
        const endIndex = Math.max(lastBrace, lastBracket);

        if (endIndex !== -1) {
            cleaned = cleaned.substring(0, endIndex + 1);
        }
        return cleaned;
    } catch (e) {
        return str;
    }
};

const analyzeFilesWithCache = async (files: File[], prompt: string, schema: any, useCache: boolean, modelName: string = FAST_MODEL, textContext: string = ""): Promise<any> => {
  const validFiles = files.filter(f => f !== null);
  if (validFiles.length === 0) throw new Error("No hay archivos válidos para analizar.");

  let combinedHash = '';
  
  if (useCache) {
      for (const file of validFiles) {
          combinedHash += await calculateFileHash(file);
      }
      const cachedResult = getCachedAnalysis(combinedHash);
      if (cachedResult) {
          return cachedResult;
      }
  }

  if (!apiKey) throw new Error("API Key no configurada (Verificar .env)");

  const fileParts = await Promise.all(validFiles.map(fileToPart));

  // Inject extracted text context if available (Hybrid Strategy)
  let finalPrompt = prompt;
  if (textContext) {
      finalPrompt += `\n\n=== CONTEXTO DE TEXTO EXTRAÍDO (SOPORTE OCR HÍBRIDO) ===\n${textContext}\n======================================================\nUse este texto como apoyo para leer partes borrosas, pero priorice la estructura visual de las tablas en el PDF.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { 
        parts: [
          ...fileParts,
          { text: finalPrompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0,
      },
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Gemini respondió vacío.");

    const cleanedText = cleanJsonString(responseText);
    const jsonResult = JSON.parse(cleanedText);

    if (useCache) {
        saveCachedAnalysis(combinedHash, jsonResult, modelName);
    }

    return jsonResult;
  } catch (error: any) {
    console.error("Gemini Client Error:", error);
    throw new Error(`Error de análisis IA: ${error.message || 'Desconocido'}`);
  }
};

// --- Helper Functions for Two-Phase Analysis ---

const classifyDocument = async (file: File): Promise<string> => {
    try {
        // We do not cache classification to keep it fast and stateless for now, 
        // or we could cache it, but it's cheap (Flash).
        const result = await analyzeFilesWithCache([file], CLASSIFICATION_PROMPT, CLASSIFICATION_SCHEMA, false, FAST_MODEL);
        const tag = `${result.isapre || 'desconocido'}_${result.formato || 'desconocido'}`.toLowerCase().replace(/\s+/g, '_');
        console.log(`[Frontend] Documento clasificado como: ${tag}`);
        return tag;
    } catch (e) {
        console.warn('Error en clasificación, usando fallback:', e);
        return 'desconocido_error';
    }
};

const getAnalysisPrompt = (tag: string): string => {
    // Here we can switch logic based on tag.
    // Currently defaulting to the main robust prompt.
    return CONTRACT_ANALYSIS_PROMPT;
};

const analyzeSingleContract = async (file: File): Promise<ContractAnalysisResult> => {
    // 1. Calculate Hash & Check Cache (Global Check)
    const fileHash = await calculateFileHash(file);
    const cachedResult = getCachedAnalysis<ContractAnalysisResult>(fileHash);
    if (cachedResult) {
        return cachedResult;
    }

    // 2. Hybrid Optimization: Extract Text locally
    // This helps Gemini processing complex contracts by providing raw text context
    let extractedText = "";
    try {
        console.log("[Frontend] Ejecutando extracción de texto local (Hybrid OCR)...");
        extractedText = await extractTextFromPdf(file);
    } catch (e) {
        console.warn("[Frontend] Falló extracción de texto local, continuando solo con visión.");
    }

    // 3. Phase 1: Classification (Flash)
    const classificationTag = await classifyDocument(file);

    // 4. Select Prompt
    const selectedPrompt = getAnalysisPrompt(classificationTag);

    // 5. Phase 2: Deep Analysis (Pro)
    // We pass useCache=false here because we manually handled cache check above 
    const result = await analyzeFilesWithCache(
        [file], 
        selectedPrompt, 
        CONTRACT_ANALYSIS_SCHEMA, 
        false, 
        REASONING_MODEL,
        extractedText // Pass text context
    );
    
    // Inject classification metadata if possible or useful
    // result.diseno_ux.classification = classificationTag; // Optional if schema allows

    // 6. Save to Cache
    saveCachedAnalysis(fileHash, result, REASONING_MODEL);

    return result as ContractAnalysisResult;
};

// --- Exports ---

// Bills: NO CACHE (Siempre variable). 
export const analyzeBillDocument = async (files: File[]): Promise<any> => {
    return analyzeFilesWithCache(files, GENERAL_ANALYSIS_PROMPT, GENERAL_ANALYSIS_SCHEMA, false, FAST_MODEL);
};

// PAMs: NO CACHE (Siempre variable). 
export const analyzePamDocument = async (files: File[]): Promise<any[]> => {
    return analyzeFilesWithCache(files, PAM_ANALYSIS_PROMPT, PAM_ANALYSIS_SCHEMA, false, FAST_MODEL);
};

// Contracts: YES CACHE + TWO-PHASE ANALYSIS + HYBRID OCR
export const analyzeContractDocument = async (files: File[]): Promise<ContractAnalysisResult[]> => {
    const validFiles = files.filter(f => f !== null);
    
    console.log(`[Frontend] Iniciando Análisis Forense Bifásico Híbrido para ${validFiles.length} contratos...`);

    // Execute analysis for each file independently using the 2-phase logic
    const results = await Promise.all(validFiles.map(analyzeSingleContract));
    
    return results;
};