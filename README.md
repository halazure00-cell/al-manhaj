# Al-Manhaj (Intellectual Roadmap & Second Brain)

## Vision
Al-Manhaj adalah ekosistem pembelajaran dan pertumbuhan spiritual yang menggabungkan:
- **Curriculum Management** (Maratib al-'Ulum),
- **Zettelkasten + Knowledge Graph**,
- **Habit Tracker** berbasis tanggal,
- **AI Discussion Partner** berbasis RAG dengan Gemini.

## Stack
- **Frontend**: React + Vite + TypeScript + Tailwind.
- **Backend API**: Express modular (`src/server/*`) dan kompatibel Vercel Functions (`api/index.ts`).
- **Database**: PostgreSQL + Prisma.
- **AI**: Google GenAI SDK (Gemini) melalui endpoint backend (`/api/ai/chat`).

## Struktur Arsitektur Baru
- `src/server/app.ts`: komposisi aplikasi API.
- `src/server/routes/*`: endpoint per domain (books, notes, habits, stats, export, ai, health).
- `src/server/lib/prisma.ts`: singleton Prisma client.
- `src/server/lib/validation.ts`: validasi payload request.
- `api/index.ts`: entrypoint serverless untuk Vercel.
- `vercel.json`: rewrite API + SPA fallback.

## Environment Variables
Buat `.env` di root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
GEMINI_API_KEY="your_gemini_api_key_here"
```

## Local Development
1. Install dependency:
   ```bash
   npm install
   ```
2. Generate Prisma client & jalankan migrasi:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
3. Jalankan app lokal (API + frontend via middleware):
   ```bash
   npm run dev
   ```

## Deploy ke Vercel
1. Push repository ke Git provider.
2. Import project di Vercel.
3. Set environment variables di Project Settings:
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
4. Deploy.

`vercel.json` sudah mengatur:
- `/api/*` -> serverless function `api/index`
- selain itu -> `index.html` untuk SPA routing.

## Catatan Keamanan
- API key Gemini **tidak** lagi di-inject ke bundle frontend.
- Semua panggilan AI harus lewat endpoint backend `/api/ai/chat`.

## Fitur yang Tersedia
- Curriculum (books)
- Zettelkasten notes + linking
- Knowledge graph data endpoint
- Habit tracker + log harian
- Statistik gabungan
- Export data JSON
- AI mudzakarah berbasis konteks data personal
