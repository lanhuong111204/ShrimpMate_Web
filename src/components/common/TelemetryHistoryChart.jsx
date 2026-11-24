import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, RotateCw, AlertCircle } from 'lucide-react';
import { telemetryService } from '../../services/telemetryService';
import { getErrorMessage } from '../../services/apiClient';
import {
  WATER_METRIC_META,
  resolveWaterMetricConfig,
} from '../../utils/waterQualityThresholds';

const METRIC_LINE_COLORS = {
  dissolvedOxygenMgL: '#006398',
  ph: '#006E2D',
  temperatureC: '#EA580C',
  salinityPpt: '#0284C7',
  ammoniaMgL: '#BA1A1A',
  turbidityNtu: '#D97706',
};

export const TelemetryHistoryChart = ({ pondId = null, pondLabel = '' }) => {
  const [selectedMetricKey, setSelectedMetricKey] = useState('dissolvedOxygenMgL');
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hoverIdx, setHoverIdx] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!pondId) {
      setReadings([]);
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await telemetryService.getTelemetryHistory(pondId, {
        page: 1,
        limit: 50,
      });
      const rawList = Array.isArray(res) ? res : res?.data || [];
      const chronological = [...rawList].sort(
        (a, b) =>
          new Date(a.measuredAt || a.createdAt || 0).getTime() -
          new Date(b.measuredAt || b.createdAt || 0).getTime()
      );
      setReadings(chronological);
    } catch (err) {
      setErrorMessage(
        getErrorMessage(err, 'Không thể tải dữ liệu lịch sử quan trắc nước.')
      );
      setReadings([]);
    } finally {
      setIsLoading(false);
    }
  }, [pondId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchHistory();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchHistory]);

  const metricConfig = resolveWaterMetricConfig(selectedMetricKey) || WATER_METRIC_META[0];
  const lineColor = METRIC_LINE_COLORS[metricConfig.key] || '#006398';

  const points = useMemo(() => {
    return readings
      .map((item) => {
        const raw = item?.[metricConfig.key];
        const num = raw !== null && raw !== undefined && raw !== '' ? Number(raw) : null;
        if (num === null || !Number.isFinite(num)) return null;
        return {
          value: num,
          measuredAt: item.measuredAt || item.createdAt,
        };
      })
      .filter(Boolean);
  }, [readings, metricConfig.key]);

  const chartStats = useMemo(() => {
    if (points.length === 0) return null;
    const vals = points.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    const latest = vals[vals.length - 1];
    return { min, max, avg, latest };
  }, [points]);

  // Tính toạ độ SVG
  const svgWidth = 720;
  const svgHeight = 220;
  const padLeft = 48;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 30;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const { yMin, yMax, coords, areaPath, linePath, refLines } = useMemo(() => {
    if (points.length === 0) {
      return { yMin: 0, yMax: 10, coords: [], areaPath: '', linePath: '', refLines: [] };
    }
    const vals = points.map((p) => p.value);
    const refVals = [
      metricConfig.warningMin,
      metricConfig.warningMax,
      metricConfig.criticalMin,
      metricConfig.criticalMax,
    ].filter((v) => v !== undefined);
    const rawMin = Math.min(...vals, ...(refVals.length > 0 ? refVals : vals));
    const rawMax = Math.max(...vals, ...(refVals.length > 0 ? refVals : vals));
    const span = Math.max(rawMax - rawMin, 0.5);
    const lo = Math.max(0, rawMin - span * 0.12);
    const hi = rawMax + span * 0.12;

    const toX = (i) =>
      points.length === 1
        ? padLeft + plotW / 2
        : padLeft + (i / (points.length - 1)) * plotW;
    const toY = (v) => padTop + plotH - ((v - lo) / (hi - lo)) * plotH;

    const mapped = points.map((p, i) => ({
      ...p,
      x: toX(i),
      y: toY(p.value),
    }));

    const line = mapped
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
      .join(' ');
    const baseY = (padTop + plotH).toFixed(1);
    const area =
      mapped.length > 1
        ? `${line} L ${mapped[mapped.length - 1].x.toFixed(1)} ${baseY} L ${mapped[0].x.toFixed(1)} ${baseY} Z`
        : '';

    const refs = [];
    if (metricConfig.warningMin !== undefined) {
      refs.push({ val: metricConfig.warningMin, y: toY(metricConfig.warningMin), label: `CB ${metricConfig.warningMin}`, color: '#D97706' });
    }
    if (metricConfig.warningMax !== undefined) {
      refs.push({ val: metricConfig.warningMax, y: toY(metricConfig.warningMax), label: `CB ${metricConfig.warningMax}`, color: '#D97706' });
    }
    if (metricConfig.criticalMin !== undefined) {
      refs.push({ val: metricConfig.criticalMin, y: toY(metricConfig.criticalMin), label: `NG ${metricConfig.criticalMin}`, color: '#BA1A1A' });
    }
    if (metricConfig.criticalMax !== undefined) {
      refs.push({ val: metricConfig.criticalMax, y: toY(metricConfig.criticalMax), label: `NG ${metricConfig.criticalMax}`, color: '#BA1A1A' });
    }

    return { yMin: lo, yMax: hi, coords: mapped, areaPath: area, linePath: line, refLines: refs };
  }, [points, metricConfig, plotW, plotH]);

  const activePoint = hoverIdx !== null ? coords[hoverIdx] : coords[coords.length - 1];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EFF4FF] text-[#006398] flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0B1C30]">
              Biểu đồ chuỗi thời gian chất lượng nước {pondLabel ? `(${pondLabel})` : ''}
            </h3>
            <p className="text-xs text-slate-500">
              50 mẫu đo gần nhất từ GET /telemetry/history • Di chuột vào điểm đo để xem chi tiết
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchHistory}
          disabled={isLoading || !pondId}
          className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start md:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#006398]' : ''}`} />
          <span>Tải lại lịch sử</span>
        </button>
      </div>

      {/* Bộ chọn 6 chỉ số */}
      <div className="flex flex-wrap items-center gap-1.5">
        {WATER_METRIC_META.map((m) => {
          const isSelected = m.key === metricConfig.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setSelectedMetricKey(m.key);
                setHoverIdx(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isSelected
                  ? 'bg-[#0B1C30] text-white border-[#0B1C30]'
                  : 'bg-[#F8F9FF] text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading && points.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-[#006398]" />
          <span>Đang tải chuỗi dữ liệu lịch sử...</span>
        </div>
      ) : points.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
          Ao nuôi chưa có đủ dữ liệu lịch sử cho chỉ số {metricConfig.label}.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Tóm tắt Min / Avg / Max / Mới nhất */}
          {chartStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-num">
              <div className="p-2.5 rounded-xl bg-[#F8F9FF] border border-slate-200/80">
                <span className="text-[10px] font-sans text-slate-500 block">
                  {hoverIdx !== null ? 'Điểm đang xem' : 'Mới nhất'}
                </span>
                <strong className="text-sm text-[#0B1C30]">
                  {(activePoint?.value ?? chartStats.latest).toFixed(metricConfig.decimals ?? 1)}{' '}
                  {metricConfig.unit}
                </strong>
                {activePoint?.measuredAt && (
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(activePoint.measuredAt).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8F9FF] border border-slate-200/80">
                <span className="text-[10px] font-sans text-slate-500 block">Trung bình</span>
                <strong className="text-sm text-[#006398]">
                  {chartStats.avg.toFixed(metricConfig.decimals ?? 1)} {metricConfig.unit}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8F9FF] border border-slate-200/80">
                <span className="text-[10px] font-sans text-slate-500 block">Thấp nhất</span>
                <strong className="text-sm text-slate-700">
                  {chartStats.min.toFixed(metricConfig.decimals ?? 1)} {metricConfig.unit}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8F9FF] border border-slate-200/80">
                <span className="text-[10px] font-sans text-slate-500 block">Cao nhất</span>
                <strong className="text-sm text-slate-700">
                  {chartStats.max.toFixed(metricConfig.decimals ?? 1)} {metricConfig.unit}
                </strong>
              </div>
            </div>
          )}

          {/* Biểu đồ SVG */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full min-w-[520px] h-56 select-none"
            >
              {/* Grid Y axis */}
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y = padTop + t * plotH;
                const val = yMax - t * (yMax - yMin);
                return (
                  <g key={t}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padLeft - 6}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="10"
                      fill="#64748B"
                      className="font-mono-num"
                    >
                      {val.toFixed(metricConfig.decimals === 3 ? 2 : 1)}
                    </text>
                  </g>
                );
              })}

              {/* Đường tham chiếu ngưỡng BE (Cảnh báo / Nguy cấp) */}
              {refLines.map((ref) => (
                <g key={`${ref.label}-${ref.color}`}>
                  <line
                    x1={padLeft}
                    y1={ref.y}
                    x2={svgWidth - padRight}
                    y2={ref.y}
                    stroke={ref.color}
                    strokeWidth="1.2"
                    strokeDasharray="5 4"
                    opacity="0.7"
                  />
                  <text
                    x={svgWidth - padRight - 2}
                    y={ref.y - 3}
                    textAnchor="end"
                    fontSize="9"
                    fontWeight="bold"
                    fill={ref.color}
                  >
                    {ref.label}
                  </text>
                </g>
              ))}

              {/* Area + Line */}
              {areaPath && (
                <path d={areaPath} fill={lineColor} opacity="0.1" />
              )}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {/* Data points + X axis labels */}
              {coords.map((pt, idx) => {
                const isActive = hoverIdx === idx || (hoverIdx === null && idx === coords.length - 1);
                const showTimeLabel =
                  idx === 0 ||
                  idx === coords.length - 1 ||
                  idx === Math.floor(coords.length / 2);

                return (
                  <g key={`${pt.measuredAt || idx}-${idx}`}>
                    {showTimeLabel && pt.measuredAt && (
                      <text
                        x={pt.x}
                        y={svgHeight - 8}
                        textAnchor="middle"
                        fontSize="9.5"
                        fill="#64748B"
                        className="font-mono-num"
                      >
                        {new Date(pt.measuredAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </text>
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isActive ? 5 : 3}
                      fill={isActive ? '#EA580C' : lineColor}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoverIdx(idx)}
                      onMouseLeave={() => setHoverIdx(null)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelemetryHistoryChart;
