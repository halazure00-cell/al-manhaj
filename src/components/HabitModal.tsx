import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Partial<Habit>) => void;
  habit?: Habit | null;
}

export default function HabitModal({ isOpen, onClose, onSave, habit }: HabitModalProps) {
  const [formData, setFormData] = useState<Partial<Habit>>({
    title: '',
    description: '',
    frequency: 'DAILY',
  });

  useEffect(() => {
    if (habit) {
      setFormData({
        title: habit.title,
        description: habit.description || '',
        frequency: habit.frequency,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        frequency: 'DAILY',
      });
    }
  }, [habit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-zinc-100 max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 shrink-0">
              <h2 className="text-xl font-serif font-bold text-zinc-900">
                {habit ? 'Edit Mutaba\'ah' : 'Buat Mutaba\'ah'}
              </h2>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors p-2 md:p-1 rounded-lg hover:bg-zinc-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X size={24} className="md:w-5 md:h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Judul</label>
                  <input 
                    required
                    type="text" 
                    dir="auto"
                    placeholder="misal: Baca 10 halaman, Dzikir Pagi"
                    className="w-full px-4 py-3 md:py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors text-base md:text-sm font-serif leading-relaxed min-h-[44px]"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Deskripsi (Opsional)</label>
                  <textarea 
                    rows={3}
                    dir="auto"
                    placeholder="Mengapa Anda membangun rutinitas ini?"
                    className="w-full px-4 py-3 md:py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors resize-none text-base md:text-sm font-serif leading-relaxed min-h-[44px]"
                    value={formData.description || ''}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Frekuensi</label>
                  <select 
                    className="w-full px-4 py-3 md:py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors bg-white text-base md:text-sm min-h-[44px]"
                    value={formData.frequency}
                    onChange={e => setFormData({...formData, frequency: e.target.value as 'DAILY' | 'WEEKLY'})}
                  >
                    <option value="DAILY">Harian</option>
                    <option value="WEEKLY">Mingguan</option>
                  </select>
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
                  {habit ? 'Simpan Perubahan' : 'Buat Mutaba\'ah'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
