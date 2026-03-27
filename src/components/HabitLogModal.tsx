import React, { useState, useEffect } from 'react';
import { Habit, HabitLog } from '../types';
import { X, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HabitLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitId: string, logDate: string, isCompleted: boolean, evaluation: string | null) => void;
  habit: Habit | null;
  selectedDate: string; // YYYY-MM-DD
  existingLog?: HabitLog | null;
}

export default function HabitLogModal({ isOpen, onClose, onSave, habit, selectedDate, existingLog }: HabitLogModalProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [evaluation, setEvaluation] = useState('');

  useEffect(() => {
    if (existingLog) {
      setIsCompleted(existingLog.isCompleted);
      setEvaluation(existingLog.evaluation || '');
    } else {
      setIsCompleted(false);
      setEvaluation('');
    }
  }, [existingLog, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (habit) {
      onSave(habit.id, selectedDate, isCompleted, evaluation || null);
    }
  };

  const [year, month, day] = selectedDate.split('-');
  const displayDate = new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <AnimatePresence>
      {isOpen && habit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-zinc-100 max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 shrink-0">
              <div>
                <h2 className="text-xl font-serif font-bold text-zinc-900" dir="auto">
                  Catat: {habit.title}
                </h2>
                <p className="text-xs font-medium text-zinc-400 mt-1 uppercase tracking-wider">{displayDate}</p>
              </div>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors p-2 md:p-1 rounded-lg hover:bg-zinc-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X size={24} className="md:w-5 md:h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <button
                  type="button"
                  onClick={() => setIsCompleted(!isCompleted)}
                  className={`w-full flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                    isCompleted 
                      ? 'bg-black border-black text-white shadow-md' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={24} className="text-white" /> : <Circle size={24} />}
                  <span className="font-bold text-lg">
                    {isCompleted ? 'Selesai' : 'Tandai Selesai'}
                  </span>
                </button>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-1.5">
                    Refleksi Harian / Catatan (Opsional)
                  </label>
                  <textarea 
                    rows={4}
                    dir="auto"
                    placeholder="Bagaimana hari ini? Ada kendala atau pemikiran?"
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors resize-none text-base md:text-sm font-serif leading-relaxed min-h-[44px]"
                    value={evaluation}
                    onChange={e => setEvaluation(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50/50 shrink-0">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-5 py-3 md:py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-200 rounded-xl transition-colors min-h-[44px]"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-5 py-3 md:py-2.5 text-sm font-semibold text-white bg-black hover:bg-zinc-800 rounded-xl transition-all shadow-sm hover:shadow-md min-h-[44px]"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
