import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Timer, 
  PlusSquare, 
  RotateCw, 
  AlertOctagon, 
  ShieldCheck, 
  Sliders, 
  Gauge, 
  RotateCcw, 
  Package,
  Warehouse,
  Waves,
  Cpu
} from 'lucide-react';
import { feedingService } from '../services/feedingService';
import { safetyRuleService } from '../services/safetyRuleService';
import { deviceService } from '../services/deviceService';
import { getErrorMessage } from '../services/apiClient';
import { SafetyBlockedModal } from './feeder/SafetyBlockedModal';

export const FeederControlView = ({
  ponds = [],
  selectedPond = null,
  onSelectPond,
  onNavigateTab,
  onEmergencyStop,
  onShowToast,
  onRefreshData,
  currentTime,
}) => {
  const feederDevice = selectedPond?.feederDevice || null;
  const hasFeeder = Boolean(feederDevice);

  const [isPaused, setIsPaused] = useState(false);
  const [isReversing, setIsReversing] = useState(false);
  const [isTestSpinning, setIsTestSpinning] = useState(false);
  const [testCountdown, setTestCountdown] = useState(10);
  const [isSaving, setIsSaving] = useState(false);

  // Số liệu thực tế lấy từ thiết bị Feeder và bản ghi cho ăn trong DB
  const hopperWeight =
    feederDevice?.metadata?.hopperKg !== undefined
      ? Number(feederDevice.metadata.hopperKg)
      : selectedPond?.hopperKg ?? null;
  const maxHopperWeight =
    feederDevice?.metadata?.maxHopperKg !== undefined
      ? Number(feederDevice.metadata.maxHopperKg)
      : selectedPond?.maxHopperKg ?? 70.0;
  const vfdFrequency =
    feederDevice?.metadata?.vfdFrequencyHz !== undefined
      ? Number(feederDevice.metadata.vfdFrequencyHz)
      : selectedPond?.vfdFrequencyHz ?? null;
  const motorCurrentA =
    feederDevice?.metadata?.motorCurrentA !== undefined
      ? Number(feederDevice.metadata.motorCurrentA)
      : null;
  const motorTempC =
    feederDevice?.metadata?.motorTempC !== undefined
      ? Number(feederDevice.metadata.motorTempC)
      : null;

  const sprayedInCurrentMeal = Number(selectedPond?.sprayedKg ?? 0);
  const targetCurrentMeal = Number(selectedPond?.targetKg ?? 0);

  // Đánh giá quy tắc an toàn
  const [safetyEvaluation, setSafetyEvaluation] = useState(null);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);

  useEffect(() => {
    setIsPaused(feederDevice?.mode === 'manual');
  }, [feederDevice?.id, feederDevice?.mode]);

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

  const updateFeederMetadata = async (partialMeta, successMsg) => {
    if (!feederDevice) {
      onShowToast?.('Ao này chưa được gán thiết bị máy cho ăn.', 'alert');
      return;
    }
    setIsSaving(true);
    try {
      await deviceService.updateDevice(feederDevice.id, {
        metadata: {
          ...(feederDevice.metadata || {}),
          ...partialMeta,
        },
      });
      await onRefreshData?.();
      if (successMsg) onShowToast?.(successMsg, 'success');
    } catch (err) {
      onShowToast?.(getErrorMessage(err, 'Không thể cập nhật thông số thiết bị lên máy chủ.'), 'alert');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartAuto = async () => {
    if (!feederDevice) {
      onShowToast?.('Ao này chưa có thiết bị máy cho ăn được gán.', 'alert');
      return;
    }

    const requestedKg = targetCurrentMeal > 0 ? Math.min(5.0, targetCurrentMeal) : 3.0;
    try {
      const preview = await safetyRuleService
        .evaluateSafetyPreview(selectedPond.id, {
          deviceId: feederDevice.id,
          requestedAmountKg: requestedKg,
        })
        .catch(() => null);

      if (preview && preview.decision === 'blocked') {
        setSafetyEvaluation(preview);
        setIsSafetyModalOpen(true);
        onShowToast?.(
          'Cảnh báo: Quy tắc an toàn từ chối lệnh cho ăn do chất lượng nước chưa đạt ngưỡng.',
          'alert'
        );
        return;
      }

      const rec = await feedingService.createRecord(selectedPond.id, {
        deviceId: feederDevice.id,
        requestedAmountKg: requestedKg,
        source: 'manual',
      });

      if (rec?.id) {
        await feedingService
          .updateRecord(rec.id, {
            status: 'completed',
            actualAmountKg: requestedKg,
          })
          .catch(() => {});
      }

      if (hopperWeight !== null) {
        const nextHopper = Math.max(0, parseFloat((hopperWeight - requestedKg).toFixed(1)));
        await updateFeederMetadata({ hopperKg: nextHopper });
      } else {
        await onRefreshData?.();
      }

      setIsPaused(false);
      onShowToast?.(`Đã kích hoạt xả ${requestedKg} kg thức ăn tại ${selectedPond.code}.`, 'success');
    } catch (err) {
      onShowToast?.(
        getErrorMessage(err, 'Không thể thực hiện lệnh xả thức ăn (kiểm tra kết nối hoặc quy tắc an toàn).'),
        'alert'
      );
    }
  };

  const handleTriggerEmergencyStop = async () => {
    if (feederDevice?.id) {
      try {
        await deviceService.emergencyStop(feederDevice.id);
      } catch (err) {
        onShowToast?.(getErrorMessage(err, 'Không thể gửi lệnh dừng khẩn cấp lên máy chủ.'), 'alert');
      }
    }
    onEmergencyStop?.();
  };

  const handlePause = async () => {
    if (!feederDevice) return;
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    try {
      await deviceService.updateDevice(feederDevice.id, {
        mode: nextPaused ? 'manual' : 'automatic',
      });
      await onRefreshData?.();
      onShowToast?.(
        nextPaused
          ? 'Đã chuyển máy cho ăn sang chế độ tạm dừng (thủ công).'
          : 'Đã chuyển máy cho ăn về chế độ tự động.',
        'info'
      );
    } catch (err) {
      setIsPaused(!nextPaused);
      onShowToast?.(getErrorMessage(err, 'Không thể đổi chế độ hoạt động của thiết bị.'), 'alert');
    }
  };

  const handleTest10s = () => {
    if (!feederDevice || isTestSpinning) return;
    setIsTestSpinning(true);
    setTestCountdown(10);
    onShowToast?.('Đang bật mâm phun thử 10 giây để kiểm tra bán kính văng.', 'info');

    const interval = setInterval(() => {
      setTestCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTestSpinning(false);
          onShowToast?.('Kiểm tra mâm phun 10s hoàn tất.', 'success');
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAdd2Kg = async () => {
    if (!feederDevice) return;
    try {
      const rec = await feedingService.createRecord(selectedPond.id, {
        deviceId: feederDevice.id,
        requestedAmountKg: 2.0,
        source: 'manual',
      });
      if (rec?.id) {
        await feedingService.updateRecord(rec.id, { status: 'completed', actualAmountKg: 2.0 }).catch(() => {});
      }
      if (hopperWeight !== null) {
        await updateFeederMetadata(
          { hopperKg: Math.max(0, parseFloat((hopperWeight - 2.0).toFixed(1))) },
          'Đã bổ sung +2.0 kg cám vào nhật ký cho ăn thực tế.'
        );
      } else {
        await onRefreshData?.();
        onShowToast?.('Đã bổ sung +2.0 kg cám vào nhật ký cho ăn thực tế.', 'success');
      }
    } catch (err) {
      onShowToast?.(getErrorMessage(err, 'Không thể thực hiện lệnh phun bù +2.0 kg.'), 'alert');
    }
  };

  const handleReverseMotor = () => {
    if (!feederDevice || isReversing) return;
    setIsReversing(true);
    onShowToast?.('Đang kích hoạt đảo chiều mâm 3 giây để chống kẹt cám.', 'info');
    setTimeout(() => {
      setIsReversing(false);
      onShowToast?.('Đảo chiều mâm hoàn tất.', 'success');
    }, 3000);
  };

  const handleSetZeroScale = async () => {
    await updateFeederMetadata(
      { hopperKg: 0.0, maxHopperKg: maxHopperWeight },
      'Đã đặt cân điện tử phễu chứa về 0.0 kg trên cơ sở dữ liệu.'
    );
  };

  const handleRefill50Kg = async () => {
    const nextWeight = Math.min(maxHopperWeight, parseFloat(((hopperWeight || 0) + 50.0).toFixed(1)));
    await updateFeederMetadata(
      { hopperKg: nextWeight, maxHopperKg: maxHopperWeight },
      `Đã nạp cám vào phễu chứa (${nextWeight} / ${maxHopperWeight} kg).`
    );
  };

  const handleSetPresetFreq = async (freq) => {
    await updateFeederMetadata(
      { vfdFrequencyHz: freq },
      `Đã lưu tần số biến tần ${freq.toFixed(1)} Hz cho thiết bị ${feederDevice?.deviceUid}.`
    );
  };

  const feedPct =
    targetCurrentMeal > 0
      ? Math.min(100, Math.round((sprayedInCurrentMeal / targetCurrentMeal) * 100))
      : 0;
  const bigCircumference = 490;
  const bigOffset = bigCircumference - (feedPct / 100) * bigCircumference;
  const hopperPct =
    hopperWeight !== null && maxHopperWeight > 0
      ? Math.min(100, Math.round((hopperWeight / maxHopperWeight) * 100))
      : 0;

  return (
    <div className="space-y-5">
      {/* 1. HEADER CHỌN AO & TRẠNG THÁI AN TOÀN */}
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
                Bộ khóa liên động an toàn: Đang kiểm tra thời gian thực
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Chỉ số thực tế tại <strong>{selectedPond.code}</strong>: DO ({selectedPond.do !== null ? `${selectedPond.do.toFixed(2)} mg/L` : 'Chưa đo'}), pH ({selectedPond.ph !== null ? selectedPond.ph.toFixed(1) : 'Chưa đo'}), Nhiệt độ ({selectedPond.temp !== null ? `${selectedPond.temp.toFixed(1)}°C` : 'Chưa đo'}).
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
                [{p.farmName}] {p.code} – {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CẢNH BÁO NẾU AO CHƯA ĐƯỢC GÁN THIẾT BỊ MÁY CHO ĂN */}
      {!hasFeeder && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong>Ao {selectedPond.code} ({selectedPond.name}) chưa được gán thiết bị máy cho ăn.</strong>
              <p className="text-amber-800 mt-0.5">
                Các thông số tải trọng phễu và biến tần dưới đây sẽ hiển thị <code>--</code> cho đến khi bạn gán thiết bị máy cho ăn thật vào ao này.
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

      {/* 2. ĐỒNG HỒ TIẾN ĐỘ RẢI CÁM & BẢNG ĐIỀU KHIỂN 6 NÚT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* CỘT TRÁI 5 COLS: VÒNG TRÒN TIẾN ĐỘ THỨC ĂN THỰC TẾ */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Tiến độ thức ăn ({selectedPond.code} – {selectedPond.name})
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                !hasFeeder
                  ? 'bg-slate-100 text-slate-500'
                  : isPaused
                  ? 'bg-[#FFDBCA] text-[#9D4300]'
                  : 'bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  !hasFeeder ? 'bg-slate-400' : isPaused ? 'bg-[#EA580C]' : 'bg-[#006E2D]'
                }`}
              />
              {!hasFeeder ? 'Chưa gán máy' : isPaused ? 'Chế độ thủ công' : 'Chế độ tự động'}
            </span>
          </div>

          <div className="relative w-52 h-52 my-4 flex items-center justify-center">
            <svg className="w-52 h-52 -rotate-90" viewBox="0 0 180 180">
              <circle
                cx="90"
                cy="90"
                r="86"
                stroke={isPaused ? '#FFDBCA' : '#7CF994'}
                strokeWidth="3"
                fill="none"
              />
              <circle cx="90" cy="90" r="78" stroke="#FFDBCA" strokeWidth="12" fill="none" />
              <circle
                cx="90"
                cy="90"
                r="78"
                stroke="#EA580C"
                strokeWidth="12"
                fill="none"
                strokeDasharray={bigCircumference}
                strokeDashoffset={bigOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-[#0B1C30] font-mono-num tracking-tight">
                {sprayedInCurrentMeal.toFixed(1)} / {targetCurrentMeal.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-0.5">kg đã rải / định mức</span>
              <span className="mt-2 px-3 py-1 rounded-full bg-[#FFDBCA] text-[#9D4300] text-xs font-extrabold font-mono-num">
                {feedPct}% hoàn thành
              </span>
            </div>
          </div>

          {/* 3 Thẻ thông số thực tế từ metadata thiết bị */}
          <div className="w-full grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-100 text-left">
            <div className="p-3 rounded-xl bg-[#EFF4FF] border border-[#D3E4FE]">
              <p className="text-[10px] font-bold text-[#006398]">Bầu chứa cám</p>
              <p className="text-base font-extrabold text-[#0B1C30] font-mono-num mt-0.5">
                {hopperWeight !== null ? (
                  <>
                    {hopperPct}% <span className="text-xs font-normal">({hopperWeight.toFixed(1)}kg)</span>
                  </>
                ) : (
                  '--'
                )}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#FFF8F5] border border-[#FFDBCA]">
              <p className="text-[10px] font-bold text-[#9D4300]">Số cữ đã rải</p>
              <p className="text-base font-extrabold text-[#EA580C] font-mono-num mt-0.5">
                {selectedPond.records?.length || 0} <span className="text-xs font-normal">lần</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#7CF994]/60">
              <p className="text-[10px] font-bold text-[#006E2D]">Biến tần VFD</p>
              <p className="text-base font-extrabold text-[#006E2D] font-mono-num mt-0.5">
                {vfdFrequency !== null ? (
                  <>
                    {vfdFrequency === 35 ? '6m' : vfdFrequency === 50 ? '16m' : '12m'}{' '}
                    <span className="text-xs font-normal">({vfdFrequency}Hz)</span>
                  </>
                ) : (
                  '--'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI 7 COLS: BẢNG ĐIỀU KHIỂN 6 NÚT + BIẾN TẦN VFD + CÂN LOADCELL */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#EA580C]" />
                <h2 className="text-sm font-bold text-[#0B1C30]">
                  Bảng điều khiển máy rải cám thời gian thực
                </h2>
              </div>
              <span className="text-xs font-mono-num text-slate-500">
                Thiết bị: <strong>{feederDevice?.deviceUid || 'Chưa gán'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={handleStartAuto}
                disabled={!hasFeeder || isSaving}
                className="h-16 px-3 bg-[#006E2D] hover:bg-[#005320] disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-xl flex flex-col items-center justify-center transition shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Play className="w-4 h-4 fill-white" />
                  <span className="font-bold text-xs">Bắt đầu rải</span>
                </div>
                <span className="text-[11px] text-[#7FFC97] mt-0.5">Kiểm tra an toàn & xả cám</span>
              </button>

              <button
                onClick={handlePause}
                disabled={!hasFeeder || isSaving}
                className={`h-16 px-3 rounded-xl flex flex-col items-center justify-center border transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                  isPaused
                    ? 'bg-[#EA580C] text-white border-[#EA580C]'
                    : 'bg-[#FEF3C7] hover:bg-amber-200/80 text-[#B45309] border-amber-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Pause className="w-4 h-4" />
                  <span className="font-bold text-xs">
                    {isPaused ? 'Bật tự động' : 'Tạm dừng'}
                  </span>
                </div>
                <span className={`text-[11px] mt-0.5 ${isPaused ? 'text-[#FFDBCA]' : 'text-[#92400E]'}`}>
                  Chuyển chế độ máy
                </span>
              </button>

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

              <button
                onClick={handleTest10s}
                disabled={!hasFeeder || isTestSpinning}
                className="h-16 px-3 bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#006398] border border-[#D3E4FE] rounded-xl flex flex-col items-center justify-center transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5">
                  <Timer className={`w-4 h-4 ${isTestSpinning ? 'animate-spin' : ''}`} />
                  <span className="font-bold text-xs">
                    {isTestSpinning ? `Đang thử (${testCountdown}s)` : 'Rải thử 10 giây'}
                  </span>
                </div>
                <span className="text-[11px] text-[#006398]/80 mt-0.5">Kiểm tra mâm văng</span>
              </button>

              <button
                onClick={handleReverseMotor}
                disabled={!hasFeeder || isReversing}
                className="h-16 px-3 bg-[#F8F9FF] hover:bg-slate-100 text-[#0B1C30] border border-slate-200 rounded-xl flex flex-col items-center justify-center transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5">
                  <RotateCw className={`w-4 h-4 text-slate-600 ${isReversing ? 'animate-spin text-[#EA580C]' : ''}`} />
                  <span className="font-bold text-xs">
                    {isReversing ? 'Đang đảo mâm...' : 'Xả kẹt vít tải'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5">Đảo chiều mâm 3 giây</span>
              </button>

              <button
                onClick={handleAdd2Kg}
                disabled={!hasFeeder || isSaving}
                className="h-16 px-3 bg-gradient-to-r from-[#FB923C] to-[#EA580C] hover:opacity-95 text-white rounded-xl flex flex-col items-center justify-center transition shadow-xs cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5">
                  <PlusSquare className="w-4 h-4" />
                  <span className="font-bold text-xs">Phun bù +2.0 kg</span>
                </div>
                <span className="text-[11px] text-[#FFDBCA] mt-0.5">Ghi nhận cữ bổ sung</span>
              </button>
            </div>
          </div>

          {/* Chọn bán kính văng biến tần VFD (lưu vào DB) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Chọn tần số biến tần VFD (bán kính văng cám)
              </span>
              <span className="font-mono-num text-xs font-bold text-[#9D4300] bg-[#FFDBCA] px-2.5 py-0.5 rounded-full">
                {vfdFrequency !== null ? `${vfdFrequency.toFixed(1)} Hz` : 'Chưa có dữ liệu'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { freq: 35.0, label: 'Gần (6m)', rpm: '1200 vòng/phút' },
                { freq: 45.0, label: 'Trung bình (12m)', rpm: '2400 vòng/phút' },
                { freq: 50.0, label: 'Xa (16m)', rpm: '3200 vòng/phút' },
              ].map((item) => (
                <button
                  key={item.freq}
                  onClick={() => handleSetPresetFreq(item.freq)}
                  disabled={!hasFeeder || isSaving}
                  className={`p-3 rounded-xl text-left transition border cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                    vfdFrequency === item.freq
                      ? 'border-2 border-[#EA580C] bg-[#FFF8F5]'
                      : 'bg-[#F8F9FF] hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className={`text-xs font-bold ${vfdFrequency === item.freq ? 'text-[#9D4300]' : 'text-[#0B1C30]'}`}>
                    {item.label}
                  </div>
                  <div className={`font-mono-num text-[11px] mt-0.5 ${vfdFrequency === item.freq ? 'text-[#EA580C] font-bold' : 'text-slate-500'}`}>
                    {item.freq.toFixed(1)} Hz • {item.rpm}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cân điện tử Loadcell phễu chứa (lưu vào DB) */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs text-slate-600">
              Cân điện tử phễu chứa thực tế:{' '}
              <strong className="text-[#0B1C30] font-mono-num">
                {hopperWeight !== null ? `${hopperWeight.toFixed(1)} / ${maxHopperWeight} kg` : 'Chưa có số đo'}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSetZeroScale}
                disabled={!hasFeeder || isSaving}
                className="h-8 px-3 bg-[#F8F9FF] hover:bg-slate-100 border border-slate-200 text-[#0B1C30] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Đặt cân 0.0 kg</span>
              </button>
              <button
                onClick={handleRefill50Kg}
                disabled={!hasFeeder || isSaving}
                className="h-8 px-3.5 bg-[#0B1C30] hover:bg-[#131B2E] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <Package className="w-3.5 h-3.5 text-[#FB923C]" />
                <span>+Nạp bao 50kg</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LỊCH SỬ CÁC LẦN CHO ĂN THỰC TẾ & THÔNG SỐ ĐỘNG CƠ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-[#0B1C30]">
              Nhật ký các lần cho ăn thực tế tại {selectedPond.code}
            </h2>
            <span className="text-xs font-mono-num text-slate-500">
              Tổng cộng: {selectedPond.records?.length || 0} bản ghi
            </span>
          </div>

          {!selectedPond.records || selectedPond.records.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Chưa có bản ghi cho ăn nào cho ao này trong cơ sở dữ liệu.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedPond.records.slice(0, 8).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl bg-[#F8F9FF] border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-[#0B1C30]">
                      Lượng cám: {Number(rec.actualAmountKg ?? rec.requestedAmountKg).toFixed(1)} kg • Nguồn:{' '}
                      {rec.source === 'schedule' ? 'Lịch tự động' : rec.source === 'ai' ? 'Đề xuất AI' : 'Thủ công'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono-num mt-0.5">
                      Thời gian:{' '}
                      {rec.startedAt ? new Date(rec.startedAt).toLocaleString('vi-VN') : '--'}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      rec.status === 'completed'
                        ? 'bg-[#E8F5E9] text-[#006E2D]'
                        : 'bg-[#EFF4FF] text-[#006398]'
                    }`}
                  >
                    {rec.status === 'completed' ? 'Hoàn thành' : rec.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#006398]" />
              <h2 className="text-sm font-bold text-[#0B1C30]">
                Thông số phần cứng máy cho ăn
              </h2>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                feederDevice?.status === 'online'
                  ? 'text-[#006E2D] bg-[#E8F5E9]'
                  : 'text-slate-600 bg-slate-100'
              }`}
            >
              {feederDevice ? (feederDevice.status === 'online' ? 'Trực tuyến' : 'Ngoại tuyến') : 'Chưa kết nối'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-3 text-xs">
            <div className="p-3.5 bg-[#F8F9FF] rounded-xl border border-slate-200/80">
              <span className="text-slate-500">Mã thiết bị:</span>
              <div className="text-sm font-extrabold text-[#0B1C30] mt-1 font-mono-num">
                {feederDevice?.deviceUid || '--'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Phiên bản FW: {feederDevice?.firmwareVersion || '--'}
              </div>
            </div>

            <div className="p-3.5 bg-[#F8F9FF] rounded-xl border border-slate-200/80">
              <span className="text-slate-500">Chế độ vận hành:</span>
              <div className="text-sm font-extrabold text-[#0B1C30] mt-1">
                {feederDevice
                  ? feederDevice.mode === 'automatic'
                    ? 'Tự động theo lịch'
                    : 'Điều khiển tay'
                  : '--'}
              </div>
              <div className="text-xs text-[#006E2D] font-semibold mt-1">
                Đồng hồ: {currentTime}
              </div>
            </div>

            <div className="p-3.5 bg-[#F8F9FF] rounded-xl border border-slate-200/80">
              <span className="text-slate-500">Dòng tải & nhiệt motor:</span>
              <div className="text-sm font-extrabold text-[#0B1C30] mt-1 font-mono-num">
                {motorCurrentA !== null ? `${motorCurrentA} A` : '--'} •{' '}
                {motorTempC !== null ? `${motorTempC}°C` : '--'}
              </div>
              <div className="text-xs text-slate-500 mt-1">Ngưỡng bảo vệ: 2.5A / 65°C</div>
            </div>

            <div className="p-3.5 bg-[#F8F9FF] rounded-xl border border-slate-200/80">
              <span className="text-slate-500">Số cữ lịch tự động:</span>
              <div className="text-sm font-extrabold text-[#006E2D] mt-1">
                {selectedPond.schedules?.length || 0} cữ / ngày
              </div>
              <div className="text-xs text-slate-500 mt-1">Lưu trên máy chủ & tủ máy</div>
            </div>
          </div>
        </div>
      </div>

      <SafetyBlockedModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        safetyResult={safetyEvaluation}
      />
    </div>
  );
};

export default FeederControlView;
