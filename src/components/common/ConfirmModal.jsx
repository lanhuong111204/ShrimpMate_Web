import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, RotateCw, X } from 'lucide-react';

const VARIANT_CONFIG = {
  danger: {
    icon: AlertTriangle,
    iconWrap: 'bg-[#FFDAD6] text-[#BA1A1A] border-[#BA1A1A]/20',
    accentBar: 'bg-[#BA1A1A]',
    button: 'bg-[#BA1A1A] hover:bg-[#93000A] text-white',
    badge: 'Xác nhận thao tác',
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: 'bg-[#FFF8F5] text-[#EA580C] border-[#FFDBCA]',
    accentBar: 'bg-[#EA580C]',
    button: 'bg-[#EA580C] hover:bg-[#C2410C] text-white',
    badge: 'Lưu ý thay đổi',
  },
  success: {
    icon: CheckCircle2,
    iconWrap: 'bg-[#E8F5E9] text-[#006E2D] border-[#7CF994]',
    accentBar: 'bg-[#006E2D]',
    button: 'bg-[#006E2D] hover:bg-[#005320] text-white',
    badge: 'Xác nhận hoàn tất',
  },
  info: {
    icon: Info,
    iconWrap: 'bg-[#EFF4FF] text-[#006398] border-[#D3E4FE]',
    accentBar: 'bg-[#006398]',
    button: 'bg-[#006398] hover:bg-[#004e78] text-white',
    badge: 'Xác nhận',
  },
};

export const ConfirmModal = ({
  isOpen,
  title = 'Xác nhận thao tác',
  message = '',
  detail = '',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger;
  const Icon = cfg.icon;

  return (
    <div
      className="fixed inset-0 !mt-0 z-[120] flex items-center justify-center p-4 bg-slate-900/15 animate-fade-in"
      onClick={() => {
        if (!isLoading) onCancel?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full border border-slate-200 ring-1 ring-slate-900/10 shadow-2xl overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1.5 w-full ${cfg.accentBar}`} />

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${cfg.iconWrap}`}
            >
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {cfg.badge}
                  </span>
                  <h3 className="text-base font-bold text-[#0B1C30] leading-snug mt-0.5">
                    {title}
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={onCancel}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                {message}
              </p>

              {detail && (
                <div className="mt-3 p-3 rounded-xl bg-[#F8F9FF] border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                  {detail}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${cfg.button}`}
            >
              {isLoading && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
