
import { Type } from '@google/genai';

export const GENERAL_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    encabezado: {
      type: Type.OBJECT,
      description: 'Contiene toda la información del encabezado del documento.',
      properties: {
        paciente: { type: Type.STRING },
        rutPaciente: { type: Type.STRING },
        titular: { type: Type.STRING },
        rutTitular: { type: Type.STRING },
        prevision: { type: Type.STRING },
        direccion: { type: Type.STRING },
        telefono: { type: Type.STRING },
        idIngreso: { type: Type.STRING },
        tipo: { type: Type.STRING },
        fechaIngreso: { type: Type.STRING },
        fechaEgreso: { type: Type.STRING },
        empresaEmisora: { type: Type.STRING },
      }
    },
    secciones: {
      type: Type.ARRAY,
      description: 'Una lista de todas las secciones de prestaciones encontradas en el documento.',
      items: {
        type: Type.OBJECT,
        properties: {
          titulo: {
            type: Type.STRING,
            description: 'El título de la sección (ej. "CONVENCIONAL", "Medicamentos y Materiales").',
          },
          headers: {
            type: Type.ARRAY,
            description: 'Un array de strings que contiene los nombres exactos de las columnas tal como aparecen en esta sección del documento.',
            items: { type: Type.STRING }
          },
          items: {
            type: Type.ARRAY,
            description: 'La lista de prestaciones cobradas, donde cada prestación es un array de strings. El orden de los valores en el array DEBE corresponder exactamente al orden de los `headers`.',
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: 'El valor de una celda para una fila de prestación.'
              }
            }
          },
          subtotales: {
            type: Type.ARRAY,
            description: "Una lista de los subtotales clave/valor que aparecen al final de la sección.",
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING, description: 'El nombre del campo del subtotal (ej. "Total Afecto").' },
                value: { type: Type.STRING, description: 'El valor del subtotal.' },
              }
            }
          }
        },
        required: ['titulo', 'headers', 'items']
      }
    },
    grandesTotales: {
      type: Type.ARRAY,
      description: 'Una lista de los grandes totales clave/valor encontrados al final del documento.',
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: 'El nombre del campo del total (ej. "Total General Cuenta").' },
          value: { type: Type.STRING, description: 'El valor del total.' },
        }
      }
    },
    montoTotalGeneral: { 
      type: Type.STRING, 
      description: "El monto monetario final y único que representa el TOTAL DE LA CUENTA COMPLETA. Debe incluir separadores de miles." 
    }
  },
  required: ['secciones', 'montoTotalGeneral']
};

export const GENERAL_ANALYSIS_PROMPT = `
**INSTRUCCIÓN CRÍTICA Y DE MÁXIMA FIDELIDAD: ANÁLISIS COMPLETO Y EXTRACCIÓN A JSON AUTO-DESCRIPTIVO**

Tu única misión es realizar un análisis forense del (o los) documento(s) PDF de la cuenta clínica y estructurar TODA la información en un único objeto JSON que se adhiera estrictamente al esquema proporcionado.

**PROCESO DE EXTRACCIÓN OBLIGATORIO Y SECUENCIAL:**

1.  **EXTRAER ENCABEZADO:**
    *   Primero, identifica y extrae toda la información general del paciente y de la cuenta que aparece en la parte superior del documento.
    *   Pobla el objeto \`encabezado\` con estos datos: \`paciente\`, \`rutPaciente\`, \`titular\`, \`rutTitular\`, \`prevision\`, \`fechaIngreso\`, \`fechaEgreso\`, etc. Si un campo no está presente, omítelo del JSON.

2.  **IDENTIFICAR SECCIONES DE PRESTACIONES:** Procesa el resto del documento e identifica los títulos que agrupan prestaciones (ej. "CONVENCIONAL", "Medicamentos y Materiales", "DEVOLUCIONES"). Cada uno será un objeto en el array \`secciones\`.

3.  **PARA CADA SECCIÓN, EXTRAER ENCABEZADOS (HEADERS):**
    *   Dentro de cada sección, lo primero que harás es identificar los nombres de las columnas de la tabla (ej. "Código", "Descripción", "Total Rec", etc.).
    *   Crea un array de strings llamado \`headers\` con estos nombres. El orden debe ser el mismo que aparece visualmente en el documento.

4.  **EXTRAER FILAS DE PRESTACIONES (ITEMS):**
    *   Después de haber definido los \`headers\`, extrae cada línea de prestación individual.
    *   Cada prestación debe ser un **array de strings** dentro del array \`items\`.
    *   **REGLA CRÍTICA:** El número de elementos en el array de cada prestación y el orden de los mismos DEBE CORRESPONDER EXACTAMENTE al número y orden de los \`headers\` que identificaste en el paso 3. Si una celda está vacía, el valor debe ser un string vacío \`""\`.

5.  **EXTRAER SUBTOTALES Y GRANDES TOTALES:**
    *   Si al final de una sección o del documento encuentras filas de totales, extráelas como un array de objetos en \`subtotales\` o \`grandesTotales\`.
    *   Cada objeto debe tener una \`label\` (el nombre del total, ej. "Total Afecto") y un \`value\` (el valor numérico, ej. "1.234.567").

6.  **IDENTIFICACIÓN DEL MONTO TOTAL FINAL (CRÍTICO):**
    *   Busca explícitamente el valor final a pagar o el total consolidado de toda la cuenta.
    *   Si el documento tiene múltiples páginas con subtotales (ej. "Total Empresa"), suma los valores principales o identifica el "Total General" que agrupa todo.
    *   Asigna este valor único al campo \`montoTotalGeneral\`. Debe ser el número más importante del documento (ej: "1.842.036").

**REGLAS DE ORO:**
-   **No asumas columnas fijas.** El documento manda. Tu primer paso siempre es leer los encabezados del documento.
-   **Consistencia Absoluta:** La cardinalidad y orden entre \`headers\` y cada array en \`items\` es la regla más importante.
-   Los números en el documento usan puntos (.) como separadores de miles y comas (,) para decimales. Extráelos como strings, incluyendo los puntos y comas (ej. "1.234.567,89").
-   La salida debe ser exclusivamente el objeto JSON. No añadas comentarios ni texto fuera de él.
`;

