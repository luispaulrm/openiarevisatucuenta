import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzePdfWithOpenAI, UploadedFile } from './openaiService';
import { generateStableAuditReport } from './auditService';
import { GENERAL_ANALYSIS_PROMPT, PAM_ANALYSIS_PROMPT, CONTRACT_ANALYSIS_PROMPT, GENERAL_ANALYSIS_SCHEMA, PAM_ANALYSIS_SCHEMA, CONTRACT_ANALYSIS_SCHEMA } from './constants';
import { AuditRequest } from './types';

// Configuración robusta de variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Intentar cargar .env desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const app = express();
// Default to 3001 but allow override
const port = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
// Explicitly cast to any to avoid "No overload matches this call" due to type mismatches in middleware definitions
app.use(express.json({ limit: '50mb' }) as any);

(process as any).setMaxListeners(20);

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit explicitly
});
// Health Check Endpoint
app.get('/api/health', (req: any, res: any) => {
    res.json({ 
        status: 'ok', 
        apiKeyConfigured: !!process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini'
    });
});

// Casting upload.array to any to resolve TypeScript overload mismatch with Express RequestHandler
app.post('/api/analyze/:type', upload.array('files') as any, async (req: any, res: any) => {
    const { type } = req.params;
    console.log(`[Backend] Solicitud de analisis recibida: ${type}`);
    
    if (!process.env.OPENAI_API_KEY) {
        console.error("[Backend] ERROR: OPENAI_API_KEY no configurada.");
        res.status(500).json({ error: 'Servidor no configurado (Falta API Key).' });
        return;
    }

    const filesFromRequest = (req as any).files;
    if (!filesFromRequest || !Array.isArray(filesFromRequest) || filesFromRequest.length === 0) {
        console.warn("[Backend] Solicitud sin archivos.");
        res.status(400).json({ error: 'No se recibieron archivos.' });
        return;
    }

    const files = filesFromRequest as UploadedFile[];
    console.log(`[Backend] Procesando ${files.length} archivo(s) para ${type}...`);
    
    try {
        let result: any;
        
        if (type === 'bill') {
            const file = files[0];
            if (files.length > 1) {
                console.warn("[Backend] Se recibieron multiples archivos para 'bill'; solo se analiza el primero.");
            }
            result = await analyzePdfWithOpenAI(
                file,
                GENERAL_ANALYSIS_PROMPT,
                JSON.stringify(GENERAL_ANALYSIS_SCHEMA)
            );
        } else if (type === 'pam') {
            const pamResponses = await Promise.all(
                files.map(file =>
                    analyzePdfWithOpenAI(
                        file,
                        PAM_ANALYSIS_PROMPT,
                        JSON.stringify(PAM_ANALYSIS_SCHEMA)
                    )
                )
            );
            result = pamResponses.flat();
        } else if (type === 'contract') {
            result = await Promise.all(
                files.map(file =>
                    analyzePdfWithOpenAI(
                        file,
                        CONTRACT_ANALYSIS_PROMPT,
                        JSON.stringify(CONTRACT_ANALYSIS_SCHEMA)
                    )
                )
            );
        } else {
            res.status(400).json({ error: 'Tipo de analisis no valido.' });
            return;
        }
        
        console.log(`[Backend] Analisis ${type} exitoso. Enviando respuesta.`);
        res.json(result);
    } catch (error) {
        console.error(`[Backend] Error critico en ${type}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido en backend.";
        res.status(500).json({ error: errorMessage });
    }
});
app.post('/api/audit', async (req: any, res: any) => {
    console.log(`[Backend] ⚖️ Iniciando Auditoría...`);
    const { billResult, pamResult, contractResult, previousAuditMarkdown, sameDataFlag } = req.body as AuditRequest;
    try {
        const report = await generateStableAuditReport(billResult, pamResult, contractResult, previousAuditMarkdown, sameDataFlag);
        console.log(`[Backend] ✅ Auditoría generada.`);
        res.json(report);
    } catch (error) {
        console.error('[Backend] ❌ Error auditoría:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Error desconocido" });
    }
});

const staticFilesPath = path.join(__dirname, '..', 'public');
app.use(express.static(staticFilesPath) as any);

app.get('*', (req: any, res: any) => {
  res.sendFile(path.join(staticFilesPath, 'index.html'));
});

// Listen on 0.0.0.0 to be accessible externally/in containers
app.listen(port, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`🚀 SERVIDOR BACKEND ACTIVO`);
    console.log(`📡 Escuchando en: http://0.0.0.0:${port}`);
    console.log(`🔑 OPENAI API Key: ${process.env.OPENAI_API_KEY ? 'CONFIGURADA ✅' : 'FALTANTE ❌'}`);
    console.log(`==================================================\n`);
});
