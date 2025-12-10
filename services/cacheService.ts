
export interface CacheEntry<T> {
  hash: string;
  timestamp: number;
  data: T;
  modelUsed: string;
}

const CACHE_PREFIX = 'audit_ai_cache_v1_';

// Calcula el hash SHA-256 del archivo para usarlo como identificador único
export const calculateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Intenta recuperar un análisis del almacenamiento local
export const getCachedAnalysis = <T>(hash: string): T | null => {
  try {
    const key = `${CACHE_PREFIX}${hash}`;
    const cachedItem = localStorage.getItem(key);
    
    if (!cachedItem) return null;
    
    const parsed: CacheEntry<T> = JSON.parse(cachedItem);
    console.log(`[Cache] ⚡ Recuperado de memoria: ${hash.substring(0, 8)}...`);
    return parsed.data;
  } catch (error) {
    console.warn('[Cache] Error al leer caché:', error);
    return null;
  }
};

// Guarda un análisis nuevo en el almacenamiento local
export const saveCachedAnalysis = <T>(hash: string, data: T, modelName: string): void => {
  try {
    const key = `${CACHE_PREFIX}${hash}`;
    const entry: CacheEntry<T> = {
      hash,
      timestamp: Date.now(),
      data,
      modelUsed: modelName
    };
    
    // Gestión simple de espacio: si falla por cuota, limpiar todo lo antiguo
    try {
        localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
        console.warn('[Cache] Espacio lleno, limpiando caché antiguo...');
        localStorage.clear(); // Estrategia drástica para MVP, en prod usaríamos LRU
        localStorage.setItem(key, JSON.stringify(entry));
    }
    
    console.log(`[Cache] 💾 Guardado en memoria: ${hash.substring(0, 8)}...`);
  } catch (error) {
    console.error('[Cache] No se pudo guardar en caché:', error);
  }
};
