import React from 'react';
import { 
  LayoutDashboard, 
  Waves, 
  Settings2, 
  Clock, 
  Activity, 
  Radio, 
  History
} from 'lucide-react';

export const Sidebar = ({
  currentTab,
  onSelectTab,
  activePondCount = 4,
  feederReadyCount = 4,
}) => {
  return (
    <aside className="w-56 bg-white border-r border-neutral-200 flex flex-col justify-between shrink-0 select-none">
      <div className="p-3 space-y-1">
        <div className="px-2.5 py-1 text-[10px] font-mono-num font-semibold uppercase text-neutral-400 tracking-wider">
          Điều Hành Trung Tâm
        </div>

        {/* 1. Bàn Tổng Quan */}
        <button
          onClick={() => onSelectTab('overview')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
            currentTab === 'overview'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Bàn Tổng Quan</span>
        </button>

        {/* 2. Quản Lý 4 Ao */}
        <button
          onClick={() => onSelectTab('ponds')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
            currentTab === 'ponds'
              ? 'bg-neutral-900 text-white shadow-sm font-semibold'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Waves className="w-4 h-4 shrink-0" />
            <span>Quản Lý 4 Ao</span>
          </div>
          <span
            className={`font-mono-num text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              currentTab === 'ponds' ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {activePondCount}
          </span>
        </button>

        {/* 3. Điều Khiển Máy Ăn */}
        <button
          onClick={() => onSelectTab('feeder')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
            currentTab === 'feeder'
              ? 'bg-neutral-900 text-white shadow-sm font-semibold'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-4 h-4 shrink-0" />
            <span>Điều Khiển Máy Ăn</span>
          </div>
          <span
            className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100"
            title={`${feederReadyCount} máy sẵn sàng`}
          />
        </button>

        {/* 4. Lên Lịch Ăn Cữ */}
        <button
          onClick={() => onSelectTab('schedule')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
            currentTab === 'schedule'
              ? 'bg-neutral-900 text-white shadow-sm font-semibold'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Lên Lịch Ăn Cữ</span>
        </button>

        {/* 5. AI Bio-Acoustic */}
        <button
          onClick={() => onSelectTab('acoustics')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
            currentTab === 'acoustics'
              ? 'bg-neutral-900 text-white shadow-sm font-semibold'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>AI Bio-Acoustic</span>
        </button>

        <div className="pt-4 px-2.5 py-1 text-[10px] font-mono-num font-semibold uppercase text-neutral-400 tracking-wider">
          Hạ Tầng Kỹ Thuật
        </div>

        {/* 6. Cài Đặt Trạm IoT */}
        <button
          onClick={() => onSelectTab('iot')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
            currentTab === 'iot'
              ? 'bg-neutral-900 text-white shadow-sm font-semibold'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
          }`}
        >
          <Radio className="w-4 h-4 shrink-0" />
          <span>Cài Đặt Trạm IoT</span>
        </button>

        {/* 7. Nhật Ký SCADA */}
        <button
          onClick={() => onSelectTab('logs')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
            currentTab === 'logs'
              ? 'bg-neutral-900 text-white shadow-sm font-semibold'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span>Nhật Ký SCADA</span>
        </button>
      </div>

      {/* Bottom Hardware Telemetry Tile */}
      <div className="p-3 border-t border-neutral-200">
        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80 text-[11px] space-y-1.5 font-mono-num">
          <div className="flex items-center justify-between text-neutral-500">
            <span>Nguồn DC:</span>
            <span className="text-neutral-900 font-semibold">24.2V – OK</span>
          </div>
          <div className="flex items-center justify-between text-neutral-500">
            <span>Phụ tải rải:</span>
            <span className="text-neutral-900 font-semibold">1.4 kW / 3.0 kW</span>
          </div>
          <div className="flex items-center justify-between text-neutral-500">
            <span>Tần số LoRa:</span>
            <span className="text-neutral-900 font-semibold">CH 08 (915.2)</span>
          </div>
          <div className="pt-1 border-t border-neutral-200/60 flex items-center justify-between text-[10px] text-neutral-400">
            <span>MCU Core:</span>
            <span className="text-emerald-700 font-medium">STM32F4 Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