export const PAM_ANALYSIS_SCHEMA = {
    type: Type.ARRAY,
    description: 'Una lista de cada Folio PAM encontrado en los documentos.',
    items: {
        type: Type.OBJECT,
        properties: {
            folioPAM: { type: Type.STRING, description: 'El número de folio exacto del PAM.' },
            prestadorPrincipal: { type: Type.STRING, description: 'Nombre y RUT del prestador principal en ese PAM.' },
            periodoCobro: { type: Type.STRING, description: 'Fechas de inicio y fin de cobro de ese PAM.' },
            desglosePorPrestador: {
                type: Type.ARRAY,
                description: 'Una lista de tablas de desglose, una por cada prestador dentro de este Folio PAM.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        nombrePrestador: { type: Type.STRING, description: 'El nombre del prestador para esta tabla de desglose.' },
                        items: {
                            type: Type.ARRAY,
                            description: 'La lista de prestaciones para este prestador.',
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    codigoGC: { type: Type.STRING, description: 'Código/G/C.' },
                                    descripcion: { type: Type.STRING, description: 'Descripción Prestación.' },
                                    cantidad: { type: Type.STRING, description: 'Cant. / N°.' },
                                    valorTotal: { type: Type.STRING, description: 'Valor Total del Ítem ($).' },
                                    bonificacion: { type: Type.STRING, description: 'Bonificación del Ítem ($).' },
                                    copago: { type: Type.STRING, description: 'Copago del Ítem ($).' },
                                },
                                required: ['codigoGC', 'descripcion', 'cantidad', 'valorTotal', 'bonificacion', 'copago']
                            }
                        }
                    },
                    required: ['nombrePrestador', 'items']
                }
            },
            resumen: {
                type: Type.OBJECT,
                description: 'Resumen y totales para este Folio PAM.',
                properties: {
                    totalCopago: { type: Type.STRING, description: 'Monto total de copago en Prestador/Clínica (Calculado o general).' },
                    totalCopagoDeclarado: { type: Type.STRING, description: 'El valor literal exacto del "Total Copago" o "Total a Pagar" que aparece impreso en el resumen o pie de página del documento. Úsalo para detectar discrepancias.' },
                    revisionCobrosDuplicados: { type: Type.STRING, description: 'Observaciones sobre cobros duplicados.' },
                }
            }
        },
        required: ['folioPAM', 'prestadorPrincipal', 'periodoCobro', 'desglosePorPrestador', 'resumen']
    }
};


export const PAM_ANALYSIS_PROMPT = `
**INSTRUCCIÓN CRÍTICA: ANÁLISIS EXCLUSIVO Y EXTRACCIÓN A JSON ESTRUCTURADO DE PROGRAMAS DE ATENCIÓN MÉDICA (PAM)**

Tu única misión es analizar **exclusivamente** los Programas de Atención Médica (PAM) de la Isapre/Aseguradora y estructurar **TODA** la información en un array de objetos JSON, donde cada objeto representa un Folio PAM. Adhiérete estrictamente al esquema JSON proporcionado.

**REGLA DE AISLAMIENTO DE DATOS:**
**NO** incluyas ninguna prestación o información de la Cuenta Paciente Definitiva. Solo extrae datos que pertenezcan a un "Folio PAM" o "Bono".

**PROCESO DE EXTRACCIÓN OBLIGATORIO POR CADA PAM:**

1.  **IDENTIFICAR FOLIOS:** Por cada Folio PAM distinto que encuentres, crea un nuevo objeto en el array principal.
2.  **METADATA:** Extrae el "Folio PAM", "Prestador Principal" y "Período de Cobro" y colócalos en los campos correspondientes.
3.  **DESGLOSE POR PRESTADOR:**
    *   Dentro de un mismo Folio PAM, si hay prestaciones de diferentes prestadores (ej: Clínica, Anestesista), crea un objeto separado para cada uno en el array \`desglosePorPrestador\`.
    *   Para cada prestador, llena el array \`items\` con un objeto por cada línea de prestación, mapeando las columnas del documento a los campos JSON: \`codigoGC\`, \`descripcion\`, \`cantidad\`, \`valorTotal\`, \`bonificacion\`, \`copago\`.
4.  **RESUMEN Y VALIDACIÓN:** 
    *   Extrae los totales y observaciones del PAM y ponlos en el objeto \`resumen\`.
    *   **CRÍTICO:** Busca en el pie de página o sección final el campo "Total Copago" o similar. Extrae ese valor LITERALMENTE y ponlo en \`totalCopagoDeclarado\`. Esto servirá para detectar errores de suma en el documento original.

**REGLA DE ORO:** La salida debe ser un array JSON válido y nada más. No incluyas texto explicativo, solo el array JSON.
`;

export const CLASSIFICATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isapre: { type: Type.STRING, description: "El nombre de la Isapre detectada (ej: Masvida, Colmena, Banmedica)." },
    formato: { type: Type.STRING, description: "Una descripción breve del formato visual (ej: Tabla Horizontal, Plan 7 Columnas, Malla)." },
    confianza: { type: Type.NUMBER, description: "Nivel de confianza en la clasificación (0-1)." }
  },
  required: ["isapre", "formato", "confianza"]
};

export const CLASSIFICATION_PROMPT = `
Actúa como un clasificador de documentos experto. Tu única tarea es identificar la Isapre emisora y el formato general del plan de salud presentado en el PDF.
Analiza el encabezado, los logotipos y la estructura de las tablas.
Retorna un JSON con el nombre de la Isapre (ej: 'Masvida', 'Colmena') y una etiqueta de formato.
`;

