import React, { useState } from 'react';
import { Book } from '../types';
import { Edit2, Trash2, BookOpen, CheckCircle2, Plus, Minus, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  onViewDetails: (book: Book) => void;
  onUpdateProgress: (book: Book, newReadPages: number) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onEdit, onDelete, onViewDetails, onUpdateProgress }) => {
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [tempProgress, setTempProgress] = useState(book.readPages.toString());

  const progress = book.totalPages > 0 ? Math.round((book.readPages / book.totalPages) * 100) : 0;
  
  const statusConfig = {
    NOT_STARTED: {
      label: 'Belum Dibaca',
      classes: 'bg-white text-zinc-500 border-zinc-200',
      icon: <BookOpen size={12} className="mr-1.5" />
    },
    IN_PROGRESS: {
      label: 'Sedang Dibaca',
      classes: 'bg-zinc-100 text-zinc-900 border-zinc-300',
      icon: <BookOpen size={12} className="mr-1.5" />
    },
    COMPLETED: {
      label: 'Selesai',
      classes: 'bg-black text-white border-black',
      icon: <CheckCircle2 size={12} className="mr-1.5" />
    },
  };

  const currentStatus = statusConfig[book.status];

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('aqidah')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (cat.includes('fiqh')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (cat.includes('sufisme') || cat.includes('tasawuf')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (cat.includes('sejarah') || cat.includes('tarikh')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-zinc-50 text-zinc-700 border-zinc-200'; // Lainnya / Default
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const handleProgressSubmit = () => {
    let newPages = parseInt(tempProgress, 10);
    if (isNaN(newPages)) newPages = book.readPages;
    if (newPages < 0) newPages = 0;
    if (newPages > book.totalPages) newPages = book.totalPages;
    
    onUpdateProgress(book, newPages);
    setIsEditingProgress(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleProgressSubmit();
    if (e.key === 'Escape') {
      setTempProgress(book.readPages.toString());
      setIsEditingProgress(false);
    }
  };

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
      className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm transition-all group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center ${currentStatus.classes}`}>
          {currentStatus.icon}
          {currentStatus.label}
        </div>
        <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button 
            onClick={() => onEdit(book)}
            className="p-2 md:p-1.5 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
            title="Edit Kitab"
          >
            <Edit2 size={16} className="md:w-3.5 md:h-3.5" />
          </button>
          <button 
            onClick={() => onDelete(book.id)}
            className="p-2 md:p-1.5 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus Kitab"
          >
            <Trash2 size={16} className="md:w-3.5 md:h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 mb-6">
        <h3 
          className="text-2xl md:text-xl font-serif font-bold text-zinc-900 leading-loose cursor-pointer hover:text-blue-600 transition-colors" 
          dir="auto"
          onClick={() => onViewDetails(book)}
        >
          {book.title}
        </h3>
        <p className="text-lg md:text-xl text-zinc-500 mt-2 font-serif leading-loose" dir="auto">{book.author}</p>
        <div className={`inline-block mt-3 px-2.5 py-1 border rounded-md text-xs font-medium ${getCategoryColor(book.category)}`}>
          {book.category}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-zinc-100">
        <div className="flex justify-between items-center text-xs text-zinc-500 mb-2 font-medium">
          <span>Progres</span>
          {isEditingProgress ? (
            <div className="flex items-center gap-1">
              <input 
                type="number" 
                value={tempProgress}
                onChange={(e) => setTempProgress(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-16 px-1.5 py-0.5 border border-zinc-300 rounded text-center text-zinc-900 focus:outline-none focus:border-black"
              />
              <span className="text-zinc-400">/ {book.totalPages}</span>
              <button 
                onClick={handleProgressSubmit}
                className="ml-1 p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <span 
              className="cursor-pointer hover:text-black hover:underline px-1 py-0.5 rounded transition-colors"
              onClick={() => {
                setTempProgress(book.readPages.toString());
                setIsEditingProgress(true);
              }}
              title="Klik untuk update progres"
            >
              {book.readPages} / {book.totalPages} hal ({progress}%)
            </span>
          )}
        </div>
        <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-black h-1.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookCard;
