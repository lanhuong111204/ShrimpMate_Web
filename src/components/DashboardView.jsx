import React, { useState } from 'react';
import { 
  PlayCircle, 
  Download, 
  Scale, 
  Cpu, 
  Wind, 
  Ear, 
  LayoutGrid, 
  AlertTriangle, 
  CheckCircle2, 
  SlidersHorizontal, 
  Radio
} from 'lucide-react';

export const DashboardView = ({
  ponds,
  logs,
  onNavigateTab,
  onRefillFeed,
  onTogglePondPause,
  onRunTestFeeder,
  onMuteAlarm,
  onShowToast,
}) => {
  const [testingAll, setTestingAll] = useState(false);
  const [testCountdown, setTestCountdown] = useState(10);
  const [selectedHoverPoint, setSelectedHoverPoint] = useState(null);

  // Calculate high-level KPIs
  const totalSprayedToday = ponds.reduce((sum, p) => sum + p.sprayedKg, 0) + 225; // 285 total baseline
  const targetSprayedToday = 360;
  const activeFeeders = ponds.filter((p) => p.status === 'spraying').length;
  const avgDo = (ponds.reduce((sum, p) => sum + p.do, 0) / ponds.length).toFixed(2);
  const avgTemp = (ponds.reduce((sum, p) => sum + p.temp, 0) / ponds.length).toFixed(1);
  const avgPh = (ponds.reduce((sum, p) => sum + p.ph, 0) / ponds.length).toFixed(1);

  const handleTestAll = () => {
    if (testingAll) return;
    setTestingAll(true);
    setTestCountdown(10);
    onShowToast('Đang kích hoạt quy trình chạy thử tự động 10 giây trên 4 ao nuôi...', 'info');

    const interval = setInterval(() => {
      setTestCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTestingAll(false);
          onShowToast('Kiểm tra tự động 10s hoàn tất: Cả 4 mâm phun và rơ-le hoạt động trơn tru.', 'success');
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleExportLog = () => {
    const csvContent = [
      'Thời gian,Mã ao,Sự kiện,Loại cảnh báo',
      ...logs.map((l) => `${l.timestamp},${l.pondId ? 'AO-' + l.pondId : 'TRẠM'},"${l.title} - ${l.message}",${l.type}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shrimpmate_scada_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Đã xuất báo cáo nhật ký SCADA ra file CSV thành công!', 'success');
  };

  return (
    <div className="space-y-5">
      {/* TOP CONTROL STRIP (MINIMAL HEADER & QUICK ACTIONS) */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display font-bold text-base md:text-lg text-neutral-900 tracking-tight uppercase">
              BÀN ĐIỀU HÀNH CHO ĂN & GIÁM SÁT MÔI TRƯỜNG AO NUÔI
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono-num font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              VẬN HÀNH TỰ ĐỘNG
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Điều khiển liên động giữa nồng độ oxy hòa tan (DO), âm thanh bắt mồi Bio-Acoustic và biến tần phễu phun.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleTestAll}
            disabled={testingAll}
            className={`h-8 px-3 rounded-lg border border-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
              testingAll ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-white hover:bg-neutral-50 text-neutral-700'
            }`}
          >
            <PlayCircle className={`w-4 h-4 ${testingAll ? 'animate-spin text-amber-600' : 'text-neutral-500'}`} />
            <span>{testingAll ? `Đang thử nghiệm (${testCountdown}s)` : 'Chạy Thử Tự Động (10s)'}</span>
          </button>

          <button
            onClick={handleExportLog}
            className="h-8 px-3 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Nhật Ký Cữ</span>
          </button>
        </div>
      </div>

      {/* 4 CORE KPI METRIC CARDS (MODERN MINIMALIST STYLE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: FEED QUANTITY */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-neutral-300 transition">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Cám Hôm Nay</span>
            <Scale className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-neutral-900 font-mono-num">
              {totalSprayedToday}
            </span>
            <span className="text-sm font-semibold text-neutral-400 font-mono-num">
              / {targetSprayedToday} kg
            </span>
          </div>
          <div className="space-y-1.5 pt-2.5 border-t border-neutral-100">
            <div className="flex justify-between text-[11px] font-mono-num">
              <span className="text-neutral-500">Tiến độ cữ 3/4:</span>
              <span className="font-semibold text-neutral-900">
                {((totalSprayedToday / targetSprayedToday) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalSprayedToday / targetSprayedToday) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 2: FEEDER ACTUATORS */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-neutral-300 transition">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Trạng Thái Máy Rải</span>
            <Cpu className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-emerald-600 font-mono-num">
              {activeFeeders} / {ponds.length}
            </span>
            <span className="text-xs font-semibold text-neutral-500">Đang hoạt động</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2.5 border-t border-neutral-100 font-mono-num">
            <span className="text-neutral-500 truncate mr-2">
              Ao 3: <strong className="text-red-500 font-medium">Báo hết cám phễu</strong>
            </span>
            <span className="text-neutral-700 font-semibold shrink-0">1 Tạm dừng</span>
          </div>
        </div>

        {/* KPI 3: INTERLOCKED WATER QUALITY */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-neutral-300 transition">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Oxy Hòa Tan (DO Bình Quân)</span>
            <Wind className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-emerald-600 font-mono-num">
              {avgDo}
            </span>
            <span className="text-xs font-medium text-neutral-400 font-mono-num">mg/L</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2.5 border-t border-neutral-100 font-mono-num">
            <span className="text-neutral-500">
              Nhiệt: <strong className="text-neutral-700">{avgTemp}°C</strong> • pH:{' '}
              <strong className="text-neutral-700">{avgPh}</strong>
            </span>
            <span className="text-emerald-600 font-semibold">Ngưỡng An Toàn</span>
          </div>
        </div>

        {/* KPI 4: AI BIO-ACOUSTIC FEEDING INDEX */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-neutral-300 transition">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">AI Bio-Acoustic (Âm Thanh)</span>
            <Ear className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-neutral-900">
              MẠNH
            </span>
            <span className="text-xs font-medium text-neutral-400 font-mono-num">(142 click/p)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2.5 border-t border-neutral-100 font-mono-num">
            <span className="text-neutral-500">Khuyến nghị AI:</span>
            <span className="text-emerald-600 font-semibold">+5% định mức cữ</span>
          </div>
        </div>
      </div>

      {/* REAL-TIME 4 POND MONITORING GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-neutral-500" />
            <h2 className="font-display font-bold text-xs uppercase tracking-wider text-neutral-700">
              Giám Sát Chi Tiết Theo Từng Ao Nuôi (Real-Time SCADA Feeder)
            </h2>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono-num">Tần số quét cảm biến: 5 giây/lần</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {ponds.map((pond) => {
            const isAlert = pond.status === 'empty_hopper';
            const isPaused = pond.status === 'paused';
            const isIdle = pond.status === 'idle';
            const progressPercent = Math.min(100, (pond.sprayedKg / pond.targetKg) * 100);

            return (
              <div
                key={pond.id}
                className={`bg-white rounded-xl p-4 flex flex-col justify-between shadow-sm transition border ${
                  isAlert
                    ? 'border-red-300 ring-1 ring-red-100'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-base text-neutral-900">
                          {pond.name}
                        </span>
                        <span className="text-[10px] font-mono-num text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                          {pond.type} • {pond.area}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {pond.shrimpType} ({pond.ageDays} ngày tuổi)
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isAlert ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-num font-semibold bg-red-50 text-red-600 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> HẾT CÁM PHỄU
                      </span>
                    ) : isPaused ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-num font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> TẠM DỪNG
                      </span>
                    ) : isIdle ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-num font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span> NGHỈ CỮ (CHỜ)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-num font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> ĐANG PHUN
                      </span>
                    )}
                  </div>

                  {/* Sensor Metrics 3-box */}
                  <div className="grid grid-cols-3 gap-1.5 py-2.5 bg-neutral-50 rounded-lg text-center font-mono-num border border-neutral-100">
                    <div className="border-r border-neutral-200/60">
                      <div className="text-[10px] text-neutral-400 uppercase">Oxy DO</div>
                      <div
                        className={`text-sm font-bold mt-0.5 ${
                          pond.do >= 5.0 ? 'text-emerald-600' : 'text-neutral-800'
                        }`}
                      >
                        {pond.do.toFixed(2)}
                      </div>
                      <div className="text-[9px] text-neutral-400">mg/L</div>
                    </div>
                    <div className="border-r border-neutral-200/60">
                      <div className="text-[10px] text-neutral-400 uppercase">Nhiệt Độ</div>
                      <div className="text-sm font-bold text-neutral-800 mt-0.5">{pond.temp.toFixed(1)}</div>
                      <div className="text-[9px] text-neutral-400">°C</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase">Độ pH</div>
                      <div className="text-sm font-bold text-neutral-800 mt-0.5">{pond.ph.toFixed(1)}</div>
                      <div className="text-[9px] text-neutral-400">{pond.id === 4 ? 'Tối ưu' : 'Ổn định'}</div>
                    </div>
                  </div>

                  {/* Hopper Loadcell & Feeding Progress */}
                  <div className="space-y-1.5 font-mono-num text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 text-[11px]">{pond.currentMeal}:</span>
                      <span
                        className={`font-semibold text-[11px] ${
                          isAlert ? 'text-red-500' : 'text-neutral-900'
                        }`}
                      >
                        {isAlert
                          ? `Dừng lúc ${pond.sprayedKg} / ${pond.targetKg} kg`
                          : isIdle
                          ? `Định mức ${pond.targetKg} kg`
                          : `Đã phun ${pond.sprayedKg} / ${pond.targetKg} kg`}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAlert ? 'bg-red-500' : isIdle ? 'bg-neutral-300' : 'bg-neutral-900'
                        }`}
                        style={{ width: `${isIdle ? 0 : progressPercent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] pt-1">
                      <span className="text-neutral-500">Cảm biến Loadcell phễu:</span>
                      <span
                        className={`font-medium ${
                          pond.hopperKg < 1 ? 'text-red-500 font-semibold' : 'text-neutral-800'
                        }`}
                      >
                        {pond.hopperKg < 1 ? `${pond.hopperKg} kg (Cạn phễu)` : `Còn ${pond.hopperKg} kg`}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-neutral-500">
                      <span>
                        {isAlert ? 'Trạng thái motor:' : 'Sức ăn Hydrophone:'}
                      </span>
                      <span
                        className={`font-medium ${
                          isAlert
                            ? 'text-red-500'
                            : pond.hydrophoneScore > 80
                            ? 'text-emerald-600 font-semibold'
                            : 'text-neutral-600'
                        }`}
                      >
                        {isAlert ? pond.motorStatus : pond.hydrophoneStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clean Modern Buttons */}
                <div className="grid grid-cols-3 gap-1.5 mt-4 pt-3 border-t border-neutral-100 text-xs">
                  {/* Button 1: Test */}
                  <button
                    onClick={() => onRunTestFeeder(pond.id)}
                    disabled={isAlert}
                    className={`h-7 px-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                      isAlert
                        ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    Rải Thử 10s
                  </button>

                  {/* Button 2: Pause / Alarm Mute / Manual */}
                  {isAlert ? (
                    <button
                      onClick={() => onMuteAlarm(pond.id)}
                      className="h-7 px-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-[11px] font-medium border border-neutral-200 transition cursor-pointer"
                    >
                      Tắt Còi
                    </button>
                  ) : isIdle ? (
                    <button
                      onClick={() => {
                        onShowToast(`Ao ${pond.id}: Chuyển sang chế độ cho ăn bổ sung thủ công.`, 'info');
                      }}
                      className="h-7 px-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-[11px] font-medium border border-neutral-200 transition cursor-pointer"
                    >
                      Thủ Công
                    </button>
                  ) : (
                    <button
                      onClick={() => onTogglePondPause(pond.id)}
                      className="h-7 px-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-[11px] font-medium border border-neutral-200 transition cursor-pointer"
                    >
                      {isPaused ? 'Tiếp Tục' : 'Tạm Dừng'}
                    </button>
                  )}

                  {/* Button 3: Refill 25kg */}
                  <button
                    onClick={() => onRefillFeed(pond.id, 25)}
                    className={`h-7 px-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                      isAlert
                        ? 'bg-red-600 text-white hover:bg-red-700 font-semibold'
                        : 'bg-neutral-900 text-white hover:bg-neutral-800'
                    }`}
                    title="Nạp thêm 1 bao cám 25kg vào phễu"
                  >
                    + Nạp 25kg
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM ROW: DUAL ANALYTICS (HOURLY FEED & DO CHART + HARDWARE CONTROLLER LOG) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* LEFT 8 COLS: PRECISION TELEMETRY CHART */}
        <div className="xl:col-span-8 bg-white p-4 lg:p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-neutral-500" />
                <h3 className="font-display font-bold text-xs uppercase text-neutral-800 tracking-wider">
                  Tương Quan Lượng Cám Phun & Nồng Độ Oxy Hòa Tan (DO 24H)
                </h3>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Giám sát chu kỳ tiêu thụ thức ăn tự động đồng bộ cùng hệ thống quạt nước tăng cường
              </p>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-3 font-mono-num text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-neutral-900"></span>
                <span className="text-neutral-600">Khối lượng cám (kg)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-emerald-500 rounded-full"></span>
                <span className="text-emerald-700 font-semibold">Oxy DO (mg/L)</span>
              </div>
            </div>
          </div>

          {/* SVG Data Visualization Canvas */}
          <div className="relative pt-2">
            <div className="h-44 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 640 160">
                {/* Horizontal Guide Lines */}
                <line stroke="#f1f5f9" strokeDasharray="3" strokeWidth="1" x1="40" x2="620" y1="30" />
                <line stroke="#f1f5f9" strokeDasharray="3" strokeWidth="1" x1="40" x2="620" y1="70" />
                <line stroke="#f1f5f9" strokeDasharray="3" strokeWidth="1" x1="40" x2="620" y1="110" />
                <line stroke="#e2e8f0" strokeWidth="1" x1="40" x2="620" y1="140" />

                {/* Y-Axis Labels DO */}
                <text className="fill-neutral-400 font-mono-num text-[9px]" textAnchor="end" x="35" y="34">7.0 DO</text>
                <text className="fill-neutral-400 font-mono-num text-[9px]" textAnchor="end" x="35" y="74">5.5 DO</text>
                <text className="fill-neutral-400 font-mono-num text-[9px]" textAnchor="end" x="35" y="114">4.0 DO</text>

                {/* Feeding Bars */}
                {/* Cữ 1: 06:00 (60 kg) */}
                <rect
                  className="fill-neutral-400 hover:fill-neutral-900 transition cursor-pointer"
                  height="65"
                  rx="2"
                  width="26"
                  x="76"
                  y="75"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 1 (06:00): 60 kg cám • DO 5.8 mg/L')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-neutral-600 font-mono-num text-[11px]" textAnchor="middle" x="89" y="68">60kg</text>
                <text className="fill-neutral-400 font-mono-num text-[10px]" textAnchor="middle" x="89" y="150">06:00</text>

                {/* Cữ 2: 09:30 (80 kg) */}
                <rect
                  className="fill-neutral-600 hover:fill-neutral-900 transition cursor-pointer"
                  height="90"
                  rx="2"
                  width="26"
                  x="186"
                  y="45"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 2 (09:30): 80 kg cám • DO 5.6 mg/L')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-neutral-700 font-mono-num font-semibold text-[11px]" textAnchor="middle" x="199" y="38">80kg</text>
                <text className="fill-neutral-400 font-mono-num text-[10px]" textAnchor="middle" x="199" y="150">09:30</text>

                {/* Cữ 3: 12:30 (100 kg - Current active) */}
                <rect
                  className="fill-neutral-950 cursor-pointer"
                  height="110"
                  rx="2"
                  width="26"
                  x="296"
                  y="25"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 3 (12:30): Đang rải 100 kg định mức • DO 5.45 mg/L')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-neutral-950 font-mono-num font-bold text-[11px]" textAnchor="middle" x="309" y="18">100kg*</text>
                <text className="fill-neutral-900 font-mono-num font-semibold text-[10px]" textAnchor="middle" x="309" y="150">12:30 (Đang)</text>

                {/* Cữ 4: 15:30 (Dự kiến 70 kg) */}
                <rect
                  className="fill-neutral-200 cursor-pointer"
                  height="75"
                  rx="2"
                  stroke="#cbd5e1"
                  strokeDasharray="2"
                  width="26"
                  x="406"
                  y="60"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 4 (15:30 - Kế hoạch): 70 kg • Dự báo DO 5.9 mg/L')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-neutral-500 font-mono-num text-[10px]" textAnchor="middle" x="419" y="53">70kg (kế)</text>
                <text className="fill-neutral-400 font-mono-num text-[10px]" textAnchor="middle" x="419" y="150">15:30</text>

                {/* Cữ 5: 18:30 (Dự kiến 45 kg) */}
                <rect
                  className="fill-neutral-200 cursor-pointer"
                  height="45"
                  rx="2"
                  stroke="#cbd5e1"
                  strokeDasharray="2"
                  width="26"
                  x="516"
                  y="90"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 5 (18:30 - Kế hoạch): 45 kg cữ tối an toàn')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-neutral-500 font-mono-num text-[10px]" textAnchor="middle" x="529" y="83">45kg (kế)</text>
                <text className="fill-neutral-400 font-mono-num text-[10px]" textAnchor="middle" x="529" y="150">18:30</text>

                {/* DO Dynamic Curve */}
                <path
                  d="M 89 60 Q 140 70, 199 50 T 309 68 T 419 45 T 529 62"
                  fill="none"
                  stroke="#10b981"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />

                {/* DO Metric Data Points */}
                <circle cx="89" cy="60" fill="#ffffff" r="4" stroke="#10b981" strokeWidth="2" />
                <circle cx="199" cy="50" fill="#ffffff" r="4" stroke="#10b981" strokeWidth="2" />
                <circle cx="309" cy="68" fill="#10b981" r="4.5" />
                <circle cx="419" cy="45" fill="#ffffff" r="3.5" stroke="#10b981" strokeDasharray="1" strokeWidth="1.5" />
                <circle cx="529" cy="62" fill="#ffffff" r="3.5" stroke="#10b981" strokeDasharray="1" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Bottom Status Strip */}
          <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200/70 text-xs font-mono-num flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 text-neutral-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-[11px]">
                {selectedHoverPoint ||
                  'Thuật toán SCADA: Quạt nước tự bù tốc độ khi lượng cám phun vượt ngưỡng 35kg/giờ/ao.'}
              </span>
            </div>
            <span className="font-semibold text-neutral-800 text-[11px] shrink-0">Oxy đáy duy trì &gt; 4.8 mg/L</span>
          </div>
        </div>

        {/* RIGHT 4 COLS: HARDWARE INTERLOCKS & AUDIT LOG */}
        <div className="xl:col-span-4 bg-white p-4 lg:p-5 rounded-xl border border-neutral-200 shadow-sm space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-neutral-500" />
                <h3 className="font-display font-bold text-xs uppercase text-neutral-800 tracking-wider">
                  Nhật Ký Vận Hành & Cảnh Báo
                </h3>
              </div>
              <span className="text-[10px] font-mono-num bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded font-medium">
                REALTIME
              </span>
            </div>

            {/* Event List */}
            <div className="space-y-2 text-xs font-mono-num max-h-[300px] overflow-y-auto pr-1">
              {logs.map((log) => {
                const isAlert = log.type === 'alert';
                return (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition ${
                      isAlert
                        ? 'bg-red-50/60 border-red-200/70'
                        : 'bg-neutral-50 border-neutral-200/70 hover:bg-neutral-100/60'
                    }`}
                  >
                    {isAlert ? (
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-semibold text-[11px] truncate ${
                            isAlert ? 'text-red-600' : 'text-neutral-800'
                          }`}
                        >
                          {log.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 shrink-0">{log.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-neutral-600 mt-0.5 leading-snug font-sans">
                        {log.message}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technical Quick Link Action */}
          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('feeder', 2)}
              className="w-full h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-mono-num text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Cấu Hình Tần Số Biến Tần Rải</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
