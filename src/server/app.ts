import 'dotenv/config';
import express from 'express';
import { booksRouter } from './routes/books.js';
import { notesRouter } from './routes/notes.js';
import { habitsRouter } from './routes/habits.js';
import { statsRouter } from './routes/stats.js';
import { exportRouter } from './routes/export.js';
import { aiRouter } from './routes/ai.js';
import { healthRouter } from './routes/health.js';
import { errorHandler } from './middleware/http.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/books', booksRouter);
  app.use('/api/notes', notesRouter);
  app.use('/api/habits', habitsRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/export', exportRouter);
  app.use('/api/ai', aiRouter);

  app.use(errorHandler);

  return app;
}
