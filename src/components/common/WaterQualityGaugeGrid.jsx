import React from 'react';
import { WATER_METRIC_META, evaluateWaterMetric } from '../../utils/waterQualityThresholds';

const POND_VALUE_KEY_MAP = {
  dissolvedOxygenMgL: 'do',
  ph: 'ph',
  temperatureC: 'temp',
  salinityPpt: 'salinity',
  ammoniaMgL: 'nh3',
  turbidityNtu: 'turbidity',
};

const computeRingRatio = (metric, val) => {
  if (val === null || val === undefined || !Number.isFinite(Number(val))) return 0;
  const num = Number(val);
  const min = metric.minScale ?? 0;
  const max = metric.maxScale ?? 100;
  if (max <= min) return 0;
  return Math.max(0.05, Math.min(1, (num - min) / (max - min)));
};

export const WaterQualityGaugeGrid = ({ pond = null, compact = false }) => {
  if (!pond) return null;

  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3`}>
      {WATER_METRIC_META.map((metric) => {
        const pondProp = POND_VALUE_KEY_MAP[metric.key];
        const rawVal = pond[pondProp];
        const evalMeta = evaluateWaterMetric(metric.key, rawVal);
        const hasVal = evalMeta.numericValue !== null;
        const ratio = hasVal ? computeRingRatio(metric, evalMeta.numericValue) : 0;
        const dashOffset = circumference - ratio * circumference;
        const displayValue = hasVal
          ? evalMeta.numericValue.toFixed(metric.decimals ?? 1)
          : '--';

        return (
          <div
            key={metric.key}
            className={`rounded-2xl border bg-white ${compact ? 'p-3' : 'p-3.5'} flex flex-col items-center text-center shadow-2xs transition ${evalMeta.borderClass}`}
            title={`${metric.label}: ${evalMeta.label} (${metric.optimalRangeText})`}
          >
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  stroke={evalMeta.trackColor}
                  strokeWidth="7"
                  fill="none"
                />
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  stroke={evalMeta.hexColor}
                  strokeWidth="7"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
                <span className={`font-mono-num font-extrabold text-sm leading-none ${evalMeta.textClass}`}>
                  {displayValue}
                </span>
                {metric.unit && (
                  <span className="text-[10px] text-slate-400 font-mono-num mt-0.5">
                    {metric.unit}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-1.5 font-bold text-xs text-[#0B1C30] truncate max-w-full">
              {metric.label}
            </div>
            <span className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${evalMeta.badgeClass}`}>
              {evalMeta.label}
            </span>
            <div className="mt-1 text-[10px] text-slate-400 font-mono-num">
              {metric.optimalRangeText}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WaterQualityGaugeGrid;
