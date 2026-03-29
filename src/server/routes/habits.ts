import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { parseHabitCreate, parseHabitLog, parseHabitUpdate } from '../lib/validation.js';
import { asyncHandler } from '../middleware/http.js';

export const habitsRouter = Router();

habitsRouter.get('/', asyncHandler(async (_req, res) => {
  const habits = await prisma.habit.findMany({
    include: { logs: { orderBy: { logDate: 'desc' }, take: 30 } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(habits);
}));

habitsRouter.post('/', asyncHandler(async (req, res) => {
  const payload = parseHabitCreate(req.body);
  const habit = await prisma.habit.create({ data: payload });
  res.status(201).json(habit);
}));

habitsRouter.put('/:id', asyncHandler(async (req, res) => {
  const payload = parseHabitUpdate(req.body);
  const habit = await prisma.habit.update({ where: { id: req.params.id }, data: payload });
  res.json(habit);
}));

habitsRouter.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.habitLog.deleteMany({ where: { habitId: req.params.id } });
  await prisma.habit.deleteMany({ where: { id: req.params.id } });
  res.json({ success: true });
}));

habitsRouter.post('/:id/logs', asyncHandler(async (req, res) => {
  const payload = parseHabitLog(req.body);

  const log = await prisma.habitLog.upsert({
    where: {
      habitId_logDate: {
        habitId: req.params.id,
        logDate: new Date(payload.logDate),
      },
    },
    update: { isCompleted: payload.isCompleted, evaluation: payload.evaluation },
    create: {
      habitId: req.params.id,
      logDate: new Date(payload.logDate),
      isCompleted: payload.isCompleted,
      evaluation: payload.evaluation,
    },
  });

  res.json(log);
}));
