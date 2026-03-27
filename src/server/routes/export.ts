import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/http';

export const exportRouter = Router();

exportRouter.get('/', asyncHandler(async (_req, res) => {
  const books = await prisma.book.findMany();
  const notes = await prisma.note.findMany();
  const noteLinks = await prisma.noteLink.findMany();
  const habits = await prisma.habit.findMany();
  const habitLogs = await prisma.habitLog.findMany();

  const exportData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: { books, notes, noteLinks, habits, habitLogs },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="al-manhaj-export-${new Date().toISOString().split('T')[0]}.json"`
  );
  res.send(JSON.stringify(exportData, null, 2));
}));