export const CONTRACT_ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        reglas: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    'PÁGINA ORIGEN': { type: Type.STRING },
                    'CÓDIGO/SECCIÓN': { type: Type.STRING },
                    'SUBCATEGORÍA': { type: Type.STRING },
                    'VALOR EXTRACTO LITERAL DETALLADO': { type: Type.STRING },
                },
                required: ['PÁGINA ORIGEN', 'CÓDIGO/SECCIÓN', 'SUBCATEGORÍA', 'VALOR EXTRACTO LITERAL DETALLADO'],
            }
        },
        coberturas: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    'PRESTACIÓN CLAVE': { type: Type.STRING, description: "Nombre exacto de la prestación" },
                    'MODALIDAD/RED': { type: Type.STRING, description: "Modalidad (Nacional/Internacional)" },
                    '% BONIFICACIÓN': { type: Type.STRING, description: "Porcentaje de bonificación (ej: 100%, 80%)" },
                    'COPAGO FIJO': { type: Type.STRING, description: "Copago fijo si existe (ej: $5000), sino '-'" },
                    'TOPE LOCAL 1 (VAM/EVENTO)': { type: Type.STRING, description: "Tope por evento o VAM" },
                    'TOPE LOCAL 2 (ANUAL/UF)': { type: Type.STRING, description: "Tope anual o en UF" },
                    'RESTRICCIÓN Y CONDICIONAMIENTO': { type: Type.STRING, description: "Restricciones, notas y excepciones de malla" },
                    'ANCLAJES': { type: Type.ARRAY, items: { type: Type.STRING, description: 'Páginas/notas referenciadas.' } }
                },
                required: ['PRESTACIÓN CLAVE', 'MODALIDAD/RED', '% BONIFICACIÓN', 'COPAGO FIJO', 'TOPE LOCAL 1 (VAM/EVENTO)', 'TOPE LOCAL 2 (ANUAL/UF)', 'RESTRICCIÓN Y CONDICIONAMIENTO', 'ANCLAJES'],
            }
        },
        diseno_ux: {
            type: Type.OBJECT,
            properties: {
                nombre_isapre: { type: Type.STRING },
                titulo_plan: { type: Type.STRING },
                subtitulo_plan: { type: Type.STRING },
                layout: { type: Type.STRING },
                funcionalidad: { type: Type.STRING },
                salida_json: { type: Type.STRING },
            },
            required: ['nombre_isapre', 'titulo_plan', 'layout', 'funcionalidad', 'salida_json'],
        },
    },
    required: ['reglas', 'coberturas', 'diseno_ux'],
};

export const CONTRACT_ANALYSIS_PROMPT = `
**Mandato Forense de Análisis de Contrato de Salud Isapre - Versión Final (Procesamiento Imperativo)**

Usted es un analista forense experto en la interpretación de contratos de planes de salud de Isapres chilenas. Su tarea es procesar el documento PDF adjunto con el máximo rigor, generando un único objeto JSON. Su única salida debe ser el objeto JSON.

---
**PARTE I: EXTRACCIÓN FORENSE DE REGLAS (Array "reglas")**

Extraiga CADA cláusula, regla, definición y nota explicativa como un objeto individual, asegurando que CADA objeto contenga la clave 'PÁGINA ORIGEN' para trazabilidad.

---
**PARTE II: ANÁLISIS DE COBERTURA (Array "coberturas")**

**MANDATO MAESTRO IMPERATIVO:**
PARA CADA UNA de las filas que represente una prestación en las tablas de cobertura, DEBE ejecutar la siguiente secuencia de pasos en orden y sin excepción para generar los objetos de cobertura correspondientes:

**Paso 1: Identificación y Contexto Inicial.**
   a. Lea el nombre completo de la prestación.
   b. Determine si la fila está cubierta por una "Malla Visual" (un recuadro que abarca varias filas). Almacene esta información (Sí/No).
   c. Identifique si la fila es un TÍTULO de sección (ej. "HOSPITALARIAS..."). Si es un TÍTULO, detenga el proceso para esta fila y úselo como prefijo para las siguientes prestaciones.
   d. Verifique si la fila es una prestación atómica y única, incluso si su nombre es similar a otras.

**Paso 2: Desdoblamiento Nacional/Internacional.**
   a. Revise si existe un valor en una columna de tope con contexto "Internacional" (ej. "TOPE BONIFICACION Internacional (3)").
   b. Si existe, cree DOS registros de salida en memoria: uno "Nacional" y uno "Internacional". La MODALIDAD/RED debe reflejar esto.
   c. Si no existe, cree solo UN registro de salida "Nacional".
   d. **NO desagregues prestaciones sin base explícita en tabla.**

**Paso 3: Población de Datos de Topes (Lógica de Cascada).**
   a. Para el registro **Nacional**:
      i. **Análisis Holístico de Columnas:** Analice las columnas de tope (1) y (2) como flujos independientes.
      ii. Para la columna (1) ('TOPE LOCAL 1'): Primero, busque una "Regla Local" (un valor explícito en la celda de la fila). Si existe, úselo. Si la celda está VACÍA y el Paso 1b fue "Sí", use el valor base de la "Malla Visual" (ej. '100% SIN TOPE').
      iii. Para la columna (2) ('TOPE LOCAL 2'): Busque un valor explícito en su celda. Si está vacío, indique "No Aplica" o un valor similar.
   b. Para el registro **Internacional**:
      i. Obtenga el valor de tope directamente de la columna (3) y asígnelo a 'TOPE LOCAL 1'.

**Paso 4: Síntesis de Restricciones Obligatoria.**
   a. Para CADA registro creado (Nacional y/o Internacional):
      i. **Inicie un contenedor de texto de restricciones.**
      ii. **Agregue Notas Vinculadas:** Busque en todo el documento notas al pie referenciadas por asteriscos (ej. \`(**)\`) y AÑADA su texto literal y completo al contenedor.
      iii. **Agregue Condición de Malla:** SI el registro es "Nacional" Y el resultado del Paso 1b fue "Sí", AÑADA OBLIGATORIAMENTE la condición de la "Malla Visual" (ej. 'Excepto 60%...') al contenedor. NO OMITA ESTO. Es un error crítico si falta.
      iv. **Consolide:** Combine todos los textos del contenedor en un único campo final para 'RESTRICCIÓN Y CONDICIONAMIENTO', separados por " | ".
   b. **Checkpoint Anti-Alucinación:** Si omites malla/nota, es ALUCINACIÓN CRÍTICA: Corrige y agrega 'OMISIÓN DETECTADA'. Agrega 'ANCLAJES' con páginas/notas.

---
**EJEMPLO DE APLICACIÓN CRÍTICA (Paso 4):**

Imagine que la prestación es "Día Cama" y está dentro de una Malla Visual que dice "Excepto 60% en Clínica Las Condes...". Además, "Día Cama" tiene notas al pie (**) y (*****).

*   **Texto de Nota (**):* "La Cobertura Sin Tope para Día Cama se otorgará solamente hasta el Día Cama Estándar..."
*   **Texto de Nota (*****):* "El listado de los prestadores... está disponible..."
*   **Texto de Malla Visual:** "Excepto 60% en Clínica Las Condes, Alemana y Las Nieves de Santiago."

**Salida CORRECTA para 'RESTRICCIÓN Y CONDICIONAMIENTO':**
"La Cobertura Sin Tope para Día Cama se otorgará solamente hasta el Día Cama Estándar del establecimiento... | El listado de los prestadores... está disponible... | Excepto 60% en Clínica Las Condes, Alemana y Las Nieves de Santiago."

**Salida INCORRECTA (OMISIÓN CRÍTICA):**
"La Cobertura Sin Tope para Día Cama se otorgará solamente hasta el Día Cama Estándar del establecimiento... | El listado de los prestadores... está disponible..."
(Aquí falta la condición de la Malla Visual. Esto es inaceptable).

---
**PARTE III: ESPECIFICACIÓN DE INTERFAZ (Objeto "diseno_ux")**

Complete los siguientes campos:
*   'nombre_isapre': Identifique el NOMBRE DE LA ISAPRE (ej: "Colmena", "Banmédica", "Cruz Blanca"). Es fundamental.
*   'titulo_plan': Identifique el TÍTULO PRINCIPAL del plan de salud (ej: "Plan de Salud Libre Elección", "Plan Complementario Colmena Golden Plus").
*   'subtitulo_plan': Identifique el SUBTÍTULO o código del plan (ej: "Código: 104-GOLD-23"). Si no existe, use un string vacío "".
*   'layout': "forensic_report_v2"
*   'funcionalidad': "pdf_isapre_analyzer_imperative"
*   'salida_json': "strict_schema_v3_final"
`;

