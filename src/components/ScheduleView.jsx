import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Save, 
  Check, 
  Play,
  ShieldCheck,
  CalendarClock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ScheduleView = ({
  schedule,
  safetyRules,
  onUpdateSchedule,
  onUpdateSafetyRules,
  onShowToast,
  pondCode = 'Ao số 02',
  pondArea = '4.200 m²',
}) => {
  const { role } = useAuth();
  const canEdit = role === 'manager';
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
    onShowToast('Đã áp dụng đề xuất khẩu phần (+3.0 kg cho Cữ 3).', 'success');
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
    onShowToast(`Quy tắc an toàn "${changed?.title}": ${changed?.enabled ? 'Đang bật' : 'Đã tắt'}`, 'info');
  };

  // Pulse test for feeder
  const handlePulseTest = (mealId) => {
    onShowToast(`Kích hoạt chạy thử xung Cữ ${mealId} trong 5 giây để kiểm tra mâm xoay.`, 'info');
  };

  // Sync schedule to controller
  const handleMasterSync = () => {
    if (isSyncingHw) return;
    setIsSyncingHw(true);
    onShowToast('Đang đồng bộ lịch cho ăn và quy tắc an toàn xuống tủ điều khiển...', 'info');

    setTimeout(() => {
      setIsSyncingHw(false);
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const timeStr = `Hôm nay, ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setLastSyncTime(timeStr);
      onShowToast('Đã lưu và đồng bộ thành công xuống tủ điều khiển tại ao.', 'success');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Lịch cho ăn tự động & Cân đối khẩu phần
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
              {pondCode} ({pondArea})
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Thiết lập định mức 4 cữ ăn trong ngày, tự động điều chỉnh theo sức ăn và ngưỡng an toàn môi trường nước.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700 flex items-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Bộ hẹn giờ độc lập: Hoạt động</span>
          </div>
        </div>
      </div>

      {/* 1. DAILY FEED SUMMARY & RECOMMENDATION */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Tổng quan khẩu phần ngày
            </h2>
          </div>
          <div className="text-xs text-slate-500">
            Loại cám: <strong className="text-slate-800 font-medium">Grobest High-Protein 2.2mm</strong> • Ngày nuôi:{' '}
            <strong className="text-slate-800 font-medium font-mono-num">42 ngày</strong>
          </div>
        </div>

        {/* 3 KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="text-xs font-medium text-slate-500">
              Kế hoạch cả ngày
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono-num">
                {totalKg.toFixed(1)}
              </span>
              <span className="font-mono-num text-xs font-medium text-slate-500">kg</span>
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2.5">
              <span>Sinh khối ước tính:</span>
              <span className="font-semibold text-slate-800 font-mono-num">~4.2 tấn tôm</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium text-slate-500">
              Đã rải thực tế
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono-num">
                {sprayedKg.toFixed(1)}
              </span>
              <span className="font-mono-num text-xs font-medium text-slate-500">
                / {totalKg.toFixed(1)} kg
              </span>
            </div>
            <div className="mt-3 text-xs flex items-center justify-between border-t border-slate-200/60 pt-2.5">
              <span className="text-slate-500">Tiến độ cữ 1 & 2:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-mono-num">
                {((sprayedKg / totalKg) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="text-xs font-medium text-slate-500">
              Lượng còn lại (Cữ 3 & 4)
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono-num">
                {remainingKg.toFixed(1)}
              </span>
              <span className="font-mono-num text-xs font-medium text-slate-500">kg</span>
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2.5">
              <span>Tồn phễu chứa:</span>
              <span className="font-semibold text-slate-800 font-mono-num">62.0 kg (Đủ cám)</span>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="space-y-2">
          <div className="flex flex-wrap justify-between text-xs text-slate-600 gap-1 font-mono-num">
            <span>
              Phân bổ:{' '}
              <strong className="text-slate-900 font-semibold">Cữ 1 ({schedule[0]?.weightKg}kg ✓)</strong> •{' '}
              <strong className="text-slate-900 font-semibold">Cữ 2 (18.4/{schedule[1]?.weightKg}kg)</strong> •{' '}
              <span className="text-slate-500">Cữ 3 ({schedule[2]?.weightKg}kg)</span> •{' '}
              <span className="text-slate-500">Cữ 4 ({schedule[3]?.weightKg}kg)</span>
            </span>
            <span className="font-semibold text-slate-900">
              {totalKg.toFixed(1)} kg / 4 cữ
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 border border-slate-200">
            <div
              className="bg-teal-600 rounded-l-full h-full transition-all"
              style={{ width: `${(schedule[0]?.weightKg / totalKg) * 100}%` }}
            />
            <div
              className="bg-teal-500/80 h-full transition-all"
              style={{ width: `${(schedule[1]?.weightKg / totalKg) * 100}%` }}
            />
            <div
              className="bg-slate-300 h-full transition-all"
              style={{ width: `${(schedule[2]?.weightKg / totalKg) * 100}%` }}
            />
            <div
              className="bg-slate-200 rounded-r-full h-full transition-all"
              style={{ width: `${(schedule[3]?.weightKg / totalKg) * 100}%` }}
            />
          </div>
        </div>

        {/* ADAPTIVE FEEDING RECOMMENDATION BANNER */}
        <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-teal-700 text-white text-[11px] font-medium">
                Đề xuất cân đối khẩu phần
              </span>
              <span className="text-xs text-slate-500 font-mono-num">
                Cập nhật lúc 11:30
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Dữ liệu âm thanh <strong>Hydrophone</strong> và sàng ăn ghi nhận tôm ăn hết <strong>100%</strong> sau 38
              phút ở Cữ 1 (DO <strong>5.8 mg/L</strong>, nhiệt độ <strong>29.4°C</strong>).{' '}
              <span className="font-semibold text-slate-900">
                Khuyến nghị tăng +3.0 kg cho Cữ 3 (14:30) và giữ nguyên Cữ 4 để đảm bảo an toàn oxy ban đêm.
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleApplyAi}
              disabled={!canEdit}
              className={`h-9 px-3.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                aiApplied
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {aiApplied ? <Check className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
              <span>{aiApplied ? 'Đã áp dụng (+3kg Cữ 3)' : 'Áp dụng đề xuất (+3kg Cữ 3)'}</span>
            </button>

            <button
              onClick={handleResetDefault}
              disabled={!canEdit}
              className={`h-9 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer flex items-center gap-1.5 ${
                !canEdit ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Đặt lại mặc định</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. 4-MEAL SCHEDULE CONFIGURATION */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Cấu hình chi tiết 4 cữ ăn trong ngày
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Điều chỉnh khối lượng cám và kiểm tra thông số xung phun cho từng khung giờ
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Chế độ rải:</span>
            <span className="rounded-md border border-slate-200 px-2.5 py-0.5 bg-slate-50 font-medium text-slate-800">
              Xung biến tần chống kẹt
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Cữ 1 */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <div className="text-xs text-slate-500 font-medium">
                    Cữ 1 • Sáng sớm
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5 font-mono-num">
                    07:00
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    Đã hoàn thành
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-3 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-500">Khối lượng:</span>
                  <div className="font-mono-num">
                    <span className="text-xl font-bold text-slate-900">20.0</span>
                    <span className="text-xs text-slate-500 ml-0.5">kg</span>
                  </div>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    disabled
                    className="flex-1 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono-num text-xs font-medium text-slate-300 cursor-not-allowed"
                  >
                    -2kg
                  </button>
                  <button
                    disabled
                    className="flex-1 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono-num text-xs font-medium text-slate-300 cursor-not-allowed"
                  >
                    +2kg
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian phun:</span>
                  <span className="font-medium text-slate-800 font-mono-num">07:00 - 07:25 (25p)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nhịp xung:</span>
                  <span className="font-medium text-slate-800 font-mono-num">4s phun / 25s nghỉ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tần số mâm:</span>
                  <span className="font-medium text-slate-800 font-mono-num">38 Hz (~8.0m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kết quả sàng ăn:</span>
                  <span className="text-emerald-600 font-semibold">Sạch 100%</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="text-xs text-slate-500 text-center py-1.5 rounded-lg bg-slate-100/80">
                Đã hoàn tất lúc 07:25
              </div>
            </div>
          </div>

          {/* Cữ 2 (ACTIVE) */}
          <div className="rounded-xl border-2 border-teal-600 bg-white p-4 flex flex-col justify-between space-y-4 relative">
            <div className="space-y-3.5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <div className="text-xs text-teal-700 font-semibold">
                    Cữ 2 • Buổi trưa (Đang rải)
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5 font-mono-num">
                    10:30
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-semibold font-mono-num">
                    Đạt 84%
                  </span>
                  <label className="inline-flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule[1]?.enabled}
                      onChange={() => handleToggleMeal(2)}
                      className="h-3.5 w-3.5 rounded text-teal-600 border-slate-300 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-slate-700">Bật</span>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-500">Định mức cữ:</span>
                  <div className="font-mono-num">
                    <span className="text-xl font-bold text-slate-900">
                      {schedule[1]?.weightKg.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 ml-0.5">kg</span>
                  </div>
                </div>
                <div className="text-xs font-mono-num text-slate-500 flex justify-between">
                  <span>
                    Đã rải: <strong className="text-slate-900">18.4 kg</strong>
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
                    className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 font-mono-num text-xs font-medium text-slate-800 transition cursor-pointer"
                  >
                    -2kg
                  </button>
                  <button
                    onClick={() => handleStepWeight(2, 2)}
                    className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 font-mono-num text-xs font-medium text-slate-800 transition cursor-pointer"
                  >
                    +2kg
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian phun:</span>
                  <span className="font-medium text-slate-800 font-mono-num">10:30 - 10:55 (25p)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nhịp xung:</span>
                  <span className="font-medium text-slate-800 font-mono-num">5s phun / 20s nghỉ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tần số mâm:</span>
                  <span className="font-medium text-slate-800 font-mono-num">42 Hz (~9.5m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dòng tải motor:</span>
                  <span className="font-medium text-slate-800 font-mono-num">1.82 A (Ổn định)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 pt-2.5 border-t border-slate-100">
              <button
                onClick={() => onShowToast('Cữ 2: Đã tạm dừng phun trong 10 phút để kiểm tra nhá.', 'info')}
                className="flex-1 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium transition cursor-pointer"
              >
                Tạm dừng
              </button>
              <button
                onClick={() => onShowToast('Đã dừng Cữ 2. Lượng cám còn lại được giữ trong phễu.', 'warning')}
                className="flex-1 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium transition cursor-pointer"
              >
                Kết thúc sớm
              </button>
            </div>
          </div>

          {/* Cữ 3 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <div className="text-xs text-slate-500 font-medium">
                    Cữ 3 • Buổi chiều
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5 font-mono-num">
                    14:30
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                    Chờ phun
                  </span>
                  <label className="inline-flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule[2]?.enabled}
                      onChange={() => handleToggleMeal(3)}
                      className="h-3.5 w-3.5 rounded text-teal-600 border-slate-300 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-slate-700">Bật</span>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-500">Khối lượng đặt:</span>
                  <div className="font-mono-num">
                    <span className="text-xl font-bold text-slate-900">
                      {schedule[2]?.weightKg.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 ml-0.5">kg</span>
                  </div>
                </div>
                <div className="text-xs font-mono-num text-slate-500 flex justify-between items-center">
                  <span>Chuẩn: 25.0 kg</span>
                  {schedule[2]?.weightKg > 25 ? (
                    <span className="text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[11px]">
                      +{schedule[2].weightKg - 25}kg đề xuất
                    </span>
                  ) : (
                    <span className="text-slate-600">Định mức chuẩn</span>
                  )}
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => handleStepWeight(3, -2)}
                    className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 font-mono-num text-xs font-medium text-slate-800 transition cursor-pointer"
                  >
                    -2kg
                  </button>
                  <button
                    onClick={() => handleStepWeight(3, 2)}
                    className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 font-mono-num text-xs font-medium text-slate-800 transition cursor-pointer"
                  >
                    +2kg
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian phun:</span>
                  <span className="font-medium text-slate-800 font-mono-num">14:30 - 15:02 (32p)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nhịp xung:</span>
                  <span className="font-medium text-slate-800 font-mono-num">5s phun / 20s nghỉ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tần số mâm:</span>
                  <span className="font-medium text-slate-800 font-mono-num">40 Hz (~8.8m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Góc rải quạt:</span>
                  <span className="font-medium text-slate-800">180° (Văng rộng)</span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100">
              <button
                onClick={() => handlePulseTest(3)}
                className="w-full py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-slate-500" />
                <span>Chạy thử xung (5s)</span>
              </button>
            </div>
          </div>

          {/* Cữ 4 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <div className="text-xs text-slate-500 font-medium">
                    Cữ 4 • Chập tối
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5 font-mono-num">
                    18:00
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                    Chờ phun
                  </span>
                  <label className="inline-flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule[3]?.enabled}
                      onChange={() => handleToggleMeal(4)}
                      className="h-3.5 w-3.5 rounded text-teal-600 border-slate-300 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-slate-700">Bật</span>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-500">Khối lượng đặt:</span>
                  <div className="font-mono-num">
                    <span className="text-xl font-bold text-slate-900">
                      {schedule[3]?.weightKg.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 ml-0.5">kg</span>
                  </div>
                </div>
                <div className="text-xs font-mono-num text-slate-500 flex justify-between">
                  <span>Chuẩn: 25.0 kg</span>
                  <span className="text-slate-600">Định mức an toàn</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => handleStepWeight(4, -2)}
                    className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 font-mono-num text-xs font-medium text-slate-800 transition cursor-pointer"
                  >
                    -2kg
                  </button>
                  <button
                    onClick={() => handleStepWeight(4, 2)}
                    className="flex-1 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 font-mono-num text-xs font-medium text-slate-800 transition cursor-pointer"
                  >
                    +2kg
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian phun:</span>
                  <span className="font-medium text-slate-800 font-mono-num">18:00 - 18:28 (28p)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nhịp xung:</span>
                  <span className="font-medium text-slate-800 font-mono-num">4s phun / 25s nghỉ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tần số mâm:</span>
                  <span className="font-medium text-slate-800 font-mono-num">35 Hz (~7.2m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Góc rải quạt:</span>
                  <span className="font-medium text-slate-800">120° (Hẹp tránh bờ)</span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100">
              <button
                onClick={() => handlePulseTest(4)}
                className="w-full py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-slate-500" />
                <span>Chạy thử xung (5s)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SAFETY INTERLOCKS & 4. CONTROLLER SYNC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT 7 COLS: SAFETY INTERLOCKS */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                Quy tắc ngắt an toàn tự động (Safety Interlocks)
              </h2>
            </div>
            <span className="text-xs text-slate-500">3 quy tắc bảo vệ</span>
          </div>

          <div className="space-y-3">
            {safetyRules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono-num font-medium border ${
                        rule.id === 'do-safeguard'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {rule.relayCode}
                    </span>
                    <span className="font-semibold text-sm text-slate-900">{rule.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>
                  <div className="font-mono-num text-xs text-slate-500 pt-0.5">{rule.currentValText}</div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleSafetyRule(rule.id)}
                      className="h-4 w-4 rounded text-teal-600 border-slate-300 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-800">Kích hoạt</span>
                  </label>
                  <span
                    className={`text-[11px] border px-2 py-0.5 rounded-full font-medium ${
                      rule.enabled
                        ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
                        : 'text-slate-500 border-slate-200 bg-slate-100'
                    }`}
                  >
                    {rule.enabled ? 'Đang bảo vệ' : 'Đã tắt'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT 5 COLS: CONTROLLER SYNC */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">
                Đồng bộ lịch xuống tủ điều khiển
              </h2>
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Sẵn sàng
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                Lịch cho ăn 4 cữ, định mức khối lượng và các quy tắc ngắt an toàn sẽ được lưu trực tiếp vào bộ nhớ tủ điều khiển tại bờ ao để đảm bảo máy vận hành ổn định ngay cả khi mất kết nối mạng.
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Chế độ vận hành:</span>
                  <span className="font-medium text-slate-900">Tự động độc lập tại tủ máy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trạng thái kết nối:</span>
                  <span className="text-emerald-700 font-medium">Trực tuyến</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lần đồng bộ gần nhất:</span>
                  <span className="font-mono-num font-medium text-slate-900">{lastSyncTime}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleMasterSync}
              disabled={isSyncingHw}
              type="button"
              className={`w-full h-10 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                isSyncingHw
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Save className={`w-4 h-4 ${isSyncingHw ? 'animate-spin' : ''}`} />
              <span>{isSyncingHw ? 'Đang lưu & đồng bộ xuống tủ máy...' : 'Lưu & Đồng bộ lịch xuống tủ điều khiển'}</span>
            </button>
            <div className="text-[11px] text-slate-400 text-center">
              Tự động duy trì lịch rải cám chính xác khi mất kết nối Internet
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
