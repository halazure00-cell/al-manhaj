import React from 'react';
import { Book } from '../types';
import { X, BookOpen, User, Tag, Layers, FileText, Calendar, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
}

export default function BookDetailsModal({ isOpen, onClose, book }: BookDetailsModalProps) {
  if (!book) return null;

  const progress = book.totalPages > 0 ? Math.round((book.readPages / book.totalPages) * 100) : 0;

  const statusConfig = {
    NOT_STARTED: { label: 'Belum Dibaca', classes: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
    IN_PROGRESS: { label: 'Sedang Dibaca', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
    COMPLETED: { label: 'Selesai', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  };

  const currentStatus = statusConfig[book.status];

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('aqidah')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (cat.includes('fiqh')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (cat.includes('sufisme') || cat.includes('tasawuf')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (cat.includes('sejarah') || cat.includes('tarikh')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-zinc-50 text-zinc-700 border-zinc-200';
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
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-zinc-100 max-h-[95vh] md:max-h-[90vh]"
          >
            {/* Header Area */}
            <div className="p-5 md:p-6 border-b border-zinc-100 shrink-0 bg-zinc-50/50 relative">
              {/* Top Bar: Close Left, Logo Right */}
              <div className="flex justify-between items-center mb-5">
                <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors p-2 rounded-full hover:bg-zinc-200 bg-zinc-100 flex items-center justify-center shrink-0">
                  <X size={18} />
                </button>
                
                {/* Logo Top Right */}
                <div className="flex items-center gap-2 opacity-80">
                  <span className="text-sm font-serif font-bold text-zinc-900 tracking-tight">Al-Manhaj</span>
                  <div className="bg-black text-white p-1.5 rounded-md shadow-sm">
                    <BookOpen size={14} />
                  </div>
                </div>
              </div>

              {/* Title & Status */}
              <div>
                <div className={`inline-block mb-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${currentStatus.classes}`}>
                  {currentStatus.label}
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900 leading-tight" dir="auto">
                  {book.title}
                </h2>
              </div>
            </div>
            
            {/* Scrollable Body */}
            <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-6">
              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                {/* Author */}
                <div className="flex items-start gap-3 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <div className="p-2 bg-white rounded-lg text-zinc-500 shrink-0 shadow-sm border border-zinc-100">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Penulis / Muallif</p>
                    <p className="text-sm font-medium text-zinc-900" dir="auto">{book.author}</p>
                  </div>
                </div>
                
                {/* Category */}
                <div className="flex items-start gap-3 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <div className="p-2 bg-white rounded-lg text-zinc-500 shrink-0 shadow-sm border border-zinc-100">
                    <Tag size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Kategori</p>
                    <div className={`inline-block mt-0.5 px-2 py-0.5 border rounded text-xs font-medium ${getCategoryColor(book.category)}`}>
                      {book.category}
                    </div>
                  </div>
                </div>

                {/* Phase */}
                <div className="flex items-start gap-3 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <div className="p-2 bg-white rounded-lg text-zinc-500 shrink-0 shadow-sm border border-zinc-100">
                    <Layers size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Fase Kurikulum</p>
                    <p className="text-sm font-medium text-zinc-900">Fase {book.stageLevel}</p>
                  </div>
                </div>

                {/* Date Added */}
                <div className="flex items-start gap-3 bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                  <div className="p-2 bg-white rounded-lg text-zinc-500 shrink-0 shadow-sm border border-zinc-100">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Ditambahkan</p>
                    <p className="text-sm font-medium text-zinc-900">
                      {new Date(book.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="pt-6 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-zinc-100 rounded-md">
                      <FileText size={16} className="text-zinc-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Progres Membaca</h3>
                  </div>
                  <span className="text-lg font-serif font-bold text-zinc-900">{progress}%</span>
                </div>
                
                <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden mb-3 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-black h-full rounded-full"
                  />
                </div>
                
                <div className="flex justify-between text-xs md:text-sm text-zinc-500 font-medium">
                  <span><strong className="text-zinc-900">{book.readPages}</strong> halaman dibaca</span>
                  <span>Total <strong className="text-zinc-900">{book.totalPages}</strong> halaman</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
