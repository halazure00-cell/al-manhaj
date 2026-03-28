import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart2, 
  BookOpen, 
  Network, 
  CheckSquare, 
  TrendingUp, 
  Award,
  BookMarked,
  Link as LinkIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';

interface StatsData {
  books: {
    totalBooks: number;
    completedBooks: number;
    inProgressBooks: number;
    totalPages: number;
    readPages: number;
  };
  notes: {
    totalNotes: number;
    totalLinks: number;
  };
  habits: {
    totalHabits: number;
    completedLogs: number;
    totalLogs: number;
    habitCompletionByDay: {
      date: string;
      completed: number;
      total: number;
    }[];
  };
}

export default function Statistics() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch statistics');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat statistik');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <div className="h-10 w-48 bg-zinc-200 rounded-lg animate-pulse"></div>
          <div className="h-4 w-64 bg-zinc-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-zinc-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="h-80 bg-zinc-100 rounded-2xl animate-pulse"></div>
          <div className="h-80 bg-zinc-100 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const readingProgress = stats.books.totalPages > 0 
    ? Math.round((stats.books.readPages / stats.books.totalPages) * 100) 
    : 0;

  const habitCompletionRate = stats.habits.totalLogs > 0
    ? Math.round((stats.habits.completedLogs / stats.habits.totalLogs) * 100)
    : 0;

  const chartData = stats.habits.habitCompletionByDay.map(day => ({
    name: format(parseISO(day.date), 'EEEE', { locale: id }).substring(0, 3),
    completed: day.completed,
    fullDate: format(parseISO(day.date), 'dd MMM yyyy', { locale: id })
  }));

  return (
    <div className="px-4 pb-4 pt-2 md:px-8 md:pb-8 md:pt-0 max-w-6xl mx-auto flex flex-col h-full overflow-y-auto pb-24 md:pb-8">
      <div className="mb-8 md:mb-10 shrink-0">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900 tracking-tight">Statistik & Rekap</h1>
        <p className="text-zinc-500 mt-2 text-sm">Pantau progres perjalanan intelektual dan spiritual Anda.</p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Top Level Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Books Stat Card */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 text-zinc-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
              <BookOpen size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-zinc-100 rounded-lg text-zinc-700">
                  <BookOpen size={20} />
                </div>
                <h3 className="font-semibold text-zinc-900">Kurikulum</h3>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-serif font-bold text-zinc-900">{stats.books.completedBooks}</span>
                <span className="text-zinc-500 mb-1">/ {stats.books.totalBooks} kitab</span>
              </div>
              <p className="text-sm text-zinc-500 mb-4">Selesai dibaca</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-500">Progres Membaca</span>
                  <span className="text-zinc-900">{readingProgress}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${readingProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-black rounded-full"
                  />
                </div>
                <p className="text-xs text-zinc-400 text-right">{stats.books.readPages} dari {stats.books.totalPages} halaman</p>
              </div>
            </div>
          </motion.div>

          {/* Notes Stat Card */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 text-zinc-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
              <Network size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-zinc-100 rounded-lg text-zinc-700">
                  <Network size={20} />
                </div>
                <h3 className="font-semibold text-zinc-900">Zettelkasten</h3>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-serif font-bold text-zinc-900">{stats.notes.totalNotes}</span>
                <span className="text-zinc-500 mb-1">catatan</span>
              </div>
              <p className="text-sm text-zinc-500 mb-6">Dalam jaringan pengetahuan</p>
              
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <LinkIcon size={18} className="text-zinc-400" />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{stats.notes.totalLinks}</p>
                  <p className="text-xs text-zinc-500">Tautan antar catatan</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Habits Stat Card */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 text-zinc-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
              <CheckSquare size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-zinc-100 rounded-lg text-zinc-700">
                  <CheckSquare size={20} />
                </div>
                <h3 className="font-semibold text-zinc-900">Mutaba'ah</h3>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-serif font-bold text-zinc-900">{habitCompletionRate}%</span>
                <span className="text-zinc-500 mb-1">tingkat penyelesaian</span>
              </div>
              <p className="text-sm text-zinc-500 mb-6">Dalam 30 hari terakhir</p>
              
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <TrendingUp size={18} className="text-zinc-400" />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{stats.habits.completedLogs} / {stats.habits.totalLogs}</p>
                  <p className="text-xs text-zinc-500">Aktivitas diselesaikan</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif font-bold text-lg text-zinc-900">Aktivitas Mutaba'ah (7 Hari Terakhir)</h3>
              <p className="text-sm text-zinc-500">Jumlah rutinitas yang diselesaikan setiap harinya.</p>
            </div>
            <div className="p-2 bg-zinc-100 rounded-lg text-zinc-700 hidden sm:block">
              <BarChart2 size={20} />
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f4f4f5' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-900 text-white p-3 rounded-xl shadow-xl text-sm border border-zinc-800">
                          <p className="font-medium mb-1">{payload[0].payload.fullDate}</p>
                          <p className="text-zinc-300">
                            <span className="font-bold text-white">{payload[0].value}</span> aktivitas selesai
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="completed" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#000000' : '#a1a1aa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recap Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-zinc-900 text-white p-6 md:p-8 rounded-2xl shadow-md relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 text-zinc-800 opacity-50">
              <Award size={160} />
            </div>
            <div className="relative z-10">
              <h3 className="font-serif font-bold text-xl mb-2">Pencapaian Kurikulum</h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Anda telah menyelesaikan {stats.books.completedBooks} dari {stats.books.totalBooks} kitab dalam kurikulum Anda. 
                Terus pertahankan konsistensi dalam menuntut ilmu.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700">
                  <BookMarked size={20} className="text-zinc-300" />
                </div>
                <div>
                  <p className="text-2xl font-serif font-bold">{stats.books.readPages}</p>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Halaman Dibaca</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm">
            <h3 className="font-serif font-bold text-xl text-zinc-900 mb-2">Jaringan Pengetahuan</h3>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
              Zettelkasten Anda semakin berkembang. Dengan {stats.notes.totalNotes} catatan dan {stats.notes.totalLinks} tautan, 
              Anda sedang membangun "otak kedua" yang saling terhubung.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200">
                <Network size={20} className="text-zinc-700" />
              </div>
              <div>
                <p className="text-2xl font-serif font-bold text-zinc-900">
                  {stats.notes.totalNotes > 0 ? (stats.notes.totalLinks / stats.notes.totalNotes).toFixed(1) : 0}
                </p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Rata-rata Tautan / Catatan</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
