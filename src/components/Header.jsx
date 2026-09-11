import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';

export const Header = ({
  currentTime,
  onEmergencyStop,
  onSync,
  isSyncing,
  activePondCode = 'AO-02',
}) => {
  return (
    <header className="sticky top-0 z-50 h-14 bg-neutral-950 text-white border-b border-neutral-800 px-3 sm:px-6 flex items-center justify-between shadow-sm">
      {/* Left: Branding & Site Info */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white text-neutral-950 flex items-center justify-center font-display font-extrabold text-sm tracking-tight shadow-sm shrink-0">
            SM
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xs tracking-wider text-white uppercase">
                SHRIMPMATE SCADA
              </span>
              <span className="text-[10px] font-mono-num bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-700 font-medium">
                v4.2 PRO
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 font-normal truncate max-w-[180px] sm:max-w-none">
              Trại CNC Ba Đầm – Giá Rai, Bạc Liêu
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-neutral-800 hidden md:block" />

        {/* Live IoT Telemetry Ping */}
        <div className="hidden sm:flex items-center gap-3.5 text-xs font-mono-num">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-neutral-400 text-[11px]">LoRa Gateway:</span>
            <span className="text-neutral-200 font-medium text-[11px]">915MHz OK (-68dBm)</span>
          </div>
          <div className="h-3 w-px bg-neutral-800" />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-neutral-400 text-[11px]">Sensor Phao:</span>
            <span className="text-neutral-200 font-medium text-[11px]">4/4 Trực tuyến</span>
          </div>
          <div className="h-3 w-px bg-neutral-800" />
          <div className="flex items-center gap-1.5 text-neutral-300">
            <span className="text-neutral-400 text-[11px]">Ao tập trung:</span>
            <span className="text-emerald-400 font-semibold text-[11px]">{activePondCode}</span>
          </div>
        </div>
      </div>

      {/* Right: Telemetry sync + Operator Info + E-Stop Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync telemetry */}
        <button
          onClick={onSync}
          title="Đồng bộ hóa tức thời dữ liệu telemetry"
          className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-medium transition cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 text-neutral-400 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          <span className="font-mono-num text-[11px]">{currentTime} Đồng bộ</span>
        </button>

        {/* Technical Operator Profile */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-neutral-800 text-right">
          <div>
            <div className="text-xs font-semibold text-neutral-200 leading-tight">Kỹ sư Trần Văn Điền</div>
            <div className="text-[10px] text-neutral-400 font-mono-num">ID: KS-8823 (Ca 1)</div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-200">
            Đ
          </div>
        </div>

        {/* E-STOP BUTTON */}
        <button
          onClick={onEmergencyStop}
          className="h-8 px-2.5 sm:px-3 rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 text-white font-display font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
          title="Ngắt khẩn cấp rơ-le toàn bộ máy rải cám và mâm quay"
        >
          <AlertOctagon className="w-4 h-4" />
          <span className="uppercase text-[11px] sm:text-xs">E-STOP KHẨN CẤP</span>
        </button>
      </div>
    </header>
  );
};