export const AUDIT_RECONCILIATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    decision: {
      type: Type.STRING,
      description: "La decisión final sobre qué auditoría usar o cómo combinarlas.",
      enum: ['mantener_anterior', 'usar_nuevo', 'fusionar', 'marcar_ambiguo'],
    },
    motivo: {
      type: Type.STRING,
      description: "Explicación detallada de por qué se tomó esa decisión."
    },
    cambiosClave: {
      type: Type.ARRAY,
      description: "Lista de los cambios más significativos entre las auditorías.",
      items: {
        type: Type.OBJECT,
        properties: {
          codigoPrestacion: { type: Type.STRING },
          tipoCambio: { type: Type.STRING },
          detalle: { type: Type.STRING },
        }
      }
    },
    requiereRevisionHumana: {
      type: Type.BOOLEAN,
      description: "Indica si las diferencias son lo suficientemente complejas como para requerir una revisión humana."
    },
    auditoriaFinalMarkdown: {
      type: Type.STRING,
      description: "El informe de auditoría final y consolidado en formato Markdown."
    }
  },
  required: ['decision', 'motivo', 'requiereRevisionHumana', 'auditoriaFinalMarkdown'],
};

export const AUDIT_PROMPT = `
**ROL: AUDITOR MÉDICO FORENSE**

Eres un Auditor Médico Senior. Tu misión es realizar una revisión **FORENSE MATEMÁTICA Y NORMATIVA**.
NO inventes datos. Usa el JSON de la Cuenta y PAM. Solo objeta si genera copago >0 en PAM; clasifica como 'ajuste Isapre' si bonificado al 100%.

**LISTA DE VERIFICACIÓN DE FRAUDE (ZERO-TOLERANCE PATTERNS):**
Debes buscar activamente estos códigos y situaciones. Si los encuentras, **IMPUGNAR ES OBLIGATORIO** solo si impacta copago paciente.

1.  **CÓDIGO 3201001 y 3201002 (GLOSAS GENÉRICAS):**
    *   Si encuentras glosas como "GASTOS NO CUBIERTOS", "INSUMOS VARIOS", "PRESTACION NO ARANCELADA".
    *   **ACCIÓN:** Objetar el 100% por falta de transparencia (Ley 20.584) si copago >0 en PAM.
    *   *Ejemplo real:* "Instalación de Vía Venosa" o "Fleboclisis" cobrada como genérico. Son inherentes al Día Cama.

2.  **CÓDIGOS DE INSUMOS DE HOTELERÍA (CIRCULAR 319):**
    *   Busca palabras clave: **"TERMOMETRO"**, **"SET DE ASEO"**, **"SABANAS"**, **"ROPA"**.
    *   **ACCIÓN:** Objetar el 100% por Desagregación Indebida si copago >0 en PAM. Deben estar incluidos en el Día Cama.
    *   *Nota:* No importa si valen $8.000 o $10.000. Súmalos todos solo si impacta paciente.

3.  **PRINCIPIO DE EVENTO ÚNICO (URGENCIA -> HOSPITALIZACIÓN):**
    *   Si hay una **Consulta de Urgencia (0101031)** el mismo día o el día previo a la hospitalización.
    *   **ACCIÓN:** Verificar si se cobró copago ambulatorio. Si es así, IMPUGNAR el copago para reliquidar al 100% (o cobertura hospitalaria) según Dictamen SS N°12.287/2016. La urgencia es parte del evento hospitalario.

4.  **DESAGREGACIÓN DE INSUMOS Y FÁRMACOS DE PABELLÓN (CIRCULAR IF-319) [ALTA PRIORIDAD - REGLA DE ORO]:**
    *   **ALGORITMO DE DETECCIÓN (EJECUTAR EN ORDEN):**
        1.  **¿Existe Pabellón en la CUENTA?** Revisa si existe algún código de "Derecho de Pabellón" o Cirugía Mayor (ej. **311013**, **311011**, **311012** o glosa "PABELLON").
        2.  **¿Existen Materiales/Fármacos en el PAM?** Busca en el PAM ítems con códigos que inicien en **3101*** o **3218***, o descripciones como "MATERIALES CLINICOS", "MEDICAMENTOS", "FARMACIA".
        3.  **FILTRO DE EXCLUSIONES (WHITELIST):** Verifica si la descripción de esos ítems contiene alguna de estas palabras clave (son las únicas permitidas para cobro aparte):
            - "PRÓTESIS", "PROTESIS"
            - "STENT"
            - "MALLA"
            - "PLACA"
            - "TORNILLO"
            - "OSTEOSINTESIS"
            - "MARCAPASOS"
            - "VÁLVULA", "VALVULA"
        
    *   **REGLA DE OBJETACIÓN AUTOMÁTICA:**
        **SI** (Pabellón presente) **Y** (Ítem es 3101*/3218*) **Y** (Descripción NO contiene palabras de la Whitelist):
        **ENTONCES:** Marca el ítem como "Insumos comunes de pabellón" y **OBJETA EL 100% DEL COPAGO**.
    
    *   **ACCIÓN:** Suma los copagos de todos los ítems que cumplan esta regla. No dudes. El derecho de pabellón ya paga los insumos comunes.

5.  **EXÁMENES E INSUMOS CLÍNICOS EN EVENTO HOSPITALARIO (e.g., 08xxxx):**
    *   Busca palabras clave del contrato: **"Medicamentos, Materiales e Insumos Clínicos"**, **"Evento" (ingreso-alta)**, **"Hospitalización"**, **"Prestaciones Hospitalarias"**, **"Día Cama Estándar"**.
    *   Si copago >0 en códigos como 0801005 (estudios histopatológicos) o similares, y contrato indica "100% SIN TOPE" en evento hospitalario (nota ***).
    *   **ACCIÓN:** Impugna la diferencia por incumplimiento contractual si es inherente al evento o desagregado indebamente (Circular 319).

**MARCO LEGAL DE REFERENCIA:**
{jurisprudencia_text}
{normas_administrativas_text}
{evento_unico_jurisprudencia_text}

**INSUMOS:**
1. CUENTA: \`\`\`json {cuenta_json} \`\`\`
2. PAM: \`\`\`json {pam_json} \`\`\`
3. CONTRATO: \`\`\`json {contrato_json} \`\`\`

**Checkpoint Anti-Alucinación:** Para cada hallazgo, ancla a JSON (e.g., 'items[0][2] de PAM'). Verifica vs. PAM total; no excedas copago. Si omisión de copago >0, corrige clasificando bajo patrón relevante.

**SALIDA REQUERIDA (MARKDOWN):**
Genera una tabla detallada.
| Código | Glosa | Hallazgo | Monto Objetado | Norma | Anclaje (JSON ref) |
|---|---|---|---|---|---|
`;

