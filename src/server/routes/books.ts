import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { parseBookCreate, parseBooksBatch, parseBookUpdate } from '../lib/validation.js';
import { asyncHandler } from '../middleware/http.js';

export const booksRouter = Router();

booksRouter.get('/', asyncHandler(async (_req, res) => {
  const books = await prisma.book.findMany({ orderBy: { stageLevel: 'asc' } });
  res.json(books);
}));

booksRouter.post('/', asyncHandler(async (req, res) => {
  const payload = parseBookCreate(req.body);
  const book = await prisma.book.create({ data: payload });

  const templateDate = book.addedAt.toISOString().slice(0, 10);
  const templateNoteLines = [
    `[${templateDate}] - Kitab Baru:`,
    `Judul: ${book.title}`,
    `Penulis: ${book.author}`,
    `Kategori/Topik: ${book.category}`,
    `Sumber (opsional): ${book.source?.trim() || '-'}`,
    `Catatan Awal (opsional): ${book.initialNote?.trim() || '-'}`,
  ];

  await prisma.note.create({
    data: {
      bookId: book.id,
      title: `Catatan Kitab: ${book.title}`,
      content: templateNoteLines.join('\n'),
    },
  });

  res.status(201).json(book);
}));

booksRouter.post('/batch', asyncHandler(async (req, res) => {
  const payload = parseBooksBatch(req.body);
  const result = await prisma.book.createMany({ data: payload, skipDuplicates: true });
  res.status(201).json({ message: `Successfully imported ${result.count} books`, count: result.count });
}));

booksRouter.put('/:id', asyncHandler(async (req, res) => {
  const payload = parseBookUpdate(req.body);
  if (payload.totalPages !== undefined && payload.readPages === undefined) {
    const existing = await prisma.book.findUnique({ where: { id: req.params.id }, select: { readPages: true } });
    if (existing && existing.readPages > Number(payload.totalPages)) {
      res.status(400).json({ error: 'Field "totalPages" cannot be less than existing "readPages"' });
      return;
    }
  }
  if (payload.readPages !== undefined && payload.totalPages === undefined) {
    const existing = await prisma.book.findUnique({ where: { id: req.params.id }, select: { totalPages: true } });
    if (existing && Number(payload.readPages) > existing.totalPages) {
      res.status(400).json({ error: 'Field "readPages" cannot be greater than existing "totalPages"' });
      return;
    }
  }

  const book = await prisma.book.update({ where: { id: req.params.id }, data: payload });
  res.json(book);
}));

booksRouter.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.note.updateMany({ where: { bookId: req.params.id }, data: { bookId: null } });
  await prisma.book.deleteMany({ where: { id: req.params.id } });
  res.json({ success: true });
}));
