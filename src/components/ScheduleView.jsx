import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Save, 
  Check, 
  Play,
  ShieldCheck,
  CalendarClock,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ScheduleView = ({
  schedule,
  safetyRules,
  onUpdateSchedule,
  onUpdateSafetyRules,
  onShowToast,
  pondCode = 'Ao Bạt A1',
  pondArea = '1.500 m²',
}) => {
  const { role } = useAuth();
  const canEdit = role === 'manager' || role === 'admin';
  const [aiApplied, setAiApplied] = useState(true);
  const [isSyncingHw, setIsSyncingHw] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Hôm nay, 14:15:10');

  // Compute totals
  const totalKg = schedule.reduce((sum, item) => (item.enabled ? sum + item.weightKg : sum), 0);
  const sprayedKg = 32.3;
  const remainingKg = Math.max(0, totalKg - sprayedKg);

  // Stepper logic
  const handleStepWeight = (mealId, delta) => {
    const updated = schedule.map((item) => {
      if (item.id === mealId) {
        const next = Math.max(2, parseFloat((item.weightKg + delta).toFixed(1)));
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
        return { ...item, weightKg: 12.6, aiAddedKg: 0.6 };
      }
      return item;
    });
    setAiApplied(true);
    onUpdateSchedule(updated);
    onShowToast('Đã áp dụng gợi ý AI ShrimpMate-FeedOpt-v2 (+5% lượng cám Cữ 3).', 'success');
  };

  // Reset Default
  const handleResetDefault = () => {
    const updated = schedule.map((item) => {
      if (item.id === 3) {
        return { ...item, weightKg: 12.0, aiAddedKg: 0 };
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
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-[#0B1C30] tracking-tight font-display">
              Lịch cho ăn tự động & Cân đối khẩu phần AI
            </h1>
            <span className="px-3 py-1 rounded-full bg-[#EFF4FF] border border-[#D3E4FE] text-xs font-bold text-[#006398]">
              {pondCode} ({pondArea})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Thiết lập định mức 4 cữ ăn trong ngày, tự động điều chỉnh theo chỉ số thèm ăn FIS và Safety Rule Engine.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0">
          <div className="rounded-full border border-[#7CF994] bg-[#E8F5E9] px-3.5 py-1.5 text-[#006E2D] flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-[#006E2D]" />
            <span>Bộ hẹn giờ độc lập: Hoạt động</span>
          </div>
        </div>
      </div>

      {/* 1. AI FEED RECOMMENDATION BANNER (Synced with Mobile & Stitch) */}
      <section className="rounded-2xl border border-[#FFDBCA] bg-[#FFF8F5] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FB923C] to-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#9D4300]">
                Gợi ý Khẩu phần AI (ShrimpMate-FeedOpt-v2)
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#EA580C] border border-[#FFDBCA]">
                Độ tin cậy 94%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#0B1C30] leading-relaxed">
              Dựa trên tuổi tôm <strong>45 DOC</strong>, nhiệt độ <strong>28.5°C</strong> và chỉ số thèm ăn <strong>FIS = Mức 3 (Ăn mạnh - sạch nhá 92%)</strong>, hệ thống đề xuất tăng <strong>+5%</strong> định mức cữ chiều (14:30) từ 12.0 kg lên <strong>12.6 kg</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleApplyAi}
            disabled={!canEdit}
            className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              aiApplied
                ? 'bg-[#006E2D] hover:bg-[#005320] text-white'
                : 'bg-[#EA580C] hover:bg-[#C2410C] text-white'
            } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {aiApplied ? <Check className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
            <span>{aiApplied ? 'Đã áp dụng (+5% Cữ 3)' : 'Áp dụng đề xuất (+5%)'}</span>
          </button>

          <button
            onClick={handleResetDefault}
            disabled={!canEdit}
            className={`h-9 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer flex items-center gap-1.5 ${
              !canEdit ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Mặc định</span>
          </button>
        </div>
      </section>

      {/* 2. DAILY FEED SUMMARY KPIs */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#EA580C]" />
            <h2 className="text-sm font-bold text-[#0B1C30]">
              Tổng quan khẩu phần ngày
            </h2>
          </div>
          <div className="text-xs text-slate-500">
            Loại cám: <strong className="text-[#0B1C30] font-bold">Grobest High-Protein Số 2 (1.8mm)</strong> • Tuổi tôm:{' '}
            <strong className="text-[#EA580C] font-bold font-mono-num">45 DOC</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 border-l-4 border-l-[#EA580C] bg-[#F8F9FF] p-4">
            <div className="text-xs font-bold uppercase text-slate-500">
              Tổng kế hoạch 4 cữ
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-extrabold text-[#0B1C30] font-mono-num">
                {totalKg.toFixed(1)}
              </span>
              <span className="font-mono-num text-xs font-semibold text-slate-500">kg</span>
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
              <span>Sinh khối ước tính:</span>
              <span className="font-bold text-[#0B1C30] font-mono-num">~3.8 tấn tôm</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 border-l-4 border-l-[#006E2D] bg-white p-4">
            <div className="text-xs font-bold uppercase text-slate-500">
              Đã rải thực tế
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-extrabold text-[#006E2D] font-mono-num">
                {sprayedKg.toFixed(1)}
              </span>
              <span className="font-mono-num text-xs font-semibold text-slate-500">
                / {totalKg.toFixed(1)} kg
              </span>
            </div>
            <div className="mt-3 text-xs flex items-center justify-between border-t border-slate-200/60 pt-2">
              <span className="text-slate-500">Tiến độ hôm nay:</span>
              <span className="font-bold text-[#006E2D] bg-[#E8F5E9] px-2 py-0.5 rounded-full text-[11px] font-mono-num">
                {((sprayedKg / totalKg) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 border-l-4 border-l-[#006398] bg-[#F8F9FF] p-4">
            <div className="text-xs font-bold uppercase text-slate-500">
              Lượng còn lại trong ngày
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-extrabold text-[#006398] font-mono-num">
                {remainingKg.toFixed(1)}
              </span>
              <span className="font-mono-num text-xs font-semibold text-slate-500">kg</span>
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
              <span>Tồn phễu chứa:</span>
              <span className="font-bold text-[#006E2D] font-mono-num">58.0 kg (Đủ cám)</span>
            </div>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 rounded-full bg-[#FFDBCA]/60 flex overflow-hidden p-0.5 gap-0.5">
            <div
              className="bg-[#006E2D] rounded-l-full h-full transition-all"
              style={{ width: `${(schedule[0]?.weightKg / totalKg) * 100}%` }}
            />
            <div
              className="bg-[#006E2D] h-full transition-all"
              style={{ width: `${(schedule[1]?.weightKg / totalKg) * 100}%` }}
            />
            <div
              className="bg-[#EA580C] h-full transition-all"
              style={{ width: `${(schedule[2]?.weightKg / totalKg) * 100}%` }}
            />
            <div
              className="bg-[#FFDBCA] rounded-r-full h-full transition-all"
              style={{ width: `${(schedule[3]?.weightKg / totalKg) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* 3. 4-MEAL SCHEDULE CONFIGURATION CARDS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#0B1C30]">
              Cấu hình chi tiết 4 cữ ăn trong ngày
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Điều chỉnh khối lượng cám và kiểm tra thông số xung phun cho từng khung giờ
            </p>
          </div>
          <span className="rounded-full border border-[#FFDBCA] px-3 py-1 bg-[#FFF8F5] text-xs font-bold text-[#9D4300]">
            Chế độ xung biến tần chống kẹt
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {schedule.map((meal) => {
            const isCompleted = meal.status === 'completed';
            const isActive = meal.status === 'active';

            return (
              <div
                key={meal.id}
                className={`rounded-2xl p-4 flex flex-col justify-between space-y-4 transition ${
                  isActive
                    ? 'border-2 border-[#EA580C] bg-[#FFF8F5]/60 shadow-sm'
                    : isCompleted
                    ? 'border border-slate-200 bg-[#F8F9FF]'
                    : 'border border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between border-b border-slate-200/70 pb-2.5">
                    <div>
                      <div className={`text-xs font-bold ${isActive ? 'text-[#EA580C]' : 'text-slate-500'}`}>
                        {meal.label}
                      </div>
                      <div className="text-2xl font-extrabold text-[#0B1C30] mt-0.5 font-mono-num">
                        {meal.time}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-[#EA580C] text-white'
                            : isCompleted
                            ? 'bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]'
                            : 'bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE]'
                        }`}
                      >
                        {meal.statusBadge}
                      </span>
                      {!isCompleted && (
                        <label className="inline-flex items-center gap-1.5 mt-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={meal.enabled}
                            onChange={() => handleToggleMeal(meal.id)}
                            className="h-3.5 w-3.5 rounded text-[#EA580C] border-slate-300 focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-slate-700">Bật</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-white p-3 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 font-medium">Định mức cữ:</span>
                      <div className="font-mono-num">
                        <span className={`text-xl font-extrabold ${isActive ? 'text-[#EA580C]' : 'text-[#0B1C30]'}`}>
                          {meal.weightKg.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-500 ml-0.5">kg</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <button
                        disabled={isCompleted}
                        onClick={() => handleStepWeight(meal.id, -1)}
                        className={`flex-1 py-1 rounded-lg border font-mono-num text-xs font-bold transition ${
                          isCompleted
                            ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                            : 'bg-[#F8F9FF] hover:bg-[#FFDBCA]/40 border-slate-200 text-[#0B1C30] cursor-pointer'
                        }`}
                      >
                        -1.0 kg
                      </button>
                      <button
                        disabled={isCompleted}
                        onClick={() => handleStepWeight(meal.id, 1)}
                        className={`flex-1 py-1 rounded-lg border font-mono-num text-xs font-bold transition ${
                          isCompleted
                            ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                            : 'bg-[#F8F9FF] hover:bg-[#FFDBCA]/40 border-slate-200 text-[#0B1C30] cursor-pointer'
                        }`}
                      >
                        +1.0 kg
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Thời lượng:</span>
                      <span className="font-semibold text-[#0B1C30] font-mono-num">{meal.timeRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nhịp xung:</span>
                      <span className="font-semibold text-[#0B1C30] font-mono-num">{meal.pulseConfig}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bán kính VFD:</span>
                      <span className="font-semibold text-[#006398] font-mono-num">
                        {meal.discFreq} ({meal.discDistance})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200/70">
                  {isCompleted ? (
                    <div className="text-xs font-bold text-[#006E2D] text-center py-1.5 rounded-xl bg-[#E8F5E9]">
                      ✓ Đã hoàn tất ({meal.trayCheckResult || '100%'})
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePulseTest(meal.id)}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-[#EA580C] hover:bg-[#C2410C] text-white'
                          : 'bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#006398] border border-[#D3E4FE]'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Đang rải tự động' : 'Chạy thử xung (5s)'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SAFETY INTERLOCKS & CONTROLLER SYNC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#006E2D]" />
              <h2 className="text-sm font-bold text-[#0B1C30]">
                Quy tắc khóa liên động an toàn (Safety Rule Engine)
              </h2>
            </div>
            <span className="text-xs font-bold text-[#006E2D] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full">
              {safetyRules.filter((r) => r.enabled).length}/{safetyRules.length} Rules Active
            </span>
          </div>

          <div className="space-y-3">
            {safetyRules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-xl border border-slate-200 bg-[#F8F9FF] p-4 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-num font-bold bg-[#FFDAD6] text-[#93000A]">
                      {rule.relayCode}
                    </span>
                    <span className="font-bold text-sm text-[#0B1C30]">{rule.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>
                  <div className="font-mono-num text-xs font-semibold text-[#006E2D] pt-0.5">
                    {rule.currentValText}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleSafetyRule(rule.id)}
                      className="h-4 w-4 rounded text-[#006E2D] border-slate-300 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[#0B1C30]">Kích hoạt</span>
                  </label>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                      rule.enabled
                        ? 'text-[#006E2D] bg-[#E8F5E9] border border-[#7CF994]'
                        : 'text-slate-500 bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {rule.enabled ? 'Đang bảo vệ' : 'Đã tắt'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-[#0B1C30]">
                Đồng bộ lịch xuống tủ điều khiển IoT
              </h2>
              <span className="text-xs text-[#006E2D] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#006E2D]" />
                Trực tuyến
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                Lịch cho ăn 4 cữ, định mức khối lượng và các quy tắc Safety Rule Engine sẽ được nạp xuống tủ điều khiển tại bờ ao để đảm bảo máy vận hành chính xác ngay cả khi mất kết nối mạng.
              </p>

              <div className="rounded-xl border border-[#D3E4FE] bg-[#EFF4FF] p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#006398]">Chế độ vận hành:</span>
                  <span className="font-bold text-[#0B1C30]">Tự động độc lập tại tủ máy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#006398]">Giao thức đồng bộ:</span>
                  <span className="text-[#006E2D] font-bold">MQTT QoS 1 (14ms)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#006398]">Lần đồng bộ gần nhất:</span>
                  <span className="font-mono-num font-bold text-[#0B1C30]">{lastSyncTime}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleMasterSync}
              disabled={isSyncingHw}
              type="button"
              className={`w-full h-10 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                isSyncingHw
                  ? 'bg-[#F59E0B] text-white'
                  : 'bg-gradient-to-r from-[#FB923C] to-[#EA580C] hover:opacity-95 text-white'
              }`}
            >
              <Save className={`w-4 h-4 ${isSyncingHw ? 'animate-spin' : ''}`} />
              <span>
                {isSyncingHw ? 'Đang nạp xuống tủ điều khiển...' : 'Lưu & Đồng bộ lịch xuống tủ điều khiển'}
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
