import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { reportFinishedCount } from './achievements';

export type BookStatus = 'want' | 'reading' | 'finished';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  genre: string;
  percent: number;
  status: BookStatus;
}

interface ReadingState {
  books: Book[];
  yearlyGoal: number;
  finishedCount: number;
  finishBook: (id: string) => void;
  updateProgress: (id: string, percent: number) => void;
  setYearlyGoal: (goal: number) => void;
  loadStatuses: (entries: [string, BookStatus][]) => void;
}

const DEFAULT_BOOKS: Book[] = [
  {
    id: '1',
    title: 'Sample Book',
    author: 'Author',
    cover: 'https://placehold.co/56x84',
    genre: 'Fiction',
    percent: 50,
    status: 'reading',
  },
  {
    id: '2',
    title: 'Next Book',
    author: 'Writer',
    cover: 'https://placehold.co/56x84',
    genre: 'Nonfiction',
    percent: 0,
    status: 'want',
  },
  {
    id: '3',
    title: 'Finished Book',
    author: 'Old Author',
    cover: 'https://placehold.co/56x84',
    genre: 'History',
    percent: 100,
    status: 'finished',
  },
];

/**
 * Store tracking the user's reading list and progress.
 *
 * Backed by `localStorage` through zustand's `persist` middleware.
 */
export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      books: DEFAULT_BOOKS,
      yearlyGoal: 12,
      finishedCount: DEFAULT_BOOKS.filter((b) => b.status === 'finished')
        .length,
      finishBook: (id) =>
        set((state) => {
          const books = state.books.map((b) =>
            b.id === id
              ? { ...b, status: 'finished' as BookStatus, percent: 100 }
              : b,
          );
          const finishedCount = books.filter(
            (b) => b.status === 'finished',
          ).length;
          reportFinishedCount(finishedCount);
          return { books, finishedCount };
        }),
      updateProgress: (id, percent) =>
        set((state) => {
          const books = state.books.map((b) =>
            b.id === id
              ? {
                  ...b,
                  percent,
                  status:
                    percent >= 100 ? ('finished' as BookStatus) : b.status,
                }
              : b,
          );
          const finishedCount = books.filter(
            (b) => b.status === 'finished',
          ).length;
          reportFinishedCount(finishedCount);
          return { books, finishedCount };
        }),
      setYearlyGoal: (goal) => set({ yearlyGoal: goal }),
      loadStatuses: (entries) =>
        set((state) => {
          const books = state.books.map((b) => {
            const entry = entries.find((e) => e[0] === b.id);
            if (!entry) return b;
            const status = entry[1];
            return {
              ...b,
              status,
              percent: status === 'finished' ? 100 : b.percent,
            };
          });
          const finishedCount = books.filter(
            (b) => b.status === 'finished',
          ).length;
          reportFinishedCount(finishedCount);
          return { books, finishedCount };
        }),
    }),
    { name: 'reading-store' },
  ),
);
