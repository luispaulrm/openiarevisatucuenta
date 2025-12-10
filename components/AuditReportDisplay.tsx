

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateAuditPdf } from '../services/pdfService';
import { AnalysisState, DocumentType } from '../types';

interface AuditReportDisplayProps {
  report: string | null; // Final Report (Round 6)
  reportA?: string | null; // Round 1
  reportB?: string | null; // Round 5
  analysisStates: Record<DocumentType, AnalysisState>;
}

type ActiveTab = 'final' | 'A' | 'B';

// Robust parser for Chilean currency format ($1.234.567) and AI variabilities
const parseCurrency = (value: string | undefined): number => {
    if (!value) return 0;
    let cleanStr = value.toString();
    
    // 1. Limpieza básica de markdown y espacios
    cleanStr = cleanStr.replace(/\*\*/g, '').replace(/`/g, '').trim();

    // 2. Detectar si es UF o V.A. y retornar 0 si no es dinero (para no sumar topes como montos)
    if (cleanStr.toUpperCase().includes('UF') || cleanStr.toUpperCase().includes('V.A.')) {
        if (!cleanStr.includes('$')) return 0;
    }
    
    // 3. Eliminar todo lo que no sea número, coma o guión (para negativos)
    // En Chile: Puntos son miles, Comas son decimales.
    cleanStr = cleanStr.replace(/\./g, '');
    cleanStr = cleanStr.replace(/[$\s]/g, '');
    cleanStr = cleanStr.replace(',', '.'); // Coma a punto para float JS
    
    cleanStr = cleanStr.replace(/[^\d.-]/g, '');
    
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : Math.round(parsed);
};

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.round(value));
};

// Helper to remove garbage lines from AI output (Mojibake)
const cleanReportLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return true; // Keep empty lines for spacing

    // 1. Detectar caracteres de "Glitch" o Mojibake comunes
    const garbageRegex = /[ØßðÐµ×÷þ]/;
    if (garbageRegex.test(line)) return false;

    // 2. Detectar patrones repetitivos de símbolos (ej: &I&M&P...)
    if (/&[A-Z0-9]&[A-Z0-9]&/.test(line)) return false;
    
    // 3. Detectar líneas con exceso de símbolos no alfanuméricos
    // Si la línea tiene más del 40% de caracteres extraños y no es una tabla, es basura.
    const symbols = trimmed.replace(/[a-zA-Z0-9\s.,$áéíóúÁÉÍÓÚñÑ|:()-]/g, '');
    if (symbols.length > trimmed.length * 0.4 && !trimmed.startsWith('|')) return false;

    // 4. Patrones específicos de alucinación visual
    if (line.includes('Ø=Ü') || line.includes('°Ø') || line.includes('°&')) return false;
    if (trimmed.startsWith('-_-')) return false;

    return true;
};

const processReportContent = (reportContent: string) => {
    let totalImpactoPaciente = 0;
    const newLines: string[] = [];
    
    const lines = reportContent.split('\n');
    let inSynthesisTable = false;
    let tableHeaderProcessed = false;
    let montoReclamarIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (!cleanReportLine(line)) continue;

        const trimmedLine = line.trim();
        const upperLine = trimmedLine.toUpperCase();

        // 1. Detect Table Start
        if (!inSynthesisTable && trimmedLine.startsWith('|')) {
             const headerCandidates = ['CÓDIGO', 'GLOSA', 'PRESTACIÓN', 'HALLAZGO', 'MONTO', 'VALOR', 'OBJETADO'];
             if (headerCandidates.some(h => upperLine.includes(h))) {
                 inSynthesisTable = true;
             }
        }

        // 2. Process Table Logic
        if (inSynthesisTable) {
             if (!trimmedLine.startsWith('|')) {
                 inSynthesisTable = false;
                 // Inject Totals at the end of the table
                 newLines.push('\n');
                 newLines.push('---');
                 newLines.push(`**💰 IMPACTO TOTAL PACIENTE (REEMBOLSO SUGERIDO): ${formatCurrency(totalImpactoPaciente)}**`);
                 newLines.push(`**📉 REVERSO TOTAL A ISAPRE (AJUSTE): $0**`);
                 newLines.push(`### 🏁 MONTO TOTAL GENERAL OBJETADO: ${formatCurrency(totalImpactoPaciente)}`);
                 newLines.push('---');
                 newLines.push('\n');
                 
                 newLines.push(line);
                 continue;
             }

             const cells = trimmedLine.split('|'); 
             const cleanCells = cells.map(c => c.trim()).filter((c, idx) => idx > 0 && idx < cells.length - 1);
             
             // 2a. Header Row processing
             if (!tableHeaderProcessed) {
                 montoReclamarIndex = cleanCells.findIndex(c => {
                    const header = c.toLowerCase();
                    return header.includes('monto') || header.includes('reclamar') || header.includes('objetado') || header.includes('valor');
                });
                if (montoReclamarIndex !== -1) tableHeaderProcessed = true;
                
                newLines.push(line);
                continue;
             }
             
             // 2b. Separator
             if (trimmedLine.match(/^\|[\s-]+\|/)) {
                newLines.push(line);
                continue;
             }

             // 2c. Data Rows
             if (cleanCells.length > 0) {
                 if (cleanCells[0].toUpperCase().includes('TOTAL') || (cleanCells[1] && cleanCells[1].toUpperCase().includes('TOTAL'))) {
                     continue; 
                 }
                 
                 if (montoReclamarIndex > -1 && montoReclamarIndex < cleanCells.length) {
                     const montoStr = cleanCells[montoReclamarIndex];
                     const val = parseCurrency(montoStr);
                     totalImpactoPaciente += val;
                 }
                 newLines.push(line);
                 continue;
             }
        }

        newLines.push(line);
    }
    
    // Edge case: Table at end of file (EOF)
    if (inSynthesisTable) {
         newLines.push('\n');
         newLines.push('---');
         newLines.push(`**💰 IMPACTO TOTAL PACIENTE (REEMBOLSO SUGERIDO): ${formatCurrency(totalImpactoPaciente)}**`);
         newLines.push(`**📉 REVERSO TOTAL A ISAPRE (AJUSTE): $0**`);
         newLines.push(`### 🏁 MONTO TOTAL GENERAL OBJETADO: ${formatCurrency(totalImpactoPaciente)}`);
         newLines.push('---');
    }

    return newLines.join('\n');
};

