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
  Zap, 
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
  const [hopperWeight, setHopperWeight] = useState(selectedPond?.hopperKg || 35.0);
  const maxHopperWeight = selectedPond?.maxHopperKg || 50.0;
  const [vfdFrequency, setVfdFrequency] = useState(45.0);
  const [sprayedInCurrentMeal, setSprayedInCurrentMeal] = useState(selectedPond?.sprayedKg || 16.0);
  const targetCurrentMeal = selectedPond?.targetKg || 22.0;

  // Pulse mechanism countdown
  const [restCountdown, setRestCountdown] = useState(14);
  const [pulseMode, setPulseMode] = useState('resting');

  // Spectrogram bars animation heights
  const [waveformBars, setWaveformBars] = useState([
    20, 35, 45, 60, 85, 95, 78, 90, 100, 82, 68, 75, 92, 96, 70, 55, 40, 62, 80, 98, 85, 72, 50, 38, 25
  ]);

  // Periodic subtle fluctuation to simulate live hydrophone acoustic clicks
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

  // Periodic pulse countdown simulation
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isRunning || isPaused) return;

      setRestCountdown((prev) => {
        if (prev <= 1) {
          if (pulseMode === 'resting') {
            setPulseMode('spraying');
            return 4; // 4s spraying
          } else {
            setPulseMode('resting');
            return 25; // 25s resting
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
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Tactical Button Handlers
  const handleStartAuto = async () => {
    setIsEvaluating(true);
    try {
      if (selectedPond?.id) {
        // 1. Kiểm tra an toàn trước khi xả cám qua Safety Rule Engine
        const preview = await safetyRuleService.evaluateSafetyPreview(selectedPond.id, {
          deviceId: selectedPond.deviceId || selectedPond.id,
          requestedAmountKg: targetCurrentMeal || 15.0,
        }).catch(() => null);

        if (preview && preview.decision === 'blocked') {
          setSafetyEvaluation(preview);
          setIsSafetyModalOpen(true);
          setIsRunning(false);
          onShowToast('CẢNH BÁO: Safety Rule Engine TỪ CHỐI lệnh cho ăn vì chất lượng nước!', 'alert');
          return;
        }

        // 2. Kích hoạt cữ ăn thực tế lên máy chủ
        await feedingService.createRecord(selectedPond.id, {
          deviceId: selectedPond.deviceId || selectedPond.id,
          requestedAmountKg: targetCurrentMeal || 15.0,
          source: 'manual',
        }).catch((err) => {
          console.warn('Backend cữ ăn offline, tiếp tục mô phỏng SCADA:', err);
        });
      }

      setIsRunning(true);
      setIsPaused(false);
      onShowToast('SCADA: ĐÃ KÍCH HOẠT CHẾ ĐỘ PHUN CÁM QUA SAFETY ENGINE THÀNH CÔNG.', 'success');
    } finally {
      setIsEvaluating(false);
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
          ? 'SCADA: TẠM DỪNG MÁY PHUN 10 PHÚT ĐỂ KÉO NHÁ KIỂM TRA SỨC ĂN.'
          : 'SCADA: ĐÃ TIẾP TỤC CHU KỲ PHUN CÁM.',
        'info'
      );
      return next;
    });
  };

  const handleTest10s = () => {
    if (isTestSpinning) return;
    setIsTestSpinning(true);
    setTestCountdown(10);
    onShowToast('SCADA: ĐANG BẬT MÂM PHUN THỬ 10 GIÂY ĐỂ KIỂM TRA BÁN KÍNH VĂNG.', 'info');

    const interval = setInterval(() => {
      setTestCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTestSpinning(false);
          onShowToast('SCADA: KIỂM TRA MÂM PHUN 10S HOÀN TẤT, ĐÃ TRỞ VỀ CHẾ ĐỘ CHỜ.', 'success');
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAdd2Kg = () => {
    setSprayedInCurrentMeal((prev) => parseFloat((prev + 2.0).toFixed(1)));
    setHopperWeight((prev) => Math.max(0, parseFloat((prev - 2.0).toFixed(1))));
    onShowToast('SCADA: ĐÃ CỘNG DỒN +2.0 KG CÁM VÀO ĐỢT ĂN HIỆN TẠI THEO ĐỀ NGHỊ CỦA AI.', 'success');
  };

  const handleReverseMotor = () => {
    if (isReversing) return;
    setIsReversing(true);
    onShowToast('SCADA: ĐANG KÍCH HOẠT CHU TRÌNH ĐẢO CHIỀU MÂM 3s ĐỂ THÔNG KẸT CÁM.', 'warning');
    setTimeout(() => {
      setIsReversing(false);
      onShowToast('SCADA: ĐẢO CHIỀU MÂM HOÀN TẤT. MÂM PHUN ĐÃ THÔNG THOÁNG.', 'success');
    }, 3000);
  };

  const handleSetZeroScale = () => {
    setHopperWeight(0.0);
    onShowToast('Cảm biến Loadcell đã được căn chỉnh về Zero (0.00 kg).', 'info');
  };

  const handleRefill50Kg = () => {
    setHopperWeight(50.0);
    onShowToast('Đã nạp mới bao cám 50.0 kg vào phễu chứa!', 'success');
  };

  const handleSetPresetFreq = (freq) => {
    setVfdFrequency(freq);
    onShowToast(`Đã chuyển tần số biến tần VFD sang ${freq} Hz.`, 'info');
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* 1. HEADER & BREADCRUMB CARD */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs font-mono-num text-slate-400 flex-wrap">
              <span>HỆ THỐNG AO NUÔI</span>
              <span>/</span>
              <span className="text-slate-700 font-medium">{selectedPond?.name || 'AO SỐ 02'}</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold">
                MÁY CHO ĂN BỜ AO ({selectedPond?.code || 'AO-02'})
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display uppercase">
                BẢNG ĐIỀU KHIỂN & GIÁM SÁT MÁY CHO ĂN THỰC ĐỊA
              </h1>
              <span className="px-2.5 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600 font-mono-num text-[11px] font-medium">
                IP66 / BIẾN TẦN VFD
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono-num text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                TỰ ĐỘNG THEO LỊCH
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-mono-num text-xs">
            <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
              <span className="text-slate-400">RTC:</span>
              <span className="font-semibold text-slate-800">{currentTime} (ĐỒNG BỘ)</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
              <span className="text-slate-400">LORA WAN:</span>
              <span className="font-semibold text-emerald-700">-72 dBm [RẤT TỐT]</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
              <span className="text-slate-400">CHU KỲ CỮ 2:</span>
              <span className="font-semibold text-slate-800">10:30 - 11:30</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CỤM PHÍM THAO TÁC NGOẠI VI THỰC ĐỊA (TACTILE FIELD CONTROLS) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold tracking-wider uppercase text-slate-700 font-display">
              CỤM PHÍM THAO TÁC NGOẠI VI THỰC ĐỊA (TACTILE FIELD CONTROLS)
            </span>
          </div>
          <span className="font-mono-num text-[11px] text-slate-400">
            ĐỘ TRỄ: &lt;50ms • KHÓA CHÉO ĐIỆN TỬ
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Phím Chạy Phun */}
          <button
            onClick={handleStartAuto}
            className="h-16 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl flex flex-col items-center justify-center transition-all shadow-sm shadow-emerald-600/20 group cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Play className="w-4 h-4 group-hover:scale-110 transition-transform fill-white" />
              <span className="font-bold text-sm tracking-wide">BẮT ĐẦU CHẠY</span>
            </div>
            <span className="font-mono-num text-[10px] text-emerald-100 tracking-wider uppercase mt-0.5">
              RUN AUTO FEEDER
            </span>
          </button>

          {/* Phím Tạm Dừng Thăm Nhá */}
          <button
            onClick={handlePause}
            className={`h-16 px-3 rounded-xl flex flex-col items-center justify-center border transition-all group cursor-pointer ${
              isPaused
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Pause className={`w-4 h-4 ${isPaused ? 'text-white' : 'text-slate-500'}`} />
              <span className="font-semibold text-sm">{isPaused ? 'TIẾP TỤC' : 'TẠM DỪNG'}</span>
            </div>
            <span
              className={`font-mono-num text-[10px] uppercase mt-0.5 ${
                isPaused ? 'text-amber-100' : 'text-slate-500'
              }`}
            >
              THĂM NHÁ (10 PHÚT)
            </span>
          </button>

          {/* Phím Phun Thử 10s */}
          <button
            onClick={handleTest10s}
            disabled={isTestSpinning}
            className={`h-16 px-3 rounded-xl flex flex-col items-center justify-center border transition-all group cursor-pointer ${
              isTestSpinning
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Timer className={`w-4 h-4 ${isTestSpinning ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span className="font-semibold text-sm">
                {isTestSpinning ? `THỬ (${testCountdown}s)` : 'PHUN THỬ 10s'}
              </span>
            </div>
            <span className="font-mono-num text-[10px] text-slate-500 uppercase mt-0.5">
              TEST MÂM PHUN
            </span>
          </button>

          {/* Phím Phun Bù +2kg */}
          <button
            onClick={handleAdd2Kg}
            className="h-16 px-3 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-800 rounded-xl flex flex-col items-center justify-center border border-slate-200 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <PlusSquare className="w-4 h-4 text-slate-500 group-hover:text-slate-900 transition-colors" />
              <span className="font-semibold text-sm">PHUN BÙ +2KG</span>
            </div>
            <span className="font-mono-num text-[10px] text-slate-500 uppercase mt-0.5">
              BỔ SUNG CỮ ĂN
            </span>
          </button>

          {/* Phím Đảo Chiều Mâm */}
          <button
            onClick={handleReverseMotor}
            disabled={isReversing}
            className={`h-16 px-3 rounded-xl flex flex-col items-center justify-center border transition-all group cursor-pointer ${
              isReversing
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <RotateCw className={`w-4 h-4 ${isReversing ? 'animate-spin text-amber-700' : 'text-slate-500'}`} />
              <span className="font-semibold text-sm">{isReversing ? 'ĐANG ĐẢO...' : 'ĐẢO CHIỀU MÂM'}</span>
            </div>
            <span className="font-mono-num text-[10px] text-slate-500 uppercase mt-0.5">
              CHỐNG KẸT CÁM
            </span>
          </button>

          {/* Nút Đỏ Dừng Khẩn Cấp */}
          <button
            onClick={handleTriggerEmergencyStop}
            className="h-16 px-3 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-xl flex flex-col items-center justify-center transition-all shadow-sm shadow-red-600/20 group cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm tracking-wide">DỪNG KHẨN CẤP</span>
            </div>
            <span className="font-mono-num text-[10px] text-red-100 tracking-wider uppercase mt-0.5 font-medium">
              NGẮT RƠ-LE TỨC THÌ
            </span>
          </button>
        </div>
      </div>

      {/* 3. KHÓA LIÊN ĐỘNG AN TOÀN MÔI TRƯỜNG NƯỚC (IOT INTERLOCK SAFETY SYSTEM) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
              KHÓA LIÊN ĐỘNG AN TOÀN MÔI TRƯỜNG NƯỚC (IOT INTERLOCK SAFETY SYSTEM)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-num text-xs text-slate-400">TRẠNG THÁI VAN AN TOÀN:</span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-mono-num text-xs font-bold uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              CHO PHÉP RẢI (UNLOCKED)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          {/* DO Box */}
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>OXY HÒA TAN (DO)</span>
              <span className="font-mono-num text-[10px] text-slate-400">QUANG HỌC LDO</span>
            </div>
            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl font-bold font-mono-num tracking-tight text-slate-900">
                {selectedPond?.do ? selectedPond.do.toFixed(2) : '5.50'}
              </span>
              <span className="font-mono-num text-xs text-slate-500 font-semibold">mg/L</span>
            </div>
            <div className="font-mono-num text-[11px] text-slate-500 border-t border-slate-200/60 pt-2 flex items-center justify-between">
              <span>Ngưỡng ngắt khóa:</span>
              <span className="font-semibold text-slate-700">&lt; 3.5 mg/L</span>
            </div>
          </div>

          {/* Nhiệt độ nước */}
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>NHIỆT ĐỘ NƯỚC AO</span>
              <span className="font-mono-num text-[10px] text-slate-400">PT100 CHỐNG ĂN MÒN</span>
            </div>
            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl font-bold font-mono-num tracking-tight text-slate-900">
                {selectedPond?.temp ? selectedPond.temp.toFixed(1) : '29.8'}
              </span>
              <span className="font-mono-num text-xs text-slate-500 font-semibold">°C</span>
            </div>
            <div className="font-mono-num text-[11px] text-slate-500 border-t border-slate-200/60 pt-2 flex items-center justify-between">
              <span>Biên độ phù hợp:</span>
              <span className="font-semibold text-slate-700">28.0 - 31.5°C</span>
            </div>
          </div>

          {/* Độ pH */}
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>ĐỘ KIỀM & PH NƯỚC</span>
              <span className="font-mono-num text-[10px] text-slate-400">ĐIỆN CỰC THỦY TINH</span>
            </div>
            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl font-bold font-mono-num tracking-tight text-slate-900">
                {selectedPond?.ph ? selectedPond.ph.toFixed(2) : '7.82'}
              </span>
              <span className="font-mono-num text-xs text-slate-500 font-semibold">pH</span>
            </div>
            <div className="font-mono-num text-[11px] text-slate-500 border-t border-slate-200/60 pt-2 flex items-center justify-between">
              <span>Dải chuẩn tôm sú/thẻ:</span>
              <span className="font-semibold text-slate-700">7.5 - 8.3 pH</span>
            </div>
          </div>

          {/* Cơ Chế Tự Động Khóa Máy */}
          <div className="p-3.5 bg-slate-100/70 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span>CƠ CHẾ TỰ ĐỘNG KHÓA MÁY</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed my-2">
              Nếu DO &lt; 3.5 mg/L hoặc pH &lt; 7.2: Ngắt cấp nguồn motor rung phễu ngay lập tức. Bảo vệ tôm không bị
              sình bụng, tránh thối bùn đáy ao.
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono-num text-slate-500 border-t border-slate-200 pt-1.5">
              <span>Interlock logic: HARDWARE</span>
              <span className="font-semibold text-slate-700">SCADA AUTO ARM</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ROW: AI HYDROPHONE + THÔNG SỐ MÁY ĂN & LOADCELL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* BỘ PHÂN TÍCH ÂM THANH SỨC ĂN BẰNG AI (Col 6/12) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
                  BỘ PHÂN TÍCH ÂM THANH SỨC ĂN AI (HYDROPHONE FEED)
                </span>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono-num font-medium text-slate-600">
                ACOUSTIC #02
              </span>
            </div>

            {/* Spectrogram Waveform Minimalist */}
            <div className="mt-3 p-3.5 bg-slate-900 rounded-xl text-slate-200">
              <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-400 mb-2">
                <span>TẦN SỐ BÚNG MỒI (15kHz - 45kHz)</span>
                <span className="text-white font-semibold">
                  TỶ LỆ CẮN MỒI: <span className="text-emerald-400 font-mono-num">88 XUNG/S</span>
                </span>
              </div>

              {/* Waveform Bars */}
              <div className="h-28 flex items-end justify-between gap-[3px] py-1 border-b border-slate-800">
                {waveformBars.map((bar, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      bar > 85 ? 'bg-white' : bar > 60 ? 'bg-slate-300' : 'bg-slate-500'
                    }`}
                    style={{ height: `${bar}%` }}
                    title={`Bin #${i + 1}: ${bar}% intensity`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono-num text-slate-400 pt-2">
                <span>-60 Giây (Bắt đầu cữ)</span>
                <span>-30 Giây</span>
                <span className="text-slate-200 font-medium">Hiện Tại: {currentTime.slice(0, 5)} (Đang vào luồng ăn)</span>
              </div>
            </div>

            {/* AI Recommendation Banner */}
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Zap className="w-4 h-4 text-slate-600" />
                  <span>KHUYẾN NGHỊ AI REAL-TIME:</span>
                </div>
                <span className="font-mono-num text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded uppercase">
                  Model: ShrimpAcoustics v4
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">
                  "{speedBoost ? 'Đang áp dụng +10% tốc độ rải' : 'Tôm ăn rất mạnh (+10% tốc độ rải)'}"
                </strong>{' '}
                - Mật độ âm thanh búng mồi quanh phao đạt 92/100 điểm. Chưa xuất hiện thức ăn thừa rơi lắng đáy.
              </p>
            </div>
          </div>

          {/* Thao tác AI */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => {
                setSpeedBoost(true);
                onShowToast('Đã kích hoạt tăng +10% tốc độ rải cám cho cữ hiện tại.', 'success');
              }}
              className={`h-9 active:scale-[0.98] rounded-lg font-mono-num text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                speedBoost ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{speedBoost ? 'ĐÃ ÁP DỤNG +10%' : 'ÁP DỤNG +10% TỐC ĐỘ'}</span>
            </button>

            <button
              onClick={() => {
                setSpeedBoost(false);
                onShowToast('Đã chuyển về tốc độ định mức ban đầu.', 'info');
              }}
              className="h-9 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 border border-slate-200 rounded-lg font-mono-num text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>GIỮ TỐC ĐỘ ĐỊNH MỨC</span>
            </button>
          </div>
        </div>

        {/* THÔNG SỐ MÁY ĂN & PHỄU LOADCELL (Col 6/12) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
                  THÔNG SỐ MÁY ĂN & PHỄU LOADCELL THỰC TẾ
                </span>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono-num font-medium text-slate-600">
                LOADCELL KELI 4 CHÂN
              </span>
            </div>

            {/* Trọng lượng cám trong phễu & Dòng tải */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                <span className="font-mono-num text-xs text-slate-500 font-semibold uppercase">
                  TRỌNG LƯỢNG CÁM TRONG PHỄU
                </span>
                <div className="my-2">
                  <div className="flex items-baseline gap-1 font-mono-num">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {hopperWeight.toFixed(1)}
                    </span>
                    <span className="text-lg text-slate-400 font-medium">/ {maxHopperWeight} kg</span>
                  </div>
                  <div className="text-[11px] font-mono-num text-slate-500 mt-1">
                    Dung lượng phễu còn: {((hopperWeight / maxHopperWeight) * 100).toFixed(1)}%
                  </div>
                </div>
                {/* Thanh mức */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-slate-900 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(hopperWeight / maxHopperWeight) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                <span className="font-mono-num text-xs text-slate-500 font-semibold uppercase">
                  DÒNG TẢI & CẢM BIẾN CHỐNG KẸT
                </span>
                <div className="my-2">
                  <div className="flex items-baseline gap-1 font-mono-num">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">1.42</span>
                    <span className="text-lg text-slate-400 font-medium">Ampe (A)</span>
                  </div>
                  <div className="text-[11px] font-mono-num text-slate-500 mt-1">
                    Định mức cho phép: &lt; 2.50 A
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono-num border-t border-slate-200/60 pt-1.5">
                  <span className="text-slate-500">Mâm quay:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    THÔNG THOÁNG
                  </span>
                </div>
              </div>
            </div>

            {/* BÁN KÍNH VĂNG CÁM (3 nấc) điều chỉnh tần số biến tần */}
            <div className="mt-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Radio className="w-4 h-4 text-slate-600" />
                  <span>BÁN KÍNH VĂNG CÁM (TẦN SỐ BIẾN TẦN VFD)</span>
                </div>
                <span className="font-mono-num text-xs font-bold text-slate-800 bg-slate-200/70 px-2 py-0.5 rounded">
                  HIỆN TẠI: {vfdFrequency.toFixed(1)} Hz
                </span>
              </div>

              {/* 3 Nấc Điều Chỉnh Nút */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSetPresetFreq(35.0)}
                  className={`p-2.5 rounded-lg text-left transition-colors border cursor-pointer ${
                    vfdFrequency === 35.0
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="font-mono-num text-xs font-semibold">GẦN (3 - 4M)</div>
                  <div className={`font-mono-num text-[11px] ${vfdFrequency === 35.0 ? 'text-slate-300' : 'text-slate-400'}`}>
                    35.0 Hz
                  </div>
                </button>

                <button
                  onClick={() => handleSetPresetFreq(45.0)}
                  className={`p-2.5 rounded-lg text-left transition-colors border cursor-pointer ${
                    vfdFrequency === 45.0
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="font-mono-num text-xs font-bold">VỪA (6M) {vfdFrequency === 45.0 && '[CHỌN]'}</div>
                  <div className={`font-mono-num text-[11px] ${vfdFrequency === 45.0 ? 'text-slate-300' : 'text-slate-400'}`}>
                    45.0 Hz
                  </div>
                </button>

                <button
                  onClick={() => handleSetPresetFreq(50.0)}
                  className={`p-2.5 rounded-lg text-left transition-colors border cursor-pointer ${
                    vfdFrequency === 50.0
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="font-mono-num text-xs font-semibold">XA (9 - 10M)</div>
                  <div className={`font-mono-num text-[11px] ${vfdFrequency === 50.0 ? 'text-slate-300' : 'text-slate-400'}`}>
                    50.0 Hz
                  </div>
                </button>
              </div>

              {/* Thanh gạt tinh chỉnh Hz */}
              <div className="flex items-center gap-3 pt-1">
                <span className="font-mono-num text-xs text-slate-400">30Hz</span>
                <input
                  type="range"
                  min="30"
                  max="50"
                  step="0.5"
                  value={vfdFrequency}
                  onChange={(e) => setVfdFrequency(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
                <span className="font-mono-num text-xs text-slate-400">50Hz</span>
              </div>
            </div>
          </div>

          {/* Thao tác loadcell */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleSetZeroScale}
              className="h-9 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200 text-slate-700 rounded-lg font-mono-num text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>SET ZERO CÂN (VỀ 0.0)</span>
            </button>

            <button
              onClick={handleRefill50Kg}
              className="h-9 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-lg font-mono-num text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>NẠP MỚI BAO CÁM 50KG</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. TIẾN ĐỘ CỮ ĂN HIỆN TẠI & THỐNG KÊ XUNG NHỊP */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
              TIẾN ĐỘ CỮ ĂN SỐ 2 (10:30 - 11:30) & XUNG NHỊP PHUN
            </span>
          </div>
          <div className="font-mono-num text-xs text-slate-500">
            ĐÃ XẢ:{' '}
            <strong className="text-slate-900 font-bold">
              {sprayedInCurrentMeal.toFixed(1)} / {targetCurrentMeal.toFixed(1)} kg
            </strong>{' '}
            ({((sprayedInCurrentMeal / targetCurrentMeal) * 100).toFixed(1)}%) • CÒN LẠI:{' '}
            <strong className="text-slate-900 font-bold">
              {Math.max(0, targetCurrentMeal - sprayedInCurrentMeal).toFixed(1)} kg
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 font-mono-num text-xs">
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 text-[11px] uppercase">CƠ CHẾ XUNG NHỊP:</span>
            <div className="text-sm font-bold text-slate-900 mt-1">4s PHUN / 25s NGHỈ</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {pulseMode === 'spraying' ? (
                <span className="text-emerald-600 font-semibold">● Đang phun: {restCountdown}s</span>
              ) : (
                <span>Đếm lùi nghỉ: {restCountdown} giây</span>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 text-[11px] uppercase">ĐỢT RẢI HIỆN TẠI:</span>
            <div className="text-sm font-bold text-slate-900 mt-1">ĐỢT 3 / 4 (5.0 KG)</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Đã xong Đợt 1 & Đợt 2</div>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 text-[11px] uppercase">NHIỆT HỘP SỐ MOTOR:</span>
            <div className="text-sm font-bold text-slate-900 mt-1">38.4 °C (BÌNH THƯỜNG)</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Ngưỡng quá nhiệt: 65°C</div>
          </div>

          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 text-[11px] uppercase">CHẾ ĐỘ OFFLINE EEPROM:</span>
            <div className="text-sm font-bold text-slate-900 mt-1">ĐỒNG BỘ 100% FLASH</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Tự chạy khi mất sóng 4G/LoRa</div>
          </div>
        </div>
      </div>

      {/* Modal Cảnh báo Chặn xả thức ăn từ Safety Rule Engine */}
      <SafetyBlockedModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        safetyResult={safetyEvaluation}
      />
    </div>
  );
};
