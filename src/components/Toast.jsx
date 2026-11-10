import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertOctagon, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    if (!message || !onClose) return;
    const duration = type === 'alert' || type === 'error' || type === 'warning' ? 7000 : 4500;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, type, onClose]);

  if (!message) return null;

  const isError = type === 'alert' || type === 'error';
  const isWarning = type === 'warning';
  const isSuccess = type === 'success';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in slide-in-from-bottom-3 duration-200">
      <div
        className={`p-3.5 rounded-xl shadow-lg border flex items-start gap-3 font-mono-num text-xs ${
          isError
            ? 'bg-red-50 text-red-900 border-red-300'
            : isWarning
            ? 'bg-amber-50 text-amber-900 border-amber-300'
            : isSuccess
            ? 'bg-neutral-900 text-white border-neutral-800'
            : 'bg-neutral-900 text-white border-neutral-800'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {isError ? (
            <AlertOctagon className="w-4 h-4 text-red-600" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : isWarning ? (
            <AlertCircle className="w-4 h-4 text-amber-600" />
          ) : (
            <Info className="w-4 h-4 text-neutral-300" />
          )}
        </div>
        <div className="flex-1 font-sans text-xs leading-snug">{message}</div>
        <button
          onClick={onClose}
          className={`transition cursor-pointer shrink-0 ${
            isError
              ? 'text-red-500 hover:text-red-800'
              : isWarning
              ? 'text-amber-600 hover:text-amber-900'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