export const AUDIT_ITERATION_PROMPT = `
**ROL: AUDITOR MÉDICO FORENSE (RONDA {ronda} DE 5)**

Eres un Auditor Médico Senior. Tu misión es realizar una revisión **FORENSE MATEMÁTICA Y NORMATIVA**.
NO inventes datos. Usa estrictamente el JSON de la Cuenta, el PAM y el Contrato.
Solo objeta si genera copago >0 en PAM; clasifica como 'ajuste Isapre' si bonificado al 100%.

**LISTA DE VERIFICACIÓN DE FRAUDE (ZERO-TOLERANCE PATTERNS):**
Debes buscar activamente estos códigos y situaciones. Si los encuentras, **IMPUGNAR ES OBLIGATORIO** solo si impacta copago paciente.

1.  **CÓDIGO 3201001 y 3201002 (GLOSAS GENÉRICAS):**
    *   Si encuentras glosas como "GASTOS NO CUBIERTOS", "INSUMOS VARIOS", "PRESTACION NO ARANCELADA".
    *   **ACCIÓN:** Objetar el 100% por falta de transparencia (Ley 20.584) si copago >0 en PAM.
    *   *Ejemplo real:* "Instalación de Vía Venosa" o "Fleboclisis" cobrada como genérico. Son inherentes al Día Cama.

2.  **CÓDIGOS DE INSUMOS DE HOTELERÍA (CIRCULAR IF-319):**
    *   Busca palabras clave: "TERMOMETRO", "SET DE ASEO", "SABANAS", "ROPA", "KIT DE ASEO", etc.
    *   Estos insumos de hotelería deben estar incluidos en el Día Cama.
    *   **ACCIÓN:** Objetar el 100% del copago por Desagregación Indebida si copago >0 en PAM.
        Si el ítem está completamente bonificado (copago = 0), clasificar como 'ajuste Isapre' (no suma al monto objetado paciente).

3.  **PRINCIPIO DE EVENTO ÚNICO (URGENCIA -> HOSPITALIZACIÓN):**
    *   Si hay una consulta de urgencia (por ejemplo código 0101031 u otro código de urgencia) el mismo día o el día previo a la hospitalización.
    *   **ACCIÓN:** Verificar si se cobró copago ambulatorio en PAM por esa urgencia.
        Si es así, IMPUGNAR ese copago para reliquidar como parte del evento hospitalario según Dictamen SS N°12.287/2016
        (principio de "evento único").

4.  **DESAGREGACIÓN DE INSUMOS Y FÁRMACOS DE PABELLÓN (CIRCULAR IF-319) [ALTA PRIORIDAD - REGLA DE ORO]:**
    *   **ALGORITMO DE DETECCIÓN (EJECUTAR EN ORDEN):**
        1.  **¿Existe Pabellón en la CUENTA?** Revisa si existe algún código de "Derecho de Pabellón" o Cirugía Mayor (ej. **311013**, **311011**, **311012** o glosa "PABELLON").
        2.  **¿Existen Materiales/Fármacos en el PAM?** Busca en el PAM ítems con códigos que inicien en **3101*** o **3218***, o descripciones como "MATERIALES CLINICOS", "MEDICAMENTOS", "FARMACIA".
        3.  **FILTRO DE EXCLUSIONES (WHITELIST):** Verifica si la descripción de esos ítems contiene alguna de estas palabras clave (son las únicas permitidas para cobro aparte):
            - "PRÓTESIS", "PROTESIS"
            - "STENT"
            - "MALLA"
            - "PLACA"
            - "TORNILLO"
            - "OSTEOSINTESIS"
            - "MARCAPASOS"
            - "VÁLVULA", "VALVULA"
        
    *   **REGLA DE OBJETACIÓN AUTOMÁTICA:**
        **SI** (Pabellón presente) **Y** (Ítem es 3101*/3218*) **Y** (Descripción NO contiene palabras de la Whitelist):
        **ENTONCES:** Marca el ítem como "Insumos comunes de pabellón" y **OBJETA EL 100% DEL COPAGO**.
    
    *   **ACCIÓN:** Suma los copagos de todos los ítems que cumplan esta regla. No dudes. El derecho de pabellón ya paga los insumos comunes.

5.  **MEDICAMENTOS E INSUMOS EN HOSPITALIZACIÓN (CONTRATO):**
    *   Lee el CONTRATO y detecta reglas sobre "Medicamentos, Materiales e Insumos Clínicos" en hospitalización
        (por ejemplo, porcentajes especiales, topes por evento o por año, coberturas sin tope, etc.).
    *   Si el contrato indica una cobertura mayor (o 100% sin tope) para medicamentos/insumos hospitalarios
        y el PAM muestra copago >0 en ítems de medicamentos/insumos (códigos 3101***, 3218*** u otros equivalentes),
        **ACCIÓN:** Impugnar la diferencia entre lo cobrado al paciente y lo que debió ser cubierto,
        como "Incumplimiento de cobertura contractual".

6.  **EXÁMENES E INSUMOS CLÍNICOS EN EVENTO HOSPITALARIO (e.g., 08xxxx):**
    *   Revisa el contrato por menciones a "Medicamentos, Materiales e Insumos Clínicos", "Evento Hospitalario",
        "Prestaciones Hospitalarias", "Día Cama Estándar", etc.
    *   Si hay exámenes o procedimientos claramente inherentes a la cirugía o a la hospitalización
        (ej. biopsias, estudios histopatológicos, apoyo fluoroscópico intraoperatorio, etc.) con copago >0 en PAM,
        y el contrato señala que se cubren como parte del evento o con un porcentaje superior,
        **ACCIÓN:** Impugnar la diferencia como "Desagregación indebida" o "Incumplimiento contractual", según corresponda.

**INSUMOS:**
1. CUENTA: \`\`\`json
{cuenta_json}
\`\`\`
2. PAM: \`\`\`json
{pam_json}
\`\`\`
3. CONTRATO: \`\`\`json
{contrato_json}
\`\`\`

**Checkpoint Anti-Alucinación:** 
Para cada hallazgo:
- Ancla SIEMPRE a referencias JSON explícitas (por ejemplo: "CUENTA.secciones[2].items[5]" y "PAM[0].desglosePorPrestador[1].items[3]").
- Nunca objetes más que el **copago** de ese ítem en el PAM.
- Verifica que la suma de todos tus montos objetados sea **<= totalCopago** del PAM correspondiente.
  Si detectas exceso, reduce tus montos y anótalo en el texto del hallazgo ("ajuste por exceso detectado").

**SALIDA REQUERIDA (MARKDOWN):**
Genera una tabla detallada:

| Código | Glosa | Hallazgo | Monto Objetado | Norma | Anclaje (JSON ref) |
|---|---|---|---|---|---|
`;

