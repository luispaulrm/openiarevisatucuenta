import OpenAI from "openai";

let client: OpenAI | null = null;

const getClient = (): OpenAI => {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("API key for OpenAI is not configured.");
  }
  client = new OpenAI({ apiKey });
  return client;
};

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

async function extractTextFromPdf(file: UploadedFile): Promise<string> {
  // Placeholder: the buffer might already contain parsed text.
  // Replace this with your Vision/OCR pipeline when available.
  return file.buffer.toString("utf8");
}

export async function analyzeDocumentWithOpenAI<T = any>(
  plainText: string,
  systemPrompt: string,
  schemaDescription?: string
): Promise<T> {
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const clientInstance = getClient();

  const systemInstructions =
    systemPrompt +
    (schemaDescription
      ? `\n\nDEVUELVE EXCLUSIVAMENTE UN JSON VÁLIDO QUE SIGA ESTE ESQUEMA: ${schemaDescription}`
      : "\n\nDEVUELVE EXCLUSIVAMENTE UN JSON VÁLIDO.");

  const response = await clientInstance.responses.create({
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: systemInstructions,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: plainText,
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  const message = response.output?.[0]?.content?.[0];
  if (!message || message.type !== "output_text") {
    throw new Error("Respuesta inesperada de OpenAI");
  }

  const raw = message.text || "";
  return JSON.parse(raw) as T;
}

export async function analyzePdfWithOpenAI<T = any>(
  file: UploadedFile,
  systemPrompt: string,
  schemaDescription?: string
): Promise<T> {
  const plainText = await extractTextFromPdf(file);
  return analyzeDocumentWithOpenAI<T>(plainText, systemPrompt, schemaDescription);
}
