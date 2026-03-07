import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, children, onClose, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden animate-scale-in border border-slate-200 flex flex-col">
        {/* Header */}
        {title && (
          <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-slate-200">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl p-2 transition-colors duration-200"
              aria-label="Fermer"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 z-10 p-2 hover:bg-slate-100 rounded-xl transition-colors duration-200"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        )}

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-slate-200 px-6 sm:px-8 py-5 bg-slate-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
