import { useEffect, useCallback } from 'react';
import { showTadzkirah } from '../components/TadzkirahToast';
import { Note, Book, HabitLog } from '../types';

const TADZKIRAH_LAST_OPEN_KEY = 'almanhaj_last_tadzkirah_date';

export function useTadzkirah() {
  // 1. Tajdidun Niyyah (App Open)
  const checkDailyNiyyah = useCallback(() => {
    const today = new Date().toDateString();
    const lastOpen = localStorage.getItem(TADZKIRAH_LAST_OPEN_KEY);

    if (lastOpen !== today) {
      setTimeout(() => {
        showTadzkirah(
          'Tajdidun Niyyah',
          'Selamat datang kembali. Mari perbarui niat menuntut ilmu hari ini murni karena Allah ﷻ.',
          { duration: 8000 }
        );
        localStorage.setItem(TADZKIRAH_LAST_OPEN_KEY, today);
      }, 2000); // Show slightly after app loads
    }
  }, []);

  // 2. Muraja'ah Pro-aktif
  const checkMurajaah = useCallback((notes: Note[], navigate: (path: string) => void) => {
    if (notes.length === 0) return;

    // Find notes older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldNotes = notes.filter(
      (n) => new Date(n.updatedAt) < thirtyDaysAgo
    );

    if (oldNotes.length > 0) {
      // Pick a random old note
      const randomNote = oldNotes[Math.floor(Math.random() * oldNotes.length)];
      
      // Only show once per session to avoid spam
      const sessionKey = 'almanhaj_murajaah_shown';
      if (!sessionStorage.getItem(sessionKey)) {
        setTimeout(() => {
          showTadzkirah(
            'Waktunya Muraja\'ah',
            `Sudah lama sejak Anda mencatat tentang "${randomNote.title}". Luangkan 2 menit untuk muraja'ah?`,
            {
              actionText: 'Buka Catatan',
              onAction: () => navigate(`/notes?id=${randomNote.id}`),
              duration: 10000,
            }
          );
          sessionStorage.setItem(sessionKey, 'true');
        }, 5000);
      }
    }
  }, []);

  // 3. Rabthul 'Ulum (When creating a note)
  const triggerRabthulUlum = useCallback(() => {
    showTadzkirah(
      'Rabthul \'Ulum',
      'Ilmu itu saling terhubung. Jangan lupa untuk menautkan catatan ini dengan catatan Anda yang lain agar pemahaman semakin utuh.',
      { duration: 6000 }
    );
  }, []);

  // 4. Dari Ilmu ke Amal (When completing a book)
  const triggerIlmuKeAmal = useCallback((bookTitle: string, navigate: (path: string) => void) => {
    showTadzkirah(
      'Dari Ilmu ke Amal',
      `Alhamdulillah, Anda telah menyelesaikan "${bookTitle}". Adakah amal atau kebiasaan baru yang ingin Anda tambahkan ke Mutaba'ah hari ini?`,
      {
        actionText: 'Buka Mutaba\'ah',
        onAction: () => navigate('/habits'),
        duration: 10000,
      }
    );
  }, []);

  // 5. Targheeb (Habit Streak)
  const checkHabitStreak = useCallback((logs: HabitLog[]) => {
    // Basic streak calculation logic (simplified for demo)
    // In a real scenario, you'd calculate consecutive days per habit.
    // Here we just check if they completed something today and yesterday.
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const completedToday = logs.some(l => l.logDate.startsWith(today) && l.isCompleted);
    const completedYesterday = logs.some(l => l.logDate.startsWith(yesterday) && l.isCompleted);

    if (completedToday && completedYesterday) {
      const sessionKey = 'almanhaj_streak_shown';
      if (!sessionStorage.getItem(sessionKey)) {
        setTimeout(() => {
          showTadzkirah(
            'Istiqomah',
            'Istiqomah adalah karomah terbesar. Anda terus menjaga Mutaba\'ah Anda. Lanjutkan!',
            { duration: 8000 }
          );
          sessionStorage.setItem(sessionKey, 'true');
        }, 3000);
      }
    }
  }, []);

  return {
    checkDailyNiyyah,
    checkMurajaah,
    triggerRabthulUlum,
    triggerIlmuKeAmal,
    checkHabitStreak,
  };
}
