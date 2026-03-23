import React, { useState, useEffect } from 'react';
import { Note, Book } from '../types';
import { X, Link as LinkIcon, Feather, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Partial<Note>, newLinks: string[], removedLinks: string[]) => void;
  note?: Note | null;
  books: Book[];
  allNotes: Note[];
}

export default function NoteModal({ isOpen, onClose, onSave, note, books, allNotes }: NoteModalProps) {
  const [formData, setFormData] = useState<Partial<Note>>({
    title: '',
    content: '',
    bookId: '',
  });

  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
  const [originalLinks, setOriginalLinks] = useState<string[]>([]);
  
  // AI Critique State
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [critiqueResult, setCritiqueResult] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content,
        bookId: note.bookId || '',
      });

      const links = [
        ...(note.sourceLinks?.map(l => l.targetNoteId) || []),
        ...(note.targetLinks?.map(l => l.sourceNoteId) || [])
      ];
      setSelectedLinks(links);
      setOriginalLinks(links);
    } else {
      setFormData({
        title: '',
        content: '',
        bookId: '',
      });
      setSelectedLinks([]);
      setOriginalLinks([]);
    }
    setCritiqueResult(null);
  }, [note, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLinks = selectedLinks.filter(id => !originalLinks.includes(id));
    const removedLinks = originalLinks.filter(id => !selectedLinks.includes(id));
    onSave(formData, newLinks, removedLinks);
  };

  const toggleLink = (noteId: string) => {
    if (selectedLinks.includes(noteId)) {
      setSelectedLinks(selectedLinks.filter(id => id !== noteId));
    } else {
      setSelectedLinks([...selectedLinks, noteId]);
    }
  };

  const handleCritique = async () => {
    if (!formData.content?.trim()) return;
    setIsCritiquing(true);
    setCritiqueResult(null);
    
    try {
      const prompt = `Critique my logic based on my database. Here is my current draft note titled "${formData.title}":\n\n${formData.content}`;
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) throw new Error('Failed to get AI critique');

      const data = await res.json();
      setCritiqueResult(data.response);
    } catch (err: any) {
      setCritiqueResult(`Error: ${err.message || 'Gagal terhubung ke AI.'}`);
    } finally {
      setIsCritiquing(false);
    }
  };

  const availableNotesToLink = allNotes.filter(n => n.id !== note?.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-100"
          >
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 shrink-0">
              <h2 className="text-xl font-serif font-bold text-zinc-900">
                {note ? 'Edit Catatan' : 'Buat Catatan'}
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
                    className="w-full px-4 py-3 md:py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors text-lg md:text-xl font-serif leading-loose min-h-[44px]"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-1.5">Kitab Terkait (Opsional)</label>
                  <select 
                    className="w-full px-4 py-3 md:py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors bg-white text-base md:text-sm min-h-[44px]"
                    value={formData.bookId || ''}
                    onChange={e => setFormData({...formData, bookId: e.target.value || null})}
                  >
                    <option value="">Tidak Ada</option>
                    {books.map(book => (
                      <option key={book.id} value={book.id}>{book.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-1.5 flex justify-between items-center">
                    <span>Konten (Mendukung Markdown)</span>
                    <button
                      type="button"
                      onClick={handleCritique}
                      disabled={isCritiquing || !formData.content?.trim()}
                      className="flex items-center gap-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCritiquing ? <Loader2 size={14} className="animate-spin" /> : <Feather size={14} />}
                      Kritik Logika
                    </button>
                  </label>
                  <textarea 
                    required
                    rows={8}
                    dir="auto"
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors font-serif text-lg md:text-xl resize-none leading-loose min-h-[44px]"
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                  />
                  
                  <AnimatePresence>
                    {critiqueResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="p-4 bg-zinc-900 text-zinc-100 rounded-xl text-sm prose prose-sm prose-invert max-w-none">
                          <div className="flex items-center gap-2 mb-2 text-zinc-400 font-semibold border-b border-zinc-800 pb-2">
                            <Feather size={16} />
                            <span>Analisis Al-Manhaj AI</span>
                          </div>
                          <ReactMarkdown>{critiqueResult}</ReactMarkdown>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {availableNotesToLink.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                      <LinkIcon size={14} />
                      <span>Tautkan ke catatan lain</span>
                    </label>
                    <div className="border border-zinc-200 rounded-xl max-h-40 overflow-y-auto p-2 space-y-1 bg-zinc-50/50">
                      {availableNotesToLink.map(n => (
                        <label key={n.id} className="flex items-center gap-3 p-3 md:p-2.5 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-zinc-200 hover:shadow-sm min-h-[44px]">
                          <input 
                            type="checkbox" 
                            className="rounded border-zinc-300 text-black focus:ring-black w-5 h-5 md:w-4 md:h-4"
                            checked={selectedLinks.includes(n.id)}
                            onChange={() => toggleLink(n.id)}
                          />
                          <span className="text-lg md:text-xl leading-loose text-zinc-700 truncate flex-1 font-medium font-serif" dir="auto">{n.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-zinc-100 flex justify-end gap-3 shrink-0 bg-zinc-50/50">
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
                  {note ? 'Simpan Perubahan' : 'Buat Catatan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
