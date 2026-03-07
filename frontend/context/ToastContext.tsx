import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type Toast = {
  id: string;
  message: string;
  variant?: 'default' | 'success' | 'error';
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastContextType = {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Record<string, number>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timeoutId = timeoutsRef.current[id];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete timeoutsRef.current[id];
    }
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const durationMs = toast.durationMs ?? 4500;

      setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 5));

      if (durationMs > 0) {
        const timeoutId = window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
        timeoutsRef.current[id] = timeoutId;
      }

      return id;
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
