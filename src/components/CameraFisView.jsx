import React, { useState, useEffect, useCallback } from 'react';
import {
  Camera,
  Sliders,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Crop,
  Activity,
  Cpu,
  Droplets,
  Warehouse,
  Waves
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cameraFisService } from '../services/cameraFisService';
import { telemetryService } from '../services/telemetryService';
import { getErrorMessage } from '../services/apiClient';

export const CameraFisView = ({
  ponds = [],
  selectedPond = null,
  onSelectPond,
  onNavigateTab,
}) => {
  const { role } = useAuth();
  const [latestFis, setLatestFis] = useState(null);
  const [cameraInfo, setCameraInfo] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals
  const [isRoiModalOpen, setIsRoiModalOpen] = useState(false);
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);

  // Tọa độ vùng quan sát ROI
  const [roiCoords, setRoiCoords] = useState({
    x: 250,
    y: 180,
    width: 600,
    height: 600,
    resolutionWidth: 1920,
    resolutionHeight: 1080,
  });

  // Trọng số thuật toán FIS (w1, w2, w3, w4)
  const [weights, setWeights] = useState({
    weightRt: 0.35,
    weightVt: 0.25,
    weightDt: 0.20,
    weightCt: 0.20,
    quantile25: 0.25,
    quantile50: 0.50,
    quantile75: 0.75,
    samplingIntervalSeconds: 20,
  });

  const pondId = selectedPond?.id || null;

  // Tải dữ liệu thực tế từ Backend (Telemetry + Camera FIS + Khuyến nghị AI)
  const fetchRealPondVisionAndTelemetry = useCallback(async () => {
    if (!pondId) {
      setLatestFis(null);
      setCameraInfo(null);
      setTelemetry(null);
      setAiRecommendation(null);
      return;
    }

    setErrorMsg('');
    try {
      const [fisSettled, teleSettled, aiSettled] = await Promise.allSettled([
        cameraFisService.getLatestFis(pondId),
        telemetryService.getLatestTelemetry(pondId),
        cameraFisService.getLatestAiRecommendation(pondId),
      ]);

      const errs = [];
      const isNotEmpty404 = (reason) => reason?.response?.status === 404;

      if (fisSettled.status === 'fulfilled') {
        const fisRes = fisSettled.value;
        if (fisRes && fisRes.hasData) {
          setLatestFis(fisRes.status);
          setCameraInfo(fisRes.camera || selectedPond?.cameraDevice || null);
        } else {
          setLatestFis(null);
          setCameraInfo(fisRes?.camera || selectedPond?.cameraDevice || null);
        }
      } else {
        setLatestFis(null);
        setCameraInfo(selectedPond?.cameraDevice || null);
        if (!isNotEmpty404(fisSettled.reason)) {
          errs.push(`FIS: ${getErrorMessage(fisSettled.reason, 'Không thể tải dữ liệu FIS.')}`);
        }
      }

      if (teleSettled.status === 'fulfilled') {
        const teleRes = teleSettled.value;
        setTelemetry(teleRes && teleRes.id ? teleRes : null);
      } else {
        setTelemetry(null);
        if (!isNotEmpty404(teleSettled.reason)) {
          errs.push(`Nước: ${getErrorMessage(teleSettled.reason, 'Không thể tải chỉ số nước.')}`);
        }
      }

      if (aiSettled.status === 'fulfilled') {
        const aiRes = aiSettled.value;
        setAiRecommendation(aiRes && aiRes.predictedFeedAmountKg !== undefined ? aiRes : null);
      } else {
        setAiRecommendation(null);
        if (!isNotEmpty404(aiSettled.reason)) {
          errs.push(`AI: ${getErrorMessage(aiSettled.reason, 'Không thể tải đề xuất AI.')}`);
        }
      }

      if (errs.length > 0) {
        setErrorMsg(errs[0]);
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Lỗi tải dữ liệu chỉ số nước và camera FIS.'));
    }
  }, [pondId, selectedPond?.cameraDevice]);

  useEffect(() => {
    fetchRealPondVisionAndTelemetry();
    const interval = setInterval(fetchRealPondVisionAndTelemetry, 12000);
    return () => clearInterval(interval);
  }, [fetchRealPondVisionAndTelemetry]);

  if (ponds.length === 0 || !selectedPond) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#EFF4FF] text-[#006398] flex items-center justify-center mx-auto">
          <Waves className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#0B1C30]">
            Chưa có ao nuôi nào để hiển thị chỉ số nước & camera FIS
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Vui lòng khởi tạo trang trại và khai báo ao nuôi trước khi xem dữ liệu cảm biến môi trường và camera sàng ăn.
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

  // Tạo 6 đồng hồ đo chất lượng nước từ số liệu thực tế của Telemetry
  const doVal = telemetry?.dissolvedOxygenMgL ?? selectedPond.do ?? null;
  const phVal = telemetry?.ph ?? selectedPond.ph ?? null;
  const tempVal = telemetry?.temperatureC ?? selectedPond.temp ?? null;
  const salVal = telemetry?.salinityPpt ?? selectedPond.salinity ?? null;
  const nh3Val = telemetry?.ammoniaMgL ?? selectedPond.nh3 ?? null;
  const turbVal = telemetry?.turbidityNtu ?? selectedPond.turbidity ?? null;

  const waterQualityGauges = [
    {
      id: 'do',
      title: '1. Oxy hòa tan (DO)',
      value: doVal !== null ? Number(doVal).toFixed(2) : '--',
      unit: 'mg/L',
      status: doVal === null ? 'CHƯA ĐO' : doVal >= 4.0 ? 'AN TOÀN' : 'THẤP',
      color: '#006E2D',
      track: '#E8F5E9',
      pct: doVal !== null ? Math.min(100, Math.round((Number(doVal) / 8.0) * 100)) : 0,
      threshold: 'An toàn ≥ 5.0 • Cấm ăn < 3.5 mg/L',
    },
    {
      id: 'ph',
      title: '2. Độ pH nước',
      value: phVal !== null ? Number(phVal).toFixed(1) : '--',
      unit: 'pH',
      status: phVal === null ? 'CHƯA ĐO' : phVal >= 7.5 && phVal <= 8.5 ? 'AN TOÀN' : 'CHÚ Ý',
      color: '#006398',
      track: '#EFF4FF',
      pct: phVal !== null ? Math.min(100, Math.round((Number(phVal) / 10.0) * 100)) : 0,
      threshold: 'Ngưỡng chuẩn: 7.5 – 8.5 pH',
    },
    {
      id: 'temp',
      title: '3. Nhiệt độ nước',
      value: tempVal !== null ? Number(tempVal).toFixed(1) : '--',
      unit: '°C',
      status: tempVal === null ? 'CHƯA ĐO' : tempVal >= 26 && tempVal <= 32 ? 'AN TOÀN' : 'CHÚ Ý',
      color: '#EA580C',
      track: '#FFDBCA',
      pct: tempVal !== null ? Math.min(100, Math.round((Number(tempVal) / 40.0) * 100)) : 0,
      threshold: 'Ngưỡng chuẩn: 26.0 – 32.0 °C',
    },
    {
      id: 'salinity',
      title: '4. Độ mặn',
      value: salVal !== null ? Number(salVal).toFixed(1) : '--',
      unit: '‰',
      status: salVal === null ? 'CHƯA ĐO' : 'AN TOÀN',
      color: '#40A2E7',
      track: '#EFF4FF',
      pct: salVal !== null ? Math.min(100, Math.round((Number(salVal) / 35.0) * 100)) : 0,
      threshold: 'Ngưỡng chuẩn: 10.0 – 25.0 ‰',
    },
    {
      id: 'nh3',
      title: '5. Khí độc NH₃',
      value: nh3Val !== null ? Number(nh3Val).toFixed(2) : '--',
      unit: 'mg/L',
      status: nh3Val === null ? 'CHƯA ĐO' : nh3Val < 0.1 ? 'AN TOÀN' : 'NGUY HIỂM',
      color: '#006E2D',
      track: '#E8F5E9',
      pct: nh3Val !== null ? Math.min(100, Math.round((Number(nh3Val) / 0.3) * 100)) : 0,
      threshold: 'An toàn < 0.05 • Nguy hiểm > 0.1 mg/L',
    },
    {
      id: 'turbidity',
      title: '6. Độ đục',
      value: turbVal !== null ? Number(turbVal).toFixed(1) : '--',
      unit: 'NTU',
      status: turbVal === null ? 'CHƯA ĐO' : 'AN TOÀN',
      color: '#F59E0B',
      track: '#FEF3C7',
      pct: turbVal !== null ? Math.min(100, Math.round((Number(turbVal) / 60.0) * 100)) : 0,
      threshold: 'Ngưỡng chuẩn: 10.0 – 40.0 NTU',
    },
  ];

  const handleTestAnalyze = async () => {
    if (!pondId) return;
    setIsAnalyzing(true);
    try {
      await cameraFisService.analyzeFrame({
        pondId,
        ...(cameraInfo?.id ? { deviceId: cameraInfo.id } : {}),
        timeDeltaSeconds: 20,
        roi: roiCoords,
        simulatedMetrics: {
          remainingFeedAreaRt: 0.08,
          shrimpDensityDt: 19.5,
          behaviorClassificationCt: 3.0,
        },
      });
      await fetchRealPondVisionAndTelemetry();
      setToastMsg(`Đã phân tích khung hình và lưu kết quả FIS mới vào cơ sở dữ liệu cho ao ${selectedPond.code}.`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Không thể phân tích khung hình camera.'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveRoi = async (e) => {
    e.preventDefault();
    try {
      if (cameraInfo?.id) {
        await cameraFisService.updateRoi(cameraInfo.id, roiCoords);
      }
      setIsRoiModalOpen(false);
      setToastMsg('Đã lưu tọa độ vùng quan sát sàng ăn (ROI) thành công.');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert('Lỗi lưu ROI: ' + getErrorMessage(err));
    }
  };

  const handleSaveWeights = async (e) => {
    e.preventDefault();
    try {
      await cameraFisService.updateWeights(pondId, weights);
      setIsWeightsModalOpen(false);
      setToastMsg('Đã lưu bộ trọng số thành phần w1–w4 của thuật toán FIS lên máy chủ.');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert('Lỗi lưu trọng số: ' + getErrorMessage(err));
    }
  };

  const currentFisLevel = latestFis?.appetiteLevel ?? null;

  const fisLevels = [
    {
      level: 0,
      title: 'Mức 0',
      badge: 'Không ăn',
      action: 'Cắt 100% cám • Dừng máy',
      sub: 'Kiểm tra khẩn cấp DO & đáy ao',
      badgeStyle: 'bg-[#FFDAD6] text-[#BA1A1A]',
      activeBorder: 'border-2 border-[#BA1A1A] bg-[#FFF8F8]',
    },
    {
      level: 1,
      title: 'Mức 1',
      badge: 'Ăn yếu',
      action: 'Giảm 50% lượng cám',
      sub: 'Theo dõi sát pH & khí độc NH₃',
      badgeStyle: 'bg-[#FEF3C7] text-[#B45309]',
      activeBorder: 'border-2 border-[#F59E0B] bg-[#FEF3C7]/30',
    },
    {
      level: 2,
      title: 'Mức 2',
      badge: 'Bình thường',
      action: 'Giữ nguyên 100% định mức',
      sub: 'Định mức chuẩn theo ngày tuổi',
      badgeStyle: 'bg-[#EFF4FF] text-[#006398]',
      activeBorder: 'border-2 border-[#006398] bg-[#EFF4FF]/60',
    },
    {
      level: 3,
      title: 'Mức 3',
      badge: 'Ăn mạnh',
      action: 'Tăng +5% lượng cám',
      sub: 'Tôm bắt mồi tích cực trên sàng ăn',
      badgeStyle: 'bg-[#E8F5E9] text-[#006E2D]',
      activeBorder: 'border-2 border-[#006E2D] bg-[#F0FDF4]',
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. TIÊU ĐỀ TRANG & CHỌN AO NUÔI THỰC TẾ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30] tracking-tight font-display">
            6 chỉ số nước và camera nhá ăn FIS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dữ liệu thực tế từ cảm biến môi trường nước và camera nhận diện sàng ăn của từng ao nuôi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-2 bg-[#EFF4FF] border border-[#D3E4FE] rounded-xl px-3 h-9">
            <Camera className="w-4 h-4 text-[#006398]" />
            <span className="text-[#006398] font-medium">Ao nuôi:</span>
            <select
              value={selectedPond.id}
              onChange={(e) => onSelectPond?.(e.target.value)}
              className="bg-transparent font-bold text-[#0B1C30] focus:outline-none cursor-pointer"
            >
              {ponds.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.farmName}] {p.code} – {p.name}
                </option>
              ))}
            </select>
          </div>

          {role !== 'farmer' && (
            <>
              <button
                onClick={() => setIsRoiModalOpen(true)}
                className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-[#0B1C30] font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Crop className="w-3.5 h-3.5 text-[#006398]" />
                <span>Vùng ROI</span>
              </button>

              <button
                onClick={() => setIsWeightsModalOpen(true)}
                className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-[#0B1C30] font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>Trọng số FIS</span>
              </button>
            </>
          )}

          <button
            onClick={handleTestAnalyze}
            disabled={isAnalyzing}
            className="h-9 px-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Activity className="w-3.5 h-3.5" />
            )}
            <span>{isAnalyzing ? 'Đang phân tích...' : 'Phân tích khung hình'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {toastMsg && (
        <div className="p-3.5 bg-[#E8F5E9] border border-[#7CF994] text-[#006E2D] rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#006E2D] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2. DẢI 4 MỨC ĐỘ THÈM ĂN FIS TỪ DỮ LIỆU THẬT */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFF4FF] text-[#006398] text-[11px] font-bold">
                <Warehouse className="w-3 h-3" />
                {selectedPond.farmName}
              </span>
              <h2 className="text-sm font-bold text-[#0B1C30]">
                Độ thèm ăn của tôm ({selectedPond.code} – {selectedPond.name})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kết quả nhận diện thực tế lưu trong cơ sở dữ liệu của ao đang chọn
            </p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
              latestFis
                ? 'bg-[#E8F5E9] text-[#006E2D] border-[#7CF994]'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {latestFis
              ? `Điểm FIS: ${Number(latestFis.fisScore).toFixed(3)} • Mức ${latestFis.appetiteLevel}`
              : 'Chưa có bản ghi FIS cho ao này'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {fisLevels.map((item) => {
            const isSelected = currentFisLevel === item.level;
            return (
              <div
                key={item.level}
                className={`p-4 rounded-xl transition relative ${
                  isSelected
                    ? item.activeBorder
                    : 'border border-slate-200 bg-[#F8F9FF]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#0B1C30]">{item.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeStyle}`}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-sm font-extrabold text-[#0B1C30]">{item.action}</p>
                <p className="text-[11px] text-slate-500 mt-1">{item.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 6 ĐỒNG HỒ ĐO CHẤT LƯỢNG NƯỚC THỰC TẾ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[#006398]" />
            <h2 className="text-sm font-bold text-[#0B1C30]">
              6 đồng hồ đo chất lượng nước ({selectedPond.code})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono-num">
            {telemetry?.measuredAt
              ? `Lần đo gần nhất: ${new Date(telemetry.measuredAt).toLocaleString('vi-VN')}`
              : 'Chưa có thiết bị cảm biến gửi số đo cho ao này'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {waterQualityGauges.map((g) => {
            const r = 20;
            const circ = 2 * Math.PI * r;
            const offset = circ - (g.pct / 100) * circ;

            return (
              <div
                key={g.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-500">{g.title}</span>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span
                        className="text-3xl font-extrabold font-mono-num"
                        style={{ color: g.color }}
                      >
                        {g.value}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{g.unit}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        g.status === 'CHƯA ĐO'
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : 'bg-[#E8F5E9] text-[#006E2D] border-[#7CF994]'
                      }`}
                    >
                      ● {g.status}
                    </span>
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r={r} stroke={g.track} strokeWidth="5" fill="none" />
                        <circle
                          cx="24"
                          cy="24"
                          r={r}
                          stroke={g.color}
                          strokeWidth="5"
                          fill="none"
                          strokeDasharray={circ}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold text-slate-600 font-mono-num">
                        {g.pct}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{g.threshold}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#006E2D] shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. THÔNG TIN CAMERA SÀNG ĂN & MA TRẬN SUY LUẬN MỜ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  cameraInfo ? 'bg-[#006E2D]' : 'bg-slate-400'
                }`}
              />
              <h3 className="text-sm font-bold text-[#0B1C30]">
                Thiết bị camera sàng ăn: {cameraInfo?.name || cameraInfo?.deviceUid || 'Chưa gán camera'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono-num text-slate-500">
              <span>{roiCoords.resolutionWidth}×{roiCoords.resolutionHeight}</span>
            </div>
          </div>

          <div className="relative aspect-video bg-[#0B1C30] rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between p-4">
            <div className="flex items-center justify-between z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 text-white text-[11px] font-mono-num">
                <span className={`w-2 h-2 rounded-full ${latestFis ? 'bg-[#10B981]' : 'bg-slate-400'}`} />
                {selectedPond.code} • {cameraInfo?.deviceUid || 'Chưa có thiết bị camera'}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#006E2D] text-white text-[11px] font-bold">
                {latestFis
                  ? `Mật độ tôm Dt: ${latestFis.shrimpDensity ?? '--'}`
                  : 'Chưa có dữ liệu phân tích'}
              </span>
            </div>

            <div className="my-auto mx-auto w-3/4 h-36 border-2 border-dashed border-[#7FFC97]/80 rounded-xl flex items-center justify-center p-3 bg-[#006E2D]/15 z-10 text-center">
              {latestFis ? (
                <div className="px-4 py-2 rounded-full bg-black/75 text-white text-xs font-mono-num font-bold border border-[#EA580C]">
                  Thức ăn còn lại Rt: {latestFis.remainingFeedPercent ?? '--'}% • Điểm FIS:{' '}
                  {Number(latestFis.fisScore).toFixed(3)} ({latestFis.appetiteLevelDescription})
                </div>
              ) : (
                <div className="text-xs text-slate-300 max-w-sm">
                  Ao <strong>{selectedPond.code}</strong> chưa có bản ghi phân tích hình ảnh sàng ăn. Bấm nút <strong>&ldquo;Phân tích khung hình&rdquo;</strong> ở góc trên để tạo dữ liệu.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 bg-black/50 px-3 py-2 rounded-lg z-10">
              <span>
                Tốc độ tiêu thụ vt:{' '}
                <strong className="text-[#7FFC97]">
                  {latestFis?.consumptionVelocity ?? '--'}
                </strong>
              </span>
              <span>
                Kết luận FIS:{' '}
                <strong className="text-[#FB923C]">
                  {latestFis ? `Mức ${latestFis.appetiteLevel}` : 'Chưa có'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Cột phải: Ma trận suy luận mờ & Đề xuất AI */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#EA580C]" />
                <h3 className="text-sm font-bold text-[#0B1C30]">
                  Ma trận suy luận mờ (Fuzzy Inference)
                </h3>
              </div>
              <span className="text-[11px] font-mono-num font-bold text-[#006398] bg-[#EFF4FF] px-2 py-0.5 rounded">
                w1–w4
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#7CF994] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#006E2D]">Nếu (DO ≥ 5.0) và (FIS == Mức 3)</p>
                  <p className="text-slate-600 mt-0.5">Oxy dồi dào và tôm bắt mồi rất mạnh</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#006E2D] text-white font-bold shrink-0">
                  +5% cám
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F9FF] border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0B1C30]">Nếu (4.0 ≤ DO &lt; 5.0) và (FIS == Mức 2)</p>
                  <p className="text-slate-500 mt-0.5">Môi trường bình thường</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#EFF4FF] text-[#006398] font-bold shrink-0">
                  100% định mức
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF8F5] border border-[#FFDBCA] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#9D4300]">Nếu (3.5 ≤ DO &lt; 4.0) hoặc (FIS == Mức 1)</p>
                  <p className="text-slate-500 mt-0.5">Oxy giảm nhẹ hoặc tôm ăn yếu</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#FEF3C7] text-[#B45309] font-bold shrink-0">
                  Giảm 50%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF8F8] border border-[#FFDAD6] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#BA1A1A]">Nếu (DO &lt; 3.5) hoặc (FIS == Mức 0)</p>
                  <p className="text-slate-500 mt-0.5">Nguy cơ ngạt oxy hoặc tôm bỏ ăn</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#BA1A1A] text-white font-bold shrink-0">
                  Cắt 100%
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#F8F9FF] rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1 font-mono-num">
            <div className="text-[11px] font-sans font-bold text-[#0B1C30]">
              Bộ trọng số FIS hiện tại (chu kỳ {weights.samplingIntervalSeconds}s):
            </div>
            <div>
              • w1 (Rt): {weights.weightRt} | w2 (vt): {weights.weightVt} | w3 (Dt): {weights.weightDt} | w4 (Ct):{' '}
              {weights.weightCt}
            </div>
            {aiRecommendation && (
              <div className="pt-1 text-[#006E2D] font-sans">
                • Khuyến nghị AI gần nhất: <strong>{aiRecommendation.predictedFeedAmountKg} kg</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. MODAL CẤU HÌNH ROI */}
      {isRoiModalOpen && (
        <div className="fixed inset-0 !mt-0 z-[100] flex items-center justify-center p-4 bg-[#0B1C30]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Crop className="w-4 h-4 text-[#006398]" />
                <h3 className="font-bold text-sm text-[#0B1C30]">
                  Cấu hình vùng quan sát sàng ăn (ROI)
                </h3>
              </div>
              <button onClick={() => setIsRoiModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoi} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 font-mono-num text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tọa độ X</label>
                  <input
                    type="number"
                    value={roiCoords.x}
                    onChange={(e) => setRoiCoords({ ...roiCoords, x: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tọa độ Y</label>
                  <input
                    type="number"
                    value={roiCoords.y}
                    onChange={(e) => setRoiCoords({ ...roiCoords, y: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Chiều rộng</label>
                  <input
                    type="number"
                    value={roiCoords.width}
                    onChange={(e) => setRoiCoords({ ...roiCoords, width: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Chiều cao</label>
                  <input
                    type="number"
                    value={roiCoords.height}
                    onChange={(e) => setRoiCoords({ ...roiCoords, height: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoiModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-xl cursor-pointer"
                >
                  Lưu tọa độ ROI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL TRỌNG SỐ FIS */}
      {isWeightsModalOpen && (
        <div className="fixed inset-0 !mt-0 z-[100] flex items-center justify-center p-4 bg-[#0B1C30]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#EA580C]" />
                <h3 className="font-bold text-sm text-[#0B1C30]">
                  Trọng số thành phần FIS (w1 – w4)
                </h3>
              </div>
              <button onClick={() => setIsWeightsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWeights} className="p-6 space-y-4">
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-700 font-semibold">w1 (Thức ăn còn lại Rt):</span>
                    <strong className="font-mono-num">{weights.weightRt}</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.weightRt}
                    onChange={(e) => setWeights({ ...weights, weightRt: Number(e.target.value) })}
                    className="w-full accent-[#EA580C]"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-700 font-semibold">w2 (Tốc độ tiêu thụ vt):</span>
                    <strong className="font-mono-num">{weights.weightVt}</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.weightVt}
                    onChange={(e) => setWeights({ ...weights, weightVt: Number(e.target.value) })}
                    className="w-full accent-[#EA580C]"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-700 font-semibold">w3 (Mật độ tôm Dt):</span>
                    <strong className="font-mono-num">{weights.weightDt}</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.weightDt}
                    onChange={(e) => setWeights({ ...weights, weightDt: Number(e.target.value) })}
                    className="w-full accent-[#EA580C]"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-700 font-semibold">w4 (Hành vi bắt mồi Ct):</span>
                    <strong className="font-mono-num">{weights.weightCt}</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.weightCt}
                    onChange={(e) => setWeights({ ...weights, weightCt: Number(e.target.value) })}
                    className="w-full accent-[#EA580C]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWeightsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-xl cursor-pointer"
                >
                  Lưu trọng số
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFisView;
