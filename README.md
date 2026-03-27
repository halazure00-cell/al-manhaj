# Al-Manhaj (Intellectual Roadmap & Second Brain)

## Vision
Al-Manhaj is a highly personalized, locally-hosted ecosystem designed for intellectual and spiritual growth. It combines curriculum management (Maratib al-'Ulum), a bidirectional Zettelkasten note-taking system with a Visual Knowledge Graph, a timezone-aware Habit Tracker (Mutaba'ah), and a strict, sandboxed Gemini-powered RAG AI Discussion Partner. It is built with data sovereignty in mind, ensuring your knowledge base remains entirely yours.

## Tech Stack Overview
- **Frontend:** Vite, React 18, TypeScript, Tailwind CSS, Framer Motion, `react-force-graph-2d`.
- **Backend:** Node.js, Express.
- **Database & ORM:** SQLite (local sovereignty), Prisma ORM.
- **AI Integration:** Google Gen AI SDK (Gemini API) restricted to Retrieval-Augmented Generation (RAG).
- **Architecture:** PWA (Progressive Web App) optimized for mobile and standalone usage.

## Prerequisites & Environment Setup
- **Node.js:** v18.x or higher recommended.
- **npm:** v9.x or higher.

Create a `.env` file in the root directory based on the following template:

```env
# .env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your_gemini_api_key_here"
```

## Installation & Local Execution

Follow these steps to get Al-Manhaj running locally:

1. **Clone/Initialize the repository:**
   ```bash
   git clone <repository-url>
   cd al-manhaj
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run Prisma migrations:**
   Initialize the SQLite database and apply the schema:
   ```bash
   npx prisma db push
   ```
   *(Alternatively, you can use `npx prisma migrate dev` if you want to track migration history).*

4. **Start the unified development server:**
   This command starts both the Express backend and the Vite frontend concurrently.
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Modules Explanation

- **Curriculum (Books/Kitab):** Manage your reading list and study curriculum. Track progress, categorize books by priority, and organize your intellectual roadmap.
- **Dialectics (Notes, Links, Knowledge Graph):** A Zettelkasten-inspired note-taking system. Create atomic notes, link them bidirectionally, and visualize connections through an interactive Knowledge Graph.
- **Adab & Amal (Habits, Local Time/Hijri integration):** A Mutaba'ah (habit tracker) to monitor daily practices. It is timezone-aware and integrates Hijri calendar concepts for spiritual tracking.
- **AI Mudzakkir:** A strict, sandboxed AI discussion partner powered by Gemini. It uses Retrieval-Augmented Generation (RAG) to answer questions and critique ideas *only* based on the notes and books you have entered into the system.
- **Data Export Utility:** Ensures complete data sovereignty. Export your entire database (Books, Notes, Links, Habits, Logs) into a single JSON file at any time.
