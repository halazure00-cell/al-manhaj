import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle2, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/api';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BatchImportModal({ isOpen, onClose }: BatchImportModalProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; count: number } | null>(null);

  const handleImport = async () => {
    setError(null);
    setSuccess(null);
    
    if (!jsonInput.trim()) {
      setError('Masukkan data JSON terlebih dahulu.');
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonInput);
      if (!Array.isArray(parsedData)) {
        throw new Error('Data harus berupa array JSON (dimulai dengan "[" dan diakhiri dengan "]").');
      }
    } catch (err: any) {
      setError(`Format JSON tidak valid: ${err.message}`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch('/api/books/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengimpor data.');
      }

      setSuccess({ message: data.message, count: data.count });
      setJsonInput('');
      
      // Reload page after a short delay to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleJson = `[
  {
    "title": "Kitab Al-Hikam",
    "author": "Ibn 'Ata'illah al-Iskandari",
    "category": "Sufisme / Tasawuf",
    "addedAt": "2026-03-30",
    "source": "Hadiah dari guru",
    "initialNote": "Fokus pada adab suluk dan tazkiyatun nafs.",
    "stageLevel": 3,
    "totalPages": 250
  },
  {
    "title": "Al-Muwatta",
    "author": "Imam Malik",
    "category": "Fiqh",
    "addedAt": "2026-03-29",
    "source": "Toko kitab Madinah",
    "initialNote": "Target murajaah bab thaharah dan shalat.",
    "stageLevel": 2,
    "totalPages": 600
  }
]`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col border border-zinc-100 max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-5 md:p-6 border-b border-zinc-100 shrink-0 bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black text-white rounded-lg shadow-sm">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-zinc-900">Batch Import Kitab</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Impor banyak kitab sekaligus menggunakan format JSON.</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-zinc-400 hover:text-zinc-900 transition-colors p-2 rounded-full hover:bg-zinc-200 bg-zinc-100 flex items-center justify-center shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-700">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{success.message}</p>
                    <p className="text-xs mt-1 opacity-80">Memuat ulang halaman...</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                    <FileJson size={16} className="text-zinc-500" />
                    Data JSON
                  </label>
                  <button 
                    onClick={() => setJsonInput(exampleJson)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Gunakan Contoh Format
                  </button>
                </div>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste array JSON Anda di sini..."
                  className="w-full h-64 p-4 text-sm font-mono bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 transition-colors resize-none"
                  spellCheck="false"
                />
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Pastikan data berupa array JSON yang valid. Field yang didukung: <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">title</code> (wajib), <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">author</code> (wajib), <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">category</code> (wajib), <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">addedAt</code> (opsional, format YYYY-MM-DD), <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">source</code> (opsional), <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">initialNote</code> (opsional), <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">stageLevel</code> (wajib, 1-4), <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">totalPages</code> (wajib), <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">readPages</code> (opsional), dan <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">status</code> (opsional).
                </p>
              </div>
            </div>

            <div className="p-5 md:p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3 shrink-0">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
                disabled={isLoading || !!success}
              >
                Batal
              </button>
              <button
                onClick={handleImport}
                disabled={isLoading || !!success}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-black hover:bg-zinc-800 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Impor Data
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
