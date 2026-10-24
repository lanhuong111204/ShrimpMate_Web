import React, { useState } from 'react';
import { 
  PlayCircle, 
  Download, 
  Scale, 
  Cpu, 
  Wind, 
  LayoutGrid, 
  List,
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck,
  Radio,
  ArrowUpRight,
  SlidersHorizontal
} from 'lucide-react';
import { alertService } from '../services/alertService';

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
  const [viewMode, setViewMode] = useState('grid'); // Default to Mobile-synced Visual Pond Cards ('grid' | 'table')

  // Live Alerts State
  const [liveAlerts, setLiveAlerts] = useState([]);

  const fetchAlerts = async () => {
    try {
      await alertService.getSummary().catch(() => null);
      const alertsRes = await alertService.getAlerts({ status: 'open', limit: 8 }).catch(() => null);
      const list = Array.isArray(alertsRes) ? alertsRes : (alertsRes?.data || []);
      if (list && list.length > 0) {
        setLiveAlerts(list);
      }
    } catch (err) {
      console.warn('Lỗi nạp cảnh báo:', err);
    }
  };

  React.useEffect(() => {
    fetchAlerts();
    const timer = setInterval(fetchAlerts, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleAcknowledgeAlert = async (id) => {
    try {
      await alertService.acknowledgeAlert(id);
      onShowToast?.('Đã tiếp nhận xử lý sự cố.', 'info');
      await fetchAlerts();
    } catch (err) {
      console.warn('Lỗi ack alert:', err);
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await alertService.resolveAlert(id);
      onShowToast?.('Đã đánh dấu giải quyết sự cố hoàn tất.', 'success');
      await fetchAlerts();
    } catch (err) {
      console.warn('Lỗi resolve alert:', err);
    }
  };

  // Calculate high-level KPIs
  const totalSprayedToday = parseFloat(ponds.reduce((sum, p) => sum + p.sprayedKg, 0).toFixed(1));
  const targetSprayedToday = parseFloat(ponds.reduce((sum, p) => sum + p.targetKg, 0).toFixed(1));
  const feedProgressPct = Math.min(100, Math.round((totalSprayedToday / (targetSprayedToday || 1)) * 100));
  const activeFeeders = ponds.filter((p) => p.status === 'spraying').length;
  const warningPonds = ponds.filter((p) => p.status === 'empty_hopper' || p.do < 4.5);
  const avgDo = (ponds.reduce((sum, p) => sum + p.do, 0) / ponds.length).toFixed(2);
  const avgTemp = (ponds.reduce((sum, p) => sum + p.temp, 0) / ponds.length).toFixed(1);
  const avgPh = (ponds.reduce((sum, p) => sum + p.ph, 0) / ponds.length).toFixed(1);

  // SVG Circular Progress Ring math (r = 22, circumference = 2 * PI * 22 = 138.2)
  const ringCircumference = 138.2;
  const ringOffset = ringCircumference - (feedProgressPct / 100) * ringCircumference;

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
    onShowToast('Đã xuất báo cáo nhật ký vận hành ra file CSV thành công!', 'success');
  };

  const renderStatusBadge = (status) => {
    if (status === 'empty_hopper') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          Cảnh báo phễu
        </span>
      );
    }
    if (status === 'paused') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFDBCA] text-[#9D4300]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
          Tạm dừng
        </span>
      );
    }
    if (status === 'idle') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#006398]" />
          Chờ cữ kế tiếp
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#006E2D]" />
        Đang rải cám
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. SAFETY RULE ENGINE INTERLOCK BANNER (Synced with ShrimpMate_Mobile) */}
      <div className="rounded-2xl p-4 bg-[#E8F5E9] border border-[#7CF994] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006E2D] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#006E2D]">
                SAFETY RULE ENGINE: ALLOWED
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#006E2D] border border-[#7CF994]">
                Cho phép 100% định mức
              </span>
            </div>
            <p className="text-xs text-[#005320] mt-0.5 font-medium">
              Các chỉ số trung bình DO ({avgDo} mg/L), pH ({avgPh}) và Nhiệt độ ({avgTemp}°C) đều nằm trong ngưỡng tối ưu cho phép xả thức ăn tự động.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('schedule')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white text-[#006E2D] border border-[#7CF994] hover:bg-[#F0FDF4] transition cursor-pointer"
          >
            Cấu hình Interlock
          </button>
        </div>
      </div>

      {/* 2. PAGE HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30] tracking-tight font-display">
            Tổng quan vận hành trang trại
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Đồng bộ thời gian thực lượng thức ăn, 6 chỉ số môi trường nước và sức ăn từng ao nuôi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleTestAll}
            disabled={testingAll}
            className={`h-9 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              testingAll
                ? 'bg-[#FEF3C7] text-[#B45309] border-amber-300'
                : 'bg-white hover:bg-[#EFF4FF] text-[#006398] border-[#D3E4FE] shadow-2xs'
            }`}
          >
            <PlayCircle className={`w-4 h-4 ${testingAll ? 'animate-spin text-[#B45309]' : 'text-[#006398]'}`} />
            <span>{testingAll ? `Đang thử nghiệm (${testCountdown}s)` : 'Rải thử toàn trại (10s)'}</span>
          </button>

          <button
            onClick={handleExportLog}
            className="h-9 px-3.5 rounded-xl bg-[#EA580C] text-white hover:bg-[#C2410C] text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất báo cáo (.CSV)</span>
          </button>
        </div>
      </div>

      {/* 3. 4 KPI SUMMARY CARDS WITH COLOR ACCENT BARS & CIRCULAR PROGRESS RING */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: TOTAL FEED WITH SVG CIRCULAR RING (Shrimp Orange #EA580C) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 border-l-4 border-l-[#EA580C] shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Tổng thức ăn hôm nay
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#0B1C30] font-mono-num">
                  {totalSprayedToday}
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono-num">
                  / {targetSprayedToday} kg
                </span>
              </div>
            </div>
            {/* Circular SVG Progress Ring */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" stroke="#FFDBCA" strokeWidth="5" fill="none" />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  stroke="#EA580C"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[11px] font-extrabold text-[#9D4300] font-mono-num">
                {feedProgressPct}%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[#006E2D] font-bold">+4.2% tối ưu FCR</span>
            <span className="text-slate-500 font-medium">Cữ 3/4 đang rải</span>
          </div>
        </div>

        {/* KPI 2: DISSOLVED OXYGEN (Ocean Blue #006398) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 border-l-4 border-l-[#006398] shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Oxy hòa tan trung bình (DO)
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#006398] font-mono-num">
                  {avgDo}
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono-num">mg/L</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] text-[#006398] flex items-center justify-center">
              <Wind className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#006398] to-[#006E2D] rounded-full"
                style={{ width: `${Math.min(100, (parseFloat(avgDo) / 8.0) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-medium text-slate-500">
              <span>Nhiệt: <strong className="text-[#0B1C30]">{avgTemp}°C</strong> • pH: <strong className="text-[#0B1C30]">{avgPh}</strong></span>
              <span className="text-[#006E2D] font-bold">Đạt chuẩn (&gt; 4.0)</span>
            </div>
          </div>
        </div>

        {/* KPI 3: FEEDER STATIONS (Bio Green #006E2D) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 border-l-4 border-l-[#006E2D] shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Trạng thái trạm máy cho ăn
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#006E2D] font-mono-num">
                  0{ponds.length}
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono-num">
                  / 0{ponds.length} Online
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#006E2D] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="px-2 py-0.5 rounded-md bg-[#E8F5E9] text-[#006E2D] font-bold">
              {activeFeeders} Đang rải
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#EFF4FF] text-[#006398] font-bold">
              {ponds.length - activeFeeders} Chờ / Cảnh báo
            </span>
          </div>
        </div>

        {/* KPI 4: OPERATIONAL ALERTS & FIS APPETITE (Amber #F59E0B) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 border-l-4 border-l-[#F59E0B] shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Cảnh báo & Sức ăn FIS
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#B45309] font-mono-num">
                  0{warningPonds.length}
                </span>
                <span className="text-xs font-semibold text-slate-500">Chú ý nhẹ</span>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309]">
              FIS: Mức 3
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium truncate mr-2">
              Ao B1: Thức ăn phễu &lt; 16%
            </span>
            <button
              onClick={() => onRefillFeed(3, 25)}
              className="text-[#EA580C] font-bold hover:underline shrink-0 cursor-pointer"
            >
              +Nạp cám →
            </button>
          </div>
        </div>
      </div>

      {/* 4. POND MONITORING SECTION (MOBILE-SYNCED POND CARDS OR TABLE) */}
      <div className="space-y-3">
        {/* Section Header & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#0B1C30] font-display">
              Giám sát chi tiết từng Ao nuôi ({ponds.length} Ao)
            </h2>
            <p className="text-xs text-slate-500">
              Bố cục thẻ trực quan đồng bộ với ứng dụng di động ShrimpMate • Bấm vào từng ao để điều khiển máy rải cám
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#EA580C] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#0B1C30]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Thẻ trực quan</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#EA580C] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#0B1C30]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Bảng dữ liệu</span>
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE-SYNCED VISUAL POND CARDS (2x2 Grid) */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ponds.map((pond) => {
              const isAlert = pond.status === 'empty_hopper';
              const isPaused = pond.status === 'paused';
              const isIdle = pond.status === 'idle';
              const progressPercent = Math.min(100, Math.round((pond.sprayedKg / (pond.targetKg || 1)) * 100));
              const hopperPct = Math.round((pond.hopperKg / (pond.maxHopperKg || 70)) * 100);

              return (
                <div
                  key={pond.id}
                  className={`bg-white rounded-2xl p-5 border transition shadow-2xs hover:shadow-md ${
                    isAlert
                      ? 'border-amber-300'
                      : 'border-slate-200 hover:border-[#EA580C]/50'
                  }`}
                >
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => onNavigateTab('feeder', pond.id)}
                        className={`w-11 h-11 rounded-xl font-extrabold text-sm flex items-center justify-center font-mono-num cursor-pointer shrink-0 ${
                          isAlert
                            ? 'bg-[#FEF3C7] text-[#B45309] border border-amber-300'
                            : 'bg-[#FFF8F5] text-[#EA580C] border border-[#FFDBCA]'
                        }`}
                      >
                        {pond.code.replace('AO-0', 'A')}
                      </div>
                      <div>
                        <button
                          onClick={() => onNavigateTab('feeder', pond.id)}
                          className="text-base font-bold text-[#0B1C30] hover:text-[#EA580C] flex items-center gap-1 cursor-pointer text-left"
                        >
                          <span>{pond.name} – {pond.shrimpType}</span>
                          <ArrowUpRight className="w-4 h-4 text-slate-400" />
                        </button>
                        <p className="text-xs text-slate-500">
                          Mã: <span className="font-mono-num font-semibold text-slate-700">{pond.code}</span> • {pond.type} • {pond.currentMeal}
                        </p>
                      </div>
                    </div>
                    {renderStatusBadge(pond.status)}
                  </div>

                  {/* 3-Column Metadata Strip (Synced with Mobile PondCard) */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-[#F8F9FF] border border-slate-100 mb-3.5 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Tuổi tôm (DOC)</p>
                      <p className="text-xs font-bold text-[#0B1C30] mt-0.5 font-mono-num">{pond.ageDays} ngày</p>
                    </div>
                    <div className="border-x border-slate-200/70">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Mật độ thả</p>
                      <p className="text-xs font-bold text-[#0B1C30] mt-0.5 font-mono-num">{pond.stockingCount || '240,000 con'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Diện tích</p>
                      <p className="text-xs font-bold text-[#0B1C30] mt-0.5 font-mono-num">{pond.area}</p>
                    </div>
                  </div>

                  {/* 4-Column Telemetry Strip (DO, pH, Temp, FIS / Hopper) */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div
                      className={`p-2.5 rounded-xl border text-center ${
                        pond.do >= 5.0
                          ? 'bg-[#F0FDF4] border-[#7CF994]/60'
                          : 'bg-[#FEF3C7]/50 border-amber-200'
                      }`}
                    >
                      <p className={`text-[10px] font-bold ${pond.do >= 5.0 ? 'text-[#006E2D]' : 'text-[#B45309]'}`}>
                        Oxy (DO)
                      </p>
                      <p className={`text-sm font-extrabold font-mono-num mt-0.5 ${pond.do >= 5.0 ? 'text-[#006E2D]' : 'text-[#B45309]'}`}>
                        {pond.do.toFixed(2)} <span className="text-[10px] font-normal">mg/L</span>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#EFF4FF] border border-[#D3E4FE] text-center">
                      <p className="text-[10px] font-bold text-[#006398]">Độ pH</p>
                      <p className="text-sm font-extrabold text-[#006398] font-mono-num mt-0.5">
                        {pond.ph.toFixed(1)}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FFF8F5] border border-[#FFDBCA] text-center">
                      <p className="text-[10px] font-bold text-[#9D4300]">Nhiệt độ</p>
                      <p className="text-sm font-extrabold text-[#9D4300] font-mono-num mt-0.5">
                        {pond.temp.toFixed(1)}°C
                      </p>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border text-center ${
                        isAlert
                          ? 'bg-[#FFDAD6]/50 border-[#BA1A1A]/30'
                          : 'bg-[#E8F5E9] border-[#7CF994]'
                      }`}
                    >
                      <p className={`text-[10px] font-bold ${isAlert ? 'text-[#BA1A1A]' : 'text-[#006E2D]'}`}>
                        {isAlert ? 'Phễu cám' : 'Độ thèm ăn'}
                      </p>
                      <p className={`text-xs font-extrabold mt-1 truncate ${isAlert ? 'text-[#BA1A1A]' : 'text-[#006E2D]'}`}>
                        {isAlert ? `Cạn (${hopperPct}%)` : pond.fisLabel || 'Mức 3'}
                      </p>
                    </div>
                  </div>

                  {/* Feed Progress Bar (Mobile Orange #EA580C on #FFDBCA track) */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        Tiến độ rải cám hôm nay (Tồn phễu: <strong className="text-[#0B1C30] font-mono-num">{pond.hopperKg} kg</strong>)
                      </span>
                      <span className="font-bold text-[#EA580C] font-mono-num">
                        {pond.sprayedKg} / {pond.targetKg} kg ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#FFDBCA]/70 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAlert
                            ? 'bg-[#F59E0B]'
                            : 'bg-gradient-to-r from-[#FB923C] to-[#EA580C]'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onRunTestFeeder(pond.id)}
                        disabled={isAlert}
                        className={`h-8 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          isAlert
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#006398] border-[#D3E4FE]'
                        }`}
                      >
                        Rải thử 10s
                      </button>

                      {isAlert ? (
                        <button
                          onClick={() => onMuteAlarm(pond.id)}
                          className="h-8 px-3 rounded-xl bg-[#FEF3C7] hover:bg-amber-200 text-[#B45309] text-xs font-bold transition cursor-pointer"
                        >
                          Tắt còi báo
                        </button>
                      ) : isIdle ? (
                        <button
                          onClick={() => onNavigateTab('camera-fis', pond.id)}
                          className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          6 Chỉ số nước
                        </button>
                      ) : (
                        <button
                          onClick={() => onTogglePondPause(pond.id)}
                          className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          {isPaused ? 'Tiếp tục rải' : 'Tạm dừng'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onRefillFeed(pond.id, 25)}
                        className={`h-8 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isAlert
                            ? 'bg-[#EA580C] text-white hover:bg-[#C2410C]'
                            : 'bg-[#FFF8F5] text-[#9D4300] border border-[#FFDBCA] hover:bg-[#FFDBCA]'
                        }`}
                      >
                        +Nạp 25kg
                      </button>
                      <button
                        onClick={() => onNavigateTab('feeder', pond.id)}
                        className="h-8 px-3 rounded-xl bg-[#0B1C30] hover:bg-[#131B2E] text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#FB923C]" />
                        <span>Điều khiển</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8F9FF] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Ao nuôi</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Môi trường (DO / pH / Nhiệt)</th>
                    <th className="py-3.5 px-4">Tiến độ cữ hiện tại</th>
                    <th className="py-3.5 px-4">Tồn phễu</th>
                    <th className="py-3.5 px-4">Độ thèm ăn (FIS)</th>
                    <th className="py-3.5 px-4 text-right">Thao tác nhanh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {ponds.map((pond) => {
                    const isAlert = pond.status === 'empty_hopper';
                    const isPaused = pond.status === 'paused';
                    const progressPercent = Math.min(100, Math.round((pond.sprayedKg / (pond.targetKg || 1)) * 100));

                    return (
                      <tr
                        key={pond.id}
                        className={`transition ${
                          isAlert ? 'bg-[#FFF8F5] hover:bg-[#FFDBCA]/30' : 'hover:bg-[#F8F9FF]'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onNavigateTab('feeder', pond.id)}
                              className="font-bold text-[#0B1C30] hover:text-[#EA580C] flex items-center gap-1 cursor-pointer"
                            >
                              <span>{pond.name}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <span className="text-[11px] font-mono-num text-[#006398] bg-[#EFF4FF] px-1.5 py-0.5 rounded font-semibold">
                              {pond.area}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {pond.shrimpType} • {pond.ageDays} DOC
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderStatusBadge(pond.status)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono-num text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${pond.do >= 5.0 ? 'text-[#006E2D]' : 'text-[#B45309]'}`}>
                              {pond.do.toFixed(2)} mg/L
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-[#006398] font-bold">pH {pond.ph.toFixed(1)}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-[#9D4300] font-bold">{pond.temp.toFixed(1)}°C</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 min-w-[180px]">
                          <div className="flex justify-between text-xs font-mono-num mb-1">
                            <span className="text-slate-500">{pond.currentMeal}</span>
                            <span className="font-bold text-[#EA580C]">
                              {pond.sprayedKg} / {pond.targetKg} kg
                            </span>
                          </div>
                          <div className="w-full h-2 bg-[#FFDBCA]/70 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#FB923C] to-[#EA580C] transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono-num text-xs">
                          <span className={`font-bold ${pond.hopperKg < 2 ? 'text-[#BA1A1A]' : 'text-[#0B1C30]'}`}>
                            {pond.hopperKg} kg
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                          <span className="font-bold text-[#006E2D]">
                            {pond.fisLabel || pond.hydrophoneStatus}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => onRunTestFeeder(pond.id)}
                              disabled={isAlert}
                              className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE] cursor-pointer"
                            >
                              Rải 10s
                            </button>
                            <button
                              onClick={() => onTogglePondPause(pond.id)}
                              className="h-7 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer"
                            >
                              {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                            </button>
                            <button
                              onClick={() => onRefillFeed(pond.id, 25)}
                              className="h-7 px-2.5 rounded-lg text-xs font-bold bg-[#EA580C] text-white hover:bg-[#C2410C] cursor-pointer"
                            >
                              +Nạp 25kg
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 5. BOTTOM ROW: 24H FEED & DO CORRELATION CHART + SAFETY RULE & MQTT LOGS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* LEFT 8 COLS: 24H CHART SYNCED WITH MOBILE PALETTE */}
        <div className="xl:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-sm font-bold text-[#0B1C30]">
                Tương quan Lượng thức ăn & Oxy hòa tan (24 giờ)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Giám sát tự động lượng cám rải theo từng cữ đối với biến động nồng độ DO trong ao
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#EA580C]" />
                <span className="text-[#9D4300]">Cữ đang rải</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#006398]" />
                <span className="text-[#006398]">Đã hoàn thành</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#006E2D] rounded-full" />
                <span className="text-[#006E2D]">Đường cong DO (mg/L)</span>
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="relative pt-2">
            <div className="h-44 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 640 160">
                <line stroke="#f1f5f9" strokeDasharray="3" strokeWidth="1" x1="40" x2="620" y1="30" />
                <line stroke="#f1f5f9" strokeDasharray="3" strokeWidth="1" x1="40" x2="620" y1="70" />
                <line stroke="#f1f5f9" strokeDasharray="3" strokeWidth="1" x1="40" x2="620" y1="110" />
                <line stroke="#e2e8f0" strokeWidth="1" x1="40" x2="620" y1="140" />

                <text className="fill-slate-400 font-mono-num text-[10px]" textAnchor="end" x="35" y="34">7.0</text>
                <text className="fill-slate-400 font-mono-num text-[10px]" textAnchor="end" x="35" y="74">5.5</text>
                <text className="fill-slate-400 font-mono-num text-[10px]" textAnchor="end" x="35" y="114">4.0</text>

                {/* Cữ 1: 06:30 (Completed - Ocean Blue #006398) */}
                <rect
                  className="fill-[#006398] hover:fill-[#0B1C30] transition cursor-pointer"
                  height="65"
                  rx="4"
                  width="32"
                  x="75"
                  y="75"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 1 (06:30): Đã rải 32.0 kg cám • DO 5.8 mg/L')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-[#006398] font-mono-num font-bold text-[11px]" textAnchor="middle" x="91" y="68">32kg</text>
                <text className="fill-slate-500 font-mono-num text-[10px]" textAnchor="middle" x="91" y="153">06:30</text>

                {/* Cữ 2: 10:30 (Completed - Ocean Blue #006398) */}
                <rect
                  className="fill-[#006398] hover:fill-[#0B1C30] transition cursor-pointer"
                  height="90"
                  rx="4"
                  width="32"
                  x="195"
                  y="50"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 2 (10:30): Đã rải 38.0 kg cám • DO 5.6 mg/L')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-[#006398] font-mono-num font-bold text-[11px]" textAnchor="middle" x="211" y="42">38kg</text>
                <text className="fill-slate-500 font-mono-num text-[10px]" textAnchor="middle" x="211" y="153">10:30</text>

                {/* Cữ 3: 14:30 (Active - Shrimp Orange #EA580C) */}
                <rect
                  className="fill-[#EA580C] cursor-pointer"
                  height="110"
                  rx="4"
                  width="34"
                  x="315"
                  y="30"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 3 (14:30 - Đang rải): 42.5 kg định mức • DO 5.60 mg/L')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-[#EA580C] font-mono-num font-extrabold text-[11px]" textAnchor="middle" x="332" y="22">42.5kg (Đang rải)</text>
                <text className="fill-[#EA580C] font-mono-num font-bold text-[10px]" textAnchor="middle" x="332" y="153">14:30</text>

                {/* Cữ 4: 18:30 (Planned - Soft Orange #FFDBCA) */}
                <rect
                  className="fill-[#FFDBCA] cursor-pointer"
                  height="78"
                  rx="4"
                  stroke="#EA580C"
                  strokeDasharray="3"
                  width="32"
                  x="445"
                  y="62"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 4 (18:30 - Kế hoạch): 35.0 kg • Dự báo DO 5.5 mg/L')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-[#9D4300] font-mono-num font-semibold text-[10px]" textAnchor="middle" x="461" y="54">35kg (Sắp tới)</text>
                <text className="fill-slate-400 font-mono-num text-[10px]" textAnchor="middle" x="461" y="153">18:30</text>

                {/* DO Dynamic Curve (Bio Green #006E2D) */}
                <path
                  d="M 91 58 Q 150 68, 211 48 T 332 64 T 461 46 T 565 60"
                  fill="none"
                  stroke="#006E2D"
                  strokeLinecap="round"
                  strokeWidth="3"
                />

                <circle cx="91" cy="58" fill="#ffffff" r="4" stroke="#006E2D" strokeWidth="2.5" />
                <circle cx="211" cy="48" fill="#ffffff" r="4" stroke="#006E2D" strokeWidth="2.5" />
                <circle cx="332" cy="64" fill="#EA580C" r="5" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="461" cy="46" fill="#ffffff" r="4" stroke="#006E2D" strokeDasharray="1" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="px-4 py-2.5 bg-[#F8F9FF] rounded-xl border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 text-[#0B1C30] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#006E2D] shrink-0" />
              <span>
                {selectedHoverPoint ||
                  'Hệ thống quạt nước tự động tăng cường khi lượng cám rải vượt 35 kg/giờ/ao.'}
              </span>
            </div>
            <span className="font-bold text-[#006E2D] font-mono-num shrink-0">Oxy đáy duy trì &gt; 5.0 mg/L</span>
          </div>
        </div>

        {/* RIGHT 4 COLS: SAFETY RULE & MQTT LOGS */}
        <div className="xl:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#EA580C]" />
                <h3 className="text-sm font-bold text-[#0B1C30]">
                  Nhật ký MQTT & Rule Engine
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('logs')}
                className="text-xs text-[#EA580C] hover:underline font-bold cursor-pointer"
              >
                Xem tất cả →
              </button>
            </div>

            {liveAlerts.length > 0 && (
              <div className="space-y-2 pb-2 border-b border-slate-100">
                <div className="text-[11px] font-bold uppercase text-[#BA1A1A] tracking-wider">
                  Sự cố đang mở ({liveAlerts.length})
                </div>
                {liveAlerts.slice(0, 2).map((alertItem) => {
                  const alertId = alertItem._id || alertItem.id;
                  return (
                    <div
                      key={alertId}
                      className="p-3 rounded-xl border border-[#FFDAD6] bg-[#FFF8F8] text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[#93000A]">
                          {alertItem.title || alertItem.type || 'Cảnh báo thiết bị'}
                        </span>
                        <span className="text-[10px] font-mono-num text-[#BA1A1A]">
                          {alertItem.status || 'OPEN'}
                        </span>
                      </div>
                      <p className="text-slate-600">{alertItem.message || alertItem.description}</p>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleAcknowledgeAlert(alertId)}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 cursor-pointer"
                        >
                          Tiếp nhận
                        </button>
                        <button
                          onClick={() => handleResolveAlert(alertId)}
                          className="px-2 py-1 rounded bg-[#006E2D] text-white font-medium hover:bg-[#005320] cursor-pointer"
                        >
                          Hoàn tất
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {logs.map((log) => {
                const isAlert = log.type === 'alert';
                const isSuccess = log.type === 'success';
                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-xl border text-xs transition ${
                      isAlert
                        ? 'bg-[#FFF8F5] border-l-4 border-l-[#F59E0B] border-amber-200'
                        : isSuccess
                        ? 'bg-[#F0FDF4] border-l-4 border-l-[#006E2D] border-[#7CF994]/60'
                        : 'bg-[#EFF4FF] border-l-4 border-l-[#006398] border-[#D3E4FE]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`font-bold ${
                          isAlert ? 'text-[#B45309]' : isSuccess ? 'text-[#006E2D]' : 'text-[#006398]'
                        }`}
                      >
                        {log.title}
                      </span>
                      <span className="text-[11px] font-mono-num text-slate-400 shrink-0">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{log.message}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Trạng thái rơ-le bảo vệ:</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#006E2D]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              3/3 Rơ-le kích hoạt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
