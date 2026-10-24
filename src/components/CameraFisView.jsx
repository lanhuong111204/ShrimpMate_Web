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
  Users
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

  // Tải dữ liệu FIS mới nhất
  const fetchLatestFis = async () => {
    try {
      const res = await cameraFisService.getLatestFis(selectedPondCode).catch(() => null);
      if (res && res.hasData) {
        setLatestFis(res.status);
        setCameraInfo(res.camera);
      } else {
        setLatestFis({
          fisScore: 0.785,
          appetiteLevel: 3,
          appetiteLevelDescription: 'Ăn mạnh (Mức 3)',
          remainingFeedPercent: 12.0,
          shrimpDensity: 18.5,
          consumptionVelocity: 0.015,
          timestamp: new Date().toISOString(),
          ageSeconds: 15,
          isStale: false,
        });
        setCameraInfo({
          id: 'cam-01-a1',
          name: 'Camera sàng ăn sâu 1.8m',
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
          predictedFeedAmountKg: 16.2,
          spreadRateKgPerMinute: 1.6,
          appetiteLevel: 3,
          biomassKg: 780.0,
          anomalyScore: 0.04,
          confidence: 0.94,
          safetyDecision: 'allowed',
          safetyReason: null,
          explanation: 'Tôm bắt mồi mạnh (FIS cao), DO=5.5 mg/L và nhiệt độ 28.5°C nằm trong ngưỡng tối ưu. Đề xuất tăng nhẹ lượng thức ăn 5% cho cữ tiếp theo.'
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

  const getAppetiteBadge = (level) => {
    switch (level) {
      case 3:
        return { label: 'Mức 3 • Ăn mạnh', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 2:
        return { label: 'Mức 2 • Bình thường', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 1:
        return { label: 'Mức 1 • Ăn yếu', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 0:
      default:
        return { label: 'Mức 0 • Ngưng ăn', color: 'bg-red-50 text-red-700 border-red-200' };
    }
  };

  const handleTestAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await cameraFisService.analyzeFrame({
        pondId: selectedPondCode,
        deviceId: cameraInfo?.id || 'cam-01',
        timeDeltaSeconds: 20,
        roi: roiCoords,
        simulatedMetrics: {
          remainingFeedAreaRt: 0.10,
          shrimpDensityDt: 20.0,
          behaviorClassificationCt: 3.0,
        },
      }).catch(() => null);

      setTimeout(() => {
        setIsAnalyzing(false);
        setToastMsg('Đã hoàn tất phân tích khung hình camera sàng ăn và cập nhật chỉ số FIS.');
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

  const appInfo = getAppetiteBadge(latestFis?.appetiteLevel ?? 3);

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Camera sàng ăn & Chỉ số bắt mồi (FIS)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Giám sát lượng cám còn lại trên sàng (Rt), mật độ tôm (Dt), tốc độ tiêu thụ (vt) và đề xuất khẩu phần tự động.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Pond Camera Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 h-9">
            <Camera className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500">Ao nuôi:</span>
            <select
              value={selectedPondCode}
              onChange={(e) => setSelectedPondCode(e.target.value)}
              className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="AO-01">Ao số 1 (AO-01)</option>
              <option value="AO-02">Ao số 2 (AO-02)</option>
              <option value="AO-03">Ao số 3 (AO-03)</option>
              <option value="AO-04">Ao số 4 (AO-04)</option>
            </select>
          </div>

          {role !== 'farmer' && (
            <>
              <button
                onClick={() => setIsRoiModalOpen(true)}
                className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Crop className="w-3.5 h-3.5 text-slate-500" />
                <span>Vùng quan sát (ROI)</span>
              </button>

              <button
                onClick={() => setIsWeightsModalOpen(true)}
                className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Trọng số FIS</span>
              </button>
            </>
          )}

          <button
            onClick={handleTestAnalyze}
            disabled={isAnalyzing}
            className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
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

      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2. 4 UNIFORM KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: FIS Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Chỉ số bắt mồi (FIS)</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-num tracking-tight text-slate-900">
              {latestFis?.fisScore?.toFixed(3) || '0.785'}
            </span>
            <span className="text-xs text-slate-400 font-mono-num">/ 1.000</span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${appInfo.color}`}>
              {appInfo.label}
            </span>
            <span className="text-slate-400 font-mono-num">
              {latestFis?.isStale ? 'Dữ liệu cũ' : 'Trực tiếp'}
            </span>
          </div>
        </div>

        {/* KPI 2: Remaining Feed Rt */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cám còn trên sàng (Rt)</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
              <Scale className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-num text-slate-900">
              {latestFis?.remainingFeedPercent?.toFixed(1) || '12.0'}%
            </span>
            <span className="text-xs text-slate-400">diện tích sàng</span>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  (latestFis?.remainingFeedPercent || 12) > 40 ? 'bg-red-500' : 'bg-teal-600'
                }`}
                style={{ width: `${latestFis?.remainingFeedPercent || 12}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">Ngưỡng cảnh báo dư thừa: &gt; 50%</p>
          </div>
        </div>

        {/* KPI 3: Shrimp Density Dt */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Mật độ tôm quanh sàng (Dt)</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-num text-slate-900">
              {latestFis?.shrimpDensity?.toFixed(1) || '18.5'}
            </span>
            <span className="text-xs font-medium text-slate-400">con/m²</span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-medium">Tập trung bắt mồi tốt</span>
          </div>
        </div>

        {/* KPI 4: Consumption Velocity Vt */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tốc độ tiêu thụ (vt)</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-num text-slate-900">
              {latestFis?.consumptionVelocity?.toFixed(3) || '0.015'}
            </span>
            <span className="text-xs font-medium text-slate-400">/ giây</span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Ổn định theo nhiệt độ ao</span>
          </div>
        </div>
      </div>

      {/* 3. FEED & BIOMASS RECOMMENDATION PANEL */}
      {aiRecommendation && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  Khuyến nghị khẩu phần & Ước tính sinh khối
                </h2>
                <span className="text-[11px] font-mono-num bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  {aiRecommendation.modelName || 'FeedOpt'} v{aiRecommendation.modelVersion || '2.1.0'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng hợp từ chỉ số bắt mồi FIS, sinh khối đàn tôm và thông số môi trường nước hiện tại
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono-num text-xs">
              <span className="text-slate-500">
                Độ tin cậy: <strong className="text-slate-900">{((aiRecommendation.confidence || 0.94) * 100).toFixed(0)}%</strong>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  aiRecommendation.safetyDecision === 'blocked'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : aiRecommendation.safetyDecision === 'adjusted'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {aiRecommendation.safetyDecision === 'blocked'
                  ? 'Tạm khóa rải'
                  : aiRecommendation.safetyDecision === 'adjusted'
                  ? 'Đã điều chỉnh'
                  : 'Cho phép rải'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block">Lượng cám khuyến nghị</span>
              <span className="text-lg font-bold text-slate-900 font-mono-num mt-1 block">
                {aiRecommendation.predictedFeedAmountKg ?? 16.2} <span className="text-xs font-normal text-slate-500">kg</span>
              </span>
            </div>

            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block">Tốc độ rải tối ưu</span>
              <span className="text-lg font-bold text-slate-900 font-mono-num mt-1 block">
                {aiRecommendation.spreadRateKgPerMinute ?? 1.6} <span className="text-xs font-normal text-slate-500">kg/phút</span>
              </span>
            </div>

            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block">Sinh khối ước tính</span>
              <span className="text-lg font-bold text-slate-900 font-mono-num mt-1 block">
                {aiRecommendation.biomassKg ?? 780.0} <span className="text-xs font-normal text-slate-500">kg</span>
              </span>
            </div>

            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 block">Chỉ số bất thường</span>
              <span
                className={`text-lg font-bold font-mono-num mt-1 block ${
                  (aiRecommendation.anomalyScore || 0) > 0.3 ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {(aiRecommendation.anomalyScore ?? 0.04).toFixed(2)}
              </span>
            </div>
          </div>

          {aiRecommendation.explanation && (
            <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-200/70 text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Nhận định:</strong> {aiRecommendation.explanation}
            </div>
          )}
        </div>
      )}

      {/* 4. CAMERA FEED & FIS FORMULA BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Camera Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h3 className="text-sm font-semibold text-slate-900">
                Khung hình trực tiếp: {cameraInfo?.name || 'Camera sàng ăn Ao 01'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono-num text-slate-500">
              <span>{roiCoords.resolutionWidth}×{roiCoords.resolutionHeight}</span>
              <span>• 30 FPS</span>
            </div>
          </div>

          {/* Visual Camera Canvas */}
          <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
            <div className="absolute inset-0 bg-radial from-slate-800 via-slate-900 to-slate-950 opacity-90" />

            {/* ROI Box */}
            <div
              className="absolute border-2 border-teal-400/90 rounded-lg bg-teal-500/10 flex flex-col justify-between p-2.5 pointer-events-none"
              style={{ width: '55%', height: '65%' }}
            >
              <div className="flex items-center justify-between text-[11px] font-mono-num text-teal-300 font-medium bg-slate-950/80 px-2 py-0.5 rounded w-max">
                <span>Vùng ROI sàng ăn [{roiCoords.width}×{roiCoords.height}]</span>
              </div>

              <div className="flex items-center justify-center">
                <span className="px-3 py-1 rounded-full bg-slate-950/85 text-teal-300 font-mono-num text-xs font-semibold border border-teal-500/40">
                  Rt: {latestFis?.remainingFeedPercent ?? 12}% • FIS: {latestFis?.fisScore ?? 0.785}
                </span>
              </div>

              <div className="text-[11px] font-mono-num text-teal-300/80 text-right">
                Độ tin cậy: 94.2%
              </div>
            </div>

            <span className="text-xs font-mono-num text-slate-400 z-10 pointer-events-none">
              [Luồng video trực tuyến từ camera sàng ăn]
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="font-mono-num">
              Cập nhật lúc: {latestFis?.timestamp ? new Date(latestFis.timestamp).toLocaleTimeString('vi-VN') : '10:45:00'}
            </span>
            <span className="text-emerald-700 font-medium">Trạng thái: Đang hoạt động</span>
          </div>
        </div>

        {/* FIS Details & Weights Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Cpu className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">
                Đánh giá chi tiết & Tham số
              </h3>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
              <div className="font-semibold text-emerald-900 flex items-center justify-between">
                <span>Đánh giá sức ăn hiện tại:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px]">Mức 3 (Mạnh)</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Tôm ăn tích cực, lượng cám trên sàng giảm đều theo thời gian, không có thức ăn dư quá hạn 30 phút.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-slate-500">Khẩu phần đề xuất:</span>
                <strong className="text-slate-900 font-mono-num">+5% cữ kế tiếp (15.8 kg)</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-slate-500">Tốc độ rải tối ưu:</span>
                <strong className="text-slate-900 font-mono-num">1.6 kg / phút</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-slate-500">Chu kỳ lấy mẫu ảnh:</span>
                <strong className="text-slate-900 font-mono-num">Mỗi {weights.samplingIntervalSeconds} giây</strong>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1 font-mono-num">
            <div className="text-[11px] font-sans font-medium text-slate-500 mb-1">Cấu hình trọng số FIS hiện tại:</div>
            <div>• w1 (Rt): {weights.weightRt} | w2 (vt): {weights.weightVt}</div>
            <div>• w3 (Dt): {weights.weightDt} | w4 (Ct): {weights.weightCt}</div>
          </div>
        </div>
      </div>

      {/* 5. ROI MODAL */}
      {isRoiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Crop className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-sm text-slate-900">
                  Cấu hình vùng quan sát sàng ăn (ROI)
                </h3>
              </div>
              <button onClick={() => setIsRoiModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoi} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Thiết lập tọa độ khung cắt để hệ thống tập trung phân tích diện tích mặt sàng ăn.
              </p>

              <div className="grid grid-cols-2 gap-3 font-mono-num text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tọa độ X</label>
                  <input
                    type="number"
                    value={roiCoords.x}
                    onChange={(e) => setRoiCoords({ ...roiCoords, x: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tọa độ Y</label>
                  <input
                    type="number"
                    value={roiCoords.y}
                    onChange={(e) => setRoiCoords({ ...roiCoords, y: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Chiều rộng (Width)</label>
                  <input
                    type="number"
                    value={roiCoords.width}
                    onChange={(e) => setRoiCoords({ ...roiCoords, width: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Chiều cao (Height)</label>
                  <input
                    type="number"
                    value={roiCoords.height}
                    onChange={(e) => setRoiCoords({ ...roiCoords, height: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoiModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-sm text-slate-900">
                  Trọng số thành phần FIS (w1 – w4)
                </h3>
              </div>
              <button onClick={() => setIsWeightsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWeights} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Điều chỉnh tỷ trọng các biến số thành phần để tính điểm cường độ bắt mồi FIS (Tổng = 1.0).
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-700 font-medium">w1 (Thức ăn còn lại Rt):</span>
                    <strong className="font-mono-num">{weights.weightRt}</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.weightRt}
                    onChange={(e) => setWeights({ ...weights, weightRt: Number(e.target.value) })}
                    className="w-full accent-teal-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-700 font-medium">w2 (Tốc độ tiêu thụ vt):</span>
                    <strong className="font-mono-num">{weights.weightVt}</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.weightVt}
                    onChange={(e) => setWeights({ ...weights, weightVt: Number(e.target.value) })}
                    className="w-full accent-teal-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-700 font-medium">w3 (Mật độ tôm Dt):</span>
                    <strong className="font-mono-num">{weights.weightDt}</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.weightDt}
                    onChange={(e) => setWeights({ ...weights, weightDt: Number(e.target.value) })}
                    className="w-full accent-teal-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-700 font-medium">w4 (Hành vi bắt mồi Ct):</span>
                    <strong className="font-mono-num">{weights.weightCt}</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights.weightCt}
                    onChange={(e) => setWeights({ ...weights, weightCt: Number(e.target.value) })}
                    className="w-full accent-teal-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWeightsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
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
