import React, { useState, useEffect } from 'react';
import { Note, Book } from '../types';
import NoteCard from '../components/NoteCard';
import NoteModal from '../components/NoteModal';
import { Plus, Search, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Zettelkasten() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [notesRes, booksRes] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/books')
      ]);

      if (!notesRes.ok || !booksRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const notesData = await notesRes.json();
      const booksData = await booksRes.json();
      
      setNotes(notesData);
      setBooks(booksData);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat catatan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveNote = async (noteData: Partial<Note>, newLinks: string[], removedLinks: string[]) => {
    const loadingToast = toast.loading('Menyimpan catatan...');
    try {
      const isEditing = !!editingNote;
      const url = isEditing ? `/api/notes/${editingNote.id}` : '/api/notes';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save note');
      }
      
      const savedNote = await res.json();

      for (const targetId of newLinks) {
        await fetch(`/api/notes/${savedNote.id}/links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetNoteId: targetId })
        });
      }

      for (const targetId of removedLinks) {
        await fetch(`/api/notes/${savedNote.id}/links/${targetId}`, {
          method: 'DELETE'
        });
      }

      await fetchData();
      setIsModalOpen(false);
      setEditingNote(null);
      toast.success('Catatan berhasil disimpan', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan catatan', { id: loadingToast });
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteConfirmId) return;
    const loadingToast = toast.loading('Menghapus catatan...');
    try {
      const res = await fetch(`/api/notes/${deleteConfirmId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete note');
      }
      await fetchData();
      setDeleteConfirmId(null);
      toast.success('Catatan berhasil dihapus', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus catatan', { id: loadingToast });
    }
  };

  const openAddModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(null);
    setTimeout(() => {
      setEditingNote(note);
      setIsModalOpen(true);
    }, 0);
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.book?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-zinc-100 rounded-2xl animate-pulse"></div>
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
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900 tracking-tight">Catatan</h1>
          <p className="text-zinc-500 mt-2 text-sm">Dialektika & Jaringan Catatan.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari catatan..." 
              className="pl-10 pr-4 py-3 md:py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors text-base md:text-sm w-full md:w-64 bg-white min-h-[44px]"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 text-white px-5 py-3 md:py-2.5 rounded-xl transition-all shadow-sm font-medium text-sm hover:shadow-md min-h-[44px]"
          >
            <Plus size={18} />
            Catatan Baru
          </button>
        </div>
      </div>

      {filteredNotes.length > 0 ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-y-auto pb-8 flex-1 content-start pr-2 md:pr-4 -mr-2 md:-mr-4"
        >
          {filteredNotes.map(note => (
            <NoteCard 
              key={note.id} 
              note={note} 
              onEdit={openEditModal}
              onDelete={setDeleteConfirmId}
            />
          ))}
        </motion.div>
      ) : (
        <div className="flex-1 flex items-center justify-center border border-dashed border-zinc-200 rounded-2xl bg-white">
          <div className="text-center max-w-sm">
            <Network className="mx-auto text-zinc-300 mb-4" size={32} />
            <h3 className="text-lg font-serif font-bold text-zinc-900 mb-1">Tidak ada catatan</h3>
            <p className="text-zinc-500 text-sm mb-6">
              {searchQuery ? "Coba sesuaikan kata kunci pencarian Anda." : "Mulai bangun jaringan pengetahuan Anda dengan membuat catatan pertama."}
            </p>
            {!searchQuery && (
              <button 
                onClick={openAddModal}
                className="text-black font-semibold text-sm hover:underline underline-offset-4"
              >
                + Buat catatan pertama Anda
              </button>
            )}
          </div>
        </div>
      )}

      <NoteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNote}
        note={editingNote}
        books={books}
        allNotes={notes}
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
              <h3 className="text-lg font-serif font-semibold text-zinc-900 mb-2">Hapus Catatan</h3>
              <p className="text-sm text-zinc-500 mb-6">Apakah Anda yakin ingin menghapus catatan ini? Tindakan ini tidak dapat dibatalkan.</p>

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
                  onClick={handleDeleteNote}
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
