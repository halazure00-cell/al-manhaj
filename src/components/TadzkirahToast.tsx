import React from 'react';
import toast from 'react-hot-toast';
import { Feather, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface TadzkirahProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  t: any; // Toast object
}

const TadzkirahToast: React.FC<TadzkirahProps> = ({ title, message, actionText, onAction, t }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-zinc-900 shadow-2xl rounded-2xl pointer-events-auto flex flex-col ring-1 ring-amber-500/20 overflow-hidden`}
    >
      <div className="p-5 flex items-start gap-4">
        <div className="flex-shrink-0 pt-1">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Feather className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        <div className="flex-1 w-0">
          <p className="text-sm font-serif font-bold text-amber-400 mb-1">
            {title}
          </p>
          <p className="mt-1 text-sm text-zinc-300 leading-relaxed">
            {message}
          </p>
          {actionText && onAction && (
            <button
              onClick={() => {
                onAction();
                toast.dismiss(t.id);
              }}
              className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-amber-500/30 shadow-sm text-sm font-medium rounded-xl text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 focus:outline-none transition-colors"
            >
              {actionText}
            </button>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded-md inline-flex text-zinc-500 hover:text-zinc-300 focus:outline-none"
          >
            <span className="sr-only">Tutup</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const showTadzkirah = (
  title: string,
  message: string,
  options?: {
    actionText?: string;
    onAction?: () => void;
    duration?: number;
  }
) => {
  toast.custom(
    (t) => (
      <TadzkirahToast
        t={t}
        title={title}
        message={message}
        actionText={options?.actionText}
        onAction={options?.onAction}
      />
    ),
    {
      duration: options?.duration || 8000, // Default 8 seconds
      position: 'bottom-right',
    }
  );
};
