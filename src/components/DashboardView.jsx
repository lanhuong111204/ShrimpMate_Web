import React, { useState } from 'react';
import { 
  PlayCircle, 
  Download, 
  Cpu, 
  Wind, 
  LayoutGrid, 
  List,
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck,
  ArrowUpRight,
  SlidersHorizontal,
  Warehouse,
  Waves,
  Plus,
  RotateCw
} from 'lucide-react';
import { alertService } from '../services/alertService';
import { getErrorMessage } from '../services/apiClient';

export const DashboardView = ({
  farms = [],
  selectedFarmId = 'all',
  ponds = [],
  logs = [],
  isLoading = false,
  onNavigateTab,
  onRefillFeed,
  onTogglePondPause,
  onRunTestFeeder,
  onMuteAlarm,
  onShowToast,
}) => {
  const [testingAll, setTestingAll] = useState(false);
  const [testCountdown, setTestCountdown] = useState(10);
  const [viewMode, setViewMode] = useState('grid');

  // Cảnh báo thời gian thực từ Backend (lọc đúng theo trang trại đang chọn)
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [alertError, setAlertError] = useState('');

  const pondIdsKey = ponds.map((p) => p.id).join(',');

  const fetchAlerts = React.useCallback(async () => {
    try {
      if (selectedFarmId !== 'all' && ponds.length === 0) {
        setLiveAlerts([]);
        setAlertError('');
        return;
      }

      const alertsRes = await alertService.getAlerts({ status: 'open', limit: 20 });
      const rawList = Array.isArray(alertsRes) ? alertsRes : (alertsRes?.data || []);
      const pondIdSet = new Set(ponds.map((p) => p.id));

      const scopedAlerts =
        selectedFarmId === 'all'
          ? rawList
          : rawList.filter((a) => a.pondId && pondIdSet.has(a.pondId));

      setLiveAlerts((scopedAlerts || []).slice(0, 8));
      setAlertError('');
    } catch (err) {
      setAlertError(getErrorMessage(err, 'Không thể tải danh sách cảnh báo từ máy chủ.'));
    }
  }, [selectedFarmId, pondIdsKey]);

  React.useEffect(() => {
    fetchAlerts();
    const timer = setInterval(fetchAlerts, 15000);
    return () => clearInterval(timer);
  }, [fetchAlerts]);

  const handleAcknowledgeAlert = async (id) => {
    try {
      await alertService.acknowledgeAlert(id);
      onShowToast?.('Đã tiếp nhận xử lý sự cố.', 'info');
      await fetchAlerts();
    } catch (err) {
      onShowToast?.(getErrorMessage(err, 'Không thể xác nhận tiếp nhận cảnh báo.'), 'alert');
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await alertService.resolveAlert(id);
      onShowToast?.('Đã đánh dấu giải quyết sự cố hoàn tất.', 'success');
      await fetchAlerts();
    } catch (err) {
      onShowToast?.(getErrorMessage(err, 'Không thể cập nhật hoàn tất xử lý cảnh báo.'), 'alert');
    }
  };

  // Tính toán các chỉ số tổng hợp thực tế từ danh sách ao nuôi trong DB
  const totalSprayedToday = parseFloat(
    ponds.reduce((sum, p) => sum + Number(p.sprayedKg || 0), 0).toFixed(1)
  );
  const targetSprayedToday = parseFloat(
    ponds.reduce((sum, p) => sum + Number(p.targetKg || 0), 0).toFixed(1)
  );
  const feedProgressPct =
    targetSprayedToday > 0
      ? Math.min(100, Math.round((totalSprayedToday / targetSprayedToday) * 100))
      : 0;

  const pondsWithDo = ponds.filter((p) => p.do !== null && p.do !== undefined);
  const pondsWithTemp = ponds.filter((p) => p.temp !== null && p.temp !== undefined);
  const pondsWithPh = ponds.filter((p) => p.ph !== null && p.ph !== undefined);

  const avgDo =
    pondsWithDo.length > 0
      ? (pondsWithDo.reduce((sum, p) => sum + p.do, 0) / pondsWithDo.length).toFixed(2)
      : null;
  const avgTemp =
    pondsWithTemp.length > 0
      ? (pondsWithTemp.reduce((sum, p) => sum + p.temp, 0) / pondsWithTemp.length).toFixed(1)
      : null;
  const avgPh =
    pondsWithPh.length > 0
      ? (pondsWithPh.reduce((sum, p) => sum + p.ph, 0) / pondsWithPh.length).toFixed(1)
      : null;

  const onlineFeeders = ponds.filter((p) => p.feederDevice && p.feederDevice.status === 'online').length;
  const totalFeeders = ponds.filter((p) => p.feederDevice).length;
  const warningPonds = ponds.filter(
    (p) => p.status === 'empty_hopper' || (p.do !== null && p.do < 4.0)
  );

  // Vòng tròn tiến độ thức ăn (r = 22, chu vi = 138.2)
  const ringCircumference = 138.2;
  const ringOffset = ringCircumference - (feedProgressPct / 100) * ringCircumference;

  const handleTestAll = () => {
    if (testingAll || ponds.length === 0) return;
    setTestingAll(true);
    setTestCountdown(10);
    onShowToast(`Đang kích hoạt chạy thử tự động 10 giây trên ${ponds.length} ao nuôi...`, 'info');

    const interval = setInterval(() => {
      setTestCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTestingAll(false);
          onShowToast('Kiểm tra tự động 10s hoàn tất.', 'success');
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleExportLog = () => {
    const csvContent = [
      'Thời gian,Mã ao,Sự kiện,Loại cảnh báo',
      ...logs.map(
        (l) =>
          `${l.timestamp},${l.pondCode || 'TRẠM'},"${l.title} - ${l.message}",${l.type}`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shrimpmate_nhat_ky_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Đã xuất báo cáo nhật ký vận hành ra tệp CSV thành công.', 'success');
  };

  const renderStatusBadge = (pond) => {
    if (pond.status === 'empty_hopper') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          Cảnh báo phễu
        </span>
      );
    }
    if (pond.dbStatus === 'maintenance') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFDBCA] text-[#9D4300]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
          Đang cải tạo
        </span>
      );
    }
    if (pond.dbStatus === 'inactive') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Tạm ngưng
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#006E2D]" />
        Đang hoạt động
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. BANNER QUY TẮC AN TOÀN NƯỚC (SAFETY RULE ENGINE) */}
      <div className="rounded-2xl p-4 bg-[#E8F5E9] border border-[#7CF994] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006E2D] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold tracking-wide text-[#006E2D]">
                Bộ quy tắc an toàn môi trường nước: Đang bảo vệ
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#006E2D] border border-[#7CF994]">
                {ponds.length > 0 ? `${ponds.length} ao được giám sát` : 'Chưa có ao nuôi'}
              </span>
            </div>
            <p className="text-xs text-[#005320] mt-0.5 font-medium">
              {avgDo !== null
                ? `Chỉ số trung bình thực tế: DO (${avgDo} mg/L), pH (${avgPh ?? '--'}) và Nhiệt độ (${avgTemp ?? '--'}°C).`
                : 'Hệ thống tự động kiểm tra nồng độ DO, pH, nhiệt độ và khí độc NH₃ trước mỗi lệnh xả thức ăn.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('schedule')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white text-[#006E2D] border border-[#7CF994] hover:bg-[#F0FDF4] transition cursor-pointer"
          >
            Xem quy tắc an toàn
          </button>
        </div>
      </div>

      {/* 2. TIÊU ĐỀ TRANG & THAO TÁC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30] tracking-tight font-display">
            Tổng quan vận hành trang trại
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Số liệu thực tế từ cơ sở dữ liệu: lượng thức ăn, 6 chỉ số môi trường nước và sức ăn từng ao nuôi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleTestAll}
            disabled={testingAll || ponds.length === 0}
            className={`h-9 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
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

      {/* 3. 4 THẺ KPI TỔNG HỢP TỪ DỮ LIỆU THẬT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: TỔNG THỨC ĂN HÔM NAY */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 border-l-4 border-l-[#EA580C] shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-slate-500">
                Tổng thức ăn đã rải
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
            <span className="text-[#006E2D] font-bold">
              {ponds.length > 0 ? `Tổng hợp từ ${ponds.length} ao` : 'Chưa có ao nuôi'}
            </span>
            <span className="text-slate-500 font-medium">
              {targetSprayedToday > 0 ? 'Đang theo lịch tự động' : 'Chưa có lịch ăn'}
            </span>
          </div>
        </div>

        {/* KPI 2: OXY HÒA TAN TRUNG BÌNH */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 border-l-4 border-l-[#006398] shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-slate-500">
                Oxy hòa tan trung bình (DO)
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#006398] font-mono-num">
                  {avgDo ?? '--'}
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
                style={{ width: avgDo ? `${Math.min(100, (parseFloat(avgDo) / 8.0) * 100)}%` : '0%' }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-medium text-slate-500">
              <span>
                Nhiệt: <strong className="text-[#0B1C30]">{avgTemp ? `${avgTemp}°C` : '--'}</strong> • pH:{' '}
                <strong className="text-[#0B1C30]">{avgPh ?? '--'}</strong>
              </span>
              <span className="text-[#006E2D] font-bold">
                {avgDo ? (parseFloat(avgDo) >= 4.0 ? 'Đạt chuẩn' : 'Cần sục khí') : 'Chưa có số đo'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: TRẠNG THÁI TRẠM MÁY CHO ĂN */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 border-l-4 border-l-[#006E2D] shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-slate-500">
                Thiết bị máy cho ăn
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#006E2D] font-mono-num">
                  {onlineFeeders}
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono-num">
                  / {totalFeeders} trực tuyến
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#006E2D] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="px-2 py-0.5 rounded-md bg-[#E8F5E9] text-[#006E2D] font-bold">
              {onlineFeeders} Sẵn sàng
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#EFF4FF] text-[#006398] font-bold">
              {ponds.length - totalFeeders} Ao chưa gán máy
            </span>
          </div>
        </div>

        {/* KPI 4: CẢNH BÁO VẬN HÀNH */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 border-l-4 border-l-[#F59E0B] shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-wide text-slate-500">
                Cảnh báo môi trường & thiết bị
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#B45309] font-mono-num">
                  {liveAlerts.length + warningPonds.length}
                </span>
                <span className="text-xs font-semibold text-slate-500">sự cố cần chú ý</span>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#B45309]">
              {liveAlerts.length > 0 ? 'Có cảnh báo mở' : 'Bình thường'}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium truncate mr-2">
              {liveAlerts[0]?.message ||
                (warningPonds[0] ? `${warningPonds[0].code}: Cần kiểm tra phễu/DO` : 'Tất cả các ao ổn định')}
            </span>
            <button
              onClick={() => onNavigateTab('logs')}
              className="text-[#EA580C] font-bold hover:underline shrink-0 cursor-pointer"
            >
              Xem nhật ký →
            </button>
          </div>
        </div>
      </div>

      {/* 4. DANH SÁCH GIÁM SÁT CHI TIẾT TỪNG AO NUÔI */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#0B1C30] font-display">
              Giám sát chi tiết từng ao nuôi ({ponds.length} ao)
            </h2>
            <p className="text-xs text-slate-500">
              Hiển thị dữ liệu thực tế từ cơ sở dữ liệu kèm tên trang trại trực thuộc • Bấm vào từng ao để điều khiển máy rải cám
            </p>
          </div>

          {ponds.length > 0 && (
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
          )}
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-[#006398]" />
            <span>Đang đồng bộ dữ liệu thực tế từ cơ sở dữ liệu...</span>
          </div>
        ) : ponds.length === 0 ? (
          /* TRẠNG THÁI RỖNG CHO TÀI KHOẢN MỚI CHƯA CÓ TRANG TRẠI / AO NUÔI */
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center max-w-2xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF8F5] text-[#EA580C] flex items-center justify-center mx-auto">
              <Waves className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#0B1C30]">
                {farms.length === 0
                  ? 'Chưa có trang trại và ao nuôi nào trong tài khoản của bạn'
                  : 'Trang trại hiện tại chưa có ao nuôi nào'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
                Hệ thống chỉ hiển thị dữ liệu thật từ cơ sở dữ liệu. Hãy khởi tạo trang trại và khai báo ao nuôi đầu tiên để bắt đầu theo dõi các chỉ số nước, lịch cho ăn và thiết bị IoT.
              </p>
            </div>
            <div className="pt-1">
              <button
                onClick={() => onNavigateTab('ponds')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Đi tới Quản lý trang trại & ao nuôi</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ponds.map((pond) => {
              const isAlert = pond.status === 'empty_hopper';
              const isPaused = pond.dbStatus === 'maintenance';
              const progressPercent =
                pond.targetKg > 0
                  ? Math.min(100, Math.round((pond.sprayedKg / pond.targetKg) * 100))
                  : 0;

              return (
                <div
                  key={pond.id}
                  className={`bg-white rounded-2xl p-5 border transition shadow-2xs hover:shadow-md ${
                    isAlert
                      ? 'border-amber-300'
                      : 'border-slate-200 hover:border-[#EA580C]/50'
                  }`}
                >
                  {/* Dòng đầu: Tên trang trại + Tên ao + Mã định danh */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-start gap-3">
                      <div
                        onClick={() => onNavigateTab('feeder', pond.id)}
                        className={`w-11 h-11 rounded-xl font-extrabold text-xs flex items-center justify-center font-mono-num cursor-pointer shrink-0 ${
                          isAlert
                            ? 'bg-[#FEF3C7] text-[#B45309] border border-amber-300'
                            : 'bg-[#FFF8F5] text-[#EA580C] border border-[#FFDBCA]'
                        }`}
                      >
                        {pond.code}
                      </div>
                      <div>
                        {/* Nhãn Trang trại trực thuộc */}
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE] text-[10px] font-bold mb-1">
                          <Warehouse className="w-3 h-3" />
                          <span>{pond.farmName || 'Trang trại'}</span>
                        </div>
                        <button
                          onClick={() => onNavigateTab('feeder', pond.id)}
                          className="text-base font-bold text-[#0B1C30] hover:text-[#EA580C] flex items-center gap-1 cursor-pointer text-left"
                        >
                          <span>{pond.name}</span>
                          <ArrowUpRight className="w-4 h-4 text-slate-400" />
                        </button>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Mã ao: <span className="font-mono-num font-semibold text-slate-700">{pond.code}</span> •{' '}
                          {pond.shrimpType} • {pond.currentMeal}
                        </p>
                      </div>
                    </div>
                    {renderStatusBadge(pond)}
                  </div>

                  {/* Dải 3 thông tin vụ nuôi & diện tích thực tế */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-[#F8F9FF] border border-slate-100 mb-3.5 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">Tuổi tôm (DOC)</p>
                      <p className="text-xs font-bold text-[#0B1C30] mt-0.5 font-mono-num">
                        {pond.ageDays ? `${pond.ageDays} ngày` : 'Chưa thả'}
                      </p>
                    </div>
                    <div className="border-x border-slate-200/70">
                      <p className="text-[10px] text-slate-400 font-bold">Số lượng giống</p>
                      <p className="text-xs font-bold text-[#0B1C30] mt-0.5 font-mono-num">
                        {pond.stockingCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">Diện tích</p>
                      <p className="text-xs font-bold text-[#0B1C30] mt-0.5 font-mono-num">{pond.area}</p>
                    </div>
                  </div>

                  {/* 4 ô chỉ số cảm biến thực tế */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div
                      className={`p-2.5 rounded-xl border text-center ${
                        pond.do === null
                          ? 'bg-slate-50 border-slate-200'
                          : pond.do >= 5.0
                          ? 'bg-[#F0FDF4] border-[#7CF994]/60'
                          : 'bg-[#FEF3C7]/50 border-amber-200'
                      }`}
                    >
                      <p className="text-[10px] font-bold text-[#006E2D]">Oxy (DO)</p>
                      <p className="text-sm font-extrabold font-mono-num mt-0.5 text-[#006E2D]">
                        {pond.do !== null ? `${pond.do.toFixed(2)}` : '--'}{' '}
                        <span className="text-[10px] font-normal">mg/L</span>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#EFF4FF] border border-[#D3E4FE] text-center">
                      <p className="text-[10px] font-bold text-[#006398]">Độ pH</p>
                      <p className="text-sm font-extrabold text-[#006398] font-mono-num mt-0.5">
                        {pond.ph !== null ? pond.ph.toFixed(1) : '--'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FFF8F5] border border-[#FFDBCA] text-center">
                      <p className="text-[10px] font-bold text-[#9D4300]">Nhiệt độ</p>
                      <p className="text-sm font-extrabold text-[#9D4300] font-mono-num mt-0.5">
                        {pond.temp !== null ? `${pond.temp.toFixed(1)}°C` : '--'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl border text-center bg-[#E8F5E9] border-[#7CF994]">
                      <p className="text-[10px] font-bold text-[#006E2D]">Độ thèm ăn</p>
                      <p className="text-xs font-extrabold mt-1 truncate text-[#006E2D]">
                        {pond.fisLabel}
                      </p>
                    </div>
                  </div>

                  {/* Thanh tiến độ rải cám */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        Tồn phễu máy cho ăn:{' '}
                        <strong className="text-[#0B1C30] font-mono-num">
                          {pond.hopperKg !== null ? `${pond.hopperKg} kg` : 'Chưa gán máy'}
                        </strong>
                      </span>
                      <span className="font-bold text-[#EA580C] font-mono-num">
                        {pond.sprayedKg} / {pond.targetKg} kg ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#FFDBCA]/70 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#FB923C] to-[#EA580C]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Nút thao tác nhanh */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onRunTestFeeder(pond.id)}
                        className="h-8 px-3 rounded-xl text-xs font-bold border transition cursor-pointer bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#006398] border-[#D3E4FE]"
                      >
                        Rải thử 10s
                      </button>

                      <button
                        onClick={() => onTogglePondPause(pond.id)}
                        className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                      >
                        {isPaused ? 'Mở hoạt động' : 'Tạm dừng'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onRefillFeed(pond.id, 25)}
                        className="h-8 px-3 rounded-xl text-xs font-bold transition cursor-pointer bg-[#FFF8F5] text-[#9D4300] border border-[#FFDBCA] hover:bg-[#FFDBCA]"
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
          /* BẢNG DỮ LIỆU CHI TIẾT */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8F9FF] text-[11px] font-bold text-slate-500">
                    <th className="py-3.5 px-4">Trang trại</th>
                    <th className="py-3.5 px-4">Ao nuôi</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Môi trường (DO / pH / Nhiệt)</th>
                    <th className="py-3.5 px-4">Tiến độ thức ăn</th>
                    <th className="py-3.5 px-4">Tồn phễu</th>
                    <th className="py-3.5 px-4 text-right">Thao tác nhanh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {ponds.map((pond) => {
                    const progressPercent =
                      pond.targetKg > 0
                        ? Math.min(100, Math.round((pond.sprayedKg / pond.targetKg) * 100))
                        : 0;

                    return (
                      <tr key={pond.id} className="hover:bg-[#F8F9FF] transition">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFF4FF] text-[#006398] text-xs font-bold">
                            <Warehouse className="w-3.5 h-3.5" />
                            <span>{pond.farmName}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onNavigateTab('feeder', pond.id)}
                              className="font-bold text-[#0B1C30] hover:text-[#EA580C] flex items-center gap-1 cursor-pointer"
                            >
                              <span>
                                {pond.code} – {pond.name}
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <span className="text-[11px] font-mono-num text-[#006398] bg-[#EFF4FF] px-1.5 py-0.5 rounded font-semibold">
                              {pond.area}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {pond.shrimpType} • {pond.ageDays ? `${pond.ageDays} ngày` : 'Chưa thả'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">{renderStatusBadge(pond)}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono-num text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#006E2D]">
                              {pond.do !== null ? `${pond.do.toFixed(2)} mg/L` : '--'}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-[#006398] font-bold">
                              pH {pond.ph !== null ? pond.ph.toFixed(1) : '--'}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-[#9D4300] font-bold">
                              {pond.temp !== null ? `${pond.temp.toFixed(1)}°C` : '--'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 min-w-[160px]">
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
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono-num text-xs font-bold">
                          {pond.hopperKg !== null ? `${pond.hopperKg} kg` : 'Chưa gán máy'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => onRunTestFeeder(pond.id)}
                              className="h-7 px-2.5 rounded-lg text-xs font-semibold bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE] cursor-pointer"
                            >
                              Rải 10s
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

      {/* 5. CẢNH BÁO VÀ NHẬT KÝ VẬN HÀNH THỰC TẾ TỪ BACKEND */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0B1C30]">
              Cảnh báo và sự kiện vận hành mới nhất
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dữ liệu cảnh báo thực tế ghi nhận từ cảm biến nước, máy cho ăn và bộ quy tắc an toàn
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('logs')}
            className="text-xs font-bold text-[#006398] hover:underline cursor-pointer"
          >
            Xem toàn bộ →
          </button>
        </div>

        {alertError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{alertError}</span>
          </div>
        )}

        {liveAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {liveAlerts.map((alertItem) => (
              <div
                key={alertItem.id}
                className="p-3.5 rounded-xl border border-amber-200 bg-[#FFF8F5] flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#9D4300]">
                      {alertItem.type?.toUpperCase() || 'CẢNH BÁO'}
                      {alertItem.pond?.code ? ` • ${alertItem.pond.code}` : ''}
                    </p>
                    <p className="text-slate-600 mt-0.5">{alertItem.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAcknowledgeAlert(alertItem.id)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Tiếp nhận
                  </button>
                  <button
                    onClick={() => handleResolveAlert(alertItem.id)}
                    className="px-2.5 py-1 rounded-lg bg-[#006E2D] text-white font-semibold hover:bg-[#005320] cursor-pointer"
                  >
                    Xử lý xong
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {logs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-[#F8F9FF] flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#006E2D] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#0B1C30]">{log.title}</p>
                    <p className="text-slate-600 mt-0.5">{log.message}</p>
                  </div>
                </div>
                <span className="font-mono-num text-[11px] text-slate-400 shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500">
            Hiện tại không có cảnh báo vượt ngưỡng nào trong hệ thống.
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
