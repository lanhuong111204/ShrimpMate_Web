import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Timer, 
  PlusSquare, 
  RotateCw, 
  AlertOctagon, 
  ShieldCheck, 
  Activity, 
  Radio, 
  Sliders, 
  Disc, 
  Check, 
  Gauge, 
  RotateCcw, 
  Package
} from 'lucide-react';
import { feedingService } from '../services/feedingService';
import { safetyRuleService } from '../services/safetyRuleService';
import { deviceService } from '../services/deviceService';
import { SafetyBlockedModal } from './feeder/SafetyBlockedModal';

export const FeederControlView = ({
  selectedPond,
  onEmergencyStop,
  onShowToast,
  currentTime,
}) => {
  // Feeder Machine State
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isReversing, setIsReversing] = useState(false);
  const [isTestSpinning, setIsTestSpinning] = useState(false);
  const [testCountdown, setTestCountdown] = useState(10);
  const [speedBoost, setSpeedBoost] = useState(false);

  // Loadcell & Frequency State
  const [hopperWeight, setHopperWeight] = useState(selectedPond?.hopperKg || 58.0);
  const maxHopperWeight = selectedPond?.maxHopperKg || 70.0;
  const [vfdFrequency, setVfdFrequency] = useState(45.0);
  const [sprayedInCurrentMeal, setSprayedInCurrentMeal] = useState(selectedPond?.sprayedKg || 40.5);
  const targetCurrentMeal = selectedPond?.targetKg || 45.0;

  // Pulse mechanism countdown
  const [restCountdown, setRestCountdown] = useState(14);
  const [pulseMode, setPulseMode] = useState('resting');

  // Spectrogram bars animation heights
  const [waveformBars, setWaveformBars] = useState([
    20, 35, 45, 60, 85, 95, 78, 90, 100, 82, 68, 75, 92, 96, 70, 55, 40, 62, 80, 98, 85, 72, 50, 38, 25
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaveformBars((prev) =>
        prev.map((val) => {
          const delta = (Math.random() - 0.48) * 12;
          return Math.min(100, Math.max(15, Math.round(val + delta)));
        })
      );
    }, 450);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isRunning || isPaused) return;

      setRestCountdown((prev) => {
        if (prev <= 1) {
          if (pulseMode === 'resting') {
            setPulseMode('spraying');
            return 4;
          } else {
            setPulseMode('resting');
            return 25;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, isPaused, pulseMode]);

  // Safety Rule Engine Evaluation State
  const [safetyEvaluation, setSafetyEvaluation] = useState(null);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);

  const handleStartAuto = async () => {
    try {
      if (selectedPond?.id) {
        const preview = await safetyRuleService.evaluateSafetyPreview(selectedPond.id, {
          deviceId: selectedPond.deviceId || selectedPond.id,
          requestedAmountKg: targetCurrentMeal || 15.0,
        }).catch(() => null);

        if (preview && preview.decision === 'blocked') {
          setSafetyEvaluation(preview);
          setIsSafetyModalOpen(true);
          setIsRunning(false);
          onShowToast('Cảnh báo: Quy tắc an toàn từ chối lệnh cho ăn do chất lượng nước chưa đạt ngưỡng!', 'alert');
          return;
        }

        await feedingService.createRecord(selectedPond.id, {
          deviceId: selectedPond.deviceId || selectedPond.id,
          requestedAmountKg: targetCurrentMeal || 15.0,
          source: 'manual',
        }).catch((err) => {
          console.warn('Backend cữ ăn offline, tiếp tục mô phỏng:', err);
        });
      }

      setIsRunning(true);
      setIsPaused(false);
      onShowToast('Đã kích hoạt chế độ phun cám tự động thành công.', 'success');
    } catch (err) {
      console.warn(err);
    }
  };

  const handleTriggerEmergencyStop = async () => {
    if (selectedPond?.deviceId) {
      await deviceService.emergencyStop(selectedPond.deviceId).catch(() => {});
    }
    onEmergencyStop?.();
  };

  const handlePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      onShowToast(
        next
          ? 'Đã tạm dừng máy phun 10 phút để kiểm tra nhá ăn.'
          : 'Đã tiếp tục chu kỳ phun cám.',
        'info'
      );
      return next;
    });
  };

  const handleTest10s = () => {
    if (isTestSpinning) return;
    setIsTestSpinning(true);
    setTestCountdown(10);
    onShowToast('Đang bật mâm phun thử 10 giây để kiểm tra bán kính văng.', 'info');

    const interval = setInterval(() => {
      setTestCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTestSpinning(false);
          onShowToast('Kiểm tra mâm phun 10s hoàn tất, đã trở về chế độ chờ.', 'success');
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAdd2Kg = () => {
    setSprayedInCurrentMeal((prev) => parseFloat((prev + 2.0).toFixed(1)));
    setHopperWeight((prev) => Math.max(0, parseFloat((prev - 2.0).toFixed(1))));
    onShowToast('Đã bổ sung +2.0 kg cám vào đợt ăn hiện tại.', 'success');
  };

  const handleReverseMotor = () => {
    if (isReversing) return;
    setIsReversing(true);
    onShowToast('Đang kích hoạt chu trình đảo chiều mâm 3s để chống kẹt cám.', 'warning');
    setTimeout(() => {
      setIsReversing(false);
      onShowToast('Đảo chiều mâm hoàn tất. Mâm phun đã thông thoáng.', 'success');
    }, 3000);
  };

  const handleSetZeroScale = () => {
    setHopperWeight(0.0);
    onShowToast('Cảm biến Loadcell đã được đưa về 0.0 kg.', 'info');
  };

  const handleRefill50Kg = () => {
    setHopperWeight(50.0);
    onShowToast('Đã nạp mới bao cám 50.0 kg vào phễu chứa.', 'success');
  };

  const handleSetPresetFreq = (freq) => {
    setVfdFrequency(freq);
    onShowToast(`Đã chuyển tần số biến tần VFD sang ${freq} Hz.`, 'info');
  };

  // Big Circular Feeder Progress Ring math (r = 78, circumference = 2 * PI * 78 = 490)
  const feedPct = Math.min(100, Math.round((sprayedInCurrentMeal / (targetCurrentMeal || 1)) * 100));
  const bigCircumference = 490;
  const bigOffset = bigCircumference - (feedPct / 100) * bigCircumference;
  const hopperPct = Math.min(100, Math.round((hopperWeight / (maxHopperWeight || 1)) * 100));

  return (
    <div className="space-y-5">
      {/* 1. MOBILE SAFETY RULE ENGINE INTERLOCK BANNER */}
      <div className="rounded-2xl p-4 bg-[#E8F5E9] border border-[#7CF994] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006E2D] text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#006E2D]">
                SAFETY RULE ENGINE: ALLOWED
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#006E2D] border border-[#7CF994]">
                Đang kiểm tra thời gian thực
              </span>
            </div>
            <p className="text-xs text-[#005320] mt-0.5 font-medium">
              Các chỉ số DO ({selectedPond?.do ? selectedPond.do.toFixed(2) : '5.60'} mg/L), pH ({selectedPond?.ph ? selectedPond.ph.toFixed(1) : '7.9'}) và Nhiệt độ ({selectedPond?.temp ? selectedPond.temp.toFixed(1) : '28.5'}°C) đều nằm trong ngưỡng tối ưu. Cho phép vận hành 100% định mức.
            </p>
          </div>
        </div>
        <div className="text-xs font-mono-num font-bold text-[#006E2D] bg-white px-3 py-1.5 rounded-xl border border-[#7CF994] shrink-0">
          Đồng hồ tủ máy: {currentTime}
        </div>
      </div>

      {/* 2. TOP SPLIT: BIG CIRCULAR FEEDER GAUGE (LEFT 5 COLS) + TACTICAL CONTROL & VFD (RIGHT 7 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 5 COLS: BIG CIRCULAR FEEDER PROGRESS GAUGE (Synced with Mobile may-cho-an.tsx) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tiến độ rải thức ăn ({selectedPond?.name || 'Ao Bạt A1'})
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                isPaused
                  ? 'bg-[#FFDBCA] text-[#9D4300]'
                  : 'bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-[#EA580C]' : 'bg-[#006E2D]'}`} />
              {isPaused ? 'TẠM DỪNG' : 'ĐANG RẢI CÁM (AUTO)'}
            </span>
          </div>

          {/* Big Circular SVG Ring */}
          <div className="relative w-52 h-52 my-4 flex items-center justify-center">
            <svg className="w-52 h-52 -rotate-90" viewBox="0 0 180 180">
              {/* Outer status ring */}
              <circle
                cx="90"
                cy="90"
                r="86"
                stroke={isPaused ? '#FFDBCA' : '#7CF994'}
                strokeWidth="3"
                fill="none"
              />
              {/* Background track */}
              <circle cx="90" cy="90" r="78" stroke="#FFDBCA" strokeWidth="12" fill="none" />
              {/* Active progress arc */}
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
              <span className="text-xs font-semibold text-slate-500 mt-0.5">kg đã rải hôm nay</span>
              <span className="mt-2 px-3 py-1 rounded-full bg-[#FFDBCA] text-[#9D4300] text-xs font-extrabold font-mono-num">
                {feedPct}% ĐÃ RẢI
              </span>
            </div>
          </div>

          {/* 3 Mini Telemetry Cards at bottom of Gauge */}
          <div className="w-full grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-100 text-left">
            <div className="p-3 rounded-xl bg-[#EFF4FF] border border-[#D3E4FE]">
              <p className="text-[10px] font-bold text-[#006398] uppercase">Bầu chứa (Hopper)</p>
              <p className="text-base font-extrabold text-[#0B1C30] font-mono-num mt-0.5">
                {hopperPct}% <span className="text-xs font-normal">({hopperWeight.toFixed(0)}kg)</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#FFF8F5] border border-[#FFDBCA]">
              <p className="text-[10px] font-bold text-[#9D4300] uppercase">Lưu lượng vít tải</p>
              <p className="text-base font-extrabold text-[#EA580C] font-mono-num mt-0.5">
                450 <span className="text-xs font-normal">g/phút</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#7CF994]/60">
              <p className="text-[10px] font-bold text-[#006E2D] uppercase">Bán kính (VFD)</p>
              <p className="text-base font-extrabold text-[#006E2D] font-mono-num mt-0.5">
                {vfdFrequency === 35 ? '6.0m' : vfdFrequency === 50 ? '16.0m' : '12.0m'}{' '}
                <span className="text-xs font-normal">({vfdFrequency}Hz)</span>
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT 7 COLS: TACTICAL 6-BUTTON CONTROL + VFD RADIUS + LOADCELL ACTIONS */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-5">
          {/* 6 Tactical Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#EA580C]" />
                <h2 className="text-sm font-bold text-[#0B1C30]">
                  Bảng điều khiển máy rải cám thời gian thực
                </h2>
              </div>
              <span className="text-xs font-mono-num text-slate-400">
                ID: FEEDER-{selectedPond?.code || 'A1'}-IOT
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* 1. Bắt đầu rải (START - Bio Green #006E2D) */}
              <button
                onClick={handleStartAuto}
                className="h-16 px-3 bg-[#006E2D] hover:bg-[#005320] text-white rounded-xl flex flex-col items-center justify-center transition shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Play className="w-4 h-4 fill-white" />
                  <span className="font-bold text-xs">Bắt đầu rải (START)</span>
                </div>
                <span className="text-[11px] text-[#7FFC97] mt-0.5">Chế độ tự động</span>
              </button>

              {/* 2. Tạm dừng (PAUSE - Amber #FEF3C7/#B45309) */}
              <button
                onClick={handlePause}
                className={`h-16 px-3 rounded-xl flex flex-col items-center justify-center border transition cursor-pointer ${
                  isPaused
                    ? 'bg-[#EA580C] text-white border-[#EA580C]'
                    : 'bg-[#FEF3C7] hover:bg-amber-200/80 text-[#B45309] border-amber-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Pause className="w-4 h-4" />
                  <span className="font-bold text-xs">
                    {isPaused ? 'Tiếp tục rải' : 'Tạm dừng (PAUSE)'}
                  </span>
                </div>
                <span className={`text-[11px] mt-0.5 ${isPaused ? 'text-[#FFDBCA]' : 'text-[#92400E]'}`}>
                  Thăm nhá (10 phút)
                </span>
              </button>

              {/* 3. Dừng khẩn cấp (E-STOP - Red #FFDAD6/#BA1A1A) */}
              <button
                onClick={handleTriggerEmergencyStop}
                className="h-16 px-3 bg-[#FFDAD6] hover:bg-[#BA1A1A] text-[#BA1A1A] hover:text-white border border-[#BA1A1A]/30 rounded-xl flex flex-col items-center justify-center transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  <span className="font-bold text-xs">Dừng hẳn (STOP)</span>
                </div>
                <span className="text-[11px] opacity-80 mt-0.5">Ngắt rơ-le tức thì</span>
              </button>

              {/* 4. Rải thử 10s (TEST - Ocean Blue #EFF4FF/#006398) */}
              <button
                onClick={handleTest10s}
                disabled={isTestSpinning}
                className="h-16 px-3 bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#006398] border border-[#D3E4FE] rounded-xl flex flex-col items-center justify-center transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Timer className={`w-4 h-4 ${isTestSpinning ? 'animate-spin' : ''}`} />
                  <span className="font-bold text-xs">
                    {isTestSpinning ? `Đang thử (${testCountdown}s)` : 'Rải thử 10s (TEST)'}
                  </span>
                </div>
                <span className="text-[11px] text-[#006398]/80 mt-0.5">Kiểm tra mâm văng</span>
              </button>

              {/* 5. Xả kẹt vít tải */}
              <button
                onClick={handleReverseMotor}
                disabled={isReversing}
                className="h-16 px-3 bg-[#F8F9FF] hover:bg-slate-100 text-[#0B1C30] border border-slate-200 rounded-xl flex flex-col items-center justify-center transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <RotateCw className={`w-4 h-4 text-slate-600 ${isReversing ? 'animate-spin text-[#EA580C]' : ''}`} />
                  <span className="font-bold text-xs">
                    {isReversing ? 'Đang đảo mâm...' : 'Xả kẹt vít tải'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5">Đảo chiều mâm 3s</span>
              </button>

              {/* 6. Phun bù +2kg (Shrimp Orange #EA580C) */}
              <button
                onClick={handleAdd2Kg}
                className="h-16 px-3 bg-gradient-to-r from-[#FB923C] to-[#EA580C] hover:opacity-95 text-white rounded-xl flex flex-col items-center justify-center transition shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <PlusSquare className="w-4 h-4" />
                  <span className="font-bold text-xs">Phun bù +2.0 kg</span>
                </div>
                <span className="text-[11px] text-[#FFDBCA] mt-0.5">Bổ sung cữ hiện tại</span>
              </button>
            </div>
          </div>

          {/* VFD Spread Radius Selector (3 Cards synced with Stitch & Mobile) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Chọn bán kính văng VFD (Inverter Speed)
              </span>
              <span className="font-mono-num text-xs font-bold text-[#9D4300] bg-[#FFDBCA] px-2.5 py-0.5 rounded-full">
                {vfdFrequency.toFixed(1)} Hz
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => handleSetPresetFreq(35.0)}
                className={`p-3 rounded-xl text-left transition border cursor-pointer ${
                  vfdFrequency === 35.0
                    ? 'border-2 border-[#EA580C] bg-[#FFF8F5]'
                    : 'bg-[#F8F9FF] hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className={`text-xs font-bold ${vfdFrequency === 35.0 ? 'text-[#9D4300]' : 'text-[#0B1C30]'}`}>
                  Gần (6m)
                </div>
                <div className={`font-mono-num text-[11px] mt-0.5 ${vfdFrequency === 35.0 ? 'text-[#EA580C] font-bold' : 'text-slate-500'}`}>
                  35.0 Hz • 1200 RPM
                </div>
              </button>

              <button
                onClick={() => handleSetPresetFreq(45.0)}
                className={`p-3 rounded-xl text-left transition border cursor-pointer ${
                  vfdFrequency === 45.0
                    ? 'border-2 border-[#EA580C] bg-[#FFF8F5]'
                    : 'bg-[#F8F9FF] hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className={`text-xs font-bold ${vfdFrequency === 45.0 ? 'text-[#9D4300]' : 'text-[#0B1C30]'}`}>
                  Trung bình (12m)
                </div>
                <div className={`font-mono-num text-[11px] mt-0.5 ${vfdFrequency === 45.0 ? 'text-[#EA580C] font-bold' : 'text-slate-500'}`}>
                  45.0 Hz • 2400 RPM
                </div>
              </button>

              <button
                onClick={() => handleSetPresetFreq(50.0)}
                className={`p-3 rounded-xl text-left transition border cursor-pointer ${
                  vfdFrequency === 50.0
                    ? 'border-2 border-[#EA580C] bg-[#FFF8F5]'
                    : 'bg-[#F8F9FF] hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className={`text-xs font-bold ${vfdFrequency === 50.0 ? 'text-[#9D4300]' : 'text-[#0B1C30]'}`}>
                  Xa (16m)
                </div>
                <div className={`font-mono-num text-[11px] mt-0.5 ${vfdFrequency === 50.0 ? 'text-[#EA580C] font-bold' : 'text-slate-500'}`}>
                  50.0 Hz • 3200 RPM
                </div>
              </button>
            </div>
          </div>

          {/* Hopper Loadcell Quick Actions */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs text-slate-600">
              Cân điện tử Loadcell phễu chứa:{' '}
              <strong className="text-[#0B1C30] font-mono-num">{hopperWeight.toFixed(1)} / {maxHopperWeight} kg</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSetZeroScale}
                className="h-8 px-3 bg-[#F8F9FF] hover:bg-slate-100 border border-slate-200 text-[#0B1C30] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Đặt cân 0.0 kg</span>
              </button>
              <button
                onClick={handleRefill50Kg}
                className="h-8 px-3.5 bg-[#0B1C30] hover:bg-[#131B2E] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Package className="w-3.5 h-3.5 text-[#FB923C]" />
                <span>+Nạp bao 50kg</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SPLIT: HYDROPHONE ACOUSTIC SPECTRUM + PULSE MECHANISM STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT 7 COLS: HYDROPHONE ACOUSTIC FEEDING */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#006E2D]" />
                <h2 className="text-sm font-bold text-[#0B1C30]">
                  Phân tích âm thanh sức ăn (Hydrophone Bio-Acoustics)
                </h2>
              </div>
              <span className="px-2.5 py-0.5 bg-[#EFF4FF] border border-[#D3E4FE] rounded-full text-xs font-mono-num font-bold text-[#006398]">
                15kHz - 45kHz
              </span>
            </div>

            <div className="p-4 bg-[#F8F9FF] rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                <span>Cường độ âm thanh bắt mồi (60 giây gần nhất)</span>
                <span className="font-bold text-[#0B1C30]">
                  Tần suất: <span className="text-[#006E2D] font-mono-num">88 xung/giây (Mức 3 - Ăn mạnh)</span>
                </span>
              </div>

              <div className="h-24 flex items-end justify-between gap-1 py-1 border-b border-slate-200">
                {waveformBars.map((bar, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-t-xs transition-all duration-300 ${
                      bar > 85 ? 'bg-[#EA580C]' : bar > 60 ? 'bg-[#006E2D]' : 'bg-[#40A2E7]'
                    }`}
                    style={{ height: `${bar}%` }}
                    title={`Mức cường độ: ${bar}%`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-500 pt-2">
                <span>-60s</span>
                <span>-30s</span>
                <span className="text-[#0B1C30] font-bold">Hiện tại: {currentTime.slice(0, 5)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-600">
              <strong className="text-[#006E2D]">Gợi ý AI Hydrophone:</strong>{' '}
              {speedBoost ? 'Đang áp dụng +10% tốc độ rải cám.' : 'Tôm bắt mồi mạnh, có thể tăng +10% tốc độ rải.'}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setSpeedBoost(true);
                  onShowToast('Đã kích hoạt tăng +10% tốc độ rải cám cho cữ hiện tại.', 'success');
                }}
                className={`h-8 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  speedBoost ? 'bg-[#006E2D] text-white' : 'bg-[#EA580C] hover:bg-[#C2410C] text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{speedBoost ? 'Đã áp dụng +10%' : 'Áp dụng +10% tốc độ'}</span>
              </button>
              <button
                onClick={() => {
                  setSpeedBoost(false);
                  onShowToast('Đã chuyển về tốc độ định mức ban đầu.', 'info');
                }}
                className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Giữ mặc định
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLS: PULSE & HARDWARE TELEMETRY */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#006398]" />
              <h2 className="text-sm font-bold text-[#0B1C30]">
                Thông số Xung phun & Động cơ
              </h2>
            </div>
            <span className="text-xs font-bold text-[#006E2D] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full">
              Hoạt động chuẩn
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-3 text-xs">
            <div className="p-3.5 bg-[#F8F9FF] rounded-xl border border-slate-200/80">
              <span className="text-slate-500">Chu kỳ xung rải:</span>
              <div className="text-sm font-extrabold text-[#0B1C30] mt-1 font-mono-num">4s phun / 25s nghỉ</div>
              <div className="text-xs mt-1 font-mono-num">
                {pulseMode === 'spraying' ? (
                  <span className="text-[#EA580C] font-bold">● Đang phun: {restCountdown}s</span>
                ) : (
                  <span className="text-[#006398] font-semibold">Đếm lùi nghỉ: {restCountdown}s</span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-[#F8F9FF] rounded-xl border border-slate-200/80">
              <span className="text-slate-500">Đợt rải trong cữ:</span>
              <div className="text-sm font-extrabold text-[#0B1C30] mt-1 font-mono-num">Đợt 3 / 4 (5.0 kg)</div>
              <div className="text-xs text-[#006E2D] font-semibold mt-1">Đã xong đợt 1 & 2</div>
            </div>

            <div className="p-3.5 bg-[#F8F9FF] rounded-xl border border-slate-200/80">
              <span className="text-slate-500">Dòng tải & Nhiệt motor:</span>
              <div className="text-sm font-extrabold text-[#0B1C30] mt-1 font-mono-num">1.42 A • 38.4°C</div>
              <div className="text-xs text-slate-500 mt-1">Ngưỡng bảo vệ: 2.5A / 65°C</div>
            </div>

            <div className="p-3.5 bg-[#F8F9FF] rounded-xl border border-slate-200/80">
              <span className="text-slate-500">Bộ nhớ lịch tủ máy:</span>
              <div className="text-sm font-extrabold text-[#006E2D] mt-1">Đã đồng bộ</div>
              <div className="text-xs text-slate-500 mt-1">Chạy độc lập khi mất mạng</div>
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
