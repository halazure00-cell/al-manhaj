import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { parseAiChat } from '../lib/validation';
import { asyncHandler } from '../middleware/http';
import { processAiQuery } from '../../services/ai.service';

export const aiRouter = Router();

aiRouter.post('/chat', asyncHandler(async (req, res) => {
  const { prompt } = parseAiChat(req.body);
  const result = await processAiQuery(prompt, prisma);
  res.json(result);
}));
