import React from 'react';
import { X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const getVariantClasses = (variant?: 'default' | 'success' | 'error') => {
  switch (variant) {
    case 'success':
      return 'border-green-200 bg-green-50 text-green-800';
    case 'error':
      return 'border-red-200 bg-red-50 text-red-800';
    default:
      return 'border-slate-200 bg-white text-slate-900';
  }
};

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed z-[10001] bottom-4 right-4 left-4 sm:left-auto sm:w-[420px] space-y-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`w-full border rounded-2xl shadow-lg px-4 py-3 flex items-start gap-3 ${getVariantClasses(
            t.variant
          )}`}
          role="status"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold break-words">{t.message}</p>
            {t.actionLabel && t.onAction && (
              <button
                type="button"
                onClick={() => {
                  t.onAction?.();
                  dismissToast(t.id);
                }}
                className="mt-2 text-sm font-bold text-blue-700 hover:text-blue-800"
              >
                {t.actionLabel}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="p-1 rounded-lg hover:bg-black/5"
            aria-label="Close"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
