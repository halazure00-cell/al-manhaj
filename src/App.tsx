import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import Layout from './components/Layout';
import Curriculum from './pages/Curriculum';
import Zettelkasten from './pages/Zettelkasten';
import HabitTracker from './pages/HabitTracker';
import Statistics from './pages/Statistics';
import KnowledgeGraph from './pages/KnowledgeGraph';
import Mudzakarah from './pages/Mudzakarah';
import { AlertTriangle } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-serif font-bold text-zinc-900 mb-2">Terjadi Kesalahan</h2>
        <p className="text-zinc-500 text-sm mb-6 whitespace-pre-wrap overflow-auto max-h-32">
          {error.message}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
        >
          Muat Ulang Aplikasi
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.href = '/'}>
      <BrowserRouter>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#18181b',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Curriculum />} />
            <Route path="notes" element={<Zettelkasten />} />
            <Route path="graph" element={<KnowledgeGraph />} />
            <Route path="mudzakarah" element={<Mudzakarah />} />
            <Route path="habits" element={<HabitTracker />} />
            <Route path="stats" element={<Statistics />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
