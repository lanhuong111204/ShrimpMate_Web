import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sprout, 
  RotateCw, 
  AlertCircle, 
  Calendar, 
  Scale, 
  TrendingUp, 
  CheckCircle2, 
  Plus, 
  History,
  Award
} from 'lucide-react';
import { cropSeasonService } from '../../services/cropSeasonService';
import { getErrorMessage } from '../../services/apiClient';

export const CropSeasonModal = ({ isOpen, onClose, pond, onSuccess }) => {
  const [seasons, setSeasons] = useState([]);
  const [activeSeason, setActiveSeason] = useState(null);
  const [statistics, setStatistics] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form tạo vụ mới
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [stockingDate, setStockingDate] = useState('');
  const [initialCount, setInitialCount] = useState('150000');
  const [stockingDensity, setStockingDensity] = useState('50');
  const [initialAverageWeightG, setInitialAverageWeightG] = useState('0.02');
  const [estimatedSurvivalRate, setEstimatedSurvivalRate] = useState('85.0');

  // Tải danh sách vụ nuôi
  const fetchSeasons = async () => {
    if (!pond?.id) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await cropSeasonService.getSeasonsByPond(pond.id);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setSeasons(list);

      const active = list.find((s) => s.status === 'active');
      setActiveSeason(active || null);

      if (active) {
        setShowCreateForm(false);
        // Tải thống kê FCR cho vụ đang nuôi
        try {
          const stats = await cropSeasonService.getSeasonStatistics(active.id);
          setStatistics(stats);
        } catch (statErr) {
          console.warn('Chưa thể lấy thống kê FCR:', statErr);
          setStatistics(null);
        }
      } else {
        setShowCreateForm(true);
        // Điền ngày hôm nay làm mặc định
        const today = new Date().toISOString().split('T')[0];
        setStockingDate(today);
        setName(`Vụ tôm ${pond.code} - ${new Date().getFullYear()}`);
      }
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lỗi tải thông tin vụ nuôi!'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && pond) {
      fetchSeasons();
      setSuccessMessage('');
    }
  }, [isOpen, pond]);

  if (!isOpen || !pond) return null;

  // Bắt đầu vụ nuôi mới
  const handleCreateSeason = async (e) => {
    e.preventDefault();
    if (!name.trim() || !stockingDate || !initialCount) {
      setErrorMessage('Vui lòng điền đầy đủ các thông số thả giống!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await cropSeasonService.createSeason(pond.id, {
        name,
        stockingDate,
        initialCount,
        stockingDensity,
        initialAverageWeightG,
        estimatedSurvivalRate,
        status: 'active',
      });
      setSuccessMessage('Đã khởi tạo vụ nuôi mới thành công!');
      await fetchSeasons();
      onSuccess?.();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Không thể tạo vụ nuôi mới!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thu hoạch & Đóng vụ nuôi
  const handleHarvestSeason = async () => {
    if (!activeSeason) return;
    if (!window.confirm(`Xác nhận hoàn thành thu hoạch cho [${activeSeason.name}]? Thao tác này sẽ đóng vụ nuôi hiện tại.`)) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await cropSeasonService.updateSeason(activeSeason.id, { status: 'completed' });
      setSuccessMessage('Vụ nuôi đã được chuyển sang trạng thái đã thu hoạch (Completed).');
      await fetchSeasons();
      onSuccess?.();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Không thể hoàn tất vụ nuôi!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đánh giá màu sắc FCR
  const getFcrRating = (fcr) => {
    if (!fcr || fcr <= 0) return { label: 'Chưa đủ dữ liệu', color: 'text-neutral-500 bg-neutral-100' };
    if (fcr < 1.3) return { label: 'Xuất sắc (< 1.3)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (fcr <= 1.5) return { label: 'Tốt (1.3 - 1.5)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    return { label: 'Cần tối ưu (> 1.5)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  };

  const fcrInfo = getFcrRating(statistics?.fcr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Sprout className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                Quản Lý Vụ Nuôi & Hệ Số FCR (UC007, UC016)
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono-num">
                Ao: <strong className="text-white">{pond.code}</strong> • {pond.name} (Diện tích: {pond.areaM2 || pond.area} m²)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-xs text-neutral-500 font-mono-num flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Đang tính toán số liệu vụ nuôi...</span>
            </div>
          ) : activeSeason ? (
            /* 1. KHU VỰC VỤ NUÔI ĐANG ACTIVE KÈM THỐNG KÊ FCR */
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-num font-bold bg-emerald-500 text-white uppercase tracking-wider inline-block">
                      VỤ ĐANG THẢ NUÔI
                    </span>
                    <h4 className="font-display font-bold text-lg">{activeSeason.name}</h4>
                    <p className="text-xs text-neutral-400 font-mono-num flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      Ngày thả: <strong>{activeSeason.stockingDate}</strong>
                    </p>
                  </div>

                  <button
                    onClick={handleHarvestSeason}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                  >
                    Thu Hoạch Vụ Nuôi
                  </button>
                </div>

                {/* 4 Chỉ số KPI Trọng Yếu */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-700/80 font-mono-num">
                  <div className="bg-neutral-800/80 p-3 rounded-xl border border-neutral-700">
                    <span className="text-[10px] text-neutral-400 uppercase">Ngày Nuôi (DOC)</span>
                    <div className="text-xl font-bold text-white mt-0.5">
                      {statistics?.daysOfCulture ?? '--'} <span className="text-xs text-neutral-400">ngày</span>
                    </div>
                  </div>

                  <div className="bg-neutral-800/80 p-3 rounded-xl border border-neutral-700">
                    <span className="text-[10px] text-neutral-400 uppercase">Tổng Thức Ăn</span>
                    <div className="text-xl font-bold text-emerald-400 mt-0.5">
                      {statistics?.totalFeedConsumedKg ? statistics.totalFeedConsumedKg.toLocaleString('vi-VN') : '--'}{' '}
                      <span className="text-xs text-neutral-400">kg</span>
                    </div>
                  </div>

                  <div className="bg-neutral-800/80 p-3 rounded-xl border border-neutral-700">
                    <span className="text-[10px] text-neutral-400 uppercase">Sinh Khối Ước Tính</span>
                    <div className="text-xl font-bold text-blue-400 mt-0.5">
                      {statistics?.estimatedCurrentBiomassKg ? statistics.estimatedCurrentBiomassKg.toLocaleString('vi-VN') : '--'}{' '}
                      <span className="text-xs text-neutral-400">kg</span>
                    </div>
                  </div>

                  <div className="bg-neutral-800/80 p-3 rounded-xl border border-neutral-700">
                    <span className="text-[10px] text-neutral-400 uppercase">Hệ Số FCR</span>
                    <div className="text-xl font-bold text-amber-400 mt-0.5">
                      {statistics?.fcr ? statistics.fcr.toFixed(2) : '--'}
                    </div>
                  </div>
                </div>

                {/* Đánh giá FCR */}
                {statistics?.fcr && (
                  <div className="mt-3 flex items-center justify-between text-xs font-mono-num">
                    <span className="text-neutral-400">Xếp hạng hiệu quả sử dụng thức ăn:</span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${fcrInfo.color}`}>
                      {fcrInfo.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Chi tiết thả giống */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-mono-num space-y-2">
                <h5 className="font-bold text-neutral-800 uppercase text-[11px]">Thông số Thả Nuôi Ban Đầu:</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-neutral-600">
                  <div>Số lượng giống: <strong className="text-neutral-900">{activeSeason.initialCount?.toLocaleString('vi-VN')} con</strong></div>
                  <div>Mật độ: <strong className="text-neutral-900">{activeSeason.stockingDensity || '--'} con/m²</strong></div>
                  <div>Tỷ lệ sống ước tính: <strong className="text-neutral-900">{activeSeason.estimatedSurvivalRate || 85}%</strong></div>
                  <div>Trọng lượng ban đầu: <strong className="text-neutral-900">{activeSeason.initialAverageWeightG || 0.02} g</strong></div>
                  <div>Số cữ ăn đã xả: <strong className="text-neutral-900">{statistics?.totalFeedingSessions ?? '--'} cữ</strong></div>
                </div>
              </div>
            </div>
          ) : (
            /* 2. CHƯA CÓ VỤ ACTIVE -> HIỂN THỊ FORM KHỞI TẠO VỤ MỚI */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                Ao <strong>{pond.code}</strong> hiện tại đang ở trạng thái cải tạo hoặc chưa khai báo vụ nuôi. Hãy thiết lập vụ mới để kích hoạt tính toán FCR và lịch ăn tự động.
              </div>

              <form onSubmit={handleCreateSeason} className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                <h4 className="font-display font-bold text-xs uppercase text-neutral-800 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Khai Báo Thả Giống Vụ Nuôi Mới
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num">
                      Tên Vụ Nuôi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Vụ Tôm Thẻ Chân Trắng 2026 - Đợt 1"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num">
                      Ngày Thả Giống <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={stockingDate}
                      onChange={(e) => setStockingDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white font-mono-num"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num">
                      Số Lượng Giống Thả (con) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={initialCount}
                      onChange={(e) => {
                        setInitialCount(e.target.value);
                        if (pond.areaM2 && e.target.value) {
                          setStockingDensity((Number(e.target.value) / Number(pond.areaM2)).toFixed(1));
                        }
                      }}
                      min="1000"
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white font-mono-num"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num">
                      Mật Độ Thả (con/m²)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={stockingDensity}
                      onChange={(e) => setStockingDensity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white font-mono-num"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num">
                      Trọng Lượng Giống Ban Đầu (gam/con)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={initialAverageWeightG}
                      onChange={(e) => setInitialAverageWeightG(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white font-mono-num"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num">
                      Tỷ Lệ Sống Kỳ Vọng (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={estimatedSurvivalRate}
                      onChange={(e) => setEstimatedSurvivalRate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white font-mono-num"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Bắt Đầu Vụ Nuôi Mới</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lịch sử các vụ trước đó */}
          {seasons.filter((s) => s.status === 'completed').length > 0 && (
            <div className="pt-4 border-t border-neutral-200 space-y-2">
              <h5 className="font-bold text-xs uppercase text-neutral-700 flex items-center gap-1.5 font-mono-num">
                <History className="w-4 h-4 text-neutral-500" />
                Lịch Sử Các Vụ Nuôi Đã Thu Hoạch
              </h5>
              <div className="space-y-1.5">
                {seasons
                  .filter((s) => s.status === 'completed')
                  .map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs font-mono-num flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-neutral-800">{s.name}</div>
                        <div className="text-[11px] text-neutral-500">
                          Thả: {s.stockingDate} • Số lượng: {s.initialCount?.toLocaleString('vi-VN')} con
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-neutral-200 text-neutral-700 text-[10px] font-bold uppercase">
                        ĐÃ THU HOẠCH
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-200/80 rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropSeasonModal;
