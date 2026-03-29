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
  res.status(201).json(book);
}));

booksRouter.post('/batch', asyncHandler(async (req, res) => {
  const payload = parseBooksBatch(req.body);
  const result = await prisma.book.createMany({ data: payload, skipDuplicates: true });
  res.status(201).json({ message: `Successfully imported ${result.count} books`, count: result.count });
}));

booksRouter.put('/:id', asyncHandler(async (req, res) => {
  const payload = parseBookUpdate(req.body);
  const book = await prisma.book.update({ where: { id: req.params.id }, data: payload });
  res.json(book);
}));

booksRouter.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.note.updateMany({ where: { bookId: req.params.id }, data: { bookId: null } });
  await prisma.book.deleteMany({ where: { id: req.params.id } });
  res.json({ success: true });
}));
