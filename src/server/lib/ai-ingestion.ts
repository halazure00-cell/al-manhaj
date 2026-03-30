import { PrismaClient } from '@prisma/client';

interface ChunkCandidate {
  heading: string | null;
  content: string;
}

const MAX_CHUNK_WORDS = 130;

function sanitize(input: string): string {
  return input.replace(/\r/g, '').trim();
}

function splitByHeading(content: string): ChunkCandidate[] {
  const lines = sanitize(content).split('\n');
  const chunks: ChunkCandidate[] = [];

  let heading: string | null = null;
  let buffer: string[] = [];

  const flushBuffer = () => {
    const text = buffer.join('\n').trim();
    if (!text) return;
    chunks.push({ heading, content: text });
    buffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const isHeading = /^#{1,4}\s+/.test(line) || /^\d+[\.)]\s+/.test(line);

    if (isHeading) {
      flushBuffer();
      heading = line.replace(/^#{1,4}\s+/, '');
      continue;
    }

    if (line.length === 0) {
      flushBuffer();
      continue;
    }

    buffer.push(line);
  }

  flushBuffer();

  if (chunks.length === 0 && sanitize(content)) {
    return [{ heading: null, content: sanitize(content) }];
  }

  return chunks;
}

function splitLongChunk(chunk: ChunkCandidate): ChunkCandidate[] {
  const words = chunk.content.split(/\s+/).filter(Boolean);
  if (words.length <= MAX_CHUNK_WORDS) return [chunk];

  const result: ChunkCandidate[] = [];
  for (let i = 0; i < words.length; i += MAX_CHUNK_WORDS) {
    const segment = words.slice(i, i + MAX_CHUNK_WORDS).join(' ');
    result.push({
      heading: chunk.heading,
      content: segment,
    });
  }

  return result;
}

export function buildNoteChunks(content: string) {
  const byHeading = splitByHeading(content);
  const flattened = byHeading.flatMap(splitLongChunk);

  return flattened
    .map((chunk, index) => ({
      chunkIndex: index,
      heading: chunk.heading,
      content: chunk.content,
      tokenCount: chunk.content.split(/\s+/).filter(Boolean).length,
    }))
    .filter((chunk) => chunk.content.length > 0);
}

export async function rebuildNoteChunks(prisma: PrismaClient, noteId: string, content: string) {
  const chunks = buildNoteChunks(content);

  const db = prisma as any;
  await db.noteChunk.deleteMany({ where: { noteId } });
  if (chunks.length > 0) {
    await db.noteChunk.createMany({
      data: chunks.map((chunk: any) => ({ noteId, ...chunk })),
    });
  }

  return chunks.length;
}
