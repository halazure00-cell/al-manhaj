import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Network, CheckSquare, BarChart2, Clock, Share2, MessageSquare, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BatchImportModal from './BatchImportModal';
import { formatHijriDate } from 'date-fns-hijri';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef(null);

  useEffect(() => {
    // Minimalist flashing open animation delay
    const timer = setTimeout(() => {
      setIsAppLoaded(true);
    }, 1200);
    
    // Time updater
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
    };
  }, []);
  
  const navItems = [
    { path: '/', label: 'Daftar Kitab', icon: BookOpen },
    { path: '/notes', label: 'Catatan', icon: Network },
    { path: '/graph', label: 'Grafik', icon: Share2 },
    { path: '/habits', label: 'Mutaba\'ah', icon: CheckSquare },
    { path: '/stats', label: 'Statistik', icon: BarChart2 },
  ];

  // Format Hijri Date: e.g., 14 Ramadan 1447
  const hijriDate = formatHijriDate(currentTime, 'iD iMMMM iYYYY');
  // Format Time: e.g., 20:47
  const timeString = format(currentTime, 'HH:mm');
  // Format Day: e.g., Senin
  const dayString = format(currentTime, 'EEEE', { locale: id });

  return (
    <>
      {/* Splash Screen Animation */}
      <AnimatePresence>
        {!isAppLoaded && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 text-white"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center gap-4"
            >
              <div className="bg-white text-black p-4 rounded-2xl shadow-2xl">
                <BookOpen size={48} />
              </div>
              <h1 className="text-3xl font-serif font-bold tracking-tight">Al-Manhaj</h1>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
                className="h-0.5 bg-white/20 rounded-full mt-2 w-full max-w-[100px] overflow-hidden"
              >
                <div className="h-full bg-white rounded-full w-full" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={constraintsRef} className="flex h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-200 overflow-x-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex w-64 border-r border-zinc-200 bg-white flex-col z-10 shrink-0">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-black text-white p-2 rounded-lg shadow-sm">
                <BookOpen size={20} />
              </div>
              <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">
                Al-Manhaj
              </h1>
            </div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mt-4">Peta Jalan Intelektual</p>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 mt-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-xl transition-colors duration-300 text-sm font-medium ${
                    isActive 
                      ? 'text-white' 
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 bg-black rounded-xl"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3">
                    <Icon size={18} className={isActive ? "text-white" : "text-zinc-400"} />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative bg-zinc-50 pb-[72px] md:pb-0 flex flex-col">
          {/* Global Header */}
          <header className="w-full flex justify-between items-center p-4 md:px-8 md:pt-8 shrink-0">
            {/* Hijri Time Display (Top Left) */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-zinc-900 font-serif font-bold text-lg md:text-xl tracking-tight">
                <Clock size={18} className="text-zinc-400" />
                <span>{timeString}</span>
              </div>
              <div className="text-xs md:text-sm text-zinc-500 font-medium tracking-wide">
                {dayString}, {hijriDate} H
              </div>
            </div>

            {/* Admin Menu (Top Right) */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  window.location.href = '/api/export';
                }}
                className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity select-none cursor-pointer group"
                title="Export Data"
              >
                <div className="bg-white border border-zinc-200 text-zinc-700 p-1.5 md:p-2 rounded-md shadow-sm group-hover:shadow-md transition-shadow">
                  <Download size={16} className="md:w-5 md:h-5" />
                </div>
              </button>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity select-none cursor-pointer group"
                title="Batch Import (Admin Menu)"
              >
                <span className="text-sm md:text-base font-serif font-bold text-zinc-900 tracking-tight group-hover:text-black transition-colors hidden sm:inline-block">Al-Manhaj</span>
                <div className="bg-black text-white p-1.5 md:p-2 rounded-md shadow-sm group-hover:shadow-md transition-shadow">
                  <BookOpen size={16} className="md:w-5 md:h-5" />
                </div>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="h-full overflow-auto"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Bottom Navigation (Mobile) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-50 flex justify-around items-center px-2 pb-safe pt-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center min-h-[56px] min-w-[64px] p-2"
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-mobile"
                    className="absolute inset-0 bg-zinc-100 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex flex-col items-center gap-1">
                  <Icon size={20} className={isActive ? "text-black" : "text-zinc-400"} />
                  <span className={`text-[10px] font-medium ${isActive ? "text-black" : "text-zinc-400"}`}>
                    {item.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Draggable Mudzakarah FAB */}
        <motion.div
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setTimeout(() => setIsDragging(false), 150)}
          className="fixed z-[60] bottom-20 right-4 md:bottom-8 md:right-8 cursor-grab active:cursor-grabbing"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1 }}
        >
          <div 
            onClick={(e) => {
              if (isDragging) {
                e.preventDefault();
              } else {
                navigate('/mudzakarah');
              }
            }}
            className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-zinc-900 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow border-2 border-white/10 relative group"
          >
            <MessageSquare size={24} className="md:w-7 md:h-7" />
            
            {/* Tooltip */}
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden md:block">
              Mudzakarah AI
            </div>
          </div>
        </motion.div>
      </div>

      <BatchImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />
    </>
  );
}
