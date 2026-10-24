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

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Hệ thống ao nuôi</span>
            <span>/</span>
            <span className="text-slate-700 font-medium">{selectedPond?.name || 'Ao số 02'}</span>
            <span>/</span>
            <span className="text-slate-900 font-semibold">
              Máy cho ăn ({selectedPond?.code || 'AO-02'})
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Điều khiển & Giám sát máy cho ăn
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Tự động theo lịch
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap text-xs font-mono-num">
          <div className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
            <span className="text-slate-500">Đồng hồ tủ máy:</span>
            <span className="font-semibold text-slate-800">{currentTime}</span>
          </div>
          <div className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
            <span className="text-slate-500">Cữ hiện tại:</span>
            <span className="font-semibold text-slate-800">Cữ 2 (10:30 - 11:30)</span>
          </div>
        </div>
      </div>

      {/* 2. CONTROL ACTION TOOLBAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Bảng điều khiển trực tiếp thiết bị
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Có kiểm tra khóa an toàn môi trường trước khi chạy
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Bắt đầu chạy */}
          <button
            onClick={handleStartAuto}
            className="h-14 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex flex-col items-center justify-center transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Play className="w-4 h-4 fill-white" />
              <span className="font-semibold text-xs">Bắt đầu chạy</span>
            </div>
            <span className="text-[11px] text-teal-100 mt-0.5">Chế độ tự động</span>
          </button>

          {/* Tạm dừng */}
          <button
            onClick={handlePause}
            className={`h-14 px-3 rounded-xl flex flex-col items-center justify-center border transition cursor-pointer ${
              isPaused
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Pause className={`w-4 h-4 ${isPaused ? 'text-white' : 'text-slate-500'}`} />
              <span className="font-semibold text-xs">{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
            </div>
            <span className={`text-[11px] mt-0.5 ${isPaused ? 'text-amber-100' : 'text-slate-500'}`}>
              Thăm nhá (10 phút)
            </span>
          </button>

          {/* Phun thử 10s */}
          <button
            onClick={handleTest10s}
            disabled={isTestSpinning}
            className={`h-14 px-3 rounded-xl flex flex-col items-center justify-center border transition cursor-pointer ${
              isTestSpinning
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Timer className={`w-4 h-4 ${isTestSpinning ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span className="font-semibold text-xs">
                {isTestSpinning ? `Đang thử (${testCountdown}s)` : 'Phun thử 10s'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">Kiểm tra mâm</span>
          </button>

          {/* Phun bù +2kg */}
          <button
            onClick={handleAdd2Kg}
            className="h-14 px-3 bg-white hover:bg-slate-50 text-slate-800 rounded-xl flex flex-col items-center justify-center border border-slate-200 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <PlusSquare className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-xs">Phun bù +2kg</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">Bổ sung cữ ăn</span>
          </button>

          {/* Đảo chiều mâm */}
          <button
            onClick={handleReverseMotor}
            disabled={isReversing}
            className={`h-14 px-3 rounded-xl flex flex-col items-center justify-center border transition cursor-pointer ${
              isReversing
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <RotateCw className={`w-4 h-4 ${isReversing ? 'animate-spin text-amber-700' : 'text-slate-500'}`} />
              <span className="font-semibold text-xs">{isReversing ? 'Đang đảo...' : 'Đảo chiều mâm'}</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5">Chống kẹt cám</span>
          </button>

          {/* Dừng khẩn cấp */}
          <button
            onClick={handleTriggerEmergencyStop}
            className="h-14 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl flex flex-col items-center justify-center transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4" />
              <span className="font-semibold text-xs">Dừng khẩn cấp</span>
            </div>
            <span className="text-[11px] text-red-100 mt-0.5">Ngắt rơ-le tức thì</span>
          </button>
        </div>
      </div>

      {/* 3. WATER QUALITY SAFETY INTERLOCK */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Khóa liên động an toàn môi trường nước
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trạng thái:</span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Cho phép rải cám
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* DO Box */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Oxy hòa tan (DO)</span>
              <span className="text-emerald-600 font-medium">Đạt chuẩn</span>
            </div>
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-2xl font-bold font-mono-num tracking-tight text-slate-900">
                {selectedPond?.do ? selectedPond.do.toFixed(2) : '5.50'}
              </span>
              <span className="font-mono-num text-xs text-slate-500">mg/L</span>
            </div>
            <div className="text-xs text-slate-500 border-t border-slate-200/60 pt-2 flex items-center justify-between">
              <span>Ngưỡng ngắt tự động:</span>
              <span className="font-mono-num font-semibold text-slate-700">&lt; 4.0 mg/L</span>
            </div>
          </div>

          {/* Nhiệt độ nước */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Nhiệt độ nước ao</span>
              <span className="text-emerald-600 font-medium">Ổn định</span>
            </div>
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-2xl font-bold font-mono-num tracking-tight text-slate-900">
                {selectedPond?.temp ? selectedPond.temp.toFixed(1) : '29.8'}
              </span>
              <span className="font-mono-num text-xs text-slate-500">°C</span>
            </div>
            <div className="text-xs text-slate-500 border-t border-slate-200/60 pt-2 flex items-center justify-between">
              <span>Khoảng tối ưu:</span>
              <span className="font-mono-num font-semibold text-slate-700">28.0 - 31.5°C</span>
            </div>
          </div>

          {/* Độ pH */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Độ pH nước</span>
              <span className="text-emerald-600 font-medium">An toàn</span>
            </div>
            <div className="flex items-baseline gap-1.5 my-2">
              <span className="text-2xl font-bold font-mono-num tracking-tight text-slate-900">
                {selectedPond?.ph ? selectedPond.ph.toFixed(2) : '7.82'}
              </span>
              <span className="font-mono-num text-xs text-slate-500">pH</span>
            </div>
            <div className="text-xs text-slate-500 border-t border-slate-200/60 pt-2 flex items-center justify-between">
              <span>Dải tiêu chuẩn:</span>
              <span className="font-mono-num font-semibold text-slate-700">7.5 - 8.3 pH</span>
            </div>
          </div>

          {/* Cơ chế khóa */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="text-xs font-semibold text-slate-800">
              Quy tắc bảo vệ tự động
            </div>
            <p className="text-xs text-slate-600 leading-relaxed my-2">
              Tự động ngắt motor rải cám khi DO &lt; 4.0 mg/L hoặc nhiệt độ vượt ngưỡng, ngăn ngừa dư thừa thức ăn gây ô nhiễm đáy ao.
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2">
              <span>Chế độ bảo vệ:</span>
              <span className="font-semibold text-emerald-700">Đang bật</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TWO COLUMNS: HYDROPHONE ACOUSTIC + HOPPER LOADCELL & VFD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 6 COLS: HYDROPHONE ACOUSTIC FEEDING */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Phân tích âm thanh sức ăn (Hydrophone)
                </h2>
              </div>
              <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-xs font-mono-num text-slate-600">
                15kHz - 45kHz
              </span>
            </div>

            {/* Clean Light Spectrogram Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                <span>Cường độ âm thanh bắt mồi (60 giây gần nhất)</span>
                <span className="font-semibold text-slate-900">
                  Tần suất: <span className="text-teal-700 font-mono-num">88 xung/giây</span>
                </span>
              </div>

              <div className="h-28 flex items-end justify-between gap-1 py-1 border-b border-slate-200">
                {waveformBars.map((bar, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-t-xs transition-all duration-300 ${
                      bar > 85 ? 'bg-teal-600' : bar > 60 ? 'bg-teal-500/70' : 'bg-slate-300'
                    }`}
                    style={{ height: `${bar}%` }}
                    title={`Mức cường độ: ${bar}%`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-500 pt-2">
                <span>-60s</span>
                <span>-30s</span>
                <span className="text-slate-800 font-medium">Hiện tại: {currentTime.slice(0, 5)}</span>
              </div>
            </div>

            {/* Recommendation Box */}
            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-900">
                  Đề xuất điều chỉnh tốc độ rải cám
                </span>
                <span className="text-[11px] font-mono-num text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                  Điểm bắt mồi: 92/100
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">
                  {speedBoost ? 'Đang áp dụng +10% tốc độ rải:' : 'Tôm bắt mồi mạnh (+10% tốc độ rải):'}
                </strong>{' '}
                Mật độ xung âm thanh quanh vùng rải đạt mức cao, chưa ghi nhận cám dư lắng đáy.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={() => {
                setSpeedBoost(true);
                onShowToast('Đã kích hoạt tăng +10% tốc độ rải cám cho cữ hiện tại.', 'success');
              }}
              className={`h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                speedBoost ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{speedBoost ? 'Đã áp dụng +10%' : 'Áp dụng +10% tốc độ'}</span>
            </button>

            <button
              onClick={() => {
                setSpeedBoost(false);
                onShowToast('Đã chuyển về tốc độ định mức ban đầu.', 'info');
              }}
              className="h-9 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Giữ tốc độ định mức</span>
            </button>
          </div>
        </div>

        {/* RIGHT 6 COLS: HOPPER LOADCELL & VFD FREQUENCY */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Thông số phễu chứa (Loadcell) & Biến tần VFD
                </h2>
              </div>
              <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-600">
                Cân điện tử 4 điểm
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Trọng lượng cám trong phễu
                </span>
                <div className="my-2">
                  <div className="flex items-baseline gap-1 font-mono-num">
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">
                      {hopperWeight.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">/ {maxHopperWeight} kg</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Còn lại: {((hopperWeight / maxHopperWeight) * 100).toFixed(1)}% dung tích
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(hopperWeight / maxHopperWeight) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Dòng tải motor & Trạng thái mâm
                </span>
                <div className="my-2">
                  <div className="flex items-baseline gap-1 font-mono-num">
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">1.42</span>
                    <span className="text-sm text-slate-400 font-medium">A</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Ngưỡng an toàn: &lt; 2.50 A
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-1.5">
                  <span className="text-slate-500">Mâm quay:</span>
                  <span className="font-medium text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Thông thoáng
                  </span>
                </div>
              </div>
            </div>

            {/* VFD Radius Control */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Radio className="w-4 h-4 text-slate-500" />
                  <span>Bán kính văng cám (Tần số biến tần VFD)</span>
                </div>
                <span className="font-mono-num text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  {vfdFrequency.toFixed(1)} Hz
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSetPresetFreq(35.0)}
                  className={`p-2.5 rounded-lg text-left transition border cursor-pointer ${
                    vfdFrequency === 35.0
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="text-xs font-semibold">Gần (3 - 4m)</div>
                  <div className={`font-mono-num text-[11px] ${vfdFrequency === 35.0 ? 'text-slate-300' : 'text-slate-400'}`}>
                    35.0 Hz
                  </div>
                </button>

                <button
                  onClick={() => handleSetPresetFreq(45.0)}
                  className={`p-2.5 rounded-lg text-left transition border cursor-pointer ${
                    vfdFrequency === 45.0
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="text-xs font-semibold">Trung bình (6m)</div>
                  <div className={`font-mono-num text-[11px] ${vfdFrequency === 45.0 ? 'text-slate-300' : 'text-slate-400'}`}>
                    45.0 Hz
                  </div>
                </button>

                <button
                  onClick={() => handleSetPresetFreq(50.0)}
                  className={`p-2.5 rounded-lg text-left transition border cursor-pointer ${
                    vfdFrequency === 50.0
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="text-xs font-semibold">Xa (9 - 10m)</div>
                  <div className={`font-mono-num text-[11px] ${vfdFrequency === 50.0 ? 'text-slate-300' : 'text-slate-400'}`}>
                    50.0 Hz
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <span className="font-mono-num text-xs text-slate-400">30Hz</span>
                <input
                  type="range"
                  min="30"
                  max="50"
                  step="0.5"
                  value={vfdFrequency}
                  onChange={(e) => setVfdFrequency(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <span className="font-mono-num text-xs text-slate-400">50Hz</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handleSetZeroScale}
              className="h-9 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt cân về 0.0 kg</span>
            </button>

            <button
              onClick={handleRefill50Kg}
              className="h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Nạp mới bao 50kg</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. CURRENT MEAL PROGRESS & PULSE STATS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Tiến độ cữ ăn hiện tại (Cữ 2: 10:30 - 11:30)
            </h2>
          </div>
          <div className="font-mono-num text-xs text-slate-500">
            Đã rải:{' '}
            <strong className="text-slate-900 font-semibold">
              {sprayedInCurrentMeal.toFixed(1)} / {targetCurrentMeal.toFixed(1)} kg
            </strong>{' '}
            ({((sprayedInCurrentMeal / targetCurrentMeal) * 100).toFixed(1)}%) • Còn lại:{' '}
            <strong className="text-slate-900 font-semibold">
              {Math.max(0, targetCurrentMeal - sprayedInCurrentMeal).toFixed(1)} kg
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-3.5 text-xs">
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <span className="text-slate-500">Chu kỳ xung nhịp rải:</span>
            <div className="text-sm font-bold text-slate-900 mt-1 font-mono-num">4s phun / 25s nghỉ</div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono-num">
              {pulseMode === 'spraying' ? (
                <span className="text-emerald-600 font-semibold">● Đang phun: {restCountdown}s</span>
              ) : (
                <span>Đếm lùi nghỉ: {restCountdown}s</span>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <span className="text-slate-500">Đợt rải trong cữ:</span>
            <div className="text-sm font-bold text-slate-900 mt-1 font-mono-num">Đợt 3 / 4 (5.0 kg)</div>
            <div className="text-xs text-slate-500 mt-0.5">Đã hoàn thành đợt 1 & 2</div>
          </div>

          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <span className="text-slate-500">Nhiệt độ động cơ:</span>
            <div className="text-sm font-bold text-slate-900 mt-1 font-mono-num">38.4 °C</div>
            <div className="text-xs text-slate-500 mt-0.5">Ngưỡng bảo vệ: 65.0 °C</div>
          </div>

          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <span className="text-slate-500">Lưu trữ lịch tại tủ máy:</span>
            <div className="text-sm font-bold text-slate-900 mt-1">Đã đồng bộ</div>
            <div className="text-xs text-slate-500 mt-0.5">Tự vận hành khi mất kết nối mạng</div>
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
