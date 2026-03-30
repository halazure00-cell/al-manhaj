export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  addedAt: string;
  source: string | null;
  initialNote: string | null;
  stageLevel: number;
  totalPages: number;
  readPages: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  bookId: string | null;
  book?: Book | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sourceLinks?: NoteLink[];
  targetLinks?: NoteLink[];
}

export interface NoteLink {
  id: string;
  sourceNoteId: string;
  targetNoteId: string;
  createdAt: string;
  sourceNote?: Note;
  targetNote?: Note;
}

export interface Habit {
  id: string;
  title: string;
  description: string | null;
  frequency: 'DAILY' | 'WEEKLY';
  createdAt: string;
  logs?: HabitLog[];
}

export interface HabitLog {
  id: string;
  habitId: string;
  logDate: string;
  isCompleted: boolean;
  evaluation: string | null;
  habit?: Habit;
}
