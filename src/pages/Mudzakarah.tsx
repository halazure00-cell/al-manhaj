import React, { useState, useRef, useEffect } from 'react';
import { Send, Feather, User, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { apiFetch } from '../lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  context?: {
    notes: { id: string; title: string }[];
    books: { id: string; title: string }[];
  };
}

export default function Mudzakarah() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg.content })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get AI response');
      }

      const data = await res.json();
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.response,
        context: data.context
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `Error: ${error.message || 'Gagal terhubung ke AI.'}`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-50">
      {/* Header */}
      <div className="px-4 py-4 md:px-8 md:py-6 bg-white border-b border-zinc-200 shrink-0 flex items-center gap-4 z-10 shadow-sm">
        <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
          <Feather size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-zinc-900 tracking-tight">Mudzakarah AI</h1>
          <p className="text-zinc-500 text-xs md:text-sm">Rekan diskusi & analisis logika</p>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-zinc-50/50">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {messages.length === 0 ? (
            <div className="h-[50vh] flex flex-col items-center justify-center text-zinc-400 space-y-4">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-2">
                <Feather size={40} className="text-zinc-300" />
              </div>
              <p className="text-center max-w-sm text-sm md:text-base">
                Mulai diskusi. AI akan menganalisis pertanyaan Anda berdasarkan catatan dan kitab yang ada di database Anda.
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

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-zinc-200 shrink-0 z-10 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan sesuatu atau minta kritik logika..."
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

  const hasContext = message.context && (message.context.notes.length > 0 || message.context.books.length > 0);

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
            <div className="prose prose-sm md:prose-base prose-zinc max-w-none leading-loose text-lg md:text-xl" dir="auto">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Context Viewer Toggle */}
        {!isUser && hasContext && (
          <div className="mt-2 w-full">
            <button
              onClick={() => setShowContext(!showContext)}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors bg-white border border-zinc-200 px-2.5 py-1.5 rounded-lg shadow-sm"
            >
              <Database size={12} />
              <span>Lihat Konteks Data ({message.context?.notes.length} Catatan, {message.context?.books.length} Kitab)</span>
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
                    {message.context?.notes.length ? (
                      <div>
                        <strong className="block mb-1.5 text-zinc-900 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                          Catatan yang Direferensikan:
                        </strong>
                        <ul className="list-disc pl-5 space-y-1">
                          {message.context.notes.map(n => (
                            <li key={n.id} className="text-zinc-600">{n.title}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    
                    {message.context?.books.length ? (
                      <div>
                        <strong className="block mb-1.5 text-zinc-900 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                          Kitab yang Direferensikan:
                        </strong>
                        <ul className="list-disc pl-5 space-y-1">
                          {message.context.books.map(b => (
                            <li key={b.id} className="text-zinc-600">{b.title}</li>
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
