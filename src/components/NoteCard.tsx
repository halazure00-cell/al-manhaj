import React from 'react';
import { Note } from '../types';
import { Edit2, Trash2, Link as LinkIcon, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onDelete }) => {
  const allLinks = [
    ...(note.sourceLinks?.map(l => l.targetNote) || []),
    ...(note.targetLinks?.map(l => l.sourceNote) || [])
  ].filter(Boolean);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
      className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm transition-all group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-2xl md:text-xl font-serif font-bold text-zinc-900 leading-relaxed md:leading-tight flex-1 pr-4" dir="auto">{note.title}</h3>
        <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button 
            onClick={() => onEdit(note)}
            className="p-2 md:p-1.5 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
            title="Edit Catatan"
          >
            <Edit2 size={16} className="md:w-3.5 md:h-3.5" />
          </button>
          <button 
            onClick={() => onDelete(note.id)}
            className="p-2 md:p-1.5 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus Catatan"
          >
            <Trash2 size={16} className="md:w-3.5 md:h-3.5" />
          </button>
        </div>
      </div>

      {note.book && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-full w-fit mb-4 border border-zinc-200">
          <BookOpen size={12} />
          <span>{note.book.title}</span>
        </div>
      )}

      <div className="text-lg md:text-xl text-zinc-600 line-clamp-4 flex-1 mb-6 prose prose-sm prose-zinc max-w-none font-serif leading-loose" dir="auto">
        <ReactMarkdown>{note.content || ''}</ReactMarkdown>
      </div>

      {allLinks.length > 0 && (
        <div className="mt-auto pt-4 border-t border-zinc-100">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3 uppercase tracking-wider font-semibold">
            <LinkIcon size={12} />
            <span>Catatan Terkait ({allLinks.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allLinks.slice(0, 3).map(linkedNote => (
              <span key={linkedNote?.id} className="text-xs font-medium bg-zinc-50 border border-zinc-200 text-zinc-600 px-2.5 py-1 rounded-lg truncate max-w-[140px]" dir="auto">
                {linkedNote?.title}
              </span>
            ))}
            {allLinks.length > 3 && (
              <span className="text-xs font-medium bg-zinc-50 border border-zinc-200 text-zinc-600 px-2.5 py-1 rounded-lg">
                +{allLinks.length - 3} lainnya
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NoteCard;
