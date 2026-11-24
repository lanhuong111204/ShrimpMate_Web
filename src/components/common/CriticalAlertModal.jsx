import React from 'react';
import {
  AlertOctagon,
  X,
  Volume2,
  VolumeX,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';

export const CriticalAlertModal = ({
  alert = null,
  isMuted = false,
  onToggleMute,
  onAcknowledge,
  onOpenLogs,
  onEmergencyStop,
  onClose,
}) => {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 !mt-0 z-[110] flex items-center justify-center p-4 bg-slate-900/35 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full border-2 border-[#BA1A1A] ring-2 ring-[#BA1A1A]/20 shadow-2xl overflow-hidden">
        <div className="bg-[#BA1A1A] px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertOctagon className="w-6 h-6 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <div className="text-[10px] font-mono-num font-bold uppercase tracking-wider text-red-100">
                CẢNH BÁO MỨC 3 • NGUY CẤP THỜI GIAN THỰC
              </div>
              <h3 className="font-display font-bold text-sm truncate">
                {alert.rawType?.toUpperCase() || alert.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleMute}
              title={isMuted ? 'Bật lại còi cảnh báo' : 'Tắt tiếng còi cảnh báo'}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {(alert.pondCode || alert.pondName) && (
              <span className="px-2.5 py-1 rounded-full bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE] font-mono-num font-bold">
                {alert.pondCode} {alert.pondName ? `• ${alert.pondName}` : ''}
              </span>
            )}
            {alert.latestValue !== null && alert.latestValue !== undefined && (
              <span className="px-2.5 py-1 rounded-full bg-[#FFDAD6] text-[#BA1A1A] font-mono-num font-bold">
                Giá trị đo: {alert.latestValue}
                {alert.metadata?.unit ? ` ${alert.metadata.unit}` : ''}
              </span>
            )}
            {alert.timestamp && (
              <span className="text-slate-500 font-mono-num ml-auto">{alert.timestamp}</span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#93000A] leading-relaxed font-medium">
            {alert.message}
          </div>

          {alert.actionRecommendation && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[#92400E] flex items-start gap-2 leading-relaxed">
              <Lightbulb className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <span>
                <strong>Khuyến nghị can thiệp:</strong> {alert.actionRecommendation}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {alert.alertId && (
              <button
                type="button"
                onClick={() => onAcknowledge?.(alert.alertId)}
                className="py-2.5 px-3 rounded-xl bg-[#006E2D] hover:bg-[#005320] text-white font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Tiếp nhận</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenLogs}
              className="py-2.5 px-3 rounded-xl bg-[#0B1C30] hover:bg-[#131B2E] text-white font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở Nhật ký</span>
            </button>
            <button
              type="button"
              onClick={onEmergencyStop}
              className="py-2.5 px-3 rounded-xl bg-[#FFDAD6] hover:bg-[#BA1A1A] text-[#BA1A1A] hover:text-white border border-[#BA1A1A]/30 font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Dừng E-Stop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriticalAlertModal;
