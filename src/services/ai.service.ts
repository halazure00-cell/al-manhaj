import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are Al-Manhaj AI, a strict analytical partner and logical fallacy checker. Your primary language is Indonesian. You MUST base your answers SOLELY on the provided Context Data from the user's library, study progress, and habit logs. If evidence is weak or missing, explicitly state uncertainty and provide concrete data that user should add. Never hallucinate citations. Keep your answers practical, concise, and actionable.`;

type AiCoachMode = 'CHAT' | 'PLAN' | 'REVIEW';
type ChatRole = 'USER' | 'AI';

const COACH_MODE_GUIDE: Record<AiCoachMode, string> = {
  CHAT: 'Mode CHAT: jawab pertanyaan user dengan analisis dan evidensi.',
  PLAN: 'Mode PLAN: hasilkan rencana belajar 7 hari yang konkret dengan prioritas kitab/catatan.',
  REVIEW: 'Mode REVIEW: evaluasi progres, hambatan, dan rekomendasi perbaikan pekanan.',
};

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
  return err.error?.message || err.message || 'Kuota AI tidak tersedia untuk project saat ini.';
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

function normalizeTokens(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2);
}

function scoreLexical(queryTokens: Set<string>, text: string) {
  const tokens = normalizeTokens(text);
  if (tokens.length === 0) return 0;

  let hits = 0;
  for (const token of tokens) {
    if (queryTokens.has(token)) hits += 1;
  }

  return hits / Math.max(6, tokens.length);
}

