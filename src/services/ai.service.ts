import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';

const SYSTEM_INSTRUCTION = `You are Al-Manhaj AI, a strict analytical partner and logical fallacy checker. Your primary language is Indonesian. You MUST base your answers SOLELY on the provided Context Data, which consists of the user's personal notes on classical Islamic theology (Asy'ari-Maturidi), Shafi'i fiqh, logic, and history. DO NOT synthesize external theological concepts (especially generic internet theology or Salafi-Wahabi frameworks). If the answer is not in the Context Data, state clearly that the user's library lacks data on this specific topic. Be straightforward, highly analytical, and to the point. Avoid generic or overly enthusiastic AI greetings.`;

export async function processAiQuery(prompt: string, prisma: PrismaClient) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("your_gemini_api_key")) {
    return {
      response: "⚠️ **API Key Gemini Terkunci dengan Nilai yang Salah.**\n\nSistem mendeteksi bahwa API Key bawaan telah tertimpa oleh *placeholder* (`MY_GEMINI_API_KEY`) dari konfigurasi awal.\n\nKarena Anda tidak dapat mengubah Secrets secara manual di AI Studio, **satu-satunya cara untuk memperbaiki ini adalah dengan membuat Project/Applet baru.**\n\nDi project baru nanti, sistem akan kembali menyuntikkan API Key bawaan yang asli secara otomatis. Silakan buat project baru dan ulangi prompt Anda.",
      context: { notes: [], books: [] }
    };
  }

  // 1. Extract keywords for retrieval (simple MVP strategy)
  // Remove common Indonesian stop words and short words
  const stopWords = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'adalah', 'ini', 'itu', 'dengan', 'dalam'];
  const keywords = prompt
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .split(' ')
    .filter(w => w.length > 3 && !stopWords.includes(w));

  let contextData = '';
  let retrievedNotes: any[] = [];
  let retrievedBooks: any[] = [];

  // 2. Retrieve Context from Database
  if (keywords.length > 0) {
    // Build OR conditions for Notes
    const noteConditions = keywords.map(kw => ({
      OR: [
        { title: { contains: kw } },
        { content: { contains: kw } }
      ]
    }));

    retrievedNotes = await prisma.note.findMany({
      where: { OR: noteConditions },
      take: 5,
      include: { book: true }
    });

    // Build OR conditions for Books
    const bookConditions = keywords.map(kw => ({
      OR: [
        { title: { contains: kw } },
        { author: { contains: kw } }
      ]
    }));

    retrievedBooks = await prisma.book.findMany({
      where: { OR: bookConditions },
      take: 3
    });

    // Format Context String
    if (retrievedNotes.length > 0) {
      contextData += "--- RETRIEVED NOTES ---\n";
      retrievedNotes.forEach(note => {
        contextData += `Title: ${note.title}\n`;
        if (note.book) contextData += `Related Book: ${note.book.title}\n`;
        contextData += `Content: ${note.content}\n\n`;
      });
    }

    if (retrievedBooks.length > 0) {
      contextData += "--- RETRIEVED BOOKS IN LIBRARY ---\n";
      retrievedBooks.forEach(book => {
        contextData += `Title: ${book.title}\nAuthor: ${book.author}\nCategory: ${book.category}\nStatus: ${book.status}\n\n`;
      });
    }
  }

  if (!contextData) {
    contextData = "No relevant context found in the user's database for the given keywords.";
  }

  // 3. Call Gemini API
  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-pro';

  const fullPrompt = `CONTEXT DATA:
${contextData}

USER PROMPT:
${prompt}`;

  const response = await ai.models.generateContent({
    model,
    contents: fullPrompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2, // Low temperature for more analytical/strict responses
    }
  });

  return {
    response: response.text,
    context: {
      notes: retrievedNotes.map(n => ({ id: n.id, title: n.title })),
      books: retrievedBooks.map(b => ({ id: b.id, title: b.title }))
    }
  };
}
