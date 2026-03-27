import type { Prisma } from '@prisma/client';

export class ValidationError extends Error {
  status = 400;
  details?: unknown;
  constructor(message: string, details?: unknown) {
    super(message);
    this.details = details;
  }
}

function ensureObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('Request body must be an object');
  }
  return value as Record<string, unknown>;
}

function readString(obj: Record<string, unknown>, key: string, required = true): string | undefined {
  const value = obj[key];
  if ((value === undefined || value === null) && !required) return undefined;
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`Field \"${key}\" must be a non-empty string`);
  }
  return value;
}

function readNumber(obj: Record<string, unknown>, key: string, required = true): number | undefined {
  const value = obj[key];
  if ((value === undefined || value === null) && !required) return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new ValidationError(`Field \"${key}\" must be a valid number`);
  }
  return num;
}

export function parseBookCreate(input: unknown): Prisma.BookCreateInput {
  const o = ensureObject(input);
  return {
    title: readString(o, 'title', true)!,
    author: readString(o, 'author', true)!,
    category: readString(o, 'category', true)!,
    stageLevel: readNumber(o, 'stageLevel', true)!,
    totalPages: readNumber(o, 'totalPages', true)!,
    readPages: readNumber(o, 'readPages', false) ?? 0,
    status: readString(o, 'status', false) ?? 'NOT_STARTED',
  };
}

export function parseBookUpdate(input: unknown): Prisma.BookUpdateInput {
  const o = ensureObject(input);
  const parsed: Prisma.BookUpdateInput = {};
  const title = readString(o, 'title', false);
  const author = readString(o, 'author', false);
  const category = readString(o, 'category', false);
  const stageLevel = readNumber(o, 'stageLevel', false);
  const totalPages = readNumber(o, 'totalPages', false);
  const readPages = readNumber(o, 'readPages', false);
  const status = readString(o, 'status', false);

  if (title !== undefined) parsed.title = title;
  if (author !== undefined) parsed.author = author;
  if (category !== undefined) parsed.category = category;
  if (stageLevel !== undefined) parsed.stageLevel = stageLevel;
  if (totalPages !== undefined) parsed.totalPages = totalPages;
  if (readPages !== undefined) parsed.readPages = readPages;
  if (status !== undefined) parsed.status = status;

  return parsed;
}

export function parseBooksBatch(input: unknown): Prisma.BookCreateManyInput[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new ValidationError('Body must be a non-empty array');
  }
  return input.map((item) => parseBookCreate(item));
}

export function parseNoteCreate(input: unknown): Prisma.NoteUncheckedCreateInput {
  const o = ensureObject(input);
  return {
    title: readString(o, 'title', true)!,
    content: readString(o, 'content', true)!,
    bookId: o.bookId === null ? null : readString(o, 'bookId', false),
  };
}

export function parseNoteUpdate(input: unknown): Prisma.NoteUncheckedUpdateInput {
  const o = ensureObject(input);
  const parsed: Prisma.NoteUncheckedUpdateInput = {};
  const title = readString(o, 'title', false);
  const content = readString(o, 'content', false);

  if (title !== undefined) parsed.title = title;
  if (content !== undefined) parsed.content = content;

  if (Object.prototype.hasOwnProperty.call(o, 'bookId')) {
    parsed.bookId = o.bookId === null ? null : readString(o, 'bookId', false);
  }

  return parsed;
}

export function parseNoteLink(input: unknown) {
  const o = ensureObject(input);
  const targetNoteId = readString(o, 'targetNoteId', true)!;
  return { targetNoteId };
}

export function parseHabitCreate(input: unknown): Prisma.HabitCreateInput {
  const o = ensureObject(input);
  const frequency = readString(o, 'frequency', false) ?? 'DAILY';
  if (!['DAILY', 'WEEKLY'].includes(frequency)) {
    throw new ValidationError('Field "frequency" must be DAILY or WEEKLY');
  }

  return {
    title: readString(o, 'title', true)!,
    description: o.description === null ? null : readString(o, 'description', false),
    frequency,
  };
}

export function parseHabitUpdate(input: unknown): Prisma.HabitUpdateInput {
  const o = ensureObject(input);
  const parsed: Prisma.HabitUpdateInput = {};

  const title = readString(o, 'title', false);
  const description = o.description === null ? null : readString(o, 'description', false);
  const frequency = readString(o, 'frequency', false);

  if (frequency && !['DAILY', 'WEEKLY'].includes(frequency)) {
    throw new ValidationError('Field "frequency" must be DAILY or WEEKLY');
  }

  if (title !== undefined) parsed.title = title;
  if (Object.prototype.hasOwnProperty.call(o, 'description')) parsed.description = description;
  if (frequency !== undefined) parsed.frequency = frequency;

  return parsed;
}

export function parseHabitLog(input: unknown) {
  const o = ensureObject(input);
  const logDate = readString(o, 'logDate', true)!;
  const isCompleted = o.isCompleted;
  if (typeof isCompleted !== 'boolean') {
    throw new ValidationError('Field "isCompleted" must be boolean');
  }
  const evaluation = o.evaluation === null ? null : readString(o, 'evaluation', false);
  return { logDate, isCompleted, evaluation };
}

export function parseAiChat(input: unknown) {
  const o = ensureObject(input);
  const prompt = readString(o, 'prompt', true)!;
  return { prompt };
}
