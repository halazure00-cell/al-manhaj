import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { execSync } from "child_process";
import { processAiQuery } from "./src/services/ai.service";

const PORT = 3000;

// Initialize Prisma Client lazily to avoid crashing if DATABASE_URL is missing on boot
let prisma: PrismaClient | null = null;
if (process.env.DATABASE_URL) {
  try {
    console.log("DATABASE_URL found. Syncing database schema...");
    // Automatically push the schema to the database to create tables
    execSync("npx prisma db push --accept-data-loss", { stdio: 'inherit' });
    console.log("Database schema synced successfully.");
    prisma = new PrismaClient();
  } catch (error) {
    console.error("Failed to sync database schema:", error);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/health", async (req, res) => {
    if (!prisma) {
      return res.status(503).json({ 
        status: "error", 
        message: "DATABASE_URL is not configured. Please add it to your secrets." 
      });
    }
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok", database: "connected" });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Database connection failed." });
    }
  });

  // --- Books API ---
  app.get("/api/books", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const books = await prisma.book.findMany({ orderBy: { stageLevel: 'asc' } });
      res.json(books);
    } catch (error: any) {
      console.error("GET /api/books error:", error);
      res.status(500).json({ error: "Failed to fetch books: " + error.message });
    }
  });

  app.post("/api/books", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const book = await prisma.book.create({ data: req.body });
      res.json(book);
    } catch (error: any) {
      console.error("POST /api/books error:", error);
      res.status(500).json({ error: "Failed to create book: " + error.message });
    }
  });

  app.post("/api/books/batch", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const booksData = req.body;
      if (!Array.isArray(booksData)) {
        return res.status(400).json({ error: "Invalid format. Expected an array of books." });
      }

      // Validate and sanitize input
      const validBooks = booksData.map((b: any) => ({
        title: String(b.title || "Untitled"),
        author: String(b.author || "Unknown"),
        category: String(b.category || "Lainnya"),
        stageLevel: Number(b.stageLevel) || 1,
        totalPages: Number(b.totalPages) || 0,
        readPages: Number(b.readPages) || 0,
        status: String(b.status || "NOT_STARTED")
      }));

      const result = await prisma.book.createMany({
        data: validBooks,
        skipDuplicates: true
      });

      res.status(201).json({ message: `Successfully imported ${result.count} books`, count: result.count });
    } catch (error: any) {
      console.error("POST /api/books/batch error:", error);
      res.status(500).json({ error: "Failed to batch import books: " + error.message });
    }
  });

  app.put("/api/books/:id", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const book = await prisma.book.update({
        where: { id: req.params.id },
        data: req.body
      });
      res.json(book);
    } catch (error: any) {
      console.error("PUT /api/books error:", error);
      res.status(500).json({ error: "Failed to update book: " + error.message });
    }
  });

  app.delete("/api/books/:id", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      // Unlink notes from this book before deleting
      await prisma.note.updateMany({
        where: { bookId: req.params.id },
        data: { bookId: null }
      });
      await prisma.book.deleteMany({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error: any) {
      console.error("DELETE /api/books error:", error);
      res.status(500).json({ error: "Failed to delete book: " + error.message });
    }
  });

  // --- Notes API (Zettelkasten) ---
  app.get("/api/notes", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const notes = await prisma.note.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          book: true,
          sourceLinks: {
            include: { targetNote: true }
          },
          targetLinks: {
            include: { sourceNote: true }
          }
        }
      });
      res.json(notes);
    } catch (error: any) {
      console.error("GET /api/notes error:", error);
      res.status(500).json({ error: "Failed to fetch notes: " + error.message });
    }
  });

  app.get("/api/notes/graph", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const notes = await prisma.note.findMany({
        include: {
          book: true,
          sourceLinks: true,
          targetLinks: true
        }
      });
      
      const links = await prisma.noteLink.findMany();

      const nodes = notes.map(note => ({
        id: note.id,
        name: note.title,
        category: note.book?.category || 'Uncategorized',
        val: (note.sourceLinks.length + note.targetLinks.length) || 1
      }));

      const graphLinks = links.map(link => ({
        source: link.sourceNoteId,
        target: link.targetNoteId
      }));

      res.json({ nodes, links: graphLinks });
    } catch (error: any) {
      console.error("GET /api/notes/graph error:", error);
      res.status(500).json({ error: "Failed to fetch graph data: " + error.message });
    }
  });

  app.post("/api/notes", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const { title, content, bookId } = req.body;
      const note = await prisma.note.create({
        data: { title, content, bookId: bookId || null },
        include: {
          book: true,
          sourceLinks: { include: { targetNote: true } },
          targetLinks: { include: { sourceNote: true } }
        }
      });
      res.json(note);
    } catch (error: any) {
      console.error("POST /api/notes error:", error);
      res.status(500).json({ error: "Failed to create note: " + error.message });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const { title, content, bookId } = req.body;
      const note = await prisma.note.update({
        where: { id: req.params.id },
        data: { title, content, bookId: bookId || null },
        include: {
          book: true,
          sourceLinks: { include: { targetNote: true } },
          targetLinks: { include: { sourceNote: true } }
        }
      });
      res.json(note);
    } catch (error: any) {
      console.error("PUT /api/notes error:", error);
      res.status(500).json({ error: "Failed to update note: " + error.message });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      // First delete any links associated with this note
      await prisma.noteLink.deleteMany({
        where: {
          OR: [
            { sourceNoteId: req.params.id },
            { targetNoteId: req.params.id }
          ]
        }
      });
      // Then delete the note
      await prisma.note.deleteMany({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error: any) {
      console.error("DELETE /api/notes error:", error);
      res.status(500).json({ error: "Failed to delete note: " + error.message });
    }
  });

  // --- Note Links API ---
  app.post("/api/notes/:id/links", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const { targetNoteId } = req.body;
      const sourceNoteId = req.params.id;
      
      if (sourceNoteId === targetNoteId) {
        return res.status(400).json({ error: "Cannot link a note to itself" });
      }

      // Check if a link already exists in either direction
      const existingLink = await prisma.noteLink.findFirst({
        where: {
          OR: [
            { sourceNoteId, targetNoteId },
            { sourceNoteId: targetNoteId, targetNoteId: sourceNoteId }
          ]
        }
      });

      if (existingLink) {
        return res.json(existingLink);
      }

      const link = await prisma.noteLink.create({
        data: { sourceNoteId, targetNoteId }
      });
      res.json(link);
    } catch (error: any) {
      console.error("POST /api/notes/:id/links error:", error);
      res.status(500).json({ error: "Failed to create link: " + error.message });
    }
  });

  app.delete("/api/notes/:id/links/:targetId", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const sourceNoteId = req.params.id;
      const targetNoteId = req.params.targetId;
      
      await prisma.noteLink.deleteMany({
        where: {
          OR: [
            { sourceNoteId, targetNoteId },
            { sourceNoteId: targetNoteId, targetNoteId: sourceNoteId }
          ]
        }
      });
      res.json({ success: true });
    } catch (error: any) {
      console.error("DELETE /api/notes/:id/links/:targetId error:", error);
      res.status(500).json({ error: "Failed to delete link: " + error.message });
    }
  });

  // --- Habits API ---
  app.get("/api/habits", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const habits = await prisma.habit.findMany({
        include: {
          logs: {
            orderBy: { logDate: 'desc' },
            take: 30 // Get last 30 days of logs
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      res.json(habits);
    } catch (error: any) {
      console.error("GET /api/habits error:", error);
      res.status(500).json({ error: "Failed to fetch habits: " + error.message });
    }
  });

  app.post("/api/habits", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const habit = await prisma.habit.create({ data: req.body });
      res.json(habit);
    } catch (error: any) {
      console.error("POST /api/habits error:", error);
      res.status(500).json({ error: "Failed to create habit: " + error.message });
    }
  });

  app.put("/api/habits/:id", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const habit = await prisma.habit.update({
        where: { id: req.params.id },
        data: req.body
      });
      res.json(habit);
    } catch (error: any) {
      console.error("PUT /api/habits error:", error);
      res.status(500).json({ error: "Failed to update habit: " + error.message });
    }
  });

  app.delete("/api/habits/:id", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      await prisma.habitLog.deleteMany({ where: { habitId: req.params.id } });
      await prisma.habit.deleteMany({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error: any) {
      console.error("DELETE /api/habits error:", error);
      res.status(500).json({ error: "Failed to delete habit: " + error.message });
    }
  });

  // --- Habit Logs API ---
  app.post("/api/habits/:id/logs", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const { logDate, isCompleted, evaluation } = req.body;
      const dateObj = new Date(logDate);
      
      // Upsert the log for this date
      const log = await prisma.habitLog.upsert({
        where: {
          habitId_logDate: {
            habitId: req.params.id,
            logDate: dateObj
          }
        },
        update: { isCompleted, evaluation },
        create: {
          habitId: req.params.id,
          logDate: dateObj,
          isCompleted,
          evaluation
        }
      });
      res.json(log);
    } catch (error: any) {
      console.error("POST /api/habits/:id/logs error:", error);
      res.status(500).json({ error: "Failed to log habit: " + error.message });
    }
  });

  // --- Statistics API ---
  app.get("/api/stats", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      // Books stats
      const books = await prisma.book.findMany();
      const totalBooks = books.length;
      const completedBooks = books.filter(b => b.status === "COMPLETED").length;
      const inProgressBooks = books.filter(b => b.status === "IN_PROGRESS").length;
      const totalPages = books.reduce((sum, b) => sum + b.totalPages, 0);
      const readPages = books.reduce((sum, b) => sum + b.readPages, 0);

      // Notes stats
      const totalNotes = await prisma.note.count();
      const totalLinks = await prisma.noteLink.count();

      // Habits stats
      const totalHabits = await prisma.habit.count();
      const habitLogs = await prisma.habitLog.findMany({
        where: {
          logDate: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
          }
        }
      });
      const completedLogs = habitLogs.filter(l => l.isCompleted).length;
      const totalLogs = habitLogs.length;

      // Habit completion by day (last 7 days)
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return d;
      }).reverse();

      const habitCompletionByDay = last7Days.map(date => {
        const logsForDate = habitLogs.filter(l => {
          const logD = new Date(l.logDate);
          return logD.getUTCFullYear() === date.getFullYear() && 
                 logD.getUTCMonth() === date.getMonth() && 
                 logD.getUTCDate() === date.getDate();
        });
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return {
          date: `${year}-${month}-${day}`,
          completed: logsForDate.filter(l => l.isCompleted).length,
          total: logsForDate.length
        };
      });

      res.json({
        books: { totalBooks, completedBooks, inProgressBooks, totalPages, readPages },
        notes: { totalNotes, totalLinks },
        habits: { totalHabits, completedLogs, totalLogs, habitCompletionByDay }
      });
    } catch (error: any) {
      console.error("GET /api/stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats: " + error.message });
    }
  });

  // --- Export API ---
  app.get("/api/export", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const books = await prisma.book.findMany();
      const notes = await prisma.note.findMany();
      const noteLinks = await prisma.noteLink.findMany();
      const habits = await prisma.habit.findMany();
      const habitLogs = await prisma.habitLog.findMany();

      const exportData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: {
          books,
          notes,
          noteLinks,
          habits,
          habitLogs
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="al-manhaj-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.send(JSON.stringify(exportData, null, 2));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to export data: " + error.message });
    }
  });

  // --- AI Chat API ---
  app.post("/api/ai/chat", async (req, res) => {
    if (!prisma) return res.status(503).json({ error: "Database not connected" });
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      
      const result = await processAiQuery(prompt, prisma);
      res.json(result);
    } catch (error: any) {
      console.error("POST /api/ai/chat error:", error);
      res.status(500).json({ error: "AI processing failed: " + error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
