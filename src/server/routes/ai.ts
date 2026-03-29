import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { parseAiChat } from '../lib/validation.js';
import { asyncHandler } from '../middleware/http.js';
import { processAiQuery } from '../../services/ai.service.js';

export const aiRouter = Router();

aiRouter.post('/chat', asyncHandler(async (req, res) => {
  const { prompt } = parseAiChat(req.body);
  const result = await processAiQuery(prompt, prisma);
  res.json(result);
}));
