import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in slide-in-from-bottom-3 duration-200">
      <div
        className={`p-3.5 rounded-xl shadow-lg border flex items-start gap-3 font-mono-num text-xs ${
          type === 'success'
            ? 'bg-neutral-900 text-white border-neutral-800'
            : type === 'warning'
            ? 'bg-amber-50 text-amber-900 border-amber-300'
            : 'bg-neutral-900 text-white border-neutral-800'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : type === 'warning' ? (
            <AlertCircle className="w-4 h-4 text-amber-600" />
          ) : (
            <Info className="w-4 h-4 text-neutral-300" />
          )}
        </div>
        <div className="flex-1 font-sans text-xs leading-snug">{message}</div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white transition cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
