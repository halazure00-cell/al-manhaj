# Al-Manhaj (Intellectual Roadmap & Second Brain)

## Vision
Al-Manhaj adalah ekosistem pembelajaran dan pertumbuhan spiritual yang menggabungkan:
- **Curriculum Management** (Maratib al-'Ulum),
- **Zettelkasten + Knowledge Graph**,
- **Habit Tracker** berbasis tanggal,
- **AI Discussion Partner** berbasis RAG dengan Gemini.

## Stack
- **Frontend**: React + Vite + TypeScript + Tailwind.
- **Backend API**: Express modular (`src/server/*`) dan kompatibel Vercel Functions (`api/[[...route]].ts`).
- **Database**: PostgreSQL + Prisma.
- **AI**: Google GenAI SDK (Gemini) melalui endpoint backend (`/api/ai/chat`).

## Struktur Arsitektur Baru
- `src/server/app.ts`: komposisi aplikasi API.
- `src/server/routes/*`: endpoint per domain (books, notes, habits, stats, export, ai, health).
- `src/server/lib/prisma.ts`: singleton Prisma client.
- `src/server/lib/validation.ts`: validasi payload request.
- `api/[[...route]].ts`: catch-all entrypoint serverless untuk Vercel API.
- `vercel.json`: rewrite API + SPA fallback.

## Environment Variables
Buat `.env` di root (bisa copy dari `.env.example`):

```env
# Runtime pooled connection (dipakai aplikasi)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public&sslmode=require"

# Direct/non-pooled connection (wajib untuk Prisma migrate/introspect)
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public&sslmode=require"

GEMINI_API_KEY="your_gemini_api_key_here"

# Opsional: model Gemini backend
GEMINI_MODEL="gemini-2.5-pro"
```

> `DIRECT_URL` penting untuk menghindari kegagalan migrasi saat `DATABASE_URL` memakai pooled connection (mis. PgBouncer).

## Local Development
1. Install dependency:
   ```bash
   npm install
   ```
2. Generate Prisma client & jalankan migrasi:
   ```bash
   npm run db:generate
   npm run db:migrate:dev
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
   - `DIRECT_URL`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (opsional)
4. Gunakan build command default dari repo (sudah diatur di `vercel.json`):
   - `npm run build:vercel`
5. Jalankan migrasi **terpisah** dari Vercel build (direkomendasikan):
   - `npm run db:migrate:deploy`
6. Kontrol perilaku migrasi build (opsional, jika tetap ingin migrate saat build):
   - `RUN_PRISMA_MIGRATIONS=false` (default) agar build Vercel tidak menjalankan migrasi secara otomatis.
   - `RUN_PRISMA_MIGRATIONS=true` jika ingin build mencoba `prisma migrate deploy`.
   - `PRISMA_MIGRATIONS_REQUIRED=false` (default) agar build tetap lanjut jika migrasi gagal (menghindari single point of failure).
   - `PRISMA_MIGRATIONS_REQUIRED=true` jika ingin build wajib gagal ketika migrasi gagal.
   - `PRISMA_MIGRATE_TIMEOUT_MS=60000` (opsional timeout).
7. Redeploy.

`vercel.json` sudah mengatur:
- `/api/*` -> serverless function catch-all `api/[[...route]]`
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


## Workflow Mobile-Only (Android)
- Gunakan **GitHub web editor** untuk perubahan kode/migrasi ringan.
- Gunakan **Supabase Dashboard (SQL Editor)** untuk validasi query & monitoring tabel.
- Gunakan **Vercel Dashboard** untuk set env (`DATABASE_URL`, `DIRECT_URL`, `RUN_PRISMA_MIGRATIONS=false`) dan trigger redeploy.
- Jalankan migrasi production sebagai langkah release terpisah (`npm run db:migrate:deploy`) agar deploy lebih stabil.
