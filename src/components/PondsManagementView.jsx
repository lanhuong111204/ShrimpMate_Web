import React from 'react';
import { Settings2, Clock, Plus } from 'lucide-react';

export const PondsManagementView = ({
  ponds,
  onSelectPond,
  onNavigateTab,
  onRefillFeed,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-neutral-900 rounded-full inline-block"></span>
            <h1 className="font-display font-bold text-base md:text-lg text-neutral-900 tracking-tight uppercase">
              QUẢN LÝ TỔNG THỂ 4 AO NUÔI – KHU CÔNG NGHỆ CAO
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Khu nuôi công nghệ cao Trại Ba Đầm – Giám sát tổng thể sức ăn, khối lượng phễu và môi trường từng ao.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono-num text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200">
            Tổng diện tích mặt nước: <strong className="text-neutral-900 font-bold">4.200 m²</strong>
          </div>
        </div>
      </div>

      {/* 4 Pond Full Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ponds.map((pond) => {
          const isAlert = pond.status === 'empty_hopper';
          const isPaused = pond.status === 'paused';
          const isIdle = pond.status === 'idle';

          return (
            <div
              key={pond.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
                isAlert ? 'border-red-300 ring-1 ring-red-100' : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="space-y-4">
                {/* Header of Pond Card */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display font-bold text-lg text-neutral-900 tracking-tight">
                        {pond.name}
                      </h3>
                      <span className="text-[11px] font-mono-num bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-medium">
                        {pond.code} • {pond.type}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {pond.shrimpType} • <strong>{pond.ageDays} ngày tuổi</strong> • Diện tích: {pond.area}
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isAlert ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono-num font-bold bg-red-50 text-red-600 border border-red-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      HẾT CÁM PHỄU
                    </span>
                  ) : isPaused ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono-num font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      TẠM DỪNG
                    </span>
                  ) : isIdle ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono-num font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                      NGHỈ CỮ
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono-num font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      ĐANG PHUN
                    </span>
                  )}
                </div>

                {/* 3 Telemetry Metrics */}
                <div className="grid grid-cols-3 gap-2 py-3 bg-neutral-50 rounded-xl text-center font-mono-num border border-neutral-100">
                  <div className="border-r border-neutral-200/60">
                    <div className="text-[10px] text-neutral-400 uppercase">Oxy Hòa Tan</div>
                    <div className="text-lg font-bold text-neutral-900 mt-0.5">{pond.do.toFixed(2)}</div>
                    <div className="text-[10px] text-neutral-400">mg/L</div>
                  </div>
                  <div className="border-r border-neutral-200/60">
                    <div className="text-[10px] text-neutral-400 uppercase">Nhiệt Độ Nước</div>
                    <div className="text-lg font-bold text-neutral-900 mt-0.5">{pond.temp.toFixed(1)}</div>
                    <div className="text-[10px] text-neutral-400">°C</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase">Độ Kiềm / pH</div>
                    <div className="text-lg font-bold text-neutral-900 mt-0.5">{pond.ph.toFixed(1)}</div>
                    <div className="text-[10px] text-neutral-400">Ổn định</div>
                  </div>
                </div>

                {/* Hopper & Feeder Specs */}
                <div className="space-y-2 font-mono-num text-xs">
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>Cữ ăn hiện tại:</span>
                    <strong className="text-neutral-900">{pond.currentMeal}</strong>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>Đã phun / Định mức:</span>
                    <strong className="text-neutral-900">
                      {pond.sprayedKg} / {pond.targetKg} kg
                    </strong>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAlert ? 'bg-red-500' : 'bg-neutral-900'
                      }`}
                      style={{ width: `${Math.min(100, (pond.sprayedKg / pond.targetKg) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-neutral-600">
                    <span>Trọng lượng phễu (Loadcell):</span>
                    <strong className={pond.hopperKg < 1 ? 'text-red-500 font-bold' : 'text-neutral-900'}>
                      {pond.hopperKg} kg
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>Đánh giá sức ăn Bio-Acoustic:</span>
                    <span className="text-emerald-600 font-semibold">{pond.hydrophoneStatus}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-5 pt-3 border-t border-neutral-100 text-xs font-mono-num">
                <button
                  onClick={() => {
                    onSelectPond(pond.id);
                    onNavigateTab('feeder', pond.id);
                  }}
                  className="py-2 px-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Máy Ăn</span>
                </button>

                <button
                  onClick={() => {
                    onSelectPond(pond.id);
                    onNavigateTab('schedule', pond.id);
                  }}
                  className="py-2 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Lịch Cữ</span>
                </button>

                <button
                  onClick={() => onRefillFeed(pond.id, 25)}
                  className="py-2 px-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+25kg</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
