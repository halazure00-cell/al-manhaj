import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import BookCard from '../components/BookCard';
import BookModal from '../components/BookModal';
import BookDetailsModal from '../components/BookDetailsModal';
import { Plus, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const STAGES = [
  { id: 1, title: 'Fase 1: Dasar (Mubtadi)', description: 'Membangun fondasi ilmu agama.' },
  { id: 2, title: 'Fase 2: Menengah (Mutawassith)', description: 'Memperdalam pemahaman dan dalil.' },
  { id: 3, title: 'Fase 3: Lanjutan (Muntahi)', description: 'Spesialisasi dan perbandingan mazhab.' },
  { id: 4, title: 'Fase 4: Pakar (Mutakhashshish)', description: 'Penelitian mendalam dan ijtihad.' },
];

export default function Curriculum() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books');
      if (!res.ok) throw new Error('Failed to fetch books');
      const data = await res.json();
      setBooks(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar kitab');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSaveBook = async (bookData: Partial<Book>) => {
    const loadingToast = toast.loading('Menyimpan kitab...');
    try {
      const isEditing = !!editingBook;
      const url = isEditing ? `/api/books/${editingBook.id}` : '/api/books';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save book');
      }
      
      await fetchBooks();
      setIsModalOpen(false);
      setEditingBook(null);
      toast.success('Kitab berhasil disimpan', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan kitab', { id: loadingToast });
    }
  };

  const handleDeleteBook = async () => {
    if (!deleteConfirmId) return;
    const loadingToast = toast.loading('Menghapus kitab...');
    try {
      const res = await fetch(`/api/books/${deleteConfirmId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete book');
      }
      await fetchBooks();
      setDeleteConfirmId(null);
      toast.success('Kitab berhasil dihapus', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kitab', { id: loadingToast });
    }
  };

  const handleUpdateProgress = async (book: Book, newReadPages: number) => {
    try {
      let newStatus = book.status;
      if (newReadPages === 0) newStatus = 'NOT_STARTED';
      else if (newReadPages >= book.totalPages) newStatus = 'COMPLETED';
      else newStatus = 'IN_PROGRESS';

      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readPages: newReadPages, status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update progress');
      }
      
      await fetchBooks();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui progres bacaan');
    }
  };

  const openAddModal = () => {
    setEditingBook(null);
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(null); // Clear first to avoid stale state
    setTimeout(() => {
      setEditingBook(book);
      setIsModalOpen(true);
    }, 0);
  };

  const openDetailsModal = (book: Book) => {
    setSelectedBook(book);
    setIsDetailsModalOpen(true);
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
        <div className="space-y-12">
          {[1, 2].map(i => (
            <div key={i} className="space-y-4">
              <div className="h-6 w-40 bg-zinc-200 rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-48 bg-zinc-100 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="px-4 pb-4 pt-2 md:px-8 md:pb-8 md:pt-0 max-w-6xl mx-auto flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 md:mb-10 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900 tracking-tight">Maratib al-'Ulum</h1>
          <p className="text-zinc-500 mt-2 text-sm">Peta jalan terstruktur untuk menuntut ilmu agama.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 text-white px-5 py-3 md:py-2.5 rounded-xl transition-all shadow-sm font-medium text-sm hover:shadow-md min-h-[44px]"
        >
          <Plus size={18} />
          Tambah Kitab
        </button>
      </div>

      <div className="overflow-y-auto pb-12 flex-1 pr-2 md:pr-4 -mr-2 md:-mr-4">
        <div className="space-y-12">
          {STAGES.map(stage => {
            const stageBooks = books.filter(b => b.stageLevel === stage.id);
            return (
              <div key={stage.id} className="relative">
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center font-serif font-bold text-sm border border-zinc-200 shrink-0">
                    {stage.id}
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-serif font-semibold text-zinc-900">{stage.title}</h2>
                    <p className="text-xs md:text-sm text-zinc-500">{stage.description}</p>
                  </div>
                </div>
                
                {stageBooks.length > 0 ? (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pl-2 md:pl-12"
                  >
                    {stageBooks.map(book => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        onEdit={openEditModal}
                        onDelete={setDeleteConfirmId}
                        onViewDetails={openDetailsModal}
                        onUpdateProgress={handleUpdateProgress}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <div className="pl-4 md:pl-12">
                    <div className="bg-white border border-dashed border-zinc-200 rounded-2xl p-8 text-center">
                      <BookOpen className="mx-auto text-zinc-300 mb-3" size={24} />
                      <p className="text-sm text-zinc-500">Belum ada kitab di fase ini.</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <BookModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBook}
        book={editingBook}
      />

      <BookDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        book={selectedBook}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 border border-zinc-100"
          >
            <h3 className="text-lg font-serif font-semibold text-zinc-900 mb-2">Hapus Kitab</h3>
            <p className="text-sm text-zinc-500 mb-6">Apakah Anda yakin ingin menghapus kitab ini? Tindakan ini tidak dapat dibatalkan.</p>

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
                onClick={handleDeleteBook}
                className="px-4 py-3 md:py-2 min-h-[44px] text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
              >
                Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