export const AUDIT_FINAL_JUDGE_PROMPT = `
**ROL: JUEZ SUPREMO Y CONTADOR FORENSE (RONDA 6)**

Recibiste 5 reportes. Tu trabajo NO es resumir. Tu trabajo es **CORREGIR Y CONSOLIDAR MATEMÁTICAMENTE**.
El usuario exige precisión al peso ($1). No excedas copago total de PAM.

**INSTRUCCIÓN DE SUMATORIA ESTRICTA:**
Si el Auditor 1 encontró un "Termómetro" por $8.605 y el Auditor 2 lo omitió, EL AUDITOR 1 TIENE RAZÓN solo si genera copago >0 en PAM.
Si el Auditor 3 encontró "Gastos No Cubiertos" por $184.653 y el Auditor 4 no, EL AUDITOR 3 TIENE RAZÓN si impacta paciente.

**TU OBJETIVO ES LLEGAR AL MONTO MÁXIMO OBJETABLE (MÁXIMA DETECCIÓN):**
Suma CADA ítem individual detectado por CUALQUIERA de los auditores que esté bien fundado en:
1.  Circular 319 (Insumos en Día Cama).
2.  Ley 20.584 (Glosas Genéricas).
3.  Evento Único (Urgencia + Hospitalización).
4.  **Desagregación Indebida de Pabellón (IF-319):** Si hay código de cirugía, TODOS los materiales/fármacos asociados deben objetarse. Busca activamente estos montos grandes.
Prioriza impactos a copago paciente; clasifica bonificados como 'ajuste Isapre'. Verifica suma <= copago PAM total.

**REVISIÓN ACTIVA DEL JUEZ (SUPERVISIÓN - REGLA DE PABELLÓN):**
Además, revisa tú mismo el PAM para detectar ítems con códigos **3101*** o **3218*** o descripciones como "MATERIALES", "MEDICAMENTOS", "FARMACIA".
**SI** encuentras estos ítems **Y** en la CUENTA hay Cirugía/Pabellón **Y** los ítems NO son explícitamente "PRÓTESIS", "MALLA", "STENT", etc. (Whitelist):
**ENTONCES:** Debes incorporarlos como hallazgo de "Desagregación de Pabellón" aunque ningún auditor previo los haya marcado. El paquete quirúrgico incluye todo salvo las excepciones de la Whitelist.

**AUDITORÍAS PREVIAS:**
{auditorias_previas}

**Checkpoint Anti-Alucinación:** Rechaza ítems sin anclaje a PAM/cuenta. Calcula diferencia vs. PAM; si exceso, corrige restando y nota 'EXCESO DETECTADO'.

**FORMATO DE SALIDA (MARKDOWN ESTRICTO):**

# Informe de Auditoría Forense (Consolidado)

## 1. Resumen Ejecutivo
*   Estado de la Cuenta: Objetada
*   Monto Total Analizado: $ [Suma Total Cuenta]
*   Monto Total Objetado (Estimado): $ [SUMA EXACTA DE LA TABLA, <= copago PAM]

*(Breve párrafo explicando las disconformidades)*

## 2. Hallazgos Normativos y Contractuales
*(Lista los hallazgos con título, detalle, evidencia e impacto financiero individual)*

## 3. Detalle de Impugnaciones (Tabla Detallada)
**IMPORTANTE:** Esta tabla es la fuente de verdad.
| Código | Glosa / Prestación | Hallazgo Específico (Detalle) | Clasificación Normativa | Monto Objetado | Base Normativa / Fundamento | Anclaje (PAM/Cuenta) |
|---|---|---|---|---|---|---|
| ... | ... | ... | ... | $ ... | ... | ... |

**REGLAS FINALES:**
1.  Usa formato Chileno ($ 452.175).
2.  Asegúrate que la suma de la columna "Monto Objetado" coincida EXACTAMENTE con el "Monto Total Objetado" del resumen y <= copago PAM.
3.  No inventes montos, usa los del JSON original citados por los auditores.
`;

