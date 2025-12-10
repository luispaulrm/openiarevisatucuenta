
import { GoogleGenAI } from "@google/genai";
import { StableAuditResult, AuditReconciliationResult } from '../types';
import { 
    AUDIT_PROMPT, 
    JURISPRUDENCIA_TEXT, 
    NORMAS_ADMINISTRATIVAS_TEXT, 
    EVENTO_UNICO_JURISPRUDENCIA_TEXT,
    AUDIT_RECONCILIATION_PROMPT,
    AUDIT_RECONCILIATION_SCHEMA
} from '../constants';

const apiKey =
  import.meta.env?.VITE_GEMINI_API_KEY ||
  import.meta.env?.VITE_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  process.env.API_KEY ||
  process.env.GEMINI_API_KEY ||
  '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Use Pro model for reasoning tasks like Audit
const MODEL_NAME = 'gemini-2.5-pro'; 

const generateRawAuditReport = async (
  billResult: any,
  pamResult: any,
  contractResult: any,
  seed: number
): Promise<string> => {
  const cuentaJson = JSON.stringify(billResult, null, 2);
  const pamJson = JSON.stringify(pamResult, null, 2);
  const contratoJson = JSON.stringify(contractResult, null, 2);

  let filledPrompt = AUDIT_PROMPT
    .replace("{jurisprudencia_text}", JURISPRUDENCIA_TEXT)
    .replace("{normas_administrativas_text}", NORMAS_ADMINISTRATIVAS_TEXT)
    .replace("{evento_unico_jurisprudencia_text}", EVENTO_UNICO_JURISPRUDENCIA_TEXT)
    .replace("{cuenta_json}", cuentaJson)
    .replace("{pam_json}", pamJson)
    .replace("{contrato_json}", contratoJson);

  if (!ai) {
    throw new Error("API Key no configurada (define VITE_GEMINI_API_KEY en tu .env.local).");
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ parts: [{ text: filledPrompt }] }],
      config: { seed: seed }, // Use specific seed for variance
    });

    return response.text || "Error: Respuesta vacía de auditoría.";
  } catch (error: any) {
    console.error("Audit Generation Error:", error);
    throw new Error(`Fallo en auditoría: ${error.message}`);
  }
};

export const generateStableAuditReport = async (
  billResult: any,
  pamResult: any,
  contractResult: any,
  // previousAuditMarkdown is ignored in the Twin Engine architecture as we always generate fresh pairs
  _ignoredPrevious?: string | null 
): Promise<StableAuditResult> => {
    if (!ai) {
        throw new Error("API Key no configurada (define VITE_GEMINI_API_KEY en tu .env.local).");
    }

    // 1. Twin Engine Execution (Parallel Audits with different seeds)
    console.log("🚀 Iniciando Motor Twin-Engine (Auditor A + Auditor B)...");
    
    const [reportA, reportB] = await Promise.all([
        generateRawAuditReport(billResult, pamResult, contractResult, 42),  // Seed A
        generateRawAuditReport(billResult, pamResult, contractResult, 123)  // Seed B
    ]);

    console.log("✅ Motor Twin-Engine finalizado. Iniciando Reconciliación...");

    // 2. Reconcile (Motor 5)
    const cuentaJson = JSON.stringify(billResult, null, 2);
    const pamJson = JSON.stringify(pamResult, null, 2);
    const contratoJson = JSON.stringify(contractResult, null, 2);

    let reconPrompt = AUDIT_RECONCILIATION_PROMPT
        .replace("{cuenta_json}", cuentaJson)
        .replace("{pam_json}", pamJson)
        .replace("{contrato_json}", contratoJson)
        .replace("{auditoria_previa_markdown}", reportA)
        .replace("{auditoria_nueva_markdown}", reportB)
        .replace("{mismos_datos_flag}", "true");

    try {
        const reconResponse = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ parts: [{ text: reconPrompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: AUDIT_RECONCILIATION_SCHEMA,
                seed: 999 // Seed for reconciliation
            }
        });

        const reconText = reconResponse.text;
        if (!reconText) throw new Error("Respuesta vacía en reconciliación.");

        const reconciliation = JSON.parse(reconText) as AuditReconciliationResult;
        
        return {
            finalReportMarkdown: reconciliation.auditoriaFinalMarkdown || reportA,
            reportAMarkdown: reportA,
            reportBMarkdown: reportB,
            reconciliation
        };

    } catch (error) {
        console.error("Reconciliation Error:", error);
        // Fallback: Return Report A as final if reconciliation fails, but provide both A and B
        return {
            finalReportMarkdown: reportA,
            reportAMarkdown: reportA,
            reportBMarkdown: reportB,
            reconciliation: null
        };
    }
};
