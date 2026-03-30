import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { parseAiChat, parseAiFeedback } from '../lib/validation.js';
import { asyncHandler } from '../middleware/http.js';
import { processAiQuery } from '../../services/ai.service.js';

export const aiRouter = Router();
const db = prisma as any;

aiRouter.post('/chat', asyncHandler(async (req, res) => {
  const { prompt, sessionId, mode, deviceKey } = parseAiChat(req.body);
  const result = await processAiQuery({ prompt, sessionId, mode, deviceKey }, db);
  res.json(result);
}));

aiRouter.get('/sessions', asyncHandler(async (_req, res) => {
  const sessions = await db.chatSession.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  res.json(sessions.map((session) => ({
    id: session.id,
    title: session.title,
    summary: session.summary,
    updatedAt: session.updatedAt,
    messageCount: session._count.messages,
    lastMode: session.lastMode,
  })));
}));

aiRouter.post('/feedback', asyncHandler(async (req, res) => {
  const { messageId, rating, reason } = parseAiFeedback(req.body);

  const feedback = await db.aiFeedback.upsert({
    where: { messageId },
    update: {
      rating,
      reason: reason ?? null,
    },
    create: {
      messageId,
      rating,
      reason: reason ?? null,
    },
  });

  res.status(201).json(feedback);
}));
