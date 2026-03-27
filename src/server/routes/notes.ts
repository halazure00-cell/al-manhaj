import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { parseNoteCreate, parseNoteLink, parseNoteUpdate } from '../lib/validation';
import { asyncHandler } from '../middleware/http';

export const notesRouter = Router();

notesRouter.get('/', asyncHandler(async (_req, res) => {
  const notes = await prisma.note.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      book: true,
      sourceLinks: { include: { targetNote: true } },
      targetLinks: { include: { sourceNote: true } },
    },
  });
  res.json(notes);
}));

notesRouter.get('/graph', asyncHandler(async (_req, res) => {
  const notes = await prisma.note.findMany({ include: { book: true, sourceLinks: true, targetLinks: true } });
  const links = await prisma.noteLink.findMany();

  const nodes = notes.map((note) => ({
    id: note.id,
    name: note.title,
    category: note.book?.category || 'Uncategorized',
    val: (note.sourceLinks.length + note.targetLinks.length) || 1,
  }));

  const graphLinks = links.map((link) => ({ source: link.sourceNoteId, target: link.targetNoteId }));

  res.json({ nodes, links: graphLinks });
}));

notesRouter.post('/', asyncHandler(async (req, res) => {
  const payload = parseNoteCreate(req.body);
  const note = await prisma.note.create({
    data: payload,
    include: {
      book: true,
      sourceLinks: { include: { targetNote: true } },
      targetLinks: { include: { sourceNote: true } },
    },
  });
  res.status(201).json(note);
}));

notesRouter.put('/:id', asyncHandler(async (req, res) => {
  const payload = parseNoteUpdate(req.body);
  const note = await prisma.note.update({
    where: { id: req.params.id },
    data: payload,
    include: {
      book: true,
      sourceLinks: { include: { targetNote: true } },
      targetLinks: { include: { sourceNote: true } },
    },
  });
  res.json(note);
}));

notesRouter.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.noteLink.deleteMany({
    where: {
      OR: [{ sourceNoteId: req.params.id }, { targetNoteId: req.params.id }],
    },
  });
  await prisma.note.deleteMany({ where: { id: req.params.id } });
  res.json({ success: true });
}));

notesRouter.post('/:id/links', asyncHandler(async (req, res) => {
  const { targetNoteId } = parseNoteLink(req.body);
  const sourceNoteId = req.params.id;

  if (sourceNoteId === targetNoteId) {
    return res.status(400).json({ error: 'Cannot link a note to itself' });
  }

  const existingLink = await prisma.noteLink.findFirst({
    where: {
      OR: [
        { sourceNoteId, targetNoteId },
        { sourceNoteId: targetNoteId, targetNoteId: sourceNoteId },
      ],
    },
  });

  if (existingLink) {
    return res.json(existingLink);
  }

  const link = await prisma.noteLink.create({ data: { sourceNoteId, targetNoteId } });
  return res.status(201).json(link);
}));

notesRouter.delete('/:id/links/:targetId', asyncHandler(async (req, res) => {
  const sourceNoteId = req.params.id;
  const targetNoteId = req.params.targetId;

  await prisma.noteLink.deleteMany({
    where: {
      OR: [
        { sourceNoteId, targetNoteId },
        { sourceNoteId: targetNoteId, targetNoteId: sourceNoteId },
      ],
    },
  });

  res.json({ success: true });
}));
