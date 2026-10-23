'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

let globalShowToast: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

export function toast(toastOrMessage: string | Omit<ToastItem, 'id'>) {
  if (!globalShowToast) {
    console.warn('ToastProvider is not mounted yet.');
    return;
  }
  if (typeof toastOrMessage === 'string') {
    globalShowToast({ message: toastOrMessage, type: 'info' });
  } else {
    globalShowToast(toastOrMessage);
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    ({ title, message, type = 'info', duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  React.useEffect(() => {
    globalShowToast = showToast;
    return () => {
      globalShowToast = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast viewport container with ARIA live region */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-6 start-6 end-6 md:start-auto md:end-6 md:max-w-md z-50 flex flex-col gap-3 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-[18px] border shadow-xl transition-all duration-200 transform translate-y-0',
              t.type === 'success' && 'bg-card border-taken text-ink',
              t.type === 'error' && 'bg-card border-emergency text-ink',
              t.type === 'info' && 'bg-card border-primary text-ink'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-6 h-6 text-taken" />}
              {t.type === 'error' && <AlertCircle className="w-6 h-6 text-emergency" />}
              {t.type === 'info' && <Info className="w-6 h-6 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              {t.title && (
                <div className="font-heading font-bold text-base mb-0.5">{t.title}</div>
              )}
              <div className="font-body text-sm text-ink/90 leading-relaxed">
                {t.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 rounded-full text-muted hover:text-ink hover:bg-sand/60 transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
