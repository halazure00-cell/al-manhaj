import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/http.js';

export const statsRouter = Router();

statsRouter.get('/', asyncHandler(async (_req, res) => {
  const books = await prisma.book.findMany();
  const totalBooks = books.length;
  const completedBooks = books.filter((b) => b.status === 'COMPLETED').length;
  const inProgressBooks = books.filter((b) => b.status === 'IN_PROGRESS').length;
  const totalPages = books.reduce((sum, b) => sum + b.totalPages, 0);
  const readPages = books.reduce((sum, b) => sum + b.readPages, 0);

  const totalNotes = await prisma.note.count();
  const totalLinks = await prisma.noteLink.count();

  const totalHabits = await prisma.habit.count();
  const habitLogs = await prisma.habitLog.findMany({
    where: {
      logDate: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    },
  });
  const completedLogs = habitLogs.filter((l) => l.isCompleted).length;
  const totalLogs = habitLogs.length;

  const last7Days = Array.from({ length: 7 })
    .map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d;
    })
    .reverse();

  const habitCompletionByDay = last7Days.map((date) => {
    const logsForDate = habitLogs.filter((l) => {
      const logD = new Date(l.logDate);
      return (
        logD.getUTCFullYear() === date.getFullYear() &&
        logD.getUTCMonth() === date.getMonth() &&
        logD.getUTCDate() === date.getDate()
      );
    });

    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      completed: logsForDate.filter((l) => l.isCompleted).length,
      total: logsForDate.length,
    };
  });

  res.json({
    books: { totalBooks, completedBooks, inProgressBooks, totalPages, readPages },
    notes: { totalNotes, totalLinks },
    habits: { totalHabits, completedLogs, totalLogs, habitCompletionByDay },
  });
}));
