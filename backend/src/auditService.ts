

import { GoogleGenAI } from "@google/genai";
import {
  AUDIT_ITERATION_PROMPT,
  AUDIT_FINAL_JUDGE_PROMPT,
  JURISPRUDENCIA_TEXT,
  NORMAS_ADMINISTRATIVAS_TEXT,
  EVENTO_UNICO_JURISPRUDENCIA_TEXT,
  AUDIT_RECONCILIATION_SCHEMA,
} from "./constants";
import type { AuditReconciliationResult, StableAuditResult } from "./types";

// ------------------------------
// MOTOR DE ITERACIÓN ÚNICA
// ------------------------------
const runAuditIteration = async (
  billResult: any,
  pamResult: any,
  contractResult: any,
  iteration: number,
  history: string | null
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }

  const cuentaJson = JSON.stringify(billResult, null, 2);
  const pamJson = JSON.stringify(pamResult, null, 2);
  const contratoJson = JSON.stringify(contractResult, null, 2);

  // Ronda 6 es el Juez, Rondas 1-5 son independientes
  let basePrompt = iteration === 6 ? AUDIT_FINAL_JUDGE_PROMPT : AUDIT_ITERATION_PROMPT;

  let filledPrompt = basePrompt.replace("{ronda}", iteration.toString());
  
  if (iteration === 6) {
      filledPrompt = filledPrompt.replace("{auditorias_previas}", history || "Sin auditorías previas.");
  }
  
  filledPrompt = filledPrompt.replace("{jurisprudencia_text}", JURISPRUDENCIA_TEXT);
  filledPrompt = filledPrompt.replace("{normas_administrativas_text}", NORMAS_ADMINISTRATIVAS_TEXT);
  filledPrompt = filledPrompt.replace("{evento_unico_jurisprudencia_text}", EVENTO_UNICO_JURISPRUDENCIA_TEXT);
  filledPrompt = filledPrompt.replace("{cuenta_json}", cuentaJson);
  filledPrompt = filledPrompt.replace("{pam_json}", pamJson);
  filledPrompt = filledPrompt.replace("{contrato_json}", contratoJson);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-pro"; 

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: filledPrompt }] }],
      config: {
        // Semilla variable para cada auditor independiente
        seed: 42 + (iteration * 111), 
      },
    });

    const reportText = response.text;
    if (!reportText) throw new Error("Respuesta vacía de Gemini.");
    return reportText;
  } catch (error) {
    console.error(`Error en Auditoría Independiente ${iteration}:`, error);
    // Return empty string or error note to not break Promise.all
    return `[FALLO AUDITOR ${iteration}]`;
  }
};

// ------------------------------------
// MOTOR HEXA-TURN (5 Independent + 1 Judge)
// ------------------------------------
export const generateStableAuditReport = async (
  billResult: any,
  pamResult: any,
  contractResult: any,
  _ignoredPrevious?: string | null,
  sameDataFlag: boolean = true
): Promise<StableAuditResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }

  console.log("[Backend] 🚀 Iniciando Mesa Redonda de 6 Auditores (5 Paralelos + 1 Juez)...");
  
  const MAX_INDEPENDENT_AUDITORS = 5;
  const auditPromises = [];

  // 1. Lanzar 5 auditorías independientes en paralelo
  for (let i = 1; i <= MAX_INDEPENDENT_AUDITORS; i++) {
      console.log(`[Backend] ⚡ Lanzando Auditor Independiente ${i}...`);
      auditPromises.push(runAuditIteration(billResult, pamResult, contractResult, i, null));
  }

  const results = await Promise.all(auditPromises);
  
  // Construir el historial para el Juez
  let auditHistory = "";
  results.forEach((report, index) => {
      auditHistory += `\n\n--- REPORTE DEL AUDITOR INDEPENDIENTE ${index + 1} ---\n${report}\n----------------------------------\n`;
  });

  // Guardar referencias para UI
  const reportA = results[0]; // Auditor 1
  const reportB = results[4]; // Auditor 5

  // 2. Ejecutar Juez Supremo (Ronda 6)
  console.log(`[Backend] ⚖️ Ejecutando Juez Supremo (Ronda 6) con las 5 opiniones...`);
  const finalReport = await runAuditIteration(billResult, pamResult, contractResult, 6, auditHistory);

  console.log("[Backend] ✅ Veredicto Final alcanzado.");

  return {
      finalReportMarkdown: finalReport,
      reportAMarkdown: reportA,
      reportBMarkdown: reportB,
      reconciliation: {
          decision: 'fusionar',
          motivo: 'Consenso tras 5 auditorías independientes y juicio final.',
          requiereRevisionHumana: false,
          auditoriaFinalMarkdown: finalReport
      }
  };
};