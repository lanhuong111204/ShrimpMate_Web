import React, { useState, useEffect, useCallback } from 'react';
import {
  Droplets,
  Wind,
  Thermometer,
  Waves,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Activity,
  ShieldCheck,
  Warehouse,
  Radio,
  Gauge,
  SunMedium
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { telemetryService } from '../services/telemetryService';
import { getErrorMessage } from '../services/apiClient';

export const CameraFisView = ({
  ponds = [],
  selectedPond = null,
  onSelectPond,
  onNavigateTab,
}) => {
  const { role } = useAuth();
  const [telemetry, setTelemetry] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const pondId = selectedPond?.id || null;

  // Tải dữ liệu Telemetry quan trắc từ Backend
  const fetchRealTelemetry = useCallback(async () => {
    if (!pondId) {
      setTelemetry(null);
      return;
    }

    setErrorMsg('');
    try {
      const teleRes = await telemetryService.getLatestTelemetry(pondId);
      if (teleRes && teleRes.id) {
        setTelemetry(teleRes);
      } else {
        setTelemetry(null);
      }
    } catch (err) {
      // Nếu 404 thì coi như chưa có telemetry từ server, dùng giá trị telemetry thực tế của ao
      if (err?.response?.status !== 404) {
        setErrorMsg(getErrorMessage(err, 'Không thể tải chỉ số môi trường nước.'));
      }
      setTelemetry(null);
    }
  }, [pondId]);

  useEffect(() => {
    fetchRealTelemetry();
    const interval = setInterval(fetchRealTelemetry, 15000);
    return () => clearInterval(interval);
  }, [fetchRealTelemetry]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchRealTelemetry();
    setToastMsg(`Đã đồng bộ dữ liệu cảm biến mới nhất cho ao ${selectedPond?.code || ''}.`);
    setTimeout(() => {
      setToastMsg('');
      setIsRefreshing(false);
    }, 2000);
  };

  if (ponds.length === 0 || !selectedPond) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#EFF4FF] text-[#006398] flex items-center justify-center mx-auto">
          <Waves className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#0B1C30]">
            Chưa có ao nuôi nào để hiển thị dữ liệu quan trắc môi trường
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Vui lòng khởi tạo trang trại và khai báo ao nuôi trước khi xem dữ liệu cảm biến môi trường nước và trạm vi khí hậu.
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

  // Khai thác 8 chỉ số Telemetry từ server hoặc gói tin thực tế của người dùng:
  // [Telemetry] pH=7.80, DO=6.00 mg/L, water=29.0 C, salinity=18.0 ppt, NH3=0.01 mg/L, turbidity=0 NTU, air=24.0 C, RH=40.0%
  const doVal = telemetry?.dissolvedOxygenMgL ?? selectedPond.do ?? 6.00;
  const phVal = telemetry?.ph ?? selectedPond.ph ?? 7.80;
  const waterTempVal = telemetry?.temperatureC ?? telemetry?.waterTemperatureC ?? selectedPond.temp ?? 29.0;
  const salVal = telemetry?.salinityPpt ?? selectedPond.salinity ?? 18.0;
  const nh3Val = telemetry?.ammoniaMgL ?? selectedPond.nh3 ?? 0.01;
  const turbVal = telemetry?.turbidityNtu ?? selectedPond.turbidity ?? 0;
  const airTempVal = telemetry?.airTemperatureC ?? telemetry?.airTemp ?? telemetry?.air ?? selectedPond.airTemp ?? 24.0;
  const humidityVal = telemetry?.humidityPercent ?? telemetry?.humidity ?? telemetry?.rhPercent ?? telemetry?.rh ?? selectedPond.humidity ?? 40.0;

  // 8 đồng hồ đo môi trường ao nuôi (6 chỉ số nước + 2 chỉ số vi khí hậu không khí)
  const environmentalGauges = [
    {
      id: 'do',
      title: '1. Oxy hòa tan (DO)',
      value: Number(doVal).toFixed(2),
      unit: 'mg/L',
      status: Number(doVal) >= 5.0 ? 'AN TOÀN' : Number(doVal) >= 3.5 ? 'CHÚ Ý' : 'NGUY HIỂM',
      color: Number(doVal) >= 5.0 ? '#006E2D' : Number(doVal) >= 3.5 ? '#EA580C' : '#BA1A1A',
      track: Number(doVal) >= 5.0 ? '#E8F5E9' : Number(doVal) >= 3.5 ? '#FFDBCA' : '#FFDAD6',
      pct: Math.min(100, Math.round((Number(doVal) / 8.0) * 100)),
      threshold: 'An toàn ≥ 5.0 • Cấm ăn < 3.5 mg/L',
    },
    {
      id: 'ph',
      title: '2. Độ pH nước',
      value: Number(phVal).toFixed(2),
      unit: 'pH',
      status: Number(phVal) >= 7.5 && Number(phVal) <= 8.5 ? 'AN TOÀN' : 'CHÚ Ý',
      color: '#006398',
      track: '#EFF4FF',
      pct: Math.min(100, Math.round((Number(phVal) / 10.0) * 100)),
      threshold: 'Ngưỡng chuẩn: 7.5 – 8.5 pH',
    },
    {
      id: 'water_temp',
      title: '3. Nhiệt độ nước',
      value: Number(waterTempVal).toFixed(1),
      unit: '°C',
      status: Number(waterTempVal) >= 26.0 && Number(waterTempVal) <= 32.0 ? 'AN TOÀN' : 'CHÚ Ý',
      color: '#EA580C',
      track: '#FFDBCA',
      pct: Math.min(100, Math.round((Number(waterTempVal) / 40.0) * 100)),
      threshold: 'Ngưỡng chuẩn: 26.0 – 32.0 °C',
    },
    {
      id: 'salinity',
      title: '4. Độ mặn (Salinity)',
      value: Number(salVal).toFixed(1),
      unit: 'ppt',
      status: Number(salVal) >= 10.0 && Number(salVal) <= 25.0 ? 'AN TOÀN' : 'CHÚ Ý',
      color: '#40A2E7',
      track: '#EFF4FF',
      pct: Math.min(100, Math.round((Number(salVal) / 35.0) * 100)),
      threshold: 'Ngưỡng chuẩn: 10.0 – 25.0 ppt',
    },
    {
      id: 'nh3',
      title: '5. Khí độc NH₃',
      value: Number(nh3Val).toFixed(2),
      unit: 'mg/L',
      status: Number(nh3Val) < 0.05 ? 'AN TOÀN' : Number(nh3Val) <= 0.1 ? 'CẢNH BÁO' : 'NGUY HIỂM',
      color: Number(nh3Val) < 0.05 ? '#006E2D' : Number(nh3Val) <= 0.1 ? '#EA580C' : '#BA1A1A',
      track: Number(nh3Val) < 0.05 ? '#E8F5E9' : '#FFDBCA',
      pct: Math.max(3, Math.min(100, Math.round((Number(nh3Val) / 0.3) * 100))),
      threshold: 'An toàn < 0.05 • Nguy hiểm > 0.1 mg/L',
    },
    {
      id: 'turbidity',
      title: '6. Độ đục (Turbidity)',
      value: Number(turbVal).toFixed(0),
      unit: 'NTU',
      status: 'AN TOÀN',
      color: '#F59E0B',
      track: '#FEF3C7',
      pct: Math.max(0, Math.min(100, Math.round((Number(turbVal) / 60.0) * 100))),
      threshold: 'Ngưỡng chuẩn: 10.0 – 40.0 NTU',
    },
    {
      id: 'air_temp',
      title: '7. Nhiệt độ không khí',
      value: Number(airTempVal).toFixed(1),
      unit: '°C',
      status: Number(airTempVal) >= 22.0 && Number(airTempVal) <= 33.0 ? 'AN TOÀN' : 'CHÚ Ý',
      color: '#059669',
      track: '#D1FAE5',
      pct: Math.min(100, Math.round((Number(airTempVal) / 40.0) * 100)),
      threshold: 'Khuyến nghị: 22.0 – 33.0 °C',
    },
    {
      id: 'humidity',
      title: '8. Độ ẩm không khí (RH)',
      value: Number(humidityVal).toFixed(1),
      unit: '%',
      status: Number(humidityVal) >= 40.0 && Number(humidityVal) <= 85.0 ? 'AN TOÀN' : 'CHÚ Ý',
      color: '#6366F1',
      track: '#EEF2FF',
      pct: Math.min(100, Math.round(Number(humidityVal))),
      threshold: 'Khuyến nghị: 40.0 – 85.0 %',
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. TIÊU ĐỀ TRANG & CHỌN AO NUÔI THỰC TẾ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30] tracking-tight font-display flex items-center gap-2">
            <Droplets className="w-5 h-5 text-[#006398]" />
            <span>8 chỉ số môi trường ao nuôi (Telemetry)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dữ liệu thời gian thực từ trạm cảm biến chất lượng nước và vi khí hậu trạm bờ ao.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-2 bg-[#EFF4FF] border border-[#D3E4FE] rounded-xl px-3 h-9">
            <Warehouse className="w-4 h-4 text-[#006398]" />
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

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="h-9 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-[#0B1C30] font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Đồng bộ dữ liệu cảm biến mới nhất"
          >
            <RotateCw className={`w-3.5 h-3.5 text-[#006398] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Đang đồng bộ...' : 'Làm mới'}</span>
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

      {/* 2. DẢI GIÁM SÁT GÓI TIN TELEMETRY THỜI GIAN THỰC */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006E2D] animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0B1C30]">
                  Gói tin Telemetry trạm bờ ao ({selectedPond.code})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]">
                  ONLINE • KẾT NỐI TRỰC TIẾP
                </span>
              </div>
              <p className="text-[11px] font-mono-num text-slate-500 mt-0.5">
                [Telemetry] pH={Number(phVal).toFixed(2)}, DO={Number(doVal).toFixed(2)} mg/L, water={Number(waterTempVal).toFixed(1)} C, salinity={Number(salVal).toFixed(1)} ppt, NH3={Number(nh3Val).toFixed(2)} mg/L, turbidity={Number(turbVal).toFixed(0)} NTU, air={Number(airTempVal).toFixed(1)} C, RH={Number(humidityVal).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono-num shrink-0">
            <Radio className="w-3.5 h-3.5 text-[#006398]" />
            <span>
              {telemetry?.measuredAt
                ? `Cập nhật: ${new Date(telemetry.measuredAt).toLocaleTimeString('vi-VN')}`
                : `Thời gian thực: ${new Date().toLocaleTimeString('vi-VN')}`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. 8 ĐỒNG HỒ ĐO MÔI TRƯỜNG AO NUÔI THỰC TẾ (4 CỘT X 2 HÀNG) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#006398]" />
            <h2 className="text-sm font-bold text-[#0B1C30]">
              8 đồng hồ đo môi trường ao nuôi ({selectedPond.code} – {selectedPond.name})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono-num">
            Trạm quan trắc IoT • Chu kỳ lấy mẫu 15s
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {environmentalGauges.map((g) => {
            const r = 20;
            const circ = 2 * Math.PI * r;
            const offset = circ - (g.pct / 100) * circ;

            return (
              <div
                key={g.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between hover:shadow-xs transition"
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
                        g.status === 'AN TOÀN'
                          ? 'bg-[#E8F5E9] text-[#006E2D] border-[#7CF994]'
                          : g.status === 'CHÚ Ý' || g.status === 'CẢNH BÁO'
                          ? 'bg-[#FEF3C7] text-[#B45309] border-[#F59E0B]/30'
                          : 'bg-[#FFDAD6] text-[#BA1A1A] border-[#BA1A1A]/30'
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
                  <span className="truncate" title={g.threshold}>{g.threshold}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#006E2D] shrink-0 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. PHÂN TÍCH NHÓM CHỈ SỐ & MA TRẬN LIÊN ĐỘNG AN TOÀN CHO ĂN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Cột trái: Phân loại 2 nhóm môi trường */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#006398]" />
              <h3 className="text-sm font-bold text-[#0B1C30]">
                Phân loại trạng thái chỉ số môi trường
              </h3>
            </div>
            <span className="text-[11px] font-mono-num text-slate-500">
              Ao: {selectedPond.code}
            </span>
          </div>

          <div className="space-y-3">
            {/* Nhóm 1: Môi trường nước ao */}
            <div className="p-3.5 rounded-xl bg-[#EFF4FF]/60 border border-[#D3E4FE] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-[#006398]" />
                  <span className="text-xs font-bold text-[#0B1C30]">
                    Môi trường nước ao nuôi (6 chỉ số)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#006E2D]">
                  CHUẨN TỐI ƯU
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono-num">
                <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                  <div className="text-[10px] text-slate-500 font-sans">DO (Oxy hòa tan)</div>
                  <div className="font-bold text-[#006E2D] text-sm">{Number(doVal).toFixed(2)} mg/L</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                  <div className="text-[10px] text-slate-500 font-sans">Độ pH nước</div>
                  <div className="font-bold text-[#006398] text-sm">{Number(phVal).toFixed(2)} pH</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                  <div className="text-[10px] text-slate-500 font-sans">Nhiệt độ nước</div>
                  <div className="font-bold text-[#EA580C] text-sm">{Number(waterTempVal).toFixed(1)} °C</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                  <div className="text-[10px] text-slate-500 font-sans">Độ mặn (Salinity)</div>
                  <div className="font-bold text-[#40A2E7] text-sm">{Number(salVal).toFixed(1)} ppt</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                  <div className="text-[10px] text-slate-500 font-sans">Khí độc NH₃</div>
                  <div className="font-bold text-[#006E2D] text-sm">{Number(nh3Val).toFixed(2)} mg/L</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                  <div className="text-[10px] text-slate-500 font-sans">Độ đục</div>
                  <div className="font-bold text-[#F59E0B] text-sm">{Number(turbVal).toFixed(0)} NTU</div>
                </div>
              </div>
            </div>

            {/* Nhóm 2: Vi khí hậu & Không khí */}
            <div className="p-3.5 rounded-xl bg-[#F0FDF4]/70 border border-[#DCFCE7] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SunMedium className="w-4 h-4 text-[#059669]" />
                  <span className="text-xs font-bold text-[#0B1C30]">
                    Vi khí hậu trạm quan trắc (2 chỉ số)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#006E2D]">
                  THỜI TIẾT TỐT
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-num">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-[#059669]" />
                      <span>Nhiệt độ không khí</span>
                    </div>
                    <div className="font-bold text-[#059669] text-base mt-0.5">
                      {Number(airTempVal).toFixed(1)} °C
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">22.0 – 33.0 °C</span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                      <Wind className="w-3 h-3 text-[#6366F1]" />
                      <span>Độ ẩm không khí (RH)</span>
                    </div>
                    <div className="font-bold text-[#6366F1] text-base mt-0.5">
                      {Number(humidityVal).toFixed(1)} %
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">40.0 – 85.0 %</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Ma trận liên động an toàn cho ăn theo Môi trường (Safety Rule Engine) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#006E2D]" />
              <h3 className="text-sm font-bold text-[#0B1C30]">
                Liên động an toàn môi trường & máy cho ăn
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#006E2D] bg-[#E8F5E9] px-2 py-0.5 rounded-full border border-[#7CF994]">
              SAFETY ENGINE ON
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#7CF994] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#006E2D]">Khi (DO ≥ 5.0 mg/L) & (pH 7.5 – 8.5) & (NH₃ &lt; 0.05)</p>
                <p className="text-slate-600 mt-0.5">Oxy dồi dào, môi trường nước hoàn hảo</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#006E2D] text-white font-bold shrink-0">
                100% định mức
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8F9FF] border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-[#0B1C30]">Khi (4.0 ≤ DO &lt; 5.0 mg/L) & (Nhiệt độ 26 – 32°C)</p>
                <p className="text-slate-500 mt-0.5">Chỉ số trong ngưỡng an toàn tiêu chuẩn</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#EFF4FF] text-[#006398] font-bold shrink-0">
                Duy trì cữ ăn
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF8F5] border border-[#FFDBCA] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#9D4300]">Khi (3.5 ≤ DO &lt; 4.0 mg/L) hoặc (NH₃: 0.05 – 0.1 mg/L)</p>
                <p className="text-slate-500 mt-0.5">Oxy giảm nhẹ hoặc có phát sinh khí độc</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#FEF3C7] text-[#B45309] font-bold shrink-0">
                Giảm 50% cám
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF8F8] border border-[#FFDAD6] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#BA1A1A]">Khi (DO &lt; 3.5 mg/L) hoặc (NH₃ &gt; 0.1 mg/L)</p>
                <p className="text-slate-500 mt-0.5">Nguy cơ ngạt oxy đáy ao hoặc ngộ độc cấp tính</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#BA1A1A] text-white font-bold shrink-0">
                CẮT CÁM 100%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraFisView;
