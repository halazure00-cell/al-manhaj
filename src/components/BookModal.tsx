import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (book: Partial<Book>) => void;
  book?: Book | null;
}

export default function BookModal({ isOpen, onClose, onSave, book }: BookModalProps) {
  const [formData, setFormData] = useState<Partial<Book>>({
    title: '',
    author: '',
    category: '',
    stageLevel: 1,
    status: 'NOT_STARTED',
    totalPages: 0,
    readPages: 0,
  });

  useEffect(() => {
    if (book) {
      setFormData(book);
    } else {
      setFormData({
        title: '',
        author: '',
        category: '',
        stageLevel: 1,
        status: 'NOT_STARTED',
        totalPages: 0,
        readPages: 0,
      });
    }
  }, [book, isOpen]);

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
                {book ? 'Edit Kitab' : 'Tambah Kitab'}
              </h2>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors p-2 md:p-1 rounded-lg hover:bg-zinc-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X size={24} className="md:w-5 md:h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Judul Kitab</label>
                  <input 
                    required
                    type="text" 
                    dir="auto"
                    className="w-full px-4 py-3 md:py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors text-lg md:text-xl font-serif leading-loose min-h-[44px]"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Penulis / Muallif</label>
                  <input 
                    required
                    type="text" 
                    dir="auto"
                    className="w-full px-4 py-3 md:py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors text-lg md:text-xl font-serif leading-loose min-h-[44px]"
                    value={formData.author}
                    onChange={e => setFormData({...formData, author: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Kategori / Fan Ilmu</label>
                  <input 
                    required
                    type="text" 
                    list="category-suggestions"
                    dir="auto"
                    placeholder="Contoh: Aqidah, Fiqh, Sufisme, Sejarah..."
                    className="w-full px-4 py-3 md:py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors text-base md:text-sm font-serif leading-relaxed min-h-[44px]"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  />
                  <datalist id="category-suggestions">
                    <option value="Aqidah" />
                    <option value="Fiqh" />
                    <option value="Sufisme" />
                    <option value="Sejarah" />
                    <option value="Lainnya" />
                  </datalist>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Fase / Tingkatan</label>
                    <select 
                      className="w-full px-4 py-3 md:py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors bg-white text-base md:text-sm min-h-[44px]"
                      value={formData.stageLevel}
                      onChange={e => setFormData({...formData, stageLevel: Number(e.target.value)})}
                    >
                      <option value={1}>Fase 1 (Mubtadi)</option>
                      <option value={2}>Fase 2 (Mutawassith)</option>
                      <option value={3}>Fase 3 (Muntahi)</option>
                      <option value={4}>Fase 4 (Mutakhashshish)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Status</label>
                    <select 
                      className="w-full px-4 py-3 md:py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors bg-white text-base md:text-sm min-h-[44px]"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="NOT_STARTED">Belum Dibaca</option>
                      <option value="IN_PROGRESS">Sedang Dibaca</option>
                      <option value="COMPLETED">Selesai</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Total Halaman</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      className="w-full px-4 py-3 md:py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors text-base md:text-sm min-h-[44px]"
                      value={formData.totalPages}
                      onChange={e => setFormData({...formData, totalPages: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Halaman Dibaca</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      max={formData.totalPages}
                      className="w-full px-4 py-3 md:py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors text-base md:text-sm min-h-[44px]"
                      value={formData.readPages}
                      onChange={e => setFormData({...formData, readPages: Number(e.target.value)})}
                    />
                  </div>
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
                  {book ? 'Simpan Perubahan' : 'Tambah Kitab'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
