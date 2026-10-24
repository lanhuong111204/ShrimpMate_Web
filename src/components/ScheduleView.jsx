import React, { useState } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Save, 
  Check, 
  HardDrive, 
  Play
} from 'lucide-react';
import { feedingService } from '../services/feedingService';
import { safetyRuleService } from '../services/safetyRuleService';

export const ScheduleView = ({
  schedule,
  safetyRules,
  onUpdateSchedule,
  onUpdateSafetyRules,
  onShowToast,
  pondCode = 'Ao Kỹ Thuật Số 02',
  pondArea = '4.200 m²',
}) => {
  const [aiApplied, setAiApplied] = useState(true);
  const [isSyncingHw, setIsSyncingHw] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Hôm nay, 10:30:15');

  // Compute totals
  const totalKg = schedule.reduce((sum, item) => (item.enabled ? sum + item.weightKg : sum), 0);
  const sprayedKg = 38.4;
  const remainingKg = Math.max(0, totalKg - sprayedKg);

  // Stepper logic
  const handleStepWeight = (mealId, delta) => {
    const updated = schedule.map((item) => {
      if (item.id === mealId) {
        const next = Math.max(5, parseFloat((item.weightKg + delta).toFixed(1)));
        return { ...item, weightKg: next };
      }
      return item;
    });
    onUpdateSchedule(updated);
  };

  // Toggle meal enabled
  const handleToggleMeal = (mealId) => {
    const updated = schedule.map((item) => {
      if (item.id === mealId) {
        return { ...item, enabled: !item.enabled };
      }
      return item;
    });
    onUpdateSchedule(updated);
    const target = updated.find((i) => i.id === mealId);
    onShowToast(`Đã ${target?.enabled ? 'bật' : 'tắt'} ${target?.label}.`, 'info');
  };

  // Apply AI Suggestion
  const handleApplyAi = () => {
    const updated = schedule.map((item) => {
      if (item.id === 3) {
        return { ...item, weightKg: 28.0, aiAddedKg: 3.0 };
      }
      return item;
    });
    setAiApplied(true);
    onUpdateSchedule(updated);
    onShowToast('Đã áp dụng đề xuất của AI Bio-Acoustic (+3.0 kg cho Cữ 3)!', 'success');
  };

  // Reset Default
  const handleResetDefault = () => {
    const updated = schedule.map((item) => {
      if (item.id === 3) {
        return { ...item, weightKg: 25.0, aiAddedKg: 0 };
      }
      if (item.id === 2) {
        return { ...item, weightKg: 22.0 };
      }
      if (item.id === 4) {
        return { ...item, weightKg: 25.0 };
      }
      return item;
    });
    setAiApplied(false);
    onUpdateSchedule(updated);
    onShowToast('Đã đặt lại khẩu phần ăn tiêu chuẩn.', 'info');
  };

  // Toggle safety rule
  const handleToggleSafetyRule = (ruleId) => {
    const updated = safetyRules.map((rule) => {
      if (rule.id === ruleId) {
        const nextEnabled = !rule.enabled;
        return {
          ...rule,
          enabled: nextEnabled,
          status: nextEnabled ? 'ARMED' : 'DISARMED',
        };
      }
      return rule;
    });
    onUpdateSafetyRules(updated);
    const changed = updated.find((r) => r.id === ruleId);
    onShowToast(`Rơ-le an toàn "${changed?.title}": ${changed?.status}`, 'info');
  };

  // Pulse test for feeder
  const handlePulseTest = (mealId) => {
    onShowToast(`[LỆNH THỬ NGHIỆM]: Kích hoạt xung biến tần Cữ ${mealId} trong 5 giây để kiểm tra mâm xoay.`, 'info');
  };

  // Master Offline Hardware Sync (EEPROM AT24C256)
  const handleMasterSync = () => {
    if (isSyncingHw) return;
    setIsSyncingHw(true);
    onShowToast('Đang biên dịch payload AES-128 và ghi trực tiếp vào chip nhớ EEPROM bờ ao...', 'info');

    setTimeout(() => {
      setIsSyncingHw(false);
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const timeStr = `Hôm nay, ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setLastSyncTime(timeStr);
      onShowToast('ĐÃ GHI THÀNH CÔNG VÀO BỘ NHỚ TỦ MÁY RTC (12ms độ trễ)!', 'success');
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* PAGE HEADER TITLE & STATUS BADGES */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-slate-950 text-white font-mono-num text-[10px] font-semibold uppercase tracking-wider">
              Module Điều Khiển Cấp Cám
            </span>
            <span className="text-xs font-mono-num text-slate-500">
              Ao Nuôi: {pondCode} ({pondArea})
            </span>
          </div>
          <h1 className="text-lg md:text-xl font-display font-bold text-slate-950 tracking-tight">
            Lên Lịch Ăn Tự Động & Mô Hình Cân Đối AI
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
            Hệ thống phân bổ cám thích ứng theo âm thanh bắt mồi (Hydrophone) và quy tắc khóa an toàn phần cứng tủ máy.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono-num text-xs shrink-0 flex-wrap">
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600">
              EEPROM CRC: <strong className="text-slate-900 font-semibold">0x7F4A</strong>
            </span>
          </div>
          <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-1.5 text-emerald-800 flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>RTC ĐỘC LẬP: HOẠT ĐỘNG</span>
          </div>
        </div>
      </div>

      {/* 1. TỔNG QUAN KHẨU PHẦN NGÀY & ĐỀ XUẤT AI ADAPTIVE FEEDING */}
      <section className="rounded-xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-4 bg-slate-900 rounded-full inline-block"></span>
            <h2 className="font-display font-bold text-sm md:text-base text-slate-900 uppercase tracking-wide">
              1. Tổng Quan Khẩu Phần Ngày & AI Cân Đối Tự Động
            </h2>
          </div>
          <div className="font-mono-num text-xs text-slate-500">
            Loại cám: <strong className="text-slate-800 font-semibold">Grobest High-Protein 2.2mm</strong> • Ngày nuôi:{' '}
            <strong className="text-slate-800 font-semibold">42 Ngày</strong>
          </div>
        </div>

        {/* METRIC KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Metric 1 */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all">
            <div className="font-mono-num text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              KẾ HOẠCH CẢ NGÀY (KG)
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-display text-3xl font-bold tracking-tight text-slate-950 font-mono-num">
                {totalKg.toFixed(1)}
              </span>
              <span className="font-mono-num text-xs font-semibold text-slate-500">kg</span>
            </div>
            <div className="mt-3 text-xs text-slate-500 font-mono-num flex items-center justify-between border-t border-slate-200/60 pt-2.5">
              <span>Định mức sinh khối:</span>
              <span className="font-semibold text-slate-800">~4.2 Tấn tôm</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 transition-all">
            <div className="font-mono-num text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              ĐÃ RẢI THỰC TẾ (KG)
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-display text-3xl font-bold tracking-tight text-slate-950 font-mono-num">
                {sprayedKg.toFixed(1)}
              </span>
              <span className="font-mono-num text-xs font-semibold text-slate-500">
                / {totalKg.toFixed(1)} kg
              </span>
            </div>
            <div className="mt-3 text-xs font-mono-num flex items-center justify-between border-t border-slate-200/60 pt-2.5">
              <span className="text-slate-500">Tiến độ cữ 1 & 2:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                {((sprayedKg / totalKg) * 100).toFixed(1)}% ĐÃ PHUN
              </span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all">
            <div className="font-mono-num text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              LƯỢNG CÒN LẠI (CỮ 3 & 4)
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-display text-3xl font-bold tracking-tight text-slate-950 font-mono-num">
                {remainingKg.toFixed(1)}
              </span>
              <span className="font-mono-num text-xs font-semibold text-slate-500">kg</span>
            </div>
            <div className="mt-3 text-xs text-slate-500 font-mono-num flex items-center justify-between border-t border-slate-200/60 pt-2.5">
              <span>Tồn phễu chứa bờ:</span>
              <span className="font-semibold text-slate-800">62.0 kg (Đủ cám)</span>
            </div>
          </div>
        </div>

        {/* PROGRESS DISTRIBUTION BAR */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap justify-between text-xs font-mono-num text-slate-600 gap-1">
            <span>
              Phân bổ:{' '}
              <strong className="text-slate-900 font-semibold">Cữ 1 ({schedule[0]?.weightKg}kg ✓)</strong> •{' '}
              <strong className="text-slate-900 font-semibold">Cữ 2 (18.4/{schedule[1]?.weightKg}kg)</strong> •{' '}
              <span className="text-slate-500">Cữ 3 ({schedule[2]?.weightKg}kg)</span> •{' '}
              <span className="text-slate-500">Cữ 4 ({schedule[3]?.weightKg}kg)</span>
            </span>
            <span className="font-semibold text-slate-900">
              {totalKg.toFixed(1)} kg / 4 Cữ
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 border border-slate-200/70">
            <div
              className="bg-slate-900 rounded-l-full h-full transition-all"
              style={{ width: `${(schedule[0]?.weightKg / totalKg) * 100}%` }}
              title="Cữ 1: Đã rải xong"
            />
            <div
              className="bg-slate-500 h-full transition-all"
              style={{ width: `${(schedule[1]?.weightKg / totalKg) * 100}%` }}
              title="Cữ 2: Đang phun"
            />
            <div
              className="bg-slate-300 h-full transition-all"
              style={{ width: `${(schedule[2]?.weightKg / totalKg) * 100}%` }}
              title="Cữ 3: Chờ phun"
            />
            <div
              className="bg-slate-200 rounded-r-full h-full transition-all"
              style={{ width: `${(schedule[3]?.weightKg / totalKg) * 100}%` }}
              title="Cữ 4: Chờ phun"
            />
          </div>
        </div>

        {/* AI ADAPTIVE FEEDING MODEL PROMPT BOX */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono-num text-[10px] font-semibold uppercase">
                AI Bio-Acoustic Engine
              </span>
              <span className="font-mono-num text-xs text-slate-600 font-medium">
                Dự Báo & Điều Chỉnh Thích Ứng (11:30)
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
              Cảm biến sóng âm <strong>Hydrophone</strong> ghi nhận nhịp ăn sạch nhá đạt <strong>100%</strong> sau 38
              phút ở Cữ 1. Cảm biến môi trường: Oxy <strong>5.8 mg/L</strong>, Nhiệt độ nước <strong>29.4°C</strong> (lý
              tưởng).
              <span className="font-semibold text-slate-900">
                {' '}
                Đề xuất: Tự động TĂNG +3.0 kg cho Cữ 3 (14:30) và GIỮ NGUYÊN Cữ 4 để ngừa thiếu oxy đêm.
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleApplyAi}
              className={`px-4 py-2 rounded-xl font-mono-num text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer ${
                aiApplied
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {aiApplied ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>{aiApplied ? 'Đã Chấp Thuận (+3kg Cữ 3)' : 'Áp Dụng Đề Xuất (+3kg Cữ 3)'}</span>
            </button>

            <button
              onClick={handleResetDefault}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-mono-num text-xs font-semibold border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Đặt Lại</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. LƯỚI CẤU HÌNH 4 CỮ ĂN TRONG NGÀY */}
      <section className="rounded-xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-4 bg-slate-900 rounded-full inline-block"></span>
            <h2 className="font-display font-bold text-sm md:text-base text-slate-900 uppercase tracking-wide">
              2. Lưới Cấu Hình 4 Cữ Ăn Trong Ngày (Timeline & Motor Stepper)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono-num">
            <span className="text-slate-400">Chế độ quăng:</span>
            <span className="rounded-md border border-slate-200 px-2 py-0.5 bg-slate-50 font-semibold text-slate-800">
              XUNG BIẾN TẦN CHỐNG KẸT
            </span>
          </div>
        </div>

        {/* 4-MEAL GRID CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Cữ 1: SÁNG SỚM */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-4.5 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <div className="font-mono-num text-[10px] text-slate-400 uppercase font-semibold">
                    Cữ 1 • SÁNG SỚM
                  </div>
                  <div className="font-display text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                    07:00
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-mono-num text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold uppercase">
                    ĐÃ XONG
                  </span>
                  <label className="inline-flex items-center gap-1.5 mt-1.5 cursor-not-allowed opacity-60">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="h-3.5 w-3.5 rounded text-slate-900 border-slate-300 focus:ring-0"
                    />
                    <span className="font-mono-num text-[10px] text-slate-500">Bật</span>
                  </label>
                </div>
              </div>

              {/* Weight Display */}
              <div className="rounded-xl border border-slate-200/70 bg-white p-3 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-mono-num text-[11px] text-slate-400 uppercase font-medium">
                    Khối lượng:
                  </span>
                  <div className="font-mono-num">
                    <span className="text-2xl font-bold text-slate-900">20.0</span>
                    <span className="text-xs text-slate-400 font-semibold ml-0.5">kg</span>
                  </div>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    disabled
                    className="flex-1 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono-num text-xs font-semibold text-slate-300 cursor-not-allowed"
                  >
                    -2kg
                  </button>
                  <button
                    disabled
                    className="flex-1 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono-num text-xs font-semibold text-slate-300 cursor-not-allowed"
                  >
                    +2kg
                  </button>
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-1.5 font-mono-num text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Thời gian phun:</span>
                  <span className="font-medium text-slate-800">25 Phút (07:00 - 07:25)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nhịp xung:</span>
                  <span className="font-medium text-slate-800">4s Phun / 25s Nghỉ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tần số mâm:</span>
                  <span className="font-medium text-slate-800">38 Hz (~8.0 m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kiểm tra nhá:</span>
                  <span className="text-emerald-600 font-semibold">Sạch 100%</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="font-mono-num text-[11px] text-slate-400 text-center py-1 rounded-lg bg-slate-100/70 border border-slate-200/50">
                Nhật ký: Đã nạp vào RTC thành công
              </div>
            </div>
          </div>

          {/* Cữ 2: BUỔI TRƯA (ACTIVE) */}
          <div className="rounded-xl border-2 border-slate-950 bg-white p-4.5 flex flex-col justify-between space-y-4 shadow-sm relative">
            <div className="absolute -top-2.5 left-4 bg-slate-950 text-white font-mono-num text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
              ● Đang Phun
            </div>

            <div className="space-y-3.5 pt-1">
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <div className="font-mono-num text-[10px] text-slate-400 uppercase font-semibold">
                    Cữ 2 • TRƯA
                  </div>
                  <div className="font-display text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                    10:30
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-mono-num text-[10px] px-2 py-0.5 rounded bg-slate-900 text-white font-semibold uppercase animate-pulse">
                    CHẠY: 84%
                  </span>
                  <label className="inline-flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule[1]?.enabled}
                      onChange={() => handleToggleMeal(2)}
                      className="h-3.5 w-3.5 rounded text-slate-900 border-slate-300 focus:ring-0 cursor-pointer"
                    />
                    <span className="font-mono-num text-[10px] text-slate-700 font-semibold">Bật</span>
                  </label>
                </div>
              </div>

              {/* Weight Display & Stepper */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-mono-num text-[11px] text-slate-500 uppercase font-medium">
                    Tiến độ cám:
                  </span>
                  <div className="font-mono-num">
                    <span className="text-2xl font-bold text-slate-950">
                      {schedule[1]?.weightKg.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold ml-0.5">kg</span>
                  </div>
                </div>
                <div className="text-[11px] font-mono-num text-slate-500 flex justify-between">
                  <span>
                    Đã văng: <strong className="text-slate-900">18.4 kg</strong>
                  </span>
                  <span>
                    Còn:{' '}
                    <strong className="text-slate-900">
                      {Math.max(0, schedule[1]?.weightKg - 18.4).toFixed(1)} kg
                    </strong>
                  </span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => handleStepWeight(2, -2)}
                    className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 font-mono-num text-xs font-semibold text-slate-900 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    -2kg
                  </button>
                  <button
                    onClick={() => handleStepWeight(2, 2)}
                    className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 font-mono-num text-xs font-semibold text-slate-900 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    +2kg
                  </button>
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-1.5 font-mono-num text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Thời gian phun:</span>
                  <span className="font-medium text-slate-800">25 Phút (10:30 - 10:55)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nhịp xung:</span>
                  <span className="font-medium text-slate-800">5s Phun / 20s Nghỉ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tần số mâm:</span>
                  <span className="font-medium text-slate-800">42 Hz (~9.5 m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dòng motor:</span>
                  <span className="font-medium text-slate-800">1.82 A (Ổn định)</span>
                </div>
              </div>
            </div>

            {/* Controls for Active Meal */}
            <div className="flex gap-1.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => onShowToast('Cữ 2: Đã tạm dừng phun trong 10 phút để kéo nhá kiểm tra.', 'info')}
                className="flex-1 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-mono-num text-xs font-semibold transition-colors cursor-pointer"
              >
                Tạm Dừng
              </button>
              <button
                onClick={() => onShowToast('Đã dừng cữ 2! Cám thừa được lưu vào tồn phễu.', 'warning')}
                className="flex-1 py-2 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 font-mono-num text-xs font-semibold transition-colors cursor-pointer"
              >
                Ngắt Cữ 2
              </button>
            </div>
          </div>

          {/* Cữ 3: BUỔI CHIỀU */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="space-y-3.5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <div className="font-mono-num text-[10px] text-slate-400 uppercase font-semibold">
                    Cữ 3 • BUỔI CHIỀU
                  </div>
                  <div className="font-display text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                    14:30
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-mono-num text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold uppercase">
                    CHỜ PHUN
                  </span>
                  <label className="inline-flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule[2]?.enabled}
                      onChange={() => handleToggleMeal(3)}
                      className="h-3.5 w-3.5 rounded text-slate-900 border-slate-300 focus:ring-0 cursor-pointer"
                    />
                    <span className="font-mono-num text-[10px] text-slate-700 font-semibold">Bật</span>
                  </label>
                </div>
              </div>

              {/* Weight Display & Stepper */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-mono-num text-[11px] text-slate-500 uppercase font-medium">
                    Khối lượng đặt:
                  </span>
                  <div className="font-mono-num">
                    <span className="text-2xl font-bold text-slate-950">
                      {schedule[2]?.weightKg.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold ml-0.5">kg</span>
                  </div>
                </div>
                <div className="text-[11px] font-mono-num text-slate-500 flex justify-between">
                  <span>Chuẩn: 25.0 kg</span>
                  {schedule[2]?.weightKg > 25 ? (
                    <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                      +{schedule[2].weightKg - 25}kg (AI Thêm)
                    </span>
                  ) : (
                    <span className="text-slate-700 font-medium">Định mức chuẩn</span>
                  )}
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => handleStepWeight(3, -2)}
                    className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 font-mono-num text-xs font-semibold text-slate-900 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    -2kg
                  </button>
                  <button
                    onClick={() => handleStepWeight(3, 2)}
                    className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 font-mono-num text-xs font-semibold text-slate-900 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    +2kg
                  </button>
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-1.5 font-mono-num text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Thời gian phun:</span>
                  <span className="font-medium text-slate-800">32 Phút (14:30 - 15:02)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nhịp xung:</span>
                  <span className="font-medium text-slate-800">5s Phun / 20s Nghỉ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tần số mâm:</span>
                  <span className="font-medium text-slate-800">40 Hz (~8.8 m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Góc rải quạt:</span>
                  <span className="font-medium text-slate-800">180° Văng Rộng</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => handlePulseTest(3)}
                className="w-full py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-mono-num text-xs font-semibold text-slate-800 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-slate-500" />
                <span>Chạy Thử Xung (5s)</span>
              </button>
            </div>
          </div>

          {/* Cữ 4: CHẬP TỐI */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4.5 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="space-y-3.5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <div className="font-mono-num text-[10px] text-slate-400 uppercase font-semibold">
                    Cữ 4 • CHẬP TỐI
                  </div>
                  <div className="font-display text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                    18:00
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-mono-num text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold uppercase">
                    CHỜ PHUN
                  </span>
                  <label className="inline-flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule[3]?.enabled}
                      onChange={() => handleToggleMeal(4)}
                      className="h-3.5 w-3.5 rounded text-slate-900 border-slate-300 focus:ring-0 cursor-pointer"
                    />
                    <span className="font-mono-num text-[10px] text-slate-700 font-semibold">Bật</span>
                  </label>
                </div>
              </div>

              {/* Weight Display & Stepper */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-mono-num text-[11px] text-slate-500 uppercase font-medium">
                    Khối lượng đặt:
                  </span>
                  <div className="font-mono-num">
                    <span className="text-2xl font-bold text-slate-950">
                      {schedule[3]?.weightKg.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold ml-0.5">kg</span>
                  </div>
                </div>
                <div className="text-[11px] font-mono-num text-slate-500 flex justify-between">
                  <span>Chuẩn: 25.0 kg</span>
                  <span className="text-slate-700 font-medium">Định mức an toàn</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => handleStepWeight(4, -2)}
                    className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 font-mono-num text-xs font-semibold text-slate-900 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    -2kg
                  </button>
                  <button
                    onClick={() => handleStepWeight(4, 2)}
                    className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 font-mono-num text-xs font-semibold text-slate-900 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    +2kg
                  </button>
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-1.5 font-mono-num text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Thời gian phun:</span>
                  <span className="font-medium text-slate-800">28 Phút (18:00 - 18:28)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nhịp xung:</span>
                  <span className="font-medium text-slate-800">4s Phun / 25s Nghỉ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tần số mâm:</span>
                  <span className="font-medium text-slate-800">35 Hz (~7.2 m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Góc rải quạt:</span>
                  <span className="font-medium text-slate-800">120° Hẹp (Tránh bờ)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => handlePulseTest(4)}
                className="w-full py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-mono-num text-xs font-semibold text-slate-800 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-slate-500" />
                <span>Chạy Thử Xung (5s)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BỘ QUY TẮC NGẮT AN TOÀN TỰ ĐỘNG & 4. ĐỒNG BỘ PHẦN CỨNG OFFLINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION 3: IOT SAFETY INTERLOCKS (7 COLS) */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-4 bg-slate-900 rounded-full inline-block"></span>
              <h2 className="font-display font-bold text-sm md:text-base text-slate-900 uppercase tracking-wide">
                3. Bộ Quy Tắc Ngắt An Toàn Tự Động (IoT Interlocks)
              </h2>
            </div>
            <span className="font-mono-num text-xs text-slate-400 font-medium">3 Rơ-le Phần Cứng</span>
          </div>

          <p className="text-xs text-slate-500 font-mono-num leading-relaxed">
            Các quy tắc được nạp trực tiếp vào mạch bảo vệ cấp 1 (Hardware Watchdog) của tủ điện tại ao. Thiết bị tự
            động ngắt cữ ngay cả khi mất kết nối mạng.
          </p>

          <div className="space-y-3">
            {safetyRules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 flex items-start justify-between gap-4 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded font-mono-num text-[10px] font-semibold uppercase border ${
                        rule.id === 'do-safeguard'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      {rule.relayCode}
                    </span>
                    <span className="font-sans font-semibold text-sm text-slate-900">{rule.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">{rule.description}</p>
                  <div className="font-mono-num text-xs text-slate-500 pt-1">{rule.currentValText}</div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleSafetyRule(rule.id)}
                      className="h-4 w-4 rounded text-slate-900 border-slate-300 focus:ring-0 cursor-pointer"
                    />
                    <span className="font-mono-num text-xs font-semibold text-slate-800">Kích hoạt</span>
                  </label>
                  <span
                    className={`font-mono-num text-[10px] border px-1.5 py-0.5 rounded font-semibold ${
                      rule.enabled
                        ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
                        : 'text-slate-500 border-slate-200 bg-slate-100'
                    }`}
                  >
                    {rule.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: OFFLINE EEPROM HARDWARE SYNC (5 COLS) */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-4 bg-slate-900 rounded-full inline-block"></span>
                <h2 className="font-display font-bold text-sm md:text-base text-slate-900 uppercase tracking-wide">
                  4. Đồng Bộ Phần Cứng Offline
                </h2>
              </div>
              <span className="font-mono-num text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> STM32 SẴN SÀNG
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                Toàn bộ lịch ăn 4 cữ, khối lượng cám và bộ 3 khóa an toàn sau khi đồng bộ sẽ được ghi trực tiếp vào{' '}
                <strong>chip nhớ EEPROM tĩnh điện</strong> và vận hành theo xung nhịp <strong>RTC phần cứng bờ ao</strong>.
              </p>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 font-mono-num text-[11px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã hóa nạp:</span>
                  <span className="font-semibold text-slate-900">AES-128 / Payload v2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bộ nhớ tủ máy:</span>
                  <span className="font-semibold text-slate-900">EEPROM AT24C256 (32KB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trạng thái mạng:</span>
                  <span className="text-emerald-700 font-semibold">Hoạt động độc lập không cần Internet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Đồng bộ gần nhất:</span>
                  <span className="font-semibold text-slate-900">{lastSyncTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* BIG OFFLINE SYNC BUTTON */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleMasterSync}
              disabled={isSyncingHw}
              type="button"
              className={`w-full py-3.5 px-4 rounded-xl font-mono-num text-xs md:text-sm font-semibold flex items-center justify-center gap-2.5 uppercase tracking-wide transition-all shadow-sm active:scale-[0.99] cursor-pointer ${
                isSyncingHw
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-950 hover:bg-slate-800 text-white'
              }`}
            >
              {isSyncingHw ? (
                <>
                  <Save className="w-5 h-5 animate-spin" />
                  <span>ĐANG GHI EEPROM & NẠP RTC TỦ MÁY...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>LƯU & ĐỒNG BỘ VÀO BỘ NHỚ TỦ MÁY RTC</span>
                </>
              )}
            </button>
            <div className="font-mono-num text-[10px] text-slate-400 text-center uppercase tracking-wider">
              Đảm bảo máy tự rải chính xác từng giây ngay cả khi mất sóng 4G/WiFi
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
