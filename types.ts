
export type DocumentType = 'bill' | 'pam' | 'contract';

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

export enum AnalysisType { General = 'general', PAM = 'pam' }

export interface Rule {
  'PÁGINA ORIGEN': string;
  'CÓDIGO/SECCIÓN': string;
  'SUBCATEGORÍA': string;
  'VALOR EXTRACTO LITERAL DETALLADO': string;
}

export interface Coverage {
  'PRESTACIÓN CLAVE': string;
  'MODALIDAD/RED': string;
  '% BONIFICACIÓN': string;
  'COPAGO FIJO': string;
  'TOPE LOCAL 1 (VAM/EVENTO)': string;
  'TOPE LOCAL 2 (ANUAL/UF)': string;
  'RESTRICCIÓN Y CONDICIONAMIENTO': string;
}

export interface UXDesign {
  nombre_isapre: string;
  titulo_plan: string;
  subtitulo_plan: string;
  layout: string;
  funcionalidad: string;
  salida_json: string;
}

export interface ContractAnalysisResult {
  reglas: Rule[];
  coberturas: Coverage[];
  diseno_ux: UXDesign;
}

// A generic type for Bill and PAM analysis results.
export type BillAnalysisResult = any;
export type PamAnalysisResult = any;

// Updated to allow array of ContractAnalysisResult
export type AnalysisResultType = ContractAnalysisResult | ContractAnalysisResult[] | BillAnalysisResult | PamAnalysisResult;

export interface AnalysisState {
  status: AnalysisStatus;
  result: AnalysisResultType | null;
  markdownContent: string | null;
  error: string | null;
  progress: number; // 0 to 100
  stage: string;    // Descripción textual de lo que está ocurriendo (ej: "Subiendo", "Analizando")
}

// --- Tipos para el Motor 5 de Reconciliación ---

export interface AuditReconciliationChange {
  codigoPrestacion: string;
  tipoCambio:
    | 'sin_cambio'
    | 'clasificacion_distinta'
    | 'monto_reclamado_distinto'
    | 'hallazgo_nuevo'
    | 'hallazgo_eliminado'
    | 'otro';
  detalle: string;
}

export interface AuditReconciliationResult {
  decision: 'mantener_anterior' | 'usar_nuevo' | 'fusionar' | 'marcar_ambiguo';
  motivo: string;
  cambiosClave?: AuditReconciliationChange[];
  requiereRevisionHumana: boolean;
  auditoriaFinalMarkdown: string;
}

export interface StableAuditResult {
  finalReportMarkdown: string;
  reportAMarkdown: string;
  reportBMarkdown: string;
  reconciliation: AuditReconciliationResult | null;
}

export interface AuditRequest {
  billResult: any;
  pamResult: any;
  contractResult: any;
  // previousAuditMarkdown removed/optional as we now generate A and B fresh
  sameDataFlag?: boolean;
}
