import React, { useState } from 'react';
import { 
  PlayCircle, 
  Download, 
  Scale, 
  Cpu, 
  Wind, 
  Ear, 
  LayoutGrid, 
  List,
  AlertTriangle, 
  CheckCircle2, 
  SlidersHorizontal, 
  Radio,
  ArrowUpRight
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
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

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
  const totalSprayedToday = ponds.reduce((sum, p) => sum + p.sprayedKg, 0) + 225;
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
    onShowToast('Đã xuất báo cáo nhật ký vận hành ra file CSV thành công!', 'success');
  };

  const renderStatusBadge = (status) => {
    if (status === 'empty_hopper') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Hết cám phễu
        </span>
      );
    }
    if (status === 'paused') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Tạm dừng
        </span>
      );
    }
    if (status === 'idle') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Nghỉ cữ (Chờ)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Đang phun cám
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Tổng quan vận hành trang trại
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Tự động hóa
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Theo dõi thời gian thực lượng cám rải, môi trường nước (DO, pH, nhiệt độ) và sức ăn từng ao nuôi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleTestAll}
            disabled={testingAll}
            className={`h-9 px-3.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              testingAll
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
            }`}
          >
            <PlayCircle className={`w-4 h-4 ${testingAll ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
            <span>{testingAll ? `Đang thử nghiệm (${testCountdown}s)` : 'Chạy thử tự động (10s)'}</span>
          </button>

          <button
            onClick={handleExportLog}
            className="h-9 px-3.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất báo cáo (.CSV)</span>
          </button>
        </div>
      </div>

      {/* 4 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: FEED QUANTITY */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng cám đã rải hôm nay</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono-num">
              {totalSprayedToday}
            </span>
            <span className="text-sm font-medium text-slate-400 font-mono-num">
              / {targetSprayedToday} kg
            </span>
          </div>
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Tiến độ cữ 3/4</span>
              <span className="font-semibold text-slate-900 font-mono-num">
                {((totalSprayedToday / targetSprayedToday) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalSprayedToday / targetSprayedToday) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 2: FEEDER ACTUATORS */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Máy cho ăn hoạt động</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono-num">
              {activeFeeders} / {ponds.length}
            </span>
            <span className="text-xs font-medium text-emerald-600">Đang phun</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500 truncate mr-2">
              Ao 3: <strong className="text-red-600 font-medium">Báo hết cám phễu</strong>
            </span>
            <span className="text-slate-600 font-medium shrink-0">1 tạm dừng</span>
          </div>
        </div>

        {/* KPI 3: WATER QUALITY */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Oxy hòa tan trung bình (DO)</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
              <Wind className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 font-mono-num">
              {avgDo}
            </span>
            <span className="text-xs font-medium text-slate-400 font-mono-num">mg/L</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500 font-mono-num">
              Nhiệt độ: <strong className="text-slate-700">{avgTemp}°C</strong> • pH:{' '}
              <strong className="text-slate-700">{avgPh}</strong>
            </span>
            <span className="text-emerald-600 font-medium">An toàn</span>
          </div>
        </div>

        {/* KPI 4: BIO-ACOUSTIC FEEDING INDEX */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Sức ăn âm thanh (Hydrophone)</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
              <Ear className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Mạnh
            </span>
            <span className="text-xs font-medium text-slate-400 font-mono-num">(142 xung/phút)</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500">Đề xuất điều chỉnh:</span>
            <span className="text-teal-700 font-semibold">+5% định mức cữ</span>
          </div>
        </div>
      </div>

      {/* POND MONITORING SECTION (TABLE OR COMPACT CARDS) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Section Header & View Toggle */}
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Danh sách ao nuôi & Trạng thái máy cho ăn ({ponds.length} ao)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật tự động mỗi 5 giây • Thao tác nhanh trực tiếp trên từng ao
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Bảng dữ liệu</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Thẻ chi tiết</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABLE VIEW (Default for easy scanning) */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Ao nuôi</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Môi trường (DO / Nhiệt / pH)</th>
                  <th className="py-3 px-4">Tiến độ cữ hiện tại</th>
                  <th className="py-3 px-4">Tồn phễu (Loadcell)</th>
                  <th className="py-3 px-4">Sức ăn / Động cơ</th>
                  <th className="py-3 px-4 text-right">Thao tác nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {ponds.map((pond) => {
                  const isAlert = pond.status === 'empty_hopper';
                  const isPaused = pond.status === 'paused';
                  const isIdle = pond.status === 'idle';
                  const progressPercent = Math.min(100, (pond.sprayedKg / pond.targetKg) * 100);

                  return (
                    <tr
                      key={pond.id}
                      className={`transition ${
                        isAlert ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Pond Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onNavigateTab('feeder', pond.id)}
                            className="font-semibold text-slate-900 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{pond.name}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <span className="text-[11px] font-mono-num text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {pond.area}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {pond.shrimpType} • {pond.ageDays} ngày tuổi
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(pond.status)}
                      </td>

                      {/* Water Quality */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono-num text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className={`font-semibold ${pond.do >= 5.0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {pond.do.toFixed(2)} mg/L
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-700">{pond.temp.toFixed(1)}°C</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-700">pH {pond.ph.toFixed(1)}</span>
                        </div>
                      </td>

                      {/* Feeding Progress */}
                      <td className="py-3.5 px-4 min-w-[180px]">
                        <div className="flex justify-between text-xs font-mono-num mb-1">
                          <span className="text-slate-500">{pond.currentMeal}</span>
                          <span className={`font-semibold ${isAlert ? 'text-red-600' : 'text-slate-900'}`}>
                            {pond.sprayedKg} / {pond.targetKg} kg
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isAlert ? 'bg-red-500' : isIdle ? 'bg-slate-300' : 'bg-teal-600'
                            }`}
                            style={{ width: `${isIdle ? 0 : progressPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* Hopper Loadcell */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono-num text-xs">
                        <span
                          className={`font-semibold ${
                            pond.hopperKg < 1 ? 'text-red-600' : 'text-slate-800'
                          }`}
                        >
                          {pond.hopperKg < 1 ? `${pond.hopperKg} kg (Cạn)` : `${pond.hopperKg} kg`}
                        </span>
                      </td>

                      {/* Appetite / Motor */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <span
                          className={`font-medium ${
                            isAlert
                              ? 'text-red-600'
                              : pond.hydrophoneScore > 80
                              ? 'text-emerald-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {isAlert ? pond.motorStatus : pond.hydrophoneStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onRunTestFeeder(pond.id)}
                            disabled={isAlert}
                            className={`h-7 px-2.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                              isAlert
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            Rải thử 10s
                          </button>

                          {isAlert ? (
                            <button
                              onClick={() => onMuteAlarm(pond.id)}
                              className="h-7 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer"
                            >
                              Tắt còi
                            </button>
                          ) : isIdle ? (
                            <button
                              onClick={() =>
                                onShowToast(`Ao ${pond.id}: Chuyển sang chế độ cho ăn bổ sung thủ công.`, 'info')
                              }
                              className="h-7 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer"
                            >
                              Thủ công
                            </button>
                          ) : (
                            <button
                              onClick={() => onTogglePondPause(pond.id)}
                              className="h-7 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer"
                            >
                              {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                            </button>
                          )}

                          <button
                            onClick={() => onRefillFeed(pond.id, 25)}
                            className={`h-7 px-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                              isAlert
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
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
        ) : (
          /* GRID CARD VIEW */
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {ponds.map((pond) => {
              const isAlert = pond.status === 'empty_hopper';
              const isPaused = pond.status === 'paused';
              const isIdle = pond.status === 'idle';
              const progressPercent = Math.min(100, (pond.sprayedKg / pond.targetKg) * 100);

              return (
                <div
                  key={pond.id}
                  className={`bg-white rounded-xl p-4 flex flex-col justify-between transition border ${
                    isAlert
                      ? 'border-red-300 bg-red-50/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base text-slate-900">
                            {pond.name}
                          </span>
                          <span className="text-[11px] font-mono-num text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {pond.type} • {pond.area}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {pond.shrimpType} ({pond.ageDays} ngày tuổi)
                        </div>
                      </div>
                      {renderStatusBadge(pond.status)}
                    </div>

                    {/* Sensor Metrics */}
                    <div className="grid grid-cols-3 gap-1.5 py-2.5 bg-slate-50 rounded-lg text-center font-mono-num border border-slate-100">
                      <div className="border-r border-slate-200/70">
                        <div className="text-[11px] text-slate-500">Oxy DO</div>
                        <div className={`text-sm font-bold mt-0.5 ${pond.do >= 5.0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {pond.do.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">mg/L</div>
                      </div>
                      <div className="border-r border-slate-200/70">
                        <div className="text-[11px] text-slate-500">Nhiệt độ</div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">{pond.temp.toFixed(1)}</div>
                        <div className="text-[10px] text-slate-400">°C</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">Độ pH</div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">{pond.ph.toFixed(1)}</div>
                        <div className="text-[10px] text-slate-400">Ổn định</div>
                      </div>
                    </div>

                    {/* Progress & Hopper */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-mono-num">
                        <span className="text-slate-500">{pond.currentMeal}:</span>
                        <span className={`font-semibold ${isAlert ? 'text-red-600' : 'text-slate-900'}`}>
                          {pond.sprayedKg} / {pond.targetKg} kg
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isAlert ? 'bg-red-500' : isIdle ? 'bg-slate-300' : 'bg-teal-600'
                          }`}
                          style={{ width: `${isIdle ? 0 : progressPercent}%` }}
                        />
                      </div>

                      <div className="flex justify-between pt-1">
                        <span className="text-slate-500">Tồn phễu (Loadcell):</span>
                        <span className={`font-mono-num font-medium ${pond.hopperKg < 1 ? 'text-red-600 font-semibold' : 'text-slate-800'}`}>
                          {pond.hopperKg < 1 ? `${pond.hopperKg} kg (Cạn)` : `Còn ${pond.hopperKg} kg`}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-500">
                        <span>{isAlert ? 'Động cơ:' : 'Sức ăn âm thanh:'}</span>
                        <span className={`font-medium ${isAlert ? 'text-red-600' : pond.hydrophoneScore > 80 ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {isAlert ? pond.motorStatus : pond.hydrophoneStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="grid grid-cols-3 gap-1.5 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => onRunTestFeeder(pond.id)}
                      disabled={isAlert}
                      className={`h-8 px-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                        isAlert
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Rải thử 10s
                    </button>

                    {isAlert ? (
                      <button
                        onClick={() => onMuteAlarm(pond.id)}
                        className="h-8 px-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer"
                      >
                        Tắt còi
                      </button>
                    ) : isIdle ? (
                      <button
                        onClick={() => onShowToast(`Ao ${pond.id}: Chuyển sang chế độ cho ăn bổ sung thủ công.`, 'info')}
                        className="h-8 px-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer"
                      >
                        Thủ công
                      </button>
                    ) : (
                      <button
                        onClick={() => onTogglePondPause(pond.id)}
                        className="h-8 px-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer"
                      >
                        {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                      </button>
                    )}

                    <button
                      onClick={() => onRefillFeed(pond.id, 25)}
                      className={`h-8 px-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                        isAlert
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      +Nạp 25kg
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BOTTOM ROW: 24H FEED & DO CHART + ALERTS & ACTIVITY LOG */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* LEFT 8 COLS: 24H CHART */}
        <div className="xl:col-span-8 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Biểu đồ lượng cám rải & Nồng độ Oxy hòa tan (24 giờ)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi tương quan giữa các cữ cho ăn và mức DO trung bình toàn trại
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-800"></span>
                <span className="text-slate-600">Lượng cám (kg)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-emerald-500 rounded-full"></span>
                <span className="text-emerald-700 font-medium">Oxy DO (mg/L)</span>
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

                {/* Cữ 1: 06:00 */}
                <rect
                  className="fill-slate-400 hover:fill-slate-800 transition cursor-pointer"
                  height="65"
                  rx="3"
                  width="28"
                  x="75"
                  y="75"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 1 (06:00): 60 kg cám • DO 5.8 mg/L')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-slate-600 font-mono-num text-[11px]" textAnchor="middle" x="89" y="68">60kg</text>
                <text className="fill-slate-500 font-mono-num text-[10px]" textAnchor="middle" x="89" y="153">06:00</text>

                {/* Cữ 2: 09:30 */}
                <rect
                  className="fill-slate-600 hover:fill-slate-800 transition cursor-pointer"
                  height="90"
                  rx="3"
                  width="28"
                  x="185"
                  y="50"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 2 (09:30): 80 kg cám • DO 5.6 mg/L')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-slate-700 font-mono-num font-semibold text-[11px]" textAnchor="middle" x="199" y="42">80kg</text>
                <text className="fill-slate-500 font-mono-num text-[10px]" textAnchor="middle" x="199" y="153">09:30</text>

                {/* Cữ 3: 12:30 */}
                <rect
                  className="fill-teal-600 cursor-pointer"
                  height="110"
                  rx="3"
                  width="28"
                  x="295"
                  y="30"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 3 (12:30): Đang rải 100 kg định mức • DO 5.45 mg/L')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-teal-700 font-mono-num font-bold text-[11px]" textAnchor="middle" x="309" y="22">100kg (Đang rải)</text>
                <text className="fill-slate-900 font-mono-num font-semibold text-[10px]" textAnchor="middle" x="309" y="153">12:30</text>

                {/* Cữ 4: 15:30 */}
                <rect
                  className="fill-slate-200 cursor-pointer"
                  height="75"
                  rx="3"
                  stroke="#cbd5e1"
                  strokeDasharray="2"
                  width="28"
                  x="405"
                  y="65"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 4 (15:30 - Kế hoạch): 70 kg • Dự báo DO 5.9 mg/L')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-slate-500 font-mono-num text-[10px]" textAnchor="middle" x="419" y="57">70kg (kế hoạch)</text>
                <text className="fill-slate-400 font-mono-num text-[10px]" textAnchor="middle" x="419" y="153">15:30</text>

                {/* Cữ 5: 18:30 */}
                <rect
                  className="fill-slate-200 cursor-pointer"
                  height="45"
                  rx="3"
                  stroke="#cbd5e1"
                  strokeDasharray="2"
                  width="28"
                  x="515"
                  y="95"
                  onMouseEnter={() => setSelectedHoverPoint('Cữ 5 (18:30 - Kế hoạch): 45 kg cữ tối')}
                  onMouseLeave={() => setSelectedHoverPoint(null)}
                />
                <text className="fill-slate-500 font-mono-num text-[10px]" textAnchor="middle" x="529" y="87">45kg (kế hoạch)</text>
                <text className="fill-slate-400 font-mono-num text-[10px]" textAnchor="middle" x="529" y="153">18:30</text>

                {/* DO Dynamic Curve */}
                <path
                  d="M 89 60 Q 140 70, 199 50 T 309 68 T 419 45 T 529 62"
                  fill="none"
                  stroke="#10b981"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />

                <circle cx="89" cy="60" fill="#ffffff" r="4" stroke="#10b981" strokeWidth="2" />
                <circle cx="199" cy="50" fill="#ffffff" r="4" stroke="#10b981" strokeWidth="2" />
                <circle cx="309" cy="68" fill="#10b981" r="4.5" />
                <circle cx="419" cy="45" fill="#ffffff" r="3.5" stroke="#10b981" strokeDasharray="1" strokeWidth="1.5" />
                <circle cx="529" cy="62" fill="#ffffff" r="3.5" stroke="#10b981" strokeDasharray="1" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          <div className="px-3.5 py-2.5 bg-slate-50 rounded-lg border border-slate-200/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>
                {selectedHoverPoint ||
                  'Hệ thống quạt nước tự động tăng cường khi lượng cám rải vượt 35 kg/giờ/ao.'}
              </span>
            </div>
            <span className="font-medium text-slate-800 font-mono-num shrink-0">Oxy đáy duy trì &gt; 4.8 mg/L</span>
          </div>
        </div>

        {/* RIGHT 4 COLS: ALERTS & LOGS */}
        <div className="xl:col-span-4 bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Cảnh báo & Nhật ký vận hành
                </h3>
              </div>
              <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                Trực tiếp
              </span>
            </div>

            <div className="space-y-2.5 text-xs max-h-[290px] overflow-y-auto pr-1">
              {liveAlerts.length > 0 ? (
                liveAlerts.map((alt) => {
                  const isCrit = alt.severity === 3 || alt.severity === 'critical';
                  const isWarn = alt.severity === 2 || alt.severity === 'warning';
                  return (
                    <div
                      key={alt.id}
                      className={`p-3 rounded-lg border flex flex-col gap-1.5 transition ${
                        isCrit
                          ? 'bg-red-50/70 border-red-200'
                          : isWarn
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold text-xs">
                          <AlertTriangle className={`w-3.5 h-3.5 ${isCrit ? 'text-red-600' : 'text-amber-600'}`} />
                          <span className={isCrit ? 'text-red-700' : 'text-amber-800'}>
                            {alt.type || 'Cảnh báo ao nuôi'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono-num">
                          {alt.triggeredAt ? new Date(alt.triggeredAt).toLocaleTimeString('vi-VN') : 'Vừa xong'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 leading-relaxed">
                        {alt.message}
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-500 font-mono-num">
                          {alt.pondName || alt.deviceUid || 'Ao nuôi'}
                        </span>
                        <div className="flex gap-1.5">
                          {alt.status === 'open' && (
                            <button
                              onClick={() => handleAcknowledgeAlert(alt.id)}
                              className="px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium cursor-pointer"
                            >
                              Tiếp nhận
                            </button>
                          )}
                          <button
                            onClick={() => handleResolveAlert(alt.id)}
                            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
                          >
                            Đã xử lý
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                logs.map((log) => {
                  const isAlert = log.type === 'alert';
                  return (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border flex items-start gap-2.5 transition ${
                        isAlert
                          ? 'bg-red-50/50 border-red-200/80'
                          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60'
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
                            className={`font-semibold text-xs truncate ${
                              isAlert ? 'text-red-700' : 'text-slate-800'
                            }`}
                          >
                            {log.title}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono-num shrink-0">{log.timestamp}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {log.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('feeder', 2)}
              className="w-full h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Cấu hình máy cho ăn & Biến tần</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
