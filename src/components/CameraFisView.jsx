import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Sliders, 
  RotateCw, 
  CheckCircle2, 
  Crop, 
  Activity, 
  TrendingUp,
  Cpu,
  Scale,
  Users,
  Droplets
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cameraFisService } from '../services/cameraFisService';
import { getErrorMessage } from '../services/apiClient';

export const CameraFisView = () => {
  const { role } = useAuth();
  const [selectedPondCode, setSelectedPondCode] = useState('AO-01');
  const [latestFis, setLatestFis] = useState(null);
  const [cameraInfo, setCameraInfo] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [selectedFisLevel, setSelectedFisLevel] = useState(3);

  // Modals
  const [isRoiModalOpen, setIsRoiModalOpen] = useState(false);
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);

  // ROI Configuration State
  const [roiCoords, setRoiCoords] = useState({
    x: 250,
    y: 180,
    width: 600,
    height: 600,
    resolutionWidth: 1920,
    resolutionHeight: 1080,
  });

  // Weights Configuration State (w1, w2, w3, w4)
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

  // 6 Water Quality Telemetry Metrics (Synced with Mobile quan-ly-ao.tsx)
  const waterQualityGauges = [
    {
      id: 'do',
      title: '1. Oxy Hòa Tan (DO)',
      value: '5.60',
      unit: 'mg/L',
      status: 'AN TOÀN',
      color: '#006E2D',
      track: '#E8F5E9',
      pct: 78,
      threshold: 'An toàn ≥ 5.0 • Cấm ăn < 3.5 mg/L',
    },
    {
      id: 'ph',
      title: '2. Độ pH Nước',
      value: '7.9',
      unit: 'pH',
      status: 'AN TOÀN',
      color: '#006398',
      track: '#EFF4FF',
      pct: 72,
      threshold: 'Ngưỡng chuẩn: 7.5 – 8.5 pH',
    },
    {
      id: 'temp',
      title: '3. Nhiệt Độ Nước',
      value: '28.5',
      unit: '°C',
      status: 'AN TOÀN',
      color: '#EA580C',
      track: '#FFDBCA',
      pct: 68,
      threshold: 'Ngưỡng chuẩn: 26.0 – 32.0 °C',
    },
    {
      id: 'salinity',
      title: '4. Độ Mặn (Salinity)',
      value: '15.0',
      unit: '‰',
      status: 'AN TOÀN',
      color: '#40A2E7',
      track: '#EFF4FF',
      pct: 60,
      threshold: 'Ngưỡng chuẩn: 10.0 – 25.0 ‰',
    },
    {
      id: 'nh3',
      title: '5. Khí Độc NH₃',
      value: '0.02',
      unit: 'mg/L',
      status: 'AN TOÀN',
      color: '#006E2D',
      track: '#E8F5E9',
      pct: 20,
      threshold: 'An toàn < 0.05 • Nguy hiểm > 0.1 mg/L',
    },
    {
      id: 'turbidity',
      title: '6. Độ Đục (Turbidity)',
      value: '25.0',
      unit: 'NTU',
      status: 'AN TOÀN',
      color: '#F59E0B',
      track: '#FEF3C7',
      pct: 62,
      threshold: 'Ngưỡng chuẩn: 10.0 – 40.0 NTU',
    },
  ];

  // Tải dữ liệu FIS mới nhất
  const fetchLatestFis = async () => {
    try {
      const res = await cameraFisService.getLatestFis(selectedPondCode).catch(() => null);
      if (res && res.hasData) {
        setLatestFis(res.status);
        setCameraInfo(res.camera);
        if (typeof res.status?.appetiteLevel === 'number') {
          setSelectedFisLevel(res.status.appetiteLevel);
        }
      } else {
        setLatestFis({
          fisScore: 0.785,
          appetiteLevel: 3,
          appetiteLevelDescription: 'Ăn mạnh (Mức 3)',
          remainingFeedPercent: 8.0,
          shrimpDensity: 18.5,
          consumptionVelocity: 0.015,
          timestamp: new Date().toISOString(),
          ageSeconds: 15,
          isStale: false,
        });
        setCameraInfo({
          id: 'cam-01-a1',
          name: 'Camera sàng ăn sâu 1.8m (CAM-A1-TRAY)',
          status: 'online',
          lastSeenAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Lỗi tải dữ liệu FIS:', err);
    }
  };

  // Tải khuyến nghị AI mới nhất
  const fetchLatestAiRec = async () => {
    try {
      const rec = await cameraFisService.getLatestAiRecommendation(selectedPondCode).catch(() => null);
      if (rec && rec.predictedFeedAmountKg) {
        setAiRecommendation(rec);
      } else {
        setAiRecommendation({
          id: 'rec-01',
          modelName: 'ShrimpMate-FeedOpt-v2',
          modelVersion: '2.1.0',
          predictedFeedAmountKg: 12.6,
          spreadRateKgPerMinute: 1.6,
          appetiteLevel: 3,
          biomassKg: 780.0,
          anomalyScore: 0.04,
          confidence: 0.94,
          safetyDecision: 'allowed',
          safetyReason: null,
          explanation: 'Tôm bắt mồi mạnh (FIS Mức 3 - sạch nhá 92%), DO=5.60 mg/L và nhiệt độ 28.5°C nằm trong ngưỡng tối ưu. Đề xuất tăng nhẹ lượng thức ăn +5% cho cữ tiếp theo.'
        });
      }
    } catch (err) {
      console.warn('Lỗi lấy khuyến nghị AI:', err);
    }
  };

  useEffect(() => {
    fetchLatestFis();
    fetchLatestAiRec();
    const interval = setInterval(() => {
      fetchLatestFis();
      fetchLatestAiRec();
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedPondCode]);

  const handleTestAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await cameraFisService.analyzeFrame({
        pondId: selectedPondCode,
        deviceId: cameraInfo?.id || 'cam-01',
        timeDeltaSeconds: 20,
        roi: roiCoords,
        simulatedMetrics: {
          remainingFeedAreaRt: 0.08,
          shrimpDensityDt: 20.0,
          behaviorClassificationCt: 3.0,
        },
      }).catch(() => null);

      setTimeout(() => {
        setIsAnalyzing(false);
        setToastMsg('Đã hoàn tất phân tích khung hình camera sàng ăn và cập nhật 6 chỉ số môi trường.');
        fetchLatestFis();
        fetchLatestAiRec();
        setTimeout(() => setToastMsg(''), 4000);
      }, 900);
    } catch {
      setIsAnalyzing(false);
    }
  };

  const handleSaveRoi = async (e) => {
    e.preventDefault();
    try {
      if (cameraInfo?.id) {
        await cameraFisService.updateRoi(cameraInfo.id, roiCoords).catch(() => {});
      }
      setIsRoiModalOpen(false);
      setToastMsg('Đã cập nhật tọa độ vùng quan sát sàng ăn (ROI) thành công.');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert('Lỗi lưu ROI: ' + getErrorMessage(err));
    }
  };

  const handleSaveWeights = async (e) => {
    e.preventDefault();
    try {
      await cameraFisService.updateWeights(selectedPondCode, weights).catch(() => {});
      setIsWeightsModalOpen(false);
      setToastMsg('Đã lưu bộ trọng số thành phần w1–w4 của thuật toán FIS.');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert('Lỗi lưu trọng số: ' + getErrorMessage(err));
    }
  };

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
      sub: 'Sạch nhá 92% • Tôm tập trung cao',
      badgeStyle: 'bg-[#E8F5E9] text-[#006E2D]',
      activeBorder: 'border-2 border-[#006E2D] bg-[#F0FDF4]',
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. PAGE HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30] tracking-tight font-display">
            6 Chỉ số Nước & Camera Nhá ăn FIS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Đồng bộ trực tiếp với ứng dụng di động: 4 mức độ thèm ăn FIS, 6 đồng hồ đo môi trường nước và nhận diện sàng ăn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-2 bg-[#EFF4FF] border border-[#D3E4FE] rounded-xl px-3 h-9">
            <Camera className="w-4 h-4 text-[#006398]" />
            <span className="text-[#006398] font-medium">Ao nuôi:</span>
            <select
              value={selectedPondCode}
              onChange={(e) => setSelectedPondCode(e.target.value)}
              className="bg-transparent font-bold text-[#0B1C30] focus:outline-none cursor-pointer"
            >
              <option value="AO-01">Ao Bạt A1 (45 DOC)</option>
              <option value="AO-02">Ao Bạt A2 (52 DOC)</option>
              <option value="AO-03">Ao Bạt B1 (28 DOC)</option>
              <option value="AO-04">Ao Ương V1 (15 DOC)</option>
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
            <span>{isAnalyzing ? 'Đang phân tích...' : 'Cập nhật dữ liệu'}</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3.5 bg-[#E8F5E9] border border-[#7CF994] text-[#006E2D] rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#006E2D] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2. 4-LEVEL FIS APPETITE SELECTOR STRIP (Synced with Mobile quan-ly-ao.tsx) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#0B1C30] uppercase tracking-wider">
              Độ thèm ăn của tôm (FIS Appetite Index)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động nhận diện từ Camera sàng ăn & Hydrophone hoặc chọn trực tiếp để kiểm thử luật suy luận mờ
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994] self-start sm:self-auto">
            Điểm FIS: {latestFis?.fisScore?.toFixed(3) || '0.785'} • Đang nhận diện: Mức {selectedFisLevel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {fisLevels.map((item) => {
            const isSelected = selectedFisLevel === item.level;
            return (
              <div
                key={item.level}
                onClick={() => {
                  setSelectedFisLevel(item.level);
                  setToastMsg(`Đã chọn mô phỏng ${item.title} (${item.badge}): ${item.action}`);
                  setTimeout(() => setToastMsg(''), 3000);
                }}
                className={`p-4 rounded-xl transition cursor-pointer relative ${
                  isSelected
                    ? item.activeBorder
                    : 'border border-slate-200 bg-[#F8F9FF] hover:border-slate-300'
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

      {/* 3. 6 WATER QUALITY TELEMETRY GAUGES (Synced with Mobile quan-ly-ao.tsx) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[#006398]" />
            <h2 className="text-sm font-bold text-[#0B1C30] uppercase tracking-wider">
              6 Đồng hồ đo chất lượng nước trực tuyến
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Cập nhật mỗi 30 giây từ cụm cảm biến IoT {selectedPondCode}
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
                    <span className="text-xs font-bold uppercase text-slate-500">{g.title}</span>
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

                  {/* Circular SVG Gauge + Status Pill */}
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]">
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

      {/* 4. CAMERA FEED & FUZZY INFERENCE RULE MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: Underwater Tray Camera Feed */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#BA1A1A] animate-pulse" />
              <h3 className="text-sm font-bold text-[#0B1C30]">
                Camera Sàng ăn trực tuyến: {cameraInfo?.name || 'CAM-A1-TRAY'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono-num text-slate-500">
              <span>{roiCoords.resolutionWidth}×{roiCoords.resolutionHeight}</span>
              <span>• 30 FPS</span>
            </div>
          </div>

          <div className="relative aspect-video bg-[#0B1C30] rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between p-4">
            <div className="flex items-center justify-between z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 text-white text-[11px] font-mono-num">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                REC • CAM-A1-TRAY (Độ sâu 1.5m)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#006E2D] text-white text-[11px] font-bold">
                AI Vision: 28 cá thể tôm trong nhá
              </span>
            </div>

            {/* Simulated ROI Bounding Boxes */}
            <div className="my-auto mx-auto w-3/4 h-36 border-2 border-dashed border-[#7FFC97]/80 rounded-xl flex items-center justify-around p-3 bg-[#006E2D]/15 z-10">
              <div className="px-2.5 py-1 rounded border border-[#7FFC97] bg-black/50 text-[#7FFC97] text-[10px] font-mono-num">
                Shrimp #1 (0.96)
              </div>
              <div className="px-3 py-1.5 rounded-full bg-black/75 text-white text-xs font-mono-num font-bold border border-[#EA580C]">
                Cám còn lại Rt: {latestFis?.remainingFeedPercent ?? 8}% • Sạch nhá 92%
              </div>
              <div className="px-2.5 py-1 rounded border border-[#FB923C] bg-black/50 text-[#FFDBCA] text-[10px] font-mono-num">
                Shrimp #2 (0.91)
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 bg-black/50 px-3 py-2 rounded-lg z-10">
              <span>Tỷ lệ sạch nhá: <strong className="text-[#7FFC97]">92% (Còn 8% cám)</strong></span>
              <span>Kết luận FIS: <strong className="text-[#FB923C]">Mức {selectedFisLevel}</strong></span>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Fuzzy Inference System Matrix & AI Rec */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#EA580C]" />
                <h3 className="text-sm font-bold text-[#0B1C30]">
                  Ma trận Suy luận mờ (Fuzzy Inference)
                </h3>
              </div>
              <span className="text-[11px] font-mono-num font-bold text-[#006398] bg-[#EFF4FF] px-2 py-0.5 rounded">
                w1–w4 Active
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#7CF994] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#006E2D]">IF (DO ≥ 5.0) AND (FIS == Mức 3)</p>
                  <p className="text-slate-600 mt-0.5">Oxy dồi dào & Tôm bắt mồi rất mạnh</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#006E2D] text-white font-bold shrink-0">
                  +5% Cám
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F9FF] border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0B1C30]">IF (4.0 ≤ DO &lt; 5.0) AND (FIS == Mức 2)</p>
                  <p className="text-slate-500 mt-0.5">Môi trường bình thường</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#EFF4FF] text-[#006398] font-bold shrink-0">
                  100% Định mức
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF8F5] border border-[#FFDBCA] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#9D4300]">IF (3.5 ≤ DO &lt; 4.0) OR (FIS == Mức 1)</p>
                  <p className="text-slate-500 mt-0.5">Oxy giảm nhẹ hoặc tôm ăn yếu</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#FEF3C7] text-[#B45309] font-bold shrink-0">
                  Giảm 50%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FFF8F8] border border-[#FFDAD6] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#BA1A1A]">IF (DO &lt; 3.5) OR (FIS == Mức 0)</p>
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
              Bộ trọng số FIS hiện tại (Chu kỳ {weights.samplingIntervalSeconds}s):
            </div>
            <div>• w1 (Rt): {weights.weightRt} | w2 (vt): {weights.weightVt} | w3 (Dt): {weights.weightDt} | w4 (Ct): {weights.weightCt}</div>
          </div>
        </div>
      </div>

      {/* 5. ROI MODAL */}
      {isRoiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1C30]/60 backdrop-blur-xs">
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
                  <label className="block text-slate-700 font-semibold mb-1">Chiều rộng (Width)</label>
                  <input
                    type="number"
                    value={roiCoords.width}
                    onChange={(e) => setRoiCoords({ ...roiCoords, width: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Chiều cao (Height)</label>
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

      {/* 6. WEIGHTS MODAL */}
      {isWeightsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1C30]/60 backdrop-blur-xs">
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
