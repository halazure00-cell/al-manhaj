import 'dotenv/config';
import express from 'express';
import { booksRouter } from './routes/books';
import { notesRouter } from './routes/notes';
import { habitsRouter } from './routes/habits';
import { statsRouter } from './routes/stats';
import { exportRouter } from './routes/export';
import { aiRouter } from './routes/ai';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/http';

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