const AuditReportDisplay: React.FC<AuditReportDisplayProps> = ({ report, reportA, reportB }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('final');
  
  const currentReport = useMemo(() => {
      if (activeTab === 'A') return reportA;
      if (activeTab === 'B') return reportB;
      return report;
  }, [activeTab, report, reportA, reportB]);

  const processedReport = useMemo(() => {
    if (!currentReport) return null;
    const processed = processReportContent(currentReport);
    if (!processed || processed.length < 50) return currentReport;
    return processed;
  }, [currentReport]);

  const handleDownloadPdf = async () => {
    if (!processedReport) return;

    setIsGeneratingPdf(true);
    try {
      const filename = activeTab === 'final' ? 'reporte_forense_final.pdf' : `auditoria_ronda_${activeTab}.pdf`;
      await generateAuditPdf(processedReport, filename);
    } catch (error) {
      console.error("Failed to generate audit PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!report) return null;

  return (
    <section className="bg-brand-secondary p-6 rounded-lg shadow-lg mt-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-brand-text border-b-2 border-brand-cyan pb-2">
          📊 Reporte de Auditoría (Mesa Redonda IA)
        </h2>
        
        {/* Tabs for Switching Reports */}
        <div className="flex bg-brand-primary rounded-lg p-1">
            {reportA && (
                <button 
                    onClick={() => setActiveTab('A')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'A' ? 'bg-brand-accent text-white shadow-md' : 'text-brand-light hover:text-white'}`}
                >
                    📝 Ronda 1 (Borrador)
                </button>
            )}
            {reportB && (
                <button 
                    onClick={() => setActiveTab('B')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'B' ? 'bg-brand-accent text-white shadow-md' : 'text-brand-light hover:text-white'}`}
                >
                    🧐 Ronda 5 (Revisión)
                </button>
            )}
            <button 
                onClick={() => setActiveTab('final')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'final' ? 'bg-brand-cyan text-brand-primary shadow-md' : 'text-brand-light hover:text-white'}`}
            >
                ⚖️ Veredicto Final (Ronda 6)
            </button>
        </div>

        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf || !processedReport}
          className="bg-red-700 hover:bg-red-600 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          {isGeneratingPdf ? (
            <span className="animate-pulse">Generando PDF...</span>
          ) : (
            <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Descargar PDF
            </>
          )}
        </button>
      </div>

      <div className="prose prose-invert max-w-none bg-brand-primary p-6 rounded-lg border border-brand-accent/30 min-h-[400px]">
        {processedReport ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{processedReport}</ReactMarkdown>
        ) : (
            <div className="flex items-center justify-center h-64 text-brand-light italic">
                Seleccione un reporte para visualizar su contenido.
            </div>
        )}
      </div>
    </section>
  );
};

export default AuditReportDisplay;