function scoreSemanticApprox(queryTokens: Set<string>, text: string) {
  const tokens = new Set(normalizeTokens(text));
  if (tokens.size === 0 || queryTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of queryTokens) {
    if (tokens.has(token)) intersection += 1;
  }

  const union = new Set([...tokens, ...queryTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

function extractCitations(contextChunks: RetrievedChunk[]) {
  return contextChunks
    .map((chunk, index) => `[#${index + 1}] ${chunk.noteTitle}${chunk.heading ? ` > ${chunk.heading}` : ''}`)
    .join('\n');
}

interface RetrievedChunk {
  chunkId: string;
  noteId: string;
  noteTitle: string;
  bookTitle: string | null;
  heading: string | null;
  content: string;
  lexicalScore: number;
  semanticScore: number;
  finalScore: number;
}

interface ProcessAiInput {
  prompt: string;
  mode: AiCoachMode;
  sessionId?: string;
  deviceKey?: string;
}

export async function processAiQuery(input: ProcessAiInput, prisma: PrismaClient) {
  const { prompt, mode, sessionId, deviceKey } = input;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.includes('your_gemini_api_key')) {
    return {
      response: "⚠️ **API Key Gemini Terkunci dengan Nilai yang Salah.**\n\nSistem mendeteksi bahwa API Key bawaan telah tertimpa oleh *placeholder* (`MY_GEMINI_API_KEY`) dari konfigurasi awal.\n\nKarena Anda tidak dapat mengubah Secrets secara manual di AI Studio, **satu-satunya cara untuk memperbaiki ini adalah dengan membuat Project/Applet baru.**\n\nDi project baru nanti, sistem akan kembali menyuntikkan API Key bawaan yang asli secara otomatis. Silakan buat project baru dan ulangi prompt Anda.",
      context: { notes: [], books: [], chunks: [], confidence: 'LOW' },
      sessionId: null,
      mode,
      aiMessageId: null,
    };
  }

  const db = prisma as any;

  const resolvedSession = sessionId
    ? await db.chatSession.upsert({
        where: { id: sessionId },
        update: { updatedAt: new Date(), lastMode: mode },
        create: { id: sessionId, deviceKey: deviceKey ?? null, lastMode: mode },
      })
    : await db.chatSession.create({
        data: {
          deviceKey: deviceKey ?? null,
          lastMode: mode,
          title: prompt.slice(0, 80),
        },
      });

  const userMessage = await db.chatMessage.create({
    data: {
      sessionId: resolvedSession.id,
      role: 'USER',
      content: prompt,
      mode,
    },
  });

  const queryTokens = new Set(normalizeTokens(prompt));

  const [chunksRaw, books, recentMessages, progress] = await Promise.all([
    db.noteChunk.findMany({
      include: { note: { include: { book: true } } },
      take: 240,
      orderBy: { updatedAt: 'desc' },
    }),
    db.book.findMany({ take: 8, orderBy: { updatedAt: 'desc' } }),
    db.chatMessage.findMany({
      where: { sessionId: resolvedSession.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    db.$transaction(async (tx: any) => {
      const totalBooks = await tx.book.count();
      const completedBooks = await tx.book.count({ where: { status: 'COMPLETED' as any } });
      const totalNotes = await tx.note.count();
      const last14Logs = await tx.habitLog.findMany({
        where: {
          logDate: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        },
      });
      const completedLogs = last14Logs.filter((log) => log.isCompleted).length;

      return {
        totalBooks,
        completedBooks,
        totalNotes,
        completedLogs,
        totalLogs: last14Logs.length,
      };
    }),
  ]);

  const scoredChunks = chunksRaw
    .map((chunk) => {
      const lexicalScore = scoreLexical(queryTokens, `${chunk.note.title} ${chunk.content}`);
      const semanticScore = scoreSemanticApprox(queryTokens, `${chunk.note.title} ${chunk.content}`);
      const finalScore = lexicalScore * 0.6 + semanticScore * 0.4;

      return {
        chunkId: chunk.id,
        noteId: chunk.noteId,
        noteTitle: chunk.note.title,
        bookTitle: chunk.note.book?.title ?? null,
        heading: chunk.heading,
        content: chunk.content,
        lexicalScore,
        semanticScore,
        finalScore,
      } satisfies RetrievedChunk;
    })
    .filter((chunk) => chunk.finalScore > 0)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 8);

  const retrievedNoteIds = Array.from(new Set(scoredChunks.map((chunk) => chunk.noteId)));
  const retrievedNotes = await db.note.findMany({
    where: { id: { in: retrievedNoteIds } },
    include: { book: true },
  });

  const topBooks = books.slice(0, 5);

  const averageConfidenceScore = scoredChunks.length
    ? scoredChunks.reduce((sum, chunk) => sum + chunk.finalScore, 0) / scoredChunks.length
    : 0;

  const confidence = averageConfidenceScore >= 0.16 ? 'HIGH' : averageConfidenceScore >= 0.07 ? 'MEDIUM' : 'LOW';

  const contextData = scoredChunks.length
    ? scoredChunks
        .map(
          (chunk, index) =>
            `[${index + 1}] NOTE: ${chunk.noteTitle}${chunk.heading ? ` / ${chunk.heading}` : ''}\n${chunk.content}`
        )
        .join('\n\n')
    : 'Tidak ada chunk yang relevan ditemukan dari catatan user.';

  const studyStats = `
PROGRESS SNAPSHOT:
- Total kitab: ${progress.totalBooks}
- Kitab selesai: ${progress.completedBooks}
- Total catatan: ${progress.totalNotes}
- Habit 14 hari: ${progress.completedLogs}/${progress.totalLogs} selesai
`;

  const memorySnippet = recentMessages
    .reverse()
    .map((msg) => `${msg.role === 'USER' ? 'USER' : 'AI'}: ${msg.content}`)
    .join('\n');

  const uncertaintyGuide =
    confidence === 'LOW'
      ? '\nWAJIB: Evidence lemah. Jelaskan ketidakpastian, data yang kurang, dan berikan template catatan yang perlu user tambahkan.'
      : '';

  const promptEnvelope = `
${COACH_MODE_GUIDE[mode]}

CONVERSATION MEMORY (recent):
${memorySnippet || '(kosong)'}

CONTEXT DATA (retrieved chunks):
${contextData}

${studyStats}

CONFIDENCE: ${confidence}
${uncertaintyGuide}

Aturan output:
1) Gunakan bahasa Indonesia.
2) Wajib bagian "Evidensi" berisi daftar [#] yang dipakai.
3) Jika mode PLAN: berikan rencana 7 hari dengan checklist harian.
4) Jika mode REVIEW: berikan evaluasi + tindakan perbaikan pekan depan.
5) Jangan gunakan data di luar context.

USER PROMPT:
${prompt}`;

  const ai = new GoogleGenAI({ apiKey });
  const models = getCandidateModels();
  let lastError: ProviderError | null = null;
  let generatedText = '';
  let usedModel = models[0] ?? 'unknown';

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: promptEnvelope,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: mode === 'CHAT' ? 0.2 : 0.3,
        },
      });

      generatedText = response.text ?? '';
      usedModel = model;
      break;
    } catch (error) {
      const providerError = error as ProviderError;
      lastError = providerError;

      if (!isQuotaError(providerError)) {
        throw error;
      }

      console.warn(`[ai] model ${model} terkena limit quota/rate. Mencoba model berikutnya jika tersedia.`);
    }
  }

  if (!generatedText) {
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

  const citations = extractCitations(scoredChunks);
  const finalResponse = `${generatedText.trim()}\n\n---\n**Evidensi:**\n${citations || '- Tidak ada evidensi kuat (context kosong).'}`;

  const aiMessage = await db.chatMessage.create({
    data: {
      sessionId: resolvedSession.id,
      role: 'AI',
      content: finalResponse,
      mode,
      retrievalMeta: {
        confidence,
        usedModel,
        topChunks: scoredChunks.map((chunk) => ({
          chunkId: chunk.chunkId,
          noteId: chunk.noteId,
          score: Number(chunk.finalScore.toFixed(4)),
        })),
      },
    },
  });

  if (recentMessages.length >= 8) {
    const summary = recentMessages
      .reverse()
      .slice(-6)
      .map((msg) => `${msg.role === 'USER' ? 'U' : 'A'}: ${msg.content.slice(0, 160)}`)
      .join(' | ');

    await db.chatSession.update({
      where: { id: resolvedSession.id },
      data: {
        summary,
        lastMode: mode,
      },
    });
  }

  return {
    response: finalResponse,
    sessionId: resolvedSession.id,
    mode,
    aiMessageId: aiMessage.id,
    context: {
      confidence,
      notes: retrievedNotes.map((note) => ({ id: note.id, title: note.title })),
      books: topBooks.map((book) => ({ id: book.id, title: book.title })),
      chunks: scoredChunks.map((chunk) => ({
        id: chunk.chunkId,
        noteId: chunk.noteId,
        noteTitle: chunk.noteTitle,
        heading: chunk.heading,
        score: Number(chunk.finalScore.toFixed(4)),
        excerpt: chunk.content.slice(0, 240),
      })),
      metrics: {
        userMessageId: userMessage.id,
        usedModel,
      },
    },
  };
}