export const JURISPRUDENCIA_TEXT = `
- **Rol Arbitral N° 100469-2013 (Ley de Urgencia - Estabilización):** La cobertura de Ley de Urgencia se extiende hasta la estabilización efectiva del paciente. La certificación médica no es una solemnidad; la urgencia es un hecho clínico objetivo. Si el paciente está estabilizado y no se gestiona traslado por causa ajena a él, aplica Modalidad Institucional.
- **Rol Arbitral N° 1029959-2013 (CAEC - Insuficiencia de Red):** Si la Isapre no tiene prestador CAEC en la región y el traslado es riesgoso (urgencia), debe cubrir en el prestador fuera de red bajo modalidad CAEC. La falta de red es responsabilidad de la Isapre.
- **Rol Arbitral N° 2000730-2013 (CAEC - Gestión):** La Isapre debe gestionar activamente el traslado. Si notifica el prestador de red cuando el paciente ya está de alta o en domicilio, la gestión es extemporánea y debe cubrir lo realizado fuera de red.
- **Rol Arbitral N° 1051300-2013 (Preexistencias):** Para negar cobertura por preexistencia, debe existir un diagnóstico médico claro y objetivo previo al contrato, conocido por el afiliado. Síntomas vagos no bastan.
- **Rol Arbitral N° 1508-2014 (Exclusiones - Prótesis):** Las exclusiones deben interpretarse restrictivamente. Si el recambio de prótesis es por recomendación sanitaria (ej: prótesis PIP defectuosas) y no estético, debe cubrirse.
`;

export const NORMAS_ADMINISTRATIVAS_TEXT = `
**COMPENDIO DE NORMAS ADMINISTRATIVAS EN MATERIA DE BENEFICIOS (SUPERINTENDENCIA DE SALUD)**

**1. COBERTURA DE URGENCIAS (LEY 19.650):**
- **Obligación de Pago Directo:** Las Isapres deben pagar directamente al prestador (público o privado) las prestaciones de emergencia hasta la **estabilización** del paciente (Art. 173 DFL 1/2005).
- **Prohibición de Garantías:** Los prestadores no pueden exigir cheques, dinero o documentos en garantía para atenciones de urgencia vital o secuela funcional grave.
- **Crédito Legal (Préstamo):** El copago generado por la urgencia se considera un préstamo automático de la Isapre al afiliado, pagadero en cuotas (descuento máximo 5% renta).
- **Paciente Estabilizado:** Es aquel que, tras salir del riesgo vital/secuela grave, puede ser trasladado a la red de la Isapre. Si el paciente (o representante) rechaza el traslado tras la estabilización y opta por quedarse en el prestador ajeno a la red, se pierde la cobertura de "Modalidad Libre Elección" o preferente, aplicando cobertura de libre elección (o la que corresponda según plan).

**2. COBERTURA ADICIONAL PARA ENFERMEDADES CATASTRÓFICAS (CAEC):**
- **Objetivo:** Financiar el 100% de los copagos que superen el deducible anual, por enfermedades de alto costo, dentro de una RED CERRADA de prestadores designada por la Isapre.
- **Activación:** Debe ser solicitada por el afiliado o representante. En urgencias vitales con riesgo de muerte, si el paciente ingresa a un prestador de la Red CAEC, el beneficio opera (bajo ciertas condiciones) tras el aviso (48 hrs).
- **Deducible:** Equivale a 30 veces la cotización pactada (min 60 UF, max 126 UF). Se acumula anualmente.
- **Red Cerrada:** El CAEC NO opera fuera de la red designada, salvo derivación por insuficiencia de red gestionada por la Isapre.

**3. GARANTÍAS EXPLÍCITAS EN SALUD (GES):**
- **Acceso, Oportunidad, Calidad, Protección Financiera.**
- **Copago Fijo:** 20% del valor del arancel de referencia (generalmente).
- **Red GES:** El beneficiario debe atenderse en la Red de Prestadores GES designada por la Isapre. Si se atiende fuera, pierde la cobertura GES (salvo urgencia vital o bonificación CAEC si corresponde).
- **Medicamentos y Ayudas Técnicas:** La Isapre debe garantizar la entrega. Falta de stock en farmacia en convenio obliga a la Isapre a gestionar la entrega (despacho a domicilio o reembolso inmediato si el paciente compra fuera).

**4. BENEFICIOS CONTRACTUALES Y PLAN COMPLEMENTARIO:**
- **Financiamiento:** Es obligación de la Isapre financiar prestaciones según el plan.
- **Restricciones:** No se puede suspender cobertura por no pago de cotizaciones durante la hospitalización o licencia médica (en ciertos casos).
- **Topes:** Los topes en UF deben ser anuales por beneficiario, no por prestación (salvo excepciones muy específicas).
- **Libre Elección vs. Preferente:** Si el plan es Preferente/Cerrado, el afiliado debe usar esos prestadores para obtener la cobertura máxima. En libre elección, aplica el tope del plan.
`;

