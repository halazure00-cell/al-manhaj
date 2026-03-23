import React, { useState, useEffect } from 'react';
import { Habit, HabitLog } from '../types';
import HabitCard from '../components/HabitCard';
import HabitModal from '../components/HabitModal';
import HabitLogModal from '../components/HabitLogModal';
import { Plus, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [loggingHabit, setLoggingHabit] = useState<Habit | null>(null);
  const [loggingDate, setLoggingDate] = useState<string>('');
  const [loggingExistingLog, setLoggingExistingLog] = useState<HabitLog | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      if (!res.ok) throw new Error('Failed to fetch habits');
      const data = await res.json();
      setHabits(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar kebiasaan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleSaveHabit = async (habitData: Partial<Habit>) => {
    const loadingToast = toast.loading('Menyimpan kebiasaan...');
    try {
      const isEditing = !!editingHabit;
      const url = isEditing ? `/api/habits/${editingHabit.id}` : '/api/habits';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save habit');
      }
      
      await fetchHabits();
      setIsHabitModalOpen(false);
      setEditingHabit(null);
      toast.success('Kebiasaan berhasil disimpan', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan kebiasaan', { id: loadingToast });
    }
  };

  const handleDeleteHabit = async () => {
    if (!deleteConfirmId) return;
    const loadingToast = toast.loading('Menghapus kebiasaan...');
    try {
      const res = await fetch(`/api/habits/${deleteConfirmId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete habit');
      }
      await fetchHabits();
      setDeleteConfirmId(null);
      toast.success('Kebiasaan berhasil dihapus', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kebiasaan', { id: loadingToast });
    }
  };

  const handleSaveLog = async (habitId: string, logDate: string, isCompleted: boolean, evaluation: string | null) => {
    try {
      const dateObj = new Date(logDate + 'T00:00:00.000Z');
      
      const res = await fetch(`/api/habits/${habitId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logDate: dateObj.toISOString(),
          isCompleted,
          evaluation
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save log');
      }
      
      await fetchHabits();
      setIsLogModalOpen(false);
      setLoggingHabit(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan log');
    }
  };

  const openAddModal = () => {
    setEditingHabit(null);
    setIsHabitModalOpen(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(null);
    setTimeout(() => {
      setEditingHabit(habit);
      setIsHabitModalOpen(true);
    }, 0);
  };

  const openLogModal = (habit: Habit, dateStr: string, existingLog?: HabitLog) => {
    setLoggingHabit(null);
    setTimeout(() => {
      setLoggingHabit(habit);
      setLoggingDate(dateStr);
      setLoggingExistingLog(existingLog || null);
      setIsLogModalOpen(true);
    }, 0);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-zinc-200 rounded-lg animate-pulse"></div>
            <div className="h-4 w-64 bg-zinc-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-zinc-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-zinc-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  return (
    <div className="px-4 pb-4 pt-2 md:px-8 md:pb-8 md:pt-0 max-w-6xl mx-auto flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 md:mb-10 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900 tracking-tight">Mutaba'ah</h1>
          <p className="text-zinc-500 mt-2 text-sm">Adab & Amal. Bangun rutinitas dan pantau progres harian.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 text-white px-5 py-3 md:py-2.5 rounded-xl transition-all shadow-sm font-medium text-sm hover:shadow-md min-h-[44px]"
        >
          <Plus size={18} />
          Mutaba'ah Baru
        </button>
      </div>

      {habits.length > 0 ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-y-auto pb-8 flex-1 content-start pr-2 md:pr-4 -mr-2 md:-mr-4"
        >
          {habits.map(habit => (
            <HabitCard 
              key={habit.id} 
              habit={habit} 
              onEdit={openEditModal}
              onDelete={setDeleteConfirmId}
              onLog={openLogModal}
              todayStr={todayStr}
            />
          ))}
        </motion.div>
      ) : (
        <div className="flex-1 flex items-center justify-center border border-dashed border-zinc-200 rounded-2xl bg-white">
          <div className="text-center max-w-sm">
            <CheckSquare className="mx-auto text-zinc-300 mb-4" size={32} />
            <h3 className="text-lg font-serif font-bold text-zinc-900 mb-1">Tidak ada mutaba'ah</h3>
            <p className="text-zinc-500 text-sm mb-6">
              Mulai bangun rutinitas harian Anda dengan membuat mutaba'ah pertama.
            </p>
            <button 
              onClick={openAddModal}
              className="text-black font-semibold text-sm hover:underline underline-offset-4"
            >
              + Buat mutaba'ah pertama Anda
            </button>
          </div>
        </div>
      )}

      <HabitModal 
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        onSave={handleSaveHabit}
        habit={editingHabit}
      />

      <HabitLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleSaveLog}
        habit={loggingHabit}
        selectedDate={loggingDate}
        existingLog={loggingExistingLog}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 border border-zinc-100"
            >
              <h3 className="text-lg font-serif font-semibold text-zinc-900 mb-2">Hapus Mutaba'ah</h3>
              <p className="text-sm text-zinc-500 mb-6">Apakah Anda yakin ingin menghapus mutaba'ah ini? Semua riwayat dan catatan akan hilang secara permanen.</p>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setDeleteConfirmId(null);
                  }}
                  className="px-4 py-3 md:py-2 min-h-[44px] text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleDeleteHabit}
                  className="px-4 py-3 md:py-2 min-h-[44px] text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
