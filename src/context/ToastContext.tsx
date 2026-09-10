import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = 'toast-' + Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Container de Toasts flutuantes */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
              toast.type === 'success'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[#517566]/60'
                : toast.type === 'error'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[#EB5757]/50'
                : toast.type === 'warning'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[#FFC107]/50'
                : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--accent)]/40'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[var(--accent-dark)] dark:text-[var(--accent)]" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-[#EB5757]" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-[#FFC107]" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-[var(--accent-dark)] dark:text-[var(--accent)]" />}
            </div>
            <div className="flex-1 text-sm font-sans font-medium leading-snug text-[var(--text-primary)]">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
