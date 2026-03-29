import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';

const SYSTEM_INSTRUCTION = `You are Al-Manhaj AI, a strict analytical partner and logical fallacy checker. Your primary language is Indonesian. You MUST base your answers SOLELY on the provided Context Data, which consists of the user's personal notes on classical Islamic theology (Asy'ari-Maturidi), Shafi'i fiqh, logic, and history. DO NOT synthesize external theological concepts (especially generic internet theology or Salafi-Wahabi frameworks). If the answer is not in the Context Data, state clearly that the user's library lacks data on this specific topic. Be straightforward, highly analytical, and to the point. Avoid generic or overly enthusiastic AI greetings.`;

interface RetryInfoDetail {
  '@type'?: string;
  retryDelay?: string;
}

interface ProviderError extends Error {
  status?: number;
  message: string;
  error?: {
    status?: string;
    message?: string;
    details?: unknown[];
  };
}

export class AiQuotaError extends Error {
  readonly code = 'AI_QUOTA_EXCEEDED';

  constructor(
    message: string,
    readonly retryAfterSeconds: number | null,
    readonly details: Record<string, unknown> | null = null
  ) {
    super(message);
    this.name = 'AiQuotaError';
  }
}

function parseRetryDelayToSeconds(input?: string): number | null {
  if (!input) return null;
  const match = input.match(/^(\d+(?:\.\d+)?)s$/);
  if (!match) return null;
  return Math.max(1, Math.ceil(Number(match[1])));
}

function extractRetryAfterSeconds(err: ProviderError): number | null {
  const details = err.error?.details;
  if (!Array.isArray(details)) return null;

  const retryInfo = details.find(
    (entry): entry is RetryInfoDetail =>
      typeof entry === 'object' &&
      entry !== null &&
      '@type' in entry &&
      (entry as RetryInfoDetail)['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
  );

  return parseRetryDelayToSeconds(retryInfo?.retryDelay);
}

function extractProviderMessage(err: ProviderError): string {
  return err.error?.message || err.message || 'Quota AI tidak tersedia untuk project saat ini.';
}

function isQuotaError(err: ProviderError): boolean {
  const normalizedMessage = extractProviderMessage(err).toLowerCase();
  const statusText = (err.error?.status ?? '').toLowerCase();

  return (
    err.status === 429 ||
    statusText.includes('resource_exhausted') ||
    normalizedMessage.includes('quota exceeded') ||
    normalizedMessage.includes('resource exhausted')
  );
}

function getCandidateModels(): string[] {
  const primaryModel = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const fallbackModels = (process.env.GEMINI_MODEL_FALLBACKS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set([primaryModel, ...fallbackModels]));
}

export async function processAiQuery(prompt: string, prisma: PrismaClient) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.includes('your_gemini_api_key')) {
    return {
      response: "⚠️ **API Key Gemini Terkunci dengan Nilai yang Salah.**\n\nSistem mendeteksi bahwa API Key bawaan telah tertimpa oleh *placeholder* (`MY_GEMINI_API_KEY`) dari konfigurasi awal.\n\nKarena Anda tidak dapat mengubah Secrets secara manual di AI Studio, **satu-satunya cara untuk memperbaiki ini adalah dengan membuat Project/Applet baru.**\n\nDi project baru nanti, sistem akan kembali menyuntikkan API Key bawaan yang asli secara otomatis. Silakan buat project baru dan ulangi prompt Anda.",
      context: { notes: [], books: [] }
    };
  }

  // 1. Extract keywords for retrieval (simple MVP strategy)
  // Remove common Indonesian stop words and short words
  const stopWords = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'adalah', 'ini', 'itu', 'dengan', 'dalam'];
  const keywords = prompt
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .split(' ')
    .filter(w => w.length > 3 && !stopWords.includes(w));

  let contextData = '';
  let retrievedNotes: any[] = [];
  let retrievedBooks: any[] = [];

  // 2. Retrieve Context from Database
  if (keywords.length > 0) {
    // Build OR conditions for Notes
    const noteConditions = keywords.map(kw => ({
      OR: [
        { title: { contains: kw } },
        { content: { contains: kw } }
      ]
    }));

    retrievedNotes = await prisma.note.findMany({
      where: { OR: noteConditions },
      take: 5,
      include: { book: true }
    });

    // Build OR conditions for Books
    const bookConditions = keywords.map(kw => ({
      OR: [
        { title: { contains: kw } },
        { author: { contains: kw } }
      ]
    }));

    retrievedBooks = await prisma.book.findMany({
      where: { OR: bookConditions },
      take: 3
    });

    // Format Context String
    if (retrievedNotes.length > 0) {
      contextData += '--- RETRIEVED NOTES ---\n';
      retrievedNotes.forEach(note => {
        contextData += `Title: ${note.title}\n`;
        if (note.book) contextData += `Related Book: ${note.book.title}\n`;
        contextData += `Content: ${note.content}\n\n`;
      });
    }

    if (retrievedBooks.length > 0) {
      contextData += '--- RETRIEVED BOOKS IN LIBRARY ---\n';
      retrievedBooks.forEach(book => {
        contextData += `Title: ${book.title}\nAuthor: ${book.author}\nCategory: ${book.category}\nStatus: ${book.status}\n\n`;
      });
    }
  }

  if (!contextData) {
    contextData = "No relevant context found in the user's database for the given keywords.";
  }

  // 3. Call Gemini API with model fallback
  const ai = new GoogleGenAI({ apiKey });
  const models = getCandidateModels();

  const fullPrompt = `CONTEXT DATA:\n${contextData}\n\nUSER PROMPT:\n${prompt}`;

  let lastError: ProviderError | null = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
        }
      });

      return {
        response: response.text,
        context: {
          notes: retrievedNotes.map(n => ({ id: n.id, title: n.title })),
          books: retrievedBooks.map(b => ({ id: b.id, title: b.title }))
        }
      };
    } catch (error) {
      const providerError = error as ProviderError;
      lastError = providerError;

      if (!isQuotaError(providerError)) {
        throw error;
      }

      console.warn(`[ai] model ${model} terkena limit quota/rate. Mencoba model berikutnya jika tersedia.`);
    }
  }

  if (lastError && isQuotaError(lastError)) {
    const retryAfterSeconds = extractRetryAfterSeconds(lastError);
    throw new AiQuotaError(
      'Kuota AI project saat ini habis atau billing belum aktif. Cek AI Studio quota/billing, atau gunakan model fallback lain.',
      retryAfterSeconds,
      {
        reason: 'RESOURCE_EXHAUSTED',
        attemptedModels: models,
      }
    );
  }

  throw lastError ?? new Error('Gagal memproses permintaan AI.');
}
