import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Send, Feather, User, Database, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Sparkles, CalendarCheck2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ApiError, apiFetch } from '../lib/api';

type CoachMode = 'CHAT' | 'PLAN' | 'REVIEW';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  aiMessageId?: string | null;
  context?: {
    confidence?: 'LOW' | 'MEDIUM' | 'HIGH';
    notes: { id: string; title: string }[];
    books: { id: string; title: string }[];
    chunks?: { id: string; noteTitle: string; heading?: string | null; excerpt: string; score: number }[];
  };
}

const MODE_LABEL: Record<CoachMode, string> = {
  CHAT: 'Diskusi',
  PLAN: 'Rencana 7 Hari',
  REVIEW: 'Review Progres',
};

const STORAGE_SESSION_KEY = 'almanhaj_ai_session_id';
const STORAGE_DEVICE_KEY = 'almanhaj_ai_device_key';

function getOrCreateDeviceKey() {
  const existing = localStorage.getItem(STORAGE_DEVICE_KEY);
  if (existing) return existing;
  const next = `device-${crypto.randomUUID()}`;
  localStorage.setItem(STORAGE_DEVICE_KEY, next);
  return next;
}

export default function Mudzakarah() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<CoachMode>('CHAT');
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem(STORAGE_SESSION_KEY));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const deviceKey = useMemo(() => getOrCreateDeviceKey(), []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const resetSession = () => {
    const next = crypto.randomUUID();
    localStorage.setItem(STORAGE_SESSION_KEY, next);
    setSessionId(next);
    setMessages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg.content,
          sessionId,
          mode,
          deviceKey,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get AI response');
      }

      const data = await res.json();
      if (data.sessionId) {
        localStorage.setItem(STORAGE_SESSION_KEY, data.sessionId);
        setSessionId(data.sessionId);
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.response,
        aiMessageId: data.aiMessageId,
        context: data.context,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: unknown) {
      console.error(error);

      let message = 'Gagal terhubung ke AI.';
      if (error instanceof ApiError) {
        if (error.code === 'AI_QUOTA_EXCEEDED') {
          message = error.retryAfterSeconds
            ? `⚠️ Kuota AI sedang habis. Coba lagi dalam ${error.retryAfterSeconds} detik, atau ganti model/billing project Gemini.`
            : '⚠️ Kuota AI project sedang habis atau billing belum aktif. Silakan cek quota/billing Gemini.';
        } else {
          message = error.message;
        }
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `Error: ${message}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-50">
      <div className="px-4 py-4 md:px-8 md:py-6 bg-white border-b border-zinc-200 shrink-0 flex items-center justify-between gap-4 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
            <Feather size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-zinc-900 tracking-tight">Mudzakarah AI</h1>
            <p className="text-zinc-500 text-xs md:text-sm">Rekan diskusi & AI learning coach</p>
          </div>
        </div>
        <button onClick={resetSession} className="text-xs px-3 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-100">Sesi Baru</button>
      </div>

      <div className="px-4 md:px-8 pt-3 pb-1 bg-white border-b border-zinc-100 shrink-0">
        <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
          {(['CHAT', 'PLAN', 'REVIEW'] as CoachMode[]).map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`px-3 py-2 rounded-lg text-xs md:text-sm border transition-colors ${
                mode === item ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
              }`}
            >
              {item === 'CHAT' ? <Sparkles className="inline mr-1" size={14} /> : null}
              {item === 'PLAN' ? <CalendarCheck2 className="inline mr-1" size={14} /> : null}
              {item === 'REVIEW' ? <Activity className="inline mr-1" size={14} /> : null}
              {MODE_LABEL[item]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-zinc-50/50">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {messages.length === 0 ? (
            <div className="h-[50vh] flex flex-col items-center justify-center text-zinc-400 space-y-4">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-2">
                <Feather size={40} className="text-zinc-300" />
              </div>
              <p className="text-center max-w-sm text-sm md:text-base">
                Mode aktif: <strong>{MODE_LABEL[mode]}</strong>. AI akan memadukan catatan, progres kitab, dan habit belajar Anda.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          {isLoading && (
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                <Feather size={16} className="text-zinc-500" />
              </div>
              <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div className="p-4 bg-white border-t border-zinc-200 shrink-0 z-10 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan sesuatu atau minta coaching plan..."
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 md:py-4 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all text-sm md:text-base shadow-inner"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-zinc-900 text-white px-5 py-3 md:py-4 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
          >
            <Send size={18} className="md:w-5 md:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const [showContext, setShowContext] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'UP' | 'DOWN' | null>(null);

  const hasContext = message.context && (message.context.notes.length > 0 || message.context.books.length > 0 || (message.context.chunks?.length ?? 0) > 0);

  const sendFeedback = async (rating: 'UP' | 'DOWN') => {
    if (!message.aiMessageId) return;
    setFeedbackState(rating);
    try {
      await apiFetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: message.aiMessageId, rating }),
      });
    } catch (error) {
      console.error('feedback error', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 md:gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isUser ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white text-zinc-600 border-zinc-200 shadow-sm'}`}>
        {isUser ? <User size={16} /> : <Feather size={16} />}
      </div>

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[75%]`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-zinc-900 text-white rounded-tr-none'
              : 'bg-white border border-zinc-200 text-zinc-900 rounded-tl-none'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed" dir="auto">{message.content}</p>
          ) : (
            <div className="prose prose-sm md:prose-base prose-zinc max-w-none leading-loose text-base md:text-lg" dir="auto">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.aiMessageId && (
          <div className="mt-2 flex items-center gap-2 text-zinc-500">
            <button onClick={() => sendFeedback('UP')} className={`p-1.5 border rounded-md ${feedbackState === 'UP' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'border-zinc-300 hover:bg-zinc-100'}`}>
              <ThumbsUp size={14} />
            </button>
            <button onClick={() => sendFeedback('DOWN')} className={`p-1.5 border rounded-md ${feedbackState === 'DOWN' ? 'bg-rose-100 border-rose-300 text-rose-700' : 'border-zinc-300 hover:bg-zinc-100'}`}>
              <ThumbsDown size={14} />
            </button>
            {message.context?.confidence ? <span className="text-[11px] uppercase tracking-wide">Confidence: {message.context.confidence}</span> : null}
          </div>
        )}

        {!isUser && hasContext && (
          <div className="mt-2 w-full">
            <button
              onClick={() => setShowContext(!showContext)}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors bg-white border border-zinc-200 px-2.5 py-1.5 rounded-lg shadow-sm"
            >
              <Database size={12} />
              <span>Lihat Konteks ({message.context?.notes.length} Catatan, {message.context?.books.length} Kitab)</span>
              {showContext ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            <AnimatePresence>
              {showContext && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-3 md:p-4 bg-white border border-zinc-200 rounded-xl text-xs md:text-sm text-zinc-600 space-y-3 shadow-sm">
                    {message.context?.chunks?.length ? (
                      <div>
                        <strong className="block mb-1.5 text-zinc-900">Top Chunks:</strong>
                        <ul className="space-y-2">
                          {message.context.chunks.map((chunk) => (
                            <li key={chunk.id} className="border border-zinc-200 rounded-md p-2">
                              <div className="font-medium text-zinc-800">{chunk.noteTitle}{chunk.heading ? ` > ${chunk.heading}` : ''} <span className="text-zinc-400">(score {chunk.score})</span></div>
                              <p className="text-zinc-600 mt-1">{chunk.excerpt}...</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