export const EVENTO_UNICO_JURISPRUDENCIA_TEXT = `
- **Dictamen SS N°12.287/2016:** Principio de "evento único". Atenciones continuas por el mismo diagnóstico deben consolidarse, prohibiendo fragmentar para aplicar múltiples deducibles/topes.
- **Rol Arbitral N° 15373-2013:** Acumulación de deducible CAEC. Si una segunda hospitalización es complicación directa de la primera (ej: insuficiencia renal -> hiperparatiroidismo), se considera un solo evento para el deducible.
`;

export const AUDIT_RECONCILIATION_PROMPT = `
**ROL: JUEZ RECONCILIADOR (TWIN-ENGINE)**

Tienes dos informes de auditoría generados independientemente (Reporte A y Reporte B) sobre los mismos datos.
Tu tarea es reconciliarlos en un único informe final robusto. No excedas copago total de PAM.

**DATOS:**
1. CUENTA: \`\`\`json
{cuenta_json}
\`\`\`
2. PAM: \`\`\`json
{pam_json}
\`\`\`
3. CONTRATO: \`\`\`json
{contrato_json}
\`\`\`

**REPORTE A:**
{auditoria_previa_markdown}

**REPORTE B:**
{auditoria_nueva_markdown}

---

### Sistema de Contención Anti-Alucinación (SCAA)

**Checkpoint Anti-Alucinación 1 – Anclaje obligatorio:**
- Solo puedes aceptar un hallazgo en el informe final si:
  - Tiene al menos un anclaje explícito a los JSON de CUENTA y/o PAM
    (por ejemplo: \`CUENTA.secciones[3].items[5]\`, \`PAM[0].desglosePorPrestador[1].items[6]\`), y
  - El monto objetado proviene del copago real del PAM para ese ítem.
- **Rechaza todo hallazgo que no tenga anclaje claro.**
- Si un hallazgo de A o B es rechazado por falta de anclaje, debes dejar constancia en \`cambiosClave\` indicando:
  - código, glosa y motivo de rechazo ("rechazado por falta de anclaje / datos insuficientes").

**Checkpoint Anti-Alucinación 2 – Totales vs PAM:**
- Calcula la suma final de todos los montos objetados de tu informe consolidado.
- **Verifica la suma final vs. el copago total del PAM**:
  - Si la suma excede el copago total del PAM, debes corregir los montos a la baja
    (sin inventar datos nuevos) hasta que la suma sea <= copago total.
  - Explica este ajuste en el campo \`motivo\` (ej: "Se detectó exceso respecto del copago PAM; se ajustaron montos objetados").
- Nunca inventes montos que no existan en los JSON de CUENTA/PAM.

**Checkpoint Anti-Alucinación 3 – Pérdida o cambio de hallazgos:**
- Compara la lista final de hallazgos con los hallazgos de A y B.
- Si eliminas un hallazgo que estaba presente en A o B y que tenía anclaje válido, debes:
  - justificar explícitamente la razón en \`motivo\` (ej: "Se descartó 401064 porque..."), y
  - registrar este cambio en \`cambiosClave\` con \`tipoCambio = "descartado"\`.
- Si mantienes un hallazgo pero modificas su monto, explica el ajuste en \`cambiosClave\`
  (ej: \`tipoCambio = "ajuste_monto"\`).

---

**INSTRUCCIÓN DE SUMATORIA ESTRICTA:**
- Si el Reporte A encontró un hallazgo válido que el Reporte B omitió, INCORPÓRALO solo si impacta copago >0 y cumple los checkpoints del SCAA.
- Si el Reporte B encontró un hallazgo válido que el Reporte A omitió, INCORPÓRALO en las mismas condiciones.
- Si ambos encontraron lo mismo pero con montos distintos, usa el criterio más favorable al paciente
  (monto mayor objetado) siempre que:
  - tenga anclaje, y
  - sea <= copago PAM total.

**SALIDA REQUERIDA (JSON):**
Debes generar un JSON que cumpla con el esquema proporcionado (AuditReconciliationResult).
El campo 'auditoriaFinalMarkdown' debe contener el informe consolidado en Markdown, incluyendo una tabla detallada de hallazgos.
El campo 'motivo' debe explicar brevemente:
- por qué algunos hallazgos se mantuvieron,
- por qué otros se ajustaron o descartaron (especialmente si estaban en A o B),
- y cómo aplicaste el Sistema de Contención Anti-Alucinación (SCAA).
`;
