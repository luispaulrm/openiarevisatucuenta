

import React, { useState } from 'react';
import { DocumentType, AnalysisState, ContractAnalysisResult, BillAnalysisResult, PamAnalysisResult } from '../types';
import ErrorMessage from './ErrorMessage';
import BillResultDisplay from './BillResultDisplay';
import PamResultDisplay from './PamResultDisplay';
import { generateBillPdf, generateContractPdf, generatePamPdf } from '../services/pdfService';

// Componente para renderizar un solo contrato
const SingleContractTable: React.FC<{ result: ContractAnalysisResult, index: number }> = ({ result, index }) => {
    return (
        <div className="mb-12 border border-brand-accent/30 rounded-lg overflow-hidden shadow-2xl">
            {/* Header del Contrato */}
            <div className="bg-brand-secondary p-6 border-b border-brand-accent/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                    <span className="text-xs text-brand-cyan font-bold uppercase tracking-wider bg-brand-primary px-2 py-1 rounded">Contrato #{index + 1}</span>
                    <h2 className="text-2xl font-bold text-white mt-2">{result.diseno_ux?.titulo_plan || 'Plan de Salud'}</h2>
                    <p className="text-sm text-brand-light">{result.diseno_ux?.nombre_isapre}</p>
                 </div>
            </div>

            <div className="p-4 bg-brand-primary/50">
                {result.reglas && result.reglas.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-brand-text mb-3 pl-2 border-l-4 border-brand-cyan">
                            Análisis Forense de Reglas
                        </h3>
                        <div className="overflow-x-auto bg-brand-primary rounded-lg border border-brand-secondary">
                            <table className="w-full text-sm text-left text-brand-light">
                                <thead className="text-xs text-brand-text uppercase bg-brand-secondary">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Página</th>
                                        <th scope="col" className="px-6 py-3">Sección</th>
                                        <th scope="col" className="px-6 py-3">Subcategoría</th>
                                        <th scope="col" className="px-6 py-3">Extracto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.reglas.map((rule, idx) => (
                                        <tr key={idx} className="border-b border-brand-secondary hover:bg-brand-accent/30 transition-colors">
                                            <td className="px-6 py-4">{rule['PÁGINA ORIGEN']}</td>
                                            <td className="px-6 py-4 font-semibold text-brand-text">{rule['CÓDIGO/SECCIÓN']}</td>
                                            <td className="px-6 py-4">{rule['SUBCATEGORÍA']}</td>
                                            <td className="px-6 py-4 whitespace-pre-wrap font-mono text-xs text-gray-400">{rule['VALOR EXTRACTO LITERAL DETALLADO']}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {result.coberturas && result.coberturas.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-brand-text mb-3 pl-2 border-l-4 border-brand-cyan">
                            Clarificación de Cobertura (Análisis Imperativo 7 Columnas)
                        </h3>
                        <div className="overflow-x-auto bg-brand-primary rounded-lg border border-brand-secondary shadow-inner">
                            <table className="w-full text-sm text-left text-brand-light border-collapse">
                                <thead className="text-xs text-brand-text uppercase bg-brand-secondary">
                                    <tr>
                                        <th className="px-4 py-3 bg-brand-secondary w-1/4 sticky left-0 z-10 border-b border-r border-brand-accent">Prestación Clave</th>
                                        <th className="px-2 py-3 bg-brand-secondary border-r border-brand-accent w-24 text-center">Modalidad</th>
                                        <th className="px-2 py-3 bg-brand-secondary border-r border-brand-accent w-16 text-center">% Bonif.</th>
                                        <th className="px-2 py-3 bg-brand-secondary border-r border-brand-accent w-20 text-center">Copago Fijo</th>
                                        <th className="px-2 py-3 bg-blue-900/30 text-blue-200 border-r border-brand-accent w-28 text-center">Tope Local 1 (VAM/Evento)</th>
                                        <th className="px-2 py-3 bg-gray-700/30 text-gray-200 border-r border-brand-accent w-28 text-center">Tope Local 2 (Anual/UF)</th>
                                        <th className="px-4 py-3 bg-brand-secondary border-b border-brand-accent text-left">Restricciones y Notas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.coberturas.map((coverage, idx) => (
                                        <tr key={idx} className="border-b border-brand-secondary hover:bg-brand-accent/20 transition-colors">
                                            <td className="px-4 py-4 font-bold text-white align-top border-r border-brand-secondary">{coverage['PRESTACIÓN CLAVE']}</td>
                                            <td className="px-2 py-4 text-brand-light text-center font-mono align-top border-r border-brand-secondary/50 text-xs">{coverage['MODALIDAD/RED']}</td>
                                            <td className="px-2 py-4 text-green-400 font-bold text-center align-top border-r border-brand-secondary/50">{coverage['% BONIFICACIÓN']}</td>
                                            <td className="px-2 py-4 text-yellow-200 font-mono text-center align-top border-r border-brand-secondary/50">{coverage['COPAGO FIJO']}</td>
                                            <td className="px-2 py-4 text-blue-300 font-mono align-top text-center border-r border-brand-secondary/50 whitespace-pre-wrap">{coverage['TOPE LOCAL 1 (VAM/EVENTO)']}</td>
                                            <td className="px-2 py-4 text-gray-300 font-mono align-top text-center border-r border-brand-secondary/50 whitespace-pre-wrap">{coverage['TOPE LOCAL 2 (ANUAL/UF)']}</td>
                                            <td className="px-4 py-4 text-xs text-gray-300 align-top whitespace-pre-wrap leading-tight font-normal min-w-[250px]">{coverage['RESTRICCIÓN Y CONDICIONAMIENTO']}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const ContractResultDisplay: React.FC<{ result: ContractAnalysisResult | ContractAnalysisResult[] }> = ({ result }) => {
  // Normalizar a array para manejar múltiples contratos
  const contracts = Array.isArray(result) ? result : [result];

  return (
    <div className="space-y-8 text-brand-text">
        {contracts.map((contract, index) => (
            <SingleContractTable key={index} result={contract} index={index} />
        ))}
    </div>
  );
};

// Enhanced Progress Card with Log History (Black Box)
const AnalysisProgressCard: React.FC<{ progress: number; stage: string; title: string; logHistory?: string[] }> = ({ progress, stage, title, logHistory }) => {
    return (
        <div className="p-8 flex flex-col items-center justify-center space-y-6 bg-brand-secondary/50 rounded-lg border border-dashed border-brand-accent min-h-[250px]">
            <div className="w-full max-w-lg space-y-4">
                <div className="flex justify-between items-end">
                     <span className="text-lg font-bold text-brand-text">{title}</span>
                     <span className="text-2xl font-bold text-brand-cyan">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-brand-primary rounded-full h-4 border border-brand-accent overflow-hidden shadow-inner">
                    <div 
                        className="bg-gradient-to-r from-brand-cyan via-blue-500 to-purple-600 h-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(0,191,255,0.5)]" 
                        style={{ width: `${progress}%` }}
                    >
                        <div className="w-full h-full opacity-30 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-pulse"></div>
                    </div>
                </div>
                
                {logHistory && logHistory.length > 0 ? (
                    // Eliminado max-h-40 y overflow-y-auto para usar scroll del navegador
                    <div className="mt-4 bg-black/80 p-3 rounded-lg border border-brand-accent/50 font-mono text-xs">
                        <ul className="space-y-1">
                            {logHistory.map((log, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-green-400">
                                   <span className="shrink-0">{log.includes('❌') ? '' : '✓'}</span> 
                                   <span className={log.includes('❌') ? "text-red-400" : "text-green-300"}>{log}</span>
                                </li>
                            ))}
                            {progress < 100 && (
                                <li className="flex items-center gap-2 text-brand-cyan animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-brand-cyan"></span>
                                    <span>Procesando...</span>
                                </li>
                            )}
                        </ul>
                    </div>
                ) : (
                    <p className="text-center text-sm text-brand-light font-mono animate-pulse pt-2">
                        {stage}
                    </p>
                )}
            </div>
        </div>
    );
};


interface ResultDisplayProps {
  analysisStates: Record<DocumentType, AnalysisState>;
  onGenerateAudit: () => void;
  onDownloadJson: (data: any, filename: string) => void;
  isAuditing: boolean;
  auditProgress?: number;
  auditStage?: string; // Kept for backwards compatibility but not used if logHistory is present
  auditLogHistory?: string[]; // New prop for detailed history
  auditError: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  analysisStates, 
  onGenerateAudit, 
  onDownloadJson, 
  isAuditing,
  auditProgress = 0,
  auditStage = '',
  auditLogHistory,
  auditError 
}) => {
  
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({
    bill: false, pam: false, contract: false
  });
  
  const [showRaw, setShowRaw] = useState<Record<string, boolean>>({
    bill: false, pam: false, contract: false
  });

  const handleDownloadPdf = async (type: DocumentType) => {
    const state = analysisStates[type];
    if (state.status !== 'success' || !state.result) return;
    
    setIsGenerating(prev => ({ ...prev, [type]: true }));
    try {
      const filename = `${type}_report.pdf`;
      if (type === 'bill') {
        await generateBillPdf(state.result as BillAnalysisResult, filename);
      } else if (type === 'pam') {
        await generatePamPdf(state.result as PamAnalysisResult[], filename);
      } else if (type === 'contract') {
        // Si es array, generamos PDF para el primero o idealmente uno combinado (MVP: el primero)
        const contractResult = Array.isArray(state.result) ? state.result[0] : state.result;
        await generateContractPdf(contractResult as ContractAnalysisResult, filename);
      }
    } catch (error) {
      console.error(`Failed to generate PDF for ${type}:`, error);
    } finally {
      setIsGenerating(prev => ({ ...prev, [type]: false }));
    }
  };
  
  const toggleRaw = (type: string) => {
      setShowRaw(prev => ({...prev, [type]: !prev[type]}));
  };

  const renderContentForType = (type: DocumentType) => {
    const state = analysisStates[type];
    
    if (state.status === 'loading') {
        return <AnalysisProgressCard progress={state.progress} stage={state.stage} title={type === 'bill' ? 'Cuenta' : type === 'pam' ? 'PAM' : 'Contrato'} />;
    }
    if (state.status === 'error') {
        return <ErrorMessage message={state.error || 'Error desconocido'} />;
    }
    if (state.status === 'success' && state.result) {
        if (showRaw[type]) {
            return (
                // Eliminado max-h-96 para que el JSON use scroll del navegador
                <div className="bg-black p-4 rounded text-xs font-mono text-green-400 overflow-auto">
                    <pre>{JSON.stringify(state.result, null, 2)}</pre>
                </div>
            )
        }
        if (type === 'bill') return <BillResultDisplay result={state.result} />;
        if (type === 'pam') return <PamResultDisplay result={state.result as PamAnalysisResult[]} />;
        if (type === 'contract') return <ContractResultDisplay result={state.result as ContractAnalysisResult | ContractAnalysisResult[]} />;
    }
    return null;
  }

  const anyActive = (Object.values(analysisStates) as AnalysisState[]).some(s => s.status !== 'idle');

  if (!anyActive) {
    return null;
  }

  const allAnalysisSucceeded = (Object.values(analysisStates) as AnalysisState[]).every(s => s.status === 'success');

  const renderSection = (type: DocumentType, title: string, num: number) => {
      if (analysisStates[type].status === 'idle') return null;
      
      return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border border-brand-accent/30 transition-all duration-500">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2 border-b border-brand-accent pb-2">
                <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
                    <span className="bg-brand-cyan text-brand-primary rounded-full w-8 h-8 flex items-center justify-center text-sm">{num}</span>
                    {title}
                </h2>
                {analysisStates[type].status === 'success' && (
                    <div className="flex gap-2">
                        <button onClick={() => toggleRaw(type)} className="text-brand-light hover:text-white text-xs underline px-2">
                            {showRaw[type] ? 'Ver Vista Normal' : 'Ver JSON'}
                        </button>
                        <button onClick={() => onDownloadJson(analysisStates[type].result, `${type}_analysis.json`)} className="bg-brand-primary border border-brand-accent hover:bg-brand-accent text-brand-text text-xs font-bold py-2 px-3 rounded transition-colors">JSON</button>
                        <button onClick={() => handleDownloadPdf(type)} disabled={isGenerating[type]} className="bg-red-900/80 hover:bg-red-700 border border-red-700 disabled:bg-gray-500 text-white text-xs font-bold py-2 px-3 rounded transition-colors">{isGenerating[type] ? '...' : 'PDF'}</button>
                    </div>
                )}
            </div>
            {renderContentForType(type)}
        </div>
      );
  }

  return (
    <section className="space-y-8">
      {renderSection('bill', 'Cuenta Paciente', 1)}
      {renderSection('pam', 'Programa Médico (PAM)', 2)}
      {renderSection('contract', 'Contrato / Póliza', 3)}

      {allAnalysisSucceeded && (
        <div className="text-center pt-4 space-y-4 bg-gradient-to-b from-brand-secondary to-brand-primary p-8 rounded-lg shadow-xl border border-green-900/50 animate-fade-in-up">
          <div className="inline-block p-3 rounded-full bg-green-900/30 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Análisis Individuales Completados</h2>
          <p className="text-brand-light max-w-md mx-auto">La IA ha estructurado exitosamente los tres documentos. El siguiente paso es cruzar esta información para encontrar discrepancias financieras.</p>
          
          {isAuditing ? (
              <div className="mt-8 max-w-2xl mx-auto">
                 <AnalysisProgressCard 
                    progress={auditProgress} 
                    stage={auditStage} 
                    title="AUDITORÍA CRUZADA FORENSE" 
                    logHistory={auditLogHistory}
                 />
              </div>
          ) : (
            <button
                onClick={onGenerateAudit}
                className="mt-4 bg-brand-cyan hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-brand-primary font-extrabold py-4 px-10 rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
            >
                <span className="text-xl">⚖️</span>
                <span>GENERAR REPORTE FORENSE</span>
            </button>
          )}
          
          {auditError && <ErrorMessage message={auditError} />}
        </div>
      )}
    </section>
  );
};

export default ResultDisplay;