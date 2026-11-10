import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Save,
  Play,
  ShieldCheck,
  CalendarClock,
  Plus,
  Trash2,
  Building2,
  Droplets,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { feedingService } from '../services/feedingService';
import { safetyRuleService } from '../services/safetyRuleService';
import { getErrorMessage } from '../services/apiClient';
import { ConfirmModal } from './common/ConfirmModal';
import { useConfirm } from '../hooks/useConfirm';

export const ScheduleView = ({
  ponds = [],
  selectedPond = null,
  onSelectPond,
  safetyRules = [],
  onRefreshData,
  onShowToast,
}) => {
  const { confirm, confirmProps } = useConfirm();
  const { role } = useAuth();
  const canEdit = role === 'manager' || role === 'admin';
  const isAdmin = role === 'admin';

  const [schedules, setSchedules] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [createScheduleError, setCreateScheduleError] = useState('');
  const [scheduleActionError, setScheduleActionError] = useState('');
  const [safetyRuleError, setSafetyRuleError] = useState('');
  const [isSyncingHw, setIsSyncingHw] = useState(false);

  // Form thêm cữ ăn mới
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: 'Cữ ăn mới',
    timeOfDay: '07:00',
    feedAmountKg: 10,
    spreadRateKgPerMinute: 1.5,
  });

  const loadPondScheduleData = useCallback(async () => {
    if (!selectedPond?.id) {
      setSchedules([]);
      setRecords([]);
      setLoadError('');
      return;
    }
    setLoading(true);
    setLoadError('');
    setCreateScheduleError('');
    setScheduleActionError('');
    setSafetyRuleError('');
    try {
      const [schedRes, recRes] = await Promise.allSettled([
        feedingService.getSchedules(selectedPond.id),
        feedingService.getRecords(selectedPond.id),
      ]);

      const errs = [];
      if (schedRes.status === 'fulfilled') {
        const schedData = schedRes.value;
        const sorted = (Array.isArray(schedData) ? schedData : (schedData?.data || [])).sort((a, b) =>
          String(a.timeOfDay || '').localeCompare(String(b.timeOfDay || '')),
        );
        setSchedules(sorted);
      } else {
        setSchedules([]);
        errs.push(getErrorMessage(schedRes.reason, 'Không thể tải danh sách lịch cho ăn.'));
      }

      if (recRes.status === 'fulfilled') {
        const recData = recRes.value;
        setRecords(Array.isArray(recData) ? recData : (recData?.data || []));
      } else {
        setRecords([]);
        errs.push(getErrorMessage(recRes.reason, 'Không thể tải lịch sử cữ ăn.'));
      }

      if (errs.length > 0) {
        setLoadError(errs[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedPond?.id]);

  useEffect(() => {
    loadPondScheduleData();
  }, [loadPondScheduleData]);

  // Empty state khi chưa có ao nuôi
  if (!ponds || ponds.length === 0 || !selectedPond) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-[#EFF4FF] text-[#006398] flex items-center justify-center mx-auto">
          <Droplets className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[#0B1C30]">
          Chưa có ao nuôi nào để thiết lập lịch cho ăn
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Vui lòng tạo trang trại và khai báo ao nuôi trước khi cấu hình các khung giờ rải cám tự động trong ngày.
        </p>
      </div>
    );
  }

  // Tính toán tổng định mức thực tế từ DB
  const totalKg = schedules.reduce(
    (sum, item) => (item.isEnabled ? sum + Number(item.feedAmountKg || 0) : sum),
    0,
  );
  const sprayedKg = records
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + Number(r.actualAmountKg || r.requestedAmountKg || 0), 0);
  const remainingKg = Math.max(0, totalKg - sprayedKg);

  // Điều chỉnh khối lượng cữ ăn trực tiếp xuống Backend
  const handleStepWeight = async (sched, delta) => {
    if (!canEdit) return;
    setScheduleActionError('');
    const nextWeight = Math.max(0.5, Number((Number(sched.feedAmountKg) + delta).toFixed(1)));
    try {
      await feedingService.updateSchedule(sched.id, { feedAmountKg: nextWeight });
      setSchedules((prev) =>
        prev.map((item) => (item.id === sched.id ? { ...item, feedAmountKg: nextWeight } : item)),
      );
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setScheduleActionError(getErrorMessage(err, 'Không thể cập nhật khối lượng cữ ăn.'));
    }
  };

  // Bật / tắt cữ ăn
  const handleToggleMeal = async (sched) => {
    if (!canEdit) return;
    setScheduleActionError('');
    const nextEnabled = !sched.isEnabled;
    try {
      await feedingService.updateSchedule(sched.id, { isEnabled: nextEnabled });
      setSchedules((prev) =>
        prev.map((item) => (item.id === sched.id ? { ...item, isEnabled: nextEnabled } : item)),
      );
      onShowToast?.(
        `Đã ${nextEnabled ? 'bật' : 'tắt'} ${sched.name} (${sched.timeOfDay}).`,
        'info',
      );
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setScheduleActionError(getErrorMessage(err, 'Không thể cập nhật trạng thái cữ ăn.'));
    }
  };

  // Tạo cữ ăn mới
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!canEdit || !selectedPond?.id) return;
    setCreateScheduleError('');
    try {
      await feedingService.createSchedule(selectedPond.id, {
        name: newSchedule.name,
        timeOfDay: newSchedule.timeOfDay,
        feedAmountKg: Number(newSchedule.feedAmountKg),
        spreadRateKgPerMinute: Number(newSchedule.spreadRateKgPerMinute || 1.5),
        daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
        isEnabled: true,
      });
      setShowAddForm(false);
      setNewSchedule({
        name: `Cữ ăn #${schedules.length + 2}`,
        timeOfDay: '11:00',
        feedAmountKg: 10,
        spreadRateKgPerMinute: 1.5,
      });
      onShowToast?.('Đã thêm khung giờ cho ăn mới vào cơ sở dữ liệu.', 'success');
      await loadPondScheduleData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setCreateScheduleError(getErrorMessage(err, 'Không thể tạo lịch cho ăn mới.'));
    }
  };

  // Tạo nhanh bộ 4 cữ tiêu chuẩn nếu ao chưa có lịch
  const handleCreateDefaultFourMeals = async () => {
    if (!canEdit || !selectedPond?.id) return;
    setScheduleActionError('');
    const defaultMeals = [
      { name: 'Cữ 1 - Sáng sớm', timeOfDay: '06:30', feedAmountKg: 10.0, spreadRateKgPerMinute: 1.5 },
      { name: 'Cữ 2 - Giữa trưa', timeOfDay: '10:30', feedAmountKg: 12.0, spreadRateKgPerMinute: 1.5 },
      { name: 'Cữ 3 - Buổi chiều', timeOfDay: '14:30', feedAmountKg: 12.5, spreadRateKgPerMinute: 1.5 },
      { name: 'Cữ 4 - Chiều tối', timeOfDay: '17:30', feedAmountKg: 9.0, spreadRateKgPerMinute: 1.2 },
    ];
    try {
      for (const meal of defaultMeals) {
        await feedingService.createSchedule(selectedPond.id, {
          ...meal,
          daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
          isEnabled: true,
        });
      }
      onShowToast?.('Đã khởi tạo lịch 4 cữ ăn tiêu chuẩn cho ao nuôi.', 'success');
      await loadPondScheduleData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setScheduleActionError(getErrorMessage(err, 'Không thể tạo bộ lịch mẫu.'));
    }
  };

  // Xóa cữ ăn
  const handleDeleteSchedule = async (sched) => {
    if (!canEdit) return;
    const ok = await confirm({
      title: 'Xóa khung giờ cho ăn',
      message: `Bạn có chắc muốn xóa "${sched.name} (${sched.timeOfDay})"?`,
      detail: 'Khung giờ này sẽ bị xóa khỏi lịch cho ăn tự động của ao.',
      confirmText: 'Xóa cữ ăn',
      variant: 'danger',
    });
    if (!ok) return;
    setScheduleActionError('');
    try {
      await feedingService.deleteSchedule(sched.id);
      onShowToast?.(`Đã xóa ${sched.name}.`, 'info');
      await loadPondScheduleData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setScheduleActionError(getErrorMessage(err, 'Không thể xóa lịch cho ăn.'));
    }
  };

  // Kích hoạt cữ ăn thực tế từ lịch
  const handleRunScheduleNow = async (sched) => {
    setScheduleActionError('');
    if (!selectedPond?.feederDevice?.id) {
      setScheduleActionError(
        'Ao nuôi này chưa được gán máy cho ăn tự động (feeder). Vui lòng gán thiết bị trước.'
      );
      return;
    }
    try {
      const record = await feedingService.createRecord(selectedPond.id, {
        deviceId: selectedPond.feederDevice.id,
        scheduleId: sched.id,
        requestedAmountKg: Number(sched.feedAmountKg),
        source: 'schedule',
      });
      if (record.status === 'blocked_by_safety') {
        setScheduleActionError(
          `Lệnh rải bị chặn bởi quy tắc an toàn: ${record.blockedReason || 'Thông số nước vượt ngưỡng'}`
        );
      } else {
        onShowToast?.(
          `Đã kích hoạt ${sched.name} (${Number(sched.feedAmountKg).toFixed(1)} kg).`,
          'success',
        );
      }
      await loadPondScheduleData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setScheduleActionError(getErrorMessage(err, 'Không thể kích hoạt cữ cho ăn.'));
    }
  };

  // Bật / tắt quy tắc an toàn (Safety Rule Engine)
  const handleToggleSafetyRule = async (rule) => {
    setSafetyRuleError('');
    if (!isAdmin) {
      setSafetyRuleError('Chỉ quản trị viên hệ thống mới có quyền bật/tắt quy tắc an toàn toàn cục.');
      return;
    }
    const nextEnabled = !rule.isEnabled;
    try {
      await safetyRuleService.updateSafetyRule(rule.id, { isEnabled: nextEnabled });
      onShowToast?.(
        `Quy tắc "${rule.name}": ${nextEnabled ? 'Đang bảo vệ' : 'Đã tạm tắt'}`,
        'info',
      );
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setSafetyRuleError(getErrorMessage(err, 'Không thể cập nhật quy tắc an toàn.'));
    }
  };

  const handleMasterSync = async () => {
    if (isSyncingHw) return;
    setIsSyncingHw(true);
    await loadPondScheduleData();
    if (onRefreshData) await onRefreshData();
    setIsSyncingHw(false);
    onShowToast?.('Đã làm mới và đồng bộ dữ liệu lịch cho ăn từ máy chủ.', 'success');
  };

  return (
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-[#0B1C30] tracking-tight font-display">
              Lịch cho ăn tự động & Quy tắc an toàn môi trường
            </h1>
            <span className="px-3 py-1 rounded-full bg-[#EFF4FF] border border-[#D3E4FE] text-xs font-bold text-[#006398] inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              {selectedPond.farmName} • {selectedPond.code} ({selectedPond.name})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Thiết lập khung giờ và định mức cám trong ngày cho từng ao nuôi, kết hợp khóa liên động an toàn (Safety Rule Engine).
          </p>
        </div>

        {/* Bộ chọn ao nuôi */}
        <div className="flex items-center gap-2 text-xs shrink-0 flex-wrap">
          <select
            value={selectedPond.id}
            onChange={(e) => onSelectPond?.(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#0B1C30] focus:outline-none focus:border-[#006398]"
          >
            {ponds.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.farmName}] {p.code} – {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={ loadPondScheduleData }
            disabled={loading}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* 1. DAILY FEED SUMMARY KPIs */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#EA580C]" />
            <h2 className="text-sm font-bold text-[#0B1C30]">
              Tổng quan khẩu phần ngày của {selectedPond.name} ({selectedPond.code})
            </h2>
          </div>
          <div className="text-xs text-slate-500">
            Diện tích: <strong className="text-[#0B1C30] font-bold">{selectedPond.areaM2} m²</strong> • Tuổi tôm:{' '}
            <strong className="text-[#EA580C] font-bold font-mono-num">
              {selectedPond.doc > 0 ? `${selectedPond.doc} ngày tuổi` : 'Chưa thả giống'}
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 border-l-4 border-l-[#EA580C] bg-[#F8F9FF] p-4">
            <div className="text-xs font-bold uppercase text-slate-500">
              Tổng định mức kế hoạch ({schedules.filter((s) => s.isEnabled).length} cữ đang bật)
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-extrabold text-[#0B1C30] font-mono-num">
                {totalKg.toFixed(1)}
              </span>
              <span className="font-mono-num text-xs font-semibold text-slate-500">kg / ngày</span>
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
              <span>Tổng số khung giờ:</span>
              <span className="font-bold text-[#0B1C30] font-mono-num">{schedules.length} cữ ăn</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 border-l-4 border-l-[#006E2D] bg-white p-4">
            <div className="text-xs font-bold uppercase text-slate-500">
              Đã rải hoàn tất (Ghi nhận thực tế)
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
              <span className="text-slate-500">Số lần cho ăn đã ghi nhận:</span>
              <span className="font-bold text-[#006E2D] bg-[#E8F5E9] px-2 py-0.5 rounded-full text-[11px] font-mono-num">
                {records.length} lượt
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 border-l-4 border-l-[#006398] bg-[#F8F9FF] p-4">
            <div className="text-xs font-bold uppercase text-slate-500">
              Định mức còn lại trong ngày
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-extrabold text-[#006398] font-mono-num">
                {remainingKg.toFixed(1)}
              </span>
              <span className="font-mono-num text-xs font-semibold text-slate-500">kg</span>
            </div>
            <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
              <span>Thiết bị máy cho ăn:</span>
              <span className="font-bold text-[#0B1C30] font-mono-num">
                {selectedPond.feederDevice ? selectedPond.feederDevice.name : 'Chưa gán thiết bị'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SCHEDULE CONFIGURATION CARDS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#0B1C30]">
              Danh sách khung giờ cho ăn tự động ({schedules.length} cữ)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Điều chỉnh khối lượng cám hoặc thêm khung giờ cho ăn mới trực tiếp vào hệ thống
            </p>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              {schedules.length === 0 && (
                <button
                  onClick={handleCreateDefaultFourMeals}
                  className="h-9 px-3.5 rounded-xl bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#006398] border border-[#D3E4FE] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Khởi tạo nhanh 4 cữ chuẩn</span>
                </button>
              )}
              <button
                onClick={() => {
                  setCreateScheduleError('');
                  setShowAddForm(!showAddForm);
                }}
                className="h-9 px-3.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm khung giờ ăn</span>
              </button>
            </div>
          )}
        </div>

        {scheduleActionError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{scheduleActionError}</span>
          </div>
        )}

        {/* Form thêm khung giờ mới */}
        {showAddForm && canEdit && (
          <form
            onSubmit={handleCreateSchedule}
            className="rounded-xl border border-[#FFDBCA] bg-[#FFF8F5] p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
          >
            {createScheduleError && (
              <div className="sm:col-span-5 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{createScheduleError}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-[#0B1C30] mb-1">Tên cữ ăn</label>
              <input
                type="text"
                required
                value={newSchedule.name}
                onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                placeholder="VD: Cữ 1 - Sáng"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0B1C30] mb-1">Giờ cho ăn (HH:mm)</label>
              <input
                type="time"
                required
                value={newSchedule.timeOfDay}
                onChange={(e) => setNewSchedule({ ...newSchedule, timeOfDay: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-mono-num font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0B1C30] mb-1">Khối lượng (kg)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={newSchedule.feedAmountKg}
                onChange={(e) => setNewSchedule({ ...newSchedule, feedAmountKg: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-mono-num font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0B1C30] mb-1">Tốc độ phun (kg/phút)</label>
              <input
                type="number"
                step="0.1"
                min="0.2"
                required
                value={newSchedule.spreadRateKgPerMinute}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, spreadRateKgPerMinute: e.target.value })
                }
                className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-mono-num font-bold"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 h-9 rounded-lg bg-[#006E2D] hover:bg-[#005320] text-white text-xs font-bold cursor-pointer"
              >
                Lưu cữ ăn
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        )}

        {schedules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-[#0B1C30]">
              Ao {selectedPond.name} chưa có lịch cho ăn tự động nào
            </div>
            <p className="text-xs text-slate-500">
              Nhấn &ldquo;Khởi tạo nhanh 4 cữ chuẩn&rdquo; hoặc &ldquo;Thêm khung giờ ăn&rdquo; ở góc trên để tạo lịch cho ăn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {schedules.map((meal) => {
              const weightKg = Number(meal.feedAmountKg || 0);
              const rateKgMin = Number(meal.spreadRateKgPerMinute || 1.5);
              const estMinutes = Math.max(1, Math.round(weightKg / rateKgMin));

              return (
                <div
                  key={meal.id}
                  className={`rounded-2xl p-4 flex flex-col justify-between space-y-4 transition ${
                    meal.isEnabled
                      ? 'border border-slate-200 bg-white shadow-2xs'
                      : 'border border-slate-200 bg-slate-50 opacity-75'
                  }`}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between border-b border-slate-200/70 pb-2.5">
                      <div>
                        <div className="text-xs font-bold text-slate-600">{meal.name}</div>
                        <div className="text-2xl font-extrabold text-[#0B1C30] mt-0.5 font-mono-num">
                          {meal.timeOfDay}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                            meal.isEnabled
                              ? 'bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {meal.isEnabled ? 'Đang bật' : 'Đã tắt'}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!meal.isEnabled}
                              disabled={!canEdit}
                              onChange={() => handleToggleMeal(meal)}
                              className="h-3.5 w-3.5 rounded text-[#EA580C] border-slate-300 focus:ring-0 cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-slate-700">Kích hoạt</span>
                          </label>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(meal)}
                              title="Xóa cữ ăn"
                              className="text-slate-400 hover:text-red-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-[#F8F9FF] p-3 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-500 font-medium">Định mức cữ:</span>
                        <div className="font-mono-num">
                          <span className="text-xl font-extrabold text-[#0B1C30]">
                            {weightKg.toFixed(1)}
                          </span>
                          <span className="text-xs text-slate-500 ml-0.5">kg</span>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleStepWeight(meal, -0.5)}
                            className="flex-1 py-1 rounded-lg border bg-white hover:bg-[#FFDBCA]/40 border-slate-200 text-[#0B1C30] font-mono-num text-xs font-bold transition cursor-pointer"
                          >
                            -0.5 kg
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStepWeight(meal, 0.5)}
                            className="flex-1 py-1 rounded-lg border bg-white hover:bg-[#FFDBCA]/40 border-slate-200 text-[#0B1C30] font-mono-num text-xs font-bold transition cursor-pointer"
                          >
                            +0.5 kg
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tốc độ rải:</span>
                        <span className="font-semibold text-[#0B1C30] font-mono-num">
                          {rateKgMin.toFixed(1)} kg/phút
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Thời gian phun dự kiến:</span>
                        <span className="font-semibold text-[#006398] font-mono-num">
                          ~{estMinutes} phút
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => handleRunScheduleNow(meal)}
                      className="w-full py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#006398] border border-[#D3E4FE]"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Kích hoạt rải cữ này ngay</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. SAFETY INTERLOCKS & CONTROLLER SYNC */}
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
              {safetyRules.filter((r) => r.isEnabled ?? r.enabled).length}/{safetyRules.length} quy tắc đang bật
            </span>
          </div>

          {safetyRuleError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{safetyRuleError}</span>
            </div>
          )}

          {safetyRules.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">
              {isAdmin
                ? 'Chưa có quy tắc an toàn nào trong cơ sở dữ liệu.'
                : 'Bộ quy tắc an toàn toàn cục do Quản trị viên (Admin) quản lý và tự động bảo vệ tại Backend mỗi khi phát lệnh cho ăn.'}
            </div>
          ) : (
            <div className="space-y-3">
              {safetyRules.map((rule) => {
                const isEnabled = rule.isEnabled ?? rule.enabled;
                const code = rule.code || rule.relayCode || 'RULE';
                const title = rule.name || rule.title;
                const reason =
                  rule.action?.reason ||
                  rule.description ||
                  `Ngưỡng ${rule.condition?.parameter || ''} ${rule.condition?.operator || ''} ${rule.condition?.threshold ?? ''}`;

                return (
                  <div
                    key={rule.id}
                    className="rounded-xl border border-slate-200 bg-[#F8F9FF] p-4 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-num font-bold bg-[#FFDAD6] text-[#93000A]">
                          {code}
                        </span>
                        <span className="font-bold text-sm text-[#0B1C30]">{title}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{reason}</p>
                      {rule.condition && (
                        <div className="font-mono-num text-xs font-semibold text-[#006398] pt-0.5">
                          Điều kiện: {rule.condition.parameter} {rule.condition.operator}{' '}
                          {rule.condition.threshold} → Hành động: {rule.action?.type || 'STOP_FEEDING'}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!isEnabled}
                          disabled={!isAdmin}
                          onChange={() => handleToggleSafetyRule(rule)}
                          className="h-4 w-4 rounded text-[#006E2D] border-slate-300 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-[#0B1C30]">Kích hoạt</span>
                      </label>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          isEnabled
                            ? 'text-[#006E2D] bg-[#E8F5E9] border border-[#7CF994]'
                            : 'text-slate-500 bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {isEnabled ? 'Đang bảo vệ' : 'Đã tắt'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-[#0B1C30]">
                Trạng thái đồng bộ lịch & kiểm tra an toàn
              </h2>
              <span className="text-xs text-[#006E2D] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#006E2D]" />
                Đồng bộ thời gian thực
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                Mọi thay đổi về khung giờ cho ăn, định mức khối lượng cám và quy tắc khóa liên động an toàn được lưu trữ trực tiếp trên máy chủ và áp dụng tự động trước mỗi lần kích hoạt máy rải cám.
              </p>

              <div className="rounded-xl border border-[#D3E4FE] bg-[#EFF4FF] p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#006398]">Ao đang cấu hình:</span>
                  <span className="font-bold text-[#0B1C30]">
                    {selectedPond.name} ({selectedPond.code})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#006398]">Trang trại trực thuộc:</span>
                  <span className="font-bold text-[#0B1C30]">{selectedPond.farmName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#006398]">Tình trạng DO hiện tại:</span>
                  <span className="font-mono-num font-bold text-[#006E2D]">
                    {selectedPond.do != null ? `${Number(selectedPond.do).toFixed(2)} mg/L` : 'Chưa có số đo'}
                  </span>
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
                {isSyncingHw ? 'Đang đồng bộ dữ liệu...' : 'Đồng bộ & Làm mới lịch cho ăn'}
              </span>
            </button>
          </div>
        </section>
      </div>

      <ConfirmModal {...confirmProps} />
    </div>
  );
};
