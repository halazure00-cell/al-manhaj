import React from 'react';
import { Habit, HabitLog } from '../types';
import { Edit2, Trash2, CheckCircle2, Circle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onLog: (habit: Habit, date: string, log?: HabitLog) => void;
  todayStr: string;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onEdit, onDelete, onLog, todayStr }) => {
  const todayLog = habit.logs?.find(log => {
    const logDateStr = new Date(log.logDate).toISOString().split('T')[0];
    return logDateStr === todayStr;
  });

  const isCompletedToday = todayLog?.isCompleted;

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    // Use local timezone for consistent date strings
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const getLogForDate = (dateStr: string) => {
    return habit.logs?.find(log => {
      const logDateStr = new Date(log.logDate).toISOString().split('T')[0];
      return logDateStr === dateStr;
    });
  };

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
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-full w-fit border border-zinc-200">
          <Calendar size={12} />
          <span>{habit.frequency === 'DAILY' ? 'Harian' : 'Mingguan'}</span>
        </div>
        <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button 
            onClick={() => onEdit(habit)}
            className="p-2 md:p-1.5 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
            title="Edit Mutaba'ah"
          >
            <Edit2 size={16} className="md:w-3.5 md:h-3.5" />
          </button>
          <button 
            onClick={() => onDelete(habit.id)}
            className="p-2 md:p-1.5 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus Mutaba'ah"
          >
            <Trash2 size={16} className="md:w-3.5 md:h-3.5" />
          </button>
        </div>
      </div>

      <h3 className="text-2xl md:text-xl font-serif font-bold text-zinc-900 leading-relaxed md:leading-tight flex-1 pr-4 mb-2" dir="auto">{habit.title}</h3>

      {habit.description && (
        <p className="text-base md:text-sm text-zinc-500 line-clamp-2 mb-6 flex-1 font-serif leading-relaxed" dir="auto">
          {habit.description}
        </p>
      )}
      {!habit.description && <div className="flex-1 mb-6"></div>}

      <div className="mt-auto pt-5 border-t border-zinc-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">7 Hari Terakhir</span>
          <div className="flex gap-1.5 md:gap-1">
            {last7Days.map(dateStr => {
              const log = getLogForDate(dateStr);
              const isToday = dateStr === todayStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => onLog(habit, dateStr, log)}
                  className={`w-8 h-8 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all border ${
                    isToday ? 'ring-2 ring-offset-2 ring-black' : ''
                  } ${
                    log?.isCompleted 
                      ? 'bg-black text-white border-black' 
                      : 'bg-zinc-50 text-zinc-300 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
                  }`}
                  title={`${dateStr}${log?.isCompleted ? ' - Selesai' : ''}`}
                >
                  {log?.isCompleted && <CheckCircle2 size={14} className="md:w-3 md:h-3" />}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => onLog(habit, todayStr, todayLog)}
          className={`w-full py-4 md:py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-base md:text-sm transition-all min-h-[44px] ${
            isCompletedToday
              ? 'bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200'
              : 'bg-black text-white hover:bg-zinc-800 shadow-sm hover:shadow-md'
          }`}
        >
          {isCompletedToday ? (
            <>
              <CheckCircle2 size={18} className="text-black" />
              Selesai Hari Ini
            </>
          ) : (
            <>
              <Circle size={18} className="text-zinc-400" />
              Catat Hari Ini
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default HabitCard;
