

import React, { useState, useCallback, useRef } from 'react';
import Header from './components/Header';
import AnalysisControls from './components/AnalysisControls';
import ResultDisplay from './components/ResultDisplay';
import ActivityLog from './components/ActivityLog';
import AuditReportDisplay from './components/AuditReportDisplay';
import ContextualExplanation from './components/ContextualExplanation';
import { analyzeBillDocument, analyzePamDocument, analyzeContractDocument } from './services/geminiService';
import { generateStableAuditReport } from './services/auditService';
import { DocumentType, AnalysisState, AnalysisResultType, StableAuditResult } from './types';
import { calculateFileHash, getCachedAnalysis } from './services/cacheService';

const App: React.FC = () => {
  const [files, setFiles] = useState<Record<DocumentType, (File | null)[]>>({
    bill: [null, null],
    pam: [null, null],
    contract: [null, null],
  });

  const initialAnalysisState: AnalysisState = {
    status: 'idle',
    result: null,
    markdownContent: null,
    error: null,
    progress: 0,
    stage: 'En espera'
  };

  const [analysisStates, setAnalysisStates] = useState<Record<DocumentType, AnalysisState>>({
    bill: { ...initialAnalysisState },
    pam: { ...initialAnalysisState },
    contract: { ...initialAnalysisState },
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  
  // Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditLogHistory, setAuditLogHistory] = useState<string[]>([]);
  const [auditResult, setAuditResult] = useState<StableAuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  const progressIntervals = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const auditInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  }, []);

  const handleFileChange = (type: DocumentType, file: File | null, index: number) => {
    setFiles(prev => {
        const newFiles = [...prev[type]];
        newFiles[index] = file;
        return { ...prev, [type]: newFiles };
    });
    setAnalysisStates(prev => ({
        ...prev,
        [type]: { ...initialAnalysisState }
    }));
    addLog(`Archivo para '${type}' (espacio ${index + 1}) seleccionado: ${file?.name || 'ninguno'}`);
  };

  // --- ANALYSIS PROGRESS LOGIC ---
  const startProgressSimulation = (type: DocumentType, isCached: boolean = false) => {
    let currentProgress = 0;
    if (progressIntervals.current[type]) clearInterval(progressIntervals.current[type]);

    addLog(isCached ? `⚡ ${type.toUpperCase()}: Plan conocido. Recuperando de memoria...` : `⏳ ${type.toUpperCase()}: Iniciando análisis IA...`);
    const speed = isCached ? 20 : 200; 

    progressIntervals.current[type] = setInterval(() => {
        setAnalysisStates(prev => {
            const currentState = prev[type];
            if (currentState.status === 'success' || currentState.status === 'error') {
                 clearInterval(progressIntervals.current[type]);
                 return prev;
            }
            let increment = 0;
            let nextStage = currentState.stage;
            if (isCached) {
                 increment = 20;
                 nextStage = "Recuperando datos guardados...";
            } else {
                if (currentProgress < 20) { increment = 5; nextStage = "Preprocesando PDF..."; } 
                else if (currentProgress < 50) { increment = 1.5; nextStage = "Enviando a Gemini IA..."; } 
                else if (currentProgress < 80) { increment = 0.4; nextStage = "Gemini: Analizando datos complejos..."; } 
                else if (currentProgress < 90) { increment = 0.1; nextStage = "Estructurando JSON de salida..."; } 
                else if (currentProgress < 98) { increment = 0.02; nextStage = "Finalizando y validando..."; } 
                else { increment = 0; nextStage = "Esperando respuesta del servidor..."; }
            }
            const nextProgress = Math.min(currentProgress + increment, 98);
            currentProgress = nextProgress;
            return { ...prev, [type]: { ...prev[type], progress: nextProgress, stage: nextStage } };
        });
    }, speed);
  };

  const stopProgressSimulation = (type: DocumentType, success: boolean) => {
      if (progressIntervals.current[type]) clearInterval(progressIntervals.current[type]);
      setAnalysisStates(prev => ({
        ...prev,
        [type]: { ...prev[type], progress: success ? 100 : 0, stage: success ? 'Completado' : 'Fallido' }
      }));
      if (success) addLog(`✅ ${type}: Proceso finalizado.`);
  };

  // --- AUDIT PROGRESS LOGIC (HEXA-TURN ENGINE) ---
  const startAuditSimulation = () => {
    if (auditInterval.current) clearInterval(auditInterval.current);
    
    setAuditProgress(0);
    setAuditLogHistory(["🚀 Iniciando Mesa Redonda (6 Iteraciones)..."]);

    // Steps adapted for 6 rounds (approx 15-20% per round)
    const auditSteps = [
        { pct: 10, msg: "🗣️ Ronda 1: Auditoría Inicial (Borrador)" },
        { pct: 25, msg: "🗣️ Ronda 2: Crítica y Refinamiento" },
        { pct: 40, msg: "🗣️ Ronda 3: Verificación de Normas (Circular 319)" },
        { pct: 55, msg: "🗣️ Ronda 4: Recálculo de Totales" },
        { pct: 70, msg: "🗣️ Ronda 5: Consolidación Previa" },
        { pct: 85, msg: "👨‍⚖️ Ronda 6: Juez Supremo (Análisis de Errores)" },
        { pct: 95, msg: "📝 Redactando Veredicto Final..." }
    ];

    let currentStepIndex = 0;

    auditInterval.current = setInterval(() => {
        setAuditProgress(prev => {
            if (prev >= 99) return 99;
            // Slower increment because 6 iterations take longer
            let increment = 0.3; 
            
            const nextProgress = prev + increment;
            
            if (currentStepIndex < auditSteps.length) {
                if (nextProgress >= auditSteps[currentStepIndex].pct) {
                    const stepMsg = auditSteps[currentStepIndex].msg;
                    setAuditLogHistory(history => {
                         if (!history.includes(stepMsg)) return [...history, stepMsg];
                         return history;
                    });
                    currentStepIndex++;
                }
            }
            return nextProgress;
        });
    }, 300); // Slower tick rate to match backend latency
  };

  const stopAuditSimulation = (success: boolean) => {
      if (auditInterval.current) clearInterval(auditInterval.current);
      setAuditProgress(success ? 100 : 0);
      setAuditLogHistory(prev => [...prev, success ? "🏁 Mesa Redonda Finalizada." : "❌ Error en Deliberación."]);
  };

  const handleAnalyze = useCallback(async () => {
    const billFiles = files.bill.filter((f): f is File => f !== null);
    const pamFiles = files.pam.filter((f): f is File => f !== null);
    const contractFiles = files.contract.filter((f): f is File => f !== null);

    if (billFiles.length === 0 && pamFiles.length === 0 && contractFiles.length === 0) {
      addLog("❌ Error: No hay archivos cargados para analizar.");
      return;
    }
    
    setIsAnalysisRunning(true);
    setAuditResult(null);
    setAuditError(null);
    
    const performAnalysis = async (type: DocumentType, service: (files: File[]) => Promise<AnalysisResultType>, filesToAnalyze: File[]) => {
        if (filesToAnalyze.length === 0) return;
        let isCached = false;
        if (type === 'contract') {
            try {
                let combinedHash = '';
                for (const file of filesToAnalyze) combinedHash += await calculateFileHash(file);
                if (getCachedAnalysis(combinedHash)) isCached = true;
            } catch (e) { console.warn("Error checking cache:", e); }
        }

        try {
            setAnalysisStates(prev => ({ 
                ...prev, 
                [type]: { ...prev[type], status: 'loading', progress: 1, stage: isCached ? 'Cargando memoria...' : 'Iniciando IA...' } 
            }));
            startProgressSimulation(type, isCached);
            const result = await service(filesToAnalyze);
            stopProgressSimulation(type, true);
            setAnalysisStates(prev => ({ 
                ...prev, 
                [type]: { 
                    status: 'success', 
                    result, 
                    error: null, 
                    markdownContent: typeof result === 'string' ? result : null,
                    progress: 100,
                    stage: isCached ? '⚡ Plan Recuperado (Sin Costo)' : '✅ Análisis IA Completado'
                } 
            }));
        } catch (error) {
            stopProgressSimulation(type, false);
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error analyzing ${type}:`, error);
            setAnalysisStates(prev => ({ 
                ...prev, 
                [type]: { status: 'error', result: null, error: errorMessage, markdownContent: null, progress: 0, stage: 'Error' } 
            }));
            addLog(`❌ Error en ${type}: ${errorMessage}`);
        }
    };

    addLog("🚀 INICIANDO ANÁLISIS SELECTIVO...");
    await Promise.all([
        performAnalysis('bill', analyzeBillDocument, billFiles),
        performAnalysis('pam', analyzePamDocument, pamFiles),
        performAnalysis('contract', analyzeContractDocument, contractFiles)
    ]);
    setIsAnalysisRunning(false);
    addLog("🏁 Ciclo de extracción finalizado.");
  }, [files, addLog]);

  const handleGenerateAudit = useCallback(async () => {
    if (!analysisStates.bill.result || !analysisStates.pam.result || !analysisStates.contract.result) {
        addLog("❌ Error: Se requieren los 3 análisis para generar la auditoría.");
        return;
    }

    addLog("⚖️ Ejecutando Mesa Redonda de 6 Auditores (Corrección Iterativa)...");
    setIsAuditing(true);
    setAuditResult(null);
    setAuditError(null);
    startAuditSimulation();

    try {
      const result = await generateStableAuditReport(
        analysisStates.bill.result,
        analysisStates.pam.result,
        analysisStates.contract.result,
        null // No previous audit
      );
      stopAuditSimulation(true);
      setAuditResult(result);
      addLog("✅ Veredicto Final Consolidado.");
    } catch (error) {
      stopAuditSimulation(false);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido.";
      setAuditError(errorMessage);
      addLog(`❌ Error auditoría: ${errorMessage}`);
    } finally {
      setIsAuditing(false);
    }
  }, [analysisStates, addLog]);

  const handleDownloadJson = (data: any, filename: string) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = filename;
    link.click();
  };

  return (
    <div className="bg-brand-primary min-h-screen text-brand-text">
      <Header />
      <main className="container mx-auto p-4 md:p-6 space-y-8">
        <ContextualExplanation />
        <AnalysisControls files={files} onFileChange={handleFileChange} onAnalyze={handleAnalyze} isAnalysisRunning={isAnalysisRunning} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <ResultDisplay
              analysisStates={analysisStates}
              onGenerateAudit={handleGenerateAudit}
              onDownloadJson={handleDownloadJson}
              isAuditing={isAuditing}
              auditProgress={auditProgress}
              auditLogHistory={auditLogHistory}
              auditError={auditError}
            />
            {auditResult && (
                <AuditReportDisplay 
                    report={auditResult.finalReportMarkdown} 
                    reportA={auditResult.reportAMarkdown}
                    reportB={auditResult.reportBMarkdown}
                    analysisStates={analysisStates} 
                />
            )}
          </div>
        </div>
        <ActivityLog logs={logs} />
      </main>
    </div>
  );
};

export default App;