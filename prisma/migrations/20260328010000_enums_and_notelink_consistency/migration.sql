-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HabitFrequency" AS ENUM ('DAILY', 'WEEKLY');

-- AlterTable
ALTER TABLE "Book"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "BookStatus" USING ("status"::"BookStatus"),
  ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';

-- AlterTable
ALTER TABLE "Habit"
  ALTER COLUMN "frequency" DROP DEFAULT,
  ALTER COLUMN "frequency" TYPE "HabitFrequency" USING ("frequency"::"HabitFrequency"),
  ALTER COLUMN "frequency" SET DEFAULT 'DAILY';

-- Strengthen NoteLink integrity for undirected links
ALTER TABLE "NoteLink"
  ADD CONSTRAINT "NoteLink_source_target_distinct" CHECK ("sourceNoteId" <> "targetNoteId");

DROP INDEX IF EXISTS "NoteLink_sourceNoteId_targetNoteId_key";

CREATE UNIQUE INDEX "NoteLink_undirected_unique"
  ON "NoteLink" (LEAST("sourceNoteId", "targetNoteId"), GREATEST("sourceNoteId", "targetNoteId"));
