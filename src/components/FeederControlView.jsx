import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  AlertOctagon, 
  ShieldCheck, 
  Warehouse, 
  Waves, 
  Cpu, 
  AlertCircle,
  RotateCw,
  Clock,
  Sparkles
} from 'lucide-react';
import { feedingService } from '../services/feedingService';
import { safetyRuleService } from '../services/safetyRuleService';
import { deviceService } from '../services/deviceService';
import { getErrorMessage } from '../services/apiClient';
import { SafetyBlockedModal } from './feeder/SafetyBlockedModal';
import { SystemClock } from './common/SystemClock';

export const FeederControlView = ({
  ponds = [],
  selectedPond = null,
  onSelectPond,
  onNavigateTab,
  onEmergencyStop,
  onShowToast,
  onRefreshData,
}) => {
  const feederDevice = selectedPond?.feederDevice || null;
  const hasFeeder = Boolean(feederDevice);

  const [isPaused, setIsPaused] = useState(false);
  const [isStartingFeed, setIsStartingFeed] = useState(false);
  const [controlError, setControlError] = useState('');
  const [customKg, setCustomKg] = useState('5.0');

  // Đánh giá quy tắc an toàn
  const [safetyEvaluation, setSafetyEvaluation] = useState(null);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);

  useEffect(() => {
    setIsPaused(feederDevice?.mode === 'manual');
    setControlError('');
  }, [selectedPond?.id, feederDevice?.id, feederDevice?.mode]);

  if (ponds.length === 0 || !selectedPond) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF8F5] text-[#EA580C] flex items-center justify-center mx-auto">
          <Waves className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#0B1C30]">
            Chưa có ao nuôi để điều khiển máy cho ăn
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Vui lòng khởi tạo trang trại, khai báo ao nuôi và gán thiết bị máy cho ăn trước khi vận hành.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab?.('ponds')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold shadow-sm transition cursor-pointer"
        >
          <span>Đi tới Quản lý trang trại & ao nuôi</span>
        </button>
      </div>
    );
  }

  const sprayedToday = Number(selectedPond?.sprayedKg ?? 0);
  const targetToday = Number(selectedPond?.targetKg ?? 0);
  const feedPct = targetToday > 0 ? Math.min(100, Math.round((sprayedToday / targetToday) * 100)) : 0;

  // Chu vi vòng tròn tiến độ
  const circumference = 2 * Math.PI * 74; // ~465
  const strokeOffset = circumference - (feedPct / 100) * circumference;

  // 1. KÍCH HOẠT CỮ ĂN MỚI
  const handleTriggerFeed = async (amount) => {
    if (!feederDevice) {
      setControlError('Ao này chưa được gán thiết bị máy cho ăn.');
      return;
    }
    const requestedAmount = Number(amount);
    if (!requestedAmount || requestedAmount <= 0) {
      setControlError('Khối lượng thức ăn phải lớn hơn 0 kg.');
      return;
    }

    setControlError('');
    setIsStartingFeed(true);

    try {
      // 1.1 Kiểm tra trước với Safety Engine
      const preview = await safetyRuleService
        .evaluateSafetyPreview(selectedPond.id, {
          deviceId: feederDevice.id,
          requestedAmountKg: requestedAmount,
        })
        .catch(() => null);

      if (preview && preview.decision === 'blocked') {
        setSafetyEvaluation(preview);
        setIsSafetyModalOpen(true);
        setControlError('Quy tắc an toàn từ chối lệnh cho ăn: Chất lượng nước chưa đạt chuẩn.');
        return;
      }

      // 1.2 Tạo bản ghi cho ăn & phát lệnh điều khiển qua MQTT tới thiết bị IoT
      await feedingService.createRecord(selectedPond.id, {
        deviceId: feederDevice.id,
        requestedAmountKg: requestedAmount,
        source: 'manual',
      });

      await onRefreshData?.();
      onShowToast?.(
        `Đã phát lệnh cữ ăn ${requestedAmount} kg tới máy cho ăn qua MQTT.`,
        'success'
      );
    } catch (err) {
      setControlError(getErrorMessage(err, 'Không thể thực hiện cữ cho ăn. Vui lòng kiểm tra kết nối thiết bị.'));
    } finally {
      setIsStartingFeed(false);
    }
  };

  // 2. DỪNG KHẨN CẤP (E-STOP)
  const handleTriggerEmergencyStop = async () => {
    setControlError('');
    if (onEmergencyStop) {
      await onEmergencyStop();
      return;
    }
    if (feederDevice?.id) {
      try {
        await deviceService.emergencyStop(feederDevice.id);
      } catch (err) {
        setControlError(getErrorMessage(err, 'Không thể gửi lệnh dừng khẩn cấp lên máy chủ.'));
      }
    }
  };

  // 3. CHUYỂN CHẾ ĐỘ TỰ ĐỘNG / THỦ CÔNG
  const handleToggleMode = async () => {
    if (!feederDevice) return;
    setControlError('');
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    try {
      await deviceService.updateDevice(feederDevice.id, {
        mode: nextPaused ? 'manual' : 'automatic',
      });
      await onRefreshData?.();
      onShowToast?.(
        nextPaused
          ? 'Đã chuyển máy cho ăn sang Chế độ thủ công (Tạm dừng).'
          : 'Đã chuyển máy cho ăn sang Chế độ tự động theo lịch.',
        'info'
      );
    } catch (err) {
      setIsPaused(!nextPaused);
      setControlError(getErrorMessage(err, 'Không thể đổi chế độ hoạt động của thiết bị.'));
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. THANH CHỌN AO & KIỂM TRA AN TOÀN CHẤT LƯỢNG NƯỚC */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006E2D] text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFF4FF] text-[#006398] text-[11px] font-bold">
                <Warehouse className="w-3 h-3" />
                {selectedPond.farmName || 'Trang trại'}
              </span>
              <span className="text-xs font-extrabold text-[#006E2D]">
                Khóa liên động an toàn: Hoạt động
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Chất lượng nước hiện tại tại <strong>{selectedPond.code}</strong>: Oxy DO (
              {selectedPond.do !== null ? `${selectedPond.do.toFixed(2)} mg/L` : 'Chưa đo'}), pH (
              {selectedPond.ph !== null ? selectedPond.ph.toFixed(1) : 'Chưa đo'}), Nhiệt độ (
              {selectedPond.temp !== null ? `${selectedPond.temp.toFixed(1)}°C` : 'Chưa đo'}).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Chọn ao điều khiển:</span>
          <select
            value={selectedPond.id}
            onChange={(e) => onSelectPond?.(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#EFF4FF] border border-[#D3E4FE] font-bold text-[#0B1C30] focus:outline-none cursor-pointer"
          >
            {ponds.map((p) => (
              <option key={p.id} value={p.id}>
                {p.isFeeding ? '🟢 [ĐANG ĂN] ' : ''}[{p.farmName}] {p.code} – {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CẢNH BÁO NẾU AO CHƯA GÁN THIẾT BỊ FEEDER */}
      {!hasFeeder && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <strong>Ao {selectedPond.code} ({selectedPond.name}) chưa được gán thiết bị máy cho ăn.</strong>
              <p className="text-amber-800 mt-0.5">
                Vui lòng gán thiết bị máy cho ăn thật trước khi thực hiện điều khiển cữ ăn.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab?.('ponds')}
            className="px-3.5 py-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold shrink-0 cursor-pointer"
          >
            Gán thiết bị ngay
          </button>
        </div>
      )}

      {/* 2. KHU VỰC ĐIỀU KHIỂN CHÍNH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* CỘT TRÁI: TIẾN ĐỘ THỨC ĂN & TRẠNG THÁI MÁY */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <span>Tiến độ thức ăn ({selectedPond.code})</span>
              {selectedPond.isFeeding && (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#EA580C] bg-[#FFF7ED] px-2 py-0.5 rounded-full border border-[#FDBA74]">
                  <RotateCw className="w-3 h-3 animate-spin" />
                  Đang rải cữ ăn
                </span>
              )}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                !hasFeeder
                  ? 'bg-slate-100 text-slate-500'
                  : selectedPond.isFeeding
                  ? 'bg-[#FFF7ED] text-[#EA580C] border border-[#FDBA74]'
                  : isPaused
                  ? 'bg-[#FFDBCA] text-[#9D4300]'
                  : 'bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  !hasFeeder
                    ? 'bg-slate-400'
                    : selectedPond.isFeeding
                    ? 'bg-[#EA580C] animate-ping'
                    : isPaused
                    ? 'bg-[#EA580C]'
                    : 'bg-[#006E2D]'
                }`}
              />
              {!hasFeeder
                ? 'Chưa gán máy'
                : selectedPond.isFeeding
                ? 'Đang xả thức ăn'
                : isPaused
                ? 'Chế độ thủ công'
                : 'Chế độ tự động'}
            </span>
          </div>

          {/* VÒNG TRÒN TIẾN ĐỘ */}
          <div className="relative w-48 h-48 my-5 flex items-center justify-center">
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="74" stroke="#F1F5F9" strokeWidth="12" fill="none" />
              <circle
                cx="90"
                cy="90"
                r="74"
                stroke="#EA580C"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-[#0B1C30] font-mono-num tracking-tight">
                {sprayedToday.toFixed(1)} / {targetToday.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-0.5">kg đã rải / định mức</span>
              <span className="mt-2 px-3 py-0.5 rounded-full bg-[#FFDBCA] text-[#9D4300] text-xs font-extrabold font-mono-num">
                {feedPct}% hoàn thành
              </span>
            </div>
          </div>

          {/* THÔNG SỐ TÓM TẮT DƯỚI VÒNG TRÒN */}
          <div className="w-full grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-left">
            <div className="p-3 rounded-xl bg-[#EFF4FF] border border-[#D3E4FE]">
              <p className="text-[10px] font-bold text-[#006398]">Cữ ăn tiếp theo</p>
              <p className="text-xs font-extrabold text-[#0B1C30] mt-1 truncate">
                {selectedPond.currentMeal || 'Theo lịch trình'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#FFF8F5] border border-[#FFDBCA]">
              <p className="text-[10px] font-bold text-[#9D4300]">Tổng số cữ đã ăn</p>
              <p className="text-base font-extrabold text-[#EA580C] font-mono-num mt-0.5">
                {selectedPond.records?.length || 0} <span className="text-xs font-normal">lần</span>
              </p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: BẢNG ĐIỀU KHIỂN & KÍCH HOẠT CỮ ĂN */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#EA580C]" />
                <h2 className="text-sm font-bold text-[#0B1C30]">
                  Điều khiển máy cho ăn
                </h2>
              </div>
              <span className="text-xs font-mono-num text-slate-500">
                Mã thiết bị: <strong>{feederDevice?.deviceUid || 'Chưa có'}</strong>
              </span>
            </div>

            {controlError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{controlError}</span>
              </div>
            )}

            {/* PHẦN CHỌN NHANH KHỐI LƯỢNG & BẮT ĐẦU CHO ĂN */}
            <div className="p-4 rounded-xl bg-[#F8F9FF] border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B1C30] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
                  Khối lượng cám cho cữ này:
                </span>
                <span className="text-xs text-slate-500">
                  Định mức hôm nay: <strong>{targetToday > 0 ? `${targetToday} kg` : 'Theo nhu cầu'}</strong>
                </span>
              </div>

              {/* CÁC NÚT CHỌN NHANH KHỐI LƯỢNG */}
              <div className="grid grid-cols-4 gap-2">
                {['2.0', '3.0', '5.0', '10.0'].map((kg) => (
                  <button
                    key={kg}
                    type="button"
                    onClick={() => setCustomKg(kg)}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      customKg === kg
                        ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {kg} kg
                  </button>
                ))}
              </div>

              {/* Ô NHẬP TÙY CHỌN */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500 shrink-0">Hoặc nhập số kg:</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  value={customKg}
                  onChange={(e) => setCustomKg(e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 font-mono-num font-bold text-xs text-[#0B1C30] focus:outline-none focus:border-[#EA580C]"
                />
                <span className="text-xs font-bold text-slate-500">kg</span>
              </div>
            </div>

            {/* 3 NÚT THAO TÁC CỐT LÕI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* NÚT 1: BẮT ĐẦU CỮ ĂN */}
              <button
                onClick={() => handleTriggerFeed(customKg)}
                disabled={!hasFeeder || isStartingFeed}
                className="h-16 px-3 bg-[#006E2D] hover:bg-[#005320] disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-xl flex flex-col items-center justify-center transition shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  {isStartingFeed ? (
                    <RotateCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white" />
                  )}
                  <span className="font-bold text-xs">
                    {isStartingFeed ? 'Đang gửi lệnh...' : `Xả ${customKg} kg`}
                  </span>
                </div>
                <span className="text-[11px] text-[#7FFC97] mt-0.5">Kiểm tra an toàn & rải</span>
              </button>

              {/* NÚT 2: TỰ ĐỘNG / TẠM DỪNG */}
              <button
                onClick={handleToggleMode}
                disabled={!hasFeeder}
                className={`h-16 px-3 rounded-xl flex flex-col items-center justify-center border transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                  isPaused
                    ? 'bg-[#EA580C] text-white border-[#EA580C]'
                    : 'bg-[#FEF3C7] hover:bg-amber-200/80 text-[#B45309] border-amber-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Pause className="w-4 h-4" />
                  <span className="font-bold text-xs">
                    {isPaused ? 'Bật tự động' : 'Tạm dừng máy'}
                  </span>
                </div>
                <span className={`text-[11px] mt-0.5 ${isPaused ? 'text-[#FFDBCA]' : 'text-[#92400E]'}`}>
                  {isPaused ? 'Vận hành theo lịch' : 'Chuyển điều khiển tay'}
                </span>
              </button>

              {/* NÚT 3: DỪNG KHẨN CẤP */}
              <button
                onClick={handleTriggerEmergencyStop}
                disabled={!hasFeeder}
                className="h-16 px-3 bg-[#FFDAD6] hover:bg-[#BA1A1A] text-[#BA1A1A] hover:text-white border border-[#BA1A1A]/30 rounded-xl flex flex-col items-center justify-center transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  <span className="font-bold text-xs">Dừng khẩn cấp</span>
                </div>
                <span className="text-[11px] opacity-80 mt-0.5">Ngắt rơ-le tức thì</span>
              </button>
            </div>
          </div>

          {/* DÒNG TÓM TẮT THIẾT BỊ PHẦN CỨNG THẬT */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Trạng thái: <strong className={feederDevice?.status === 'online' ? 'text-[#006E2D]' : 'text-slate-600'}>
                {feederDevice?.status === 'online' ? 'Trực tuyến (Online)' : 'Ngoại tuyến (Offline)'}
              </strong>
            </span>
            <span>
              Firmware: <strong>{feederDevice?.firmwareVersion || '1.0.0'}</strong>
            </span>
            <span>
              Đồng hồ: <strong className="font-mono-num"><SystemClock /></strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. NHẬT KÝ CÁC LẦN CHO ĂN THỰC TẾ TRONG DATABASE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#006398]" />
            <h2 className="text-sm font-bold text-[#0B1C30]">
              Nhật ký các lần cho ăn thực tế tại {selectedPond.code} ({selectedPond.name})
            </h2>
          </div>
          <span className="text-xs font-mono-num text-slate-500">
            Tổng cộng: {selectedPond.records?.length || 0} bản ghi
          </span>
        </div>

        {!selectedPond.records || selectedPond.records.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Chưa có bản ghi cho ăn nào cho ao này trong cơ sở dữ liệu.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {selectedPond.records.slice(0, 10).map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-xl bg-[#F8F9FF] border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-[#0B1C30]">
                    Lượng cám: {Number(rec.actualAmountKg ?? rec.requestedAmountKg).toFixed(1)} kg • Nguồn:{' '}
                    <span className="font-semibold text-[#006398]">
                      {rec.source === 'schedule' ? 'Lịch tự động' : rec.source === 'ai' ? 'Đề xuất AI' : 'Thủ công'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono-num mt-0.5">
                    Thời gian:{' '}
                    {rec.startedAt || rec.createdAt
                      ? new Date(rec.startedAt || rec.createdAt).toLocaleString('vi-VN')
                      : '--'}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    rec.status === 'completed'
                      ? 'bg-[#E8F5E9] text-[#006E2D]'
                      : rec.status === 'stopped'
                      ? 'bg-slate-100 text-slate-600'
                      : rec.status === 'running'
                      ? 'bg-[#FFF7ED] text-[#EA580C] border border-[#FDBA74]'
                      : 'bg-[#EFF4FF] text-[#006398]'
                  }`}
                >
                  {rec.status === 'completed'
                    ? 'Hoàn thành'
                    : rec.status === 'stopped'
                    ? 'Đã dừng'
                    : rec.status === 'running'
                    ? 'Đang xả'
                    : rec.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CẢNH BÁO QUY TẮC AN TOÀN NƯỚC (NẾU BỊ CHẶN) */}
      <SafetyBlockedModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        safetyResult={safetyEvaluation}
      />
    </div>
  );
};

export default FeederControlView;
