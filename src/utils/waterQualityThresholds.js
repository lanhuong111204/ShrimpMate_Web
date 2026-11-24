/**
 * Quy ước ngưỡng chất lượng nước, mức độ cảnh báo, quyết định Safety Engine
 * và trạng thái thiết bị IoT — đồng bộ 100% với Backend WATER_QUALITY_THRESHOLDS.
 */

export const WATER_QUALITY_LEVEL_STYLES = {
  green: {
    level: 'green',
    status: 'optimal',
    label: 'An toàn',
    hexColor: '#006E2D',
    trackColor: '#E8F5E9',
    badgeClass: 'bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]',
    textClass: 'text-[#006E2D]',
    bgClass: 'bg-[#E8F5E9]',
    borderClass: 'border-[#7CF994]',
    dotClass: 'bg-[#006E2D]',
  },
  yellow: {
    level: 'yellow',
    status: 'warning',
    label: 'Cảnh báo',
    hexColor: '#D97706',
    trackColor: '#FEF3C7',
    badgeClass: 'bg-amber-100 text-[#9D4300] border border-amber-200',
    textClass: 'text-[#9D4300]',
    bgClass: 'bg-[#FFF8F5]',
    borderClass: 'border-amber-200',
    dotClass: 'bg-[#F59E0B]',
  },
  red: {
    level: 'red',
    status: 'danger',
    label: 'Nguy hiểm',
    hexColor: '#BA1A1A',
    trackColor: '#FFDAD6',
    badgeClass: 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#BA1A1A]/30',
    textClass: 'text-[#BA1A1A]',
    bgClass: 'bg-[#FFF8F8]',
    borderClass: 'border-[#FFDAD6]',
    dotClass: 'bg-[#BA1A1A]',
  },
  unknown: {
    level: 'unknown',
    status: 'unknown',
    label: 'Chưa đo',
    hexColor: '#64748B',
    trackColor: '#F1F5F9',
    badgeClass: 'bg-slate-100 text-slate-500 border border-slate-200',
    textClass: 'text-slate-500',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

const toValidNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const WATER_QUALITY_THRESHOLDS = {
  dissolvedOxygenMgL: {
    key: 'dissolvedOxygenMgL',
    label: 'Oxy hòa tan (DO)',
    shortLabel: 'DO',
    unit: 'mg/L',
    minScale: 0,
    maxScale: 10,
    decimals: 2,
    optimalMin: 5.0,
    warningMin: 4.0,
    criticalMin: 3.5,
    optimalRangeText: '≥ 4.0 mg/L (Tối ưu ≥ 5.0)',
    warningRangeText: '3.5 – < 4.0 mg/L',
    dangerRangeText: '< 3.5 mg/L',
    evaluate: (raw) => {
      const v = toValidNumber(raw);
      if (v === null) return 'unknown';
      if (v < 3.5) return 'red';
      if (v < 4.0) return 'yellow';
      return 'green';
    },
  },
  ph: {
    key: 'ph',
    label: 'Độ pH',
    shortLabel: 'pH',
    unit: '',
    minScale: 5.5,
    maxScale: 10.0,
    decimals: 2,
    optimalMin: 7.5,
    optimalMax: 8.5,
    warningMin: 7.2,
    warningMax: 8.8,
    criticalMin: 7.0,
    criticalMax: 9.0,
    optimalRangeText: '7.2 – 8.8 (Tối ưu 7.5–8.5)',
    warningRangeText: '7.0 – < 7.2 hoặc > 8.8 – 9.0',
    dangerRangeText: '< 7.0 hoặc > 9.0',
    evaluate: (raw) => {
      const v = toValidNumber(raw);
      if (v === null) return 'unknown';
      if (v < 7.0 || v > 9.0) return 'red';
      if (v < 7.2 || v > 8.8) return 'yellow';
      return 'green';
    },
  },
  temperatureC: {
    key: 'temperatureC',
    label: 'Nhiệt độ nước',
    shortLabel: 'Nhiệt',
    unit: '°C',
    minScale: 18,
    maxScale: 38,
    decimals: 1,
    optimalMin: 28.0,
    optimalMax: 32.0,
    warningMin: 26.0,
    warningMax: 33.5,
    criticalMin: 22.0,
    criticalMax: 35.0,
    optimalRangeText: '26 – 33.5 °C (Tối ưu 28–32)',
    warningRangeText: '22 – < 26 hoặc > 33.5 – 35 °C',
    dangerRangeText: '< 22 hoặc > 35 °C',
    evaluate: (raw) => {
      const v = toValidNumber(raw);
      if (v === null) return 'unknown';
      if (v < 22.0 || v > 35.0) return 'red';
      if (v < 26.0 || v > 33.5) return 'yellow';
      return 'green';
    },
  },
  salinityPpt: {
    key: 'salinityPpt',
    label: 'Độ mặn',
    shortLabel: 'Mặn',
    unit: '‰',
    minScale: 0,
    maxScale: 40,
    decimals: 1,
    optimalMin: 10.0,
    optimalMax: 25.0,
    warningMin: 5.0,
    warningMax: 30.0,
    criticalMin: 2.0,
    criticalMax: 35.0,
    optimalRangeText: '5 – 30 ‰ (Tối ưu 10–25)',
    warningRangeText: '2 – < 5 hoặc > 30 – 35 ‰',
    dangerRangeText: '< 2 hoặc > 35 ‰',
    evaluate: (raw) => {
      const v = toValidNumber(raw);
      if (v === null) return 'unknown';
      if (v < 2.0 || v > 35.0) return 'red';
      if (v < 5.0 || v > 30.0) return 'yellow';
      return 'green';
    },
  },
  ammoniaMgL: {
    key: 'ammoniaMgL',
    label: 'Khí độc NH₃',
    shortLabel: 'NH₃',
    unit: 'mg/L',
    minScale: 0,
    maxScale: 0.5,
    decimals: 3,
    optimalMax: 0.05,
    warningMax: 0.1,
    criticalMax: 0.3,
    optimalRangeText: '≤ 0.1 mg/L (Tối ưu ≤ 0.05)',
    warningRangeText: '> 0.1 – 0.3 mg/L',
    dangerRangeText: '> 0.3 mg/L',
    evaluate: (raw) => {
      const v = toValidNumber(raw);
      if (v === null) return 'unknown';
      if (v > 0.3) return 'red';
      if (v > 0.1) return 'yellow';
      return 'green';
    },
  },
  turbidityNtu: {
    key: 'turbidityNtu',
    label: 'Độ đục',
    shortLabel: 'Đục',
    unit: 'NTU',
    minScale: 0,
    maxScale: 100,
    decimals: 1,
    optimalMin: 20,
    optimalMax: 40,
    warningMax: 60,
    criticalMax: 80,
    optimalRangeText: '≤ 60 NTU (Tối ưu 20–40)',
    warningRangeText: '> 60 – 80 NTU',
    dangerRangeText: '> 80 NTU',
    evaluate: (raw) => {
      const v = toValidNumber(raw);
      if (v === null) return 'unknown';
      if (v > 80.0) return 'red';
      if (v > 60.0) return 'yellow';
      return 'green';
    },
  },
};

export const WATER_METRIC_META = Object.values(WATER_QUALITY_THRESHOLDS);

const METRIC_ALIASES = {
  do: 'dissolvedOxygenMgL',
  dissolvedOxygen: 'dissolvedOxygenMgL',
  dissolvedOxygenMgL: 'dissolvedOxygenMgL',
  ph: 'ph',
  temp: 'temperatureC',
  temperature: 'temperatureC',
  temperatureC: 'temperatureC',
  salinity: 'salinityPpt',
  salinityPpt: 'salinityPpt',
  nh3: 'ammoniaMgL',
  ammonia: 'ammoniaMgL',
  ammoniaMgL: 'ammoniaMgL',
  turbidity: 'turbidityNtu',
  turbidityNtu: 'turbidityNtu',
};

export const resolveWaterMetricConfig = (metricKey) => {
  const canonicalKey = METRIC_ALIASES[metricKey] || metricKey;
  return WATER_QUALITY_THRESHOLDS[canonicalKey] || null;
};

/**
 * Trả về cấp độ ngưỡng ('green' | 'yellow' | 'red' | 'unknown') cho một chỉ số nước.
 */
export const getWaterQualityLevel = (metricKey, value) => {
  const config = resolveWaterMetricConfig(metricKey);
  if (!config) return 'unknown';
  return config.evaluate(value);
};

/**
 * Trả về đầy đủ metadata màu sắc & trạng thái hiển thị cho chỉ số nước.
 */
export const evaluateWaterQuality = (metricKey, value) => {
  const config = resolveWaterMetricConfig(metricKey);
  const level = config ? config.evaluate(value) : 'unknown';
  const style = WATER_QUALITY_LEVEL_STYLES[level] || WATER_QUALITY_LEVEL_STYLES.unknown;
  return {
    ...style,
    metricKey: config?.key || metricKey,
    metric: config,
    numericValue: toValidNumber(value),
  };
};

export const evaluateWaterMetric = evaluateWaterQuality;

export const getWaterQualityColor = (metricKey, value) => {
  const level = getWaterQualityLevel(metricKey, value);
  return WATER_QUALITY_LEVEL_STYLES[level] || WATER_QUALITY_LEVEL_STYLES.unknown;
};

export const SAFETY_DECISION_META = {
  allowed: {
    decision: 'allowed',
    label: 'Cho phép',
    shortLabel: 'ALLOWED',
    level: 'green',
    hexColor: '#006E2D',
    badgeClass: 'bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]',
    cardClass: 'bg-[#F0FDF4] border-[#7CF994]',
    textClass: 'text-[#006E2D]',
  },
  adjusted: {
    decision: 'adjusted',
    label: 'Điều chỉnh giảm',
    shortLabel: 'ADJUSTED',
    level: 'yellow',
    hexColor: '#D97706',
    badgeClass: 'bg-amber-100 text-[#9D4300] border border-amber-200',
    cardClass: 'bg-[#FFF8F5] border-amber-200',
    textClass: 'text-[#9D4300]',
  },
  blocked: {
    decision: 'blocked',
    label: 'Chặn an toàn',
    shortLabel: 'BLOCKED',
    level: 'red',
    hexColor: '#BA1A1A',
    badgeClass: 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#BA1A1A]/30',
    cardClass: 'bg-[#FFF8F8] border-[#FFDAD6]',
    textClass: 'text-[#BA1A1A]',
  },
};

export const getSafetyDecisionMeta = (decision) => {
  const key = String(decision || '').trim().toLowerCase();
  return (
    SAFETY_DECISION_META[key] || {
      decision: key || 'unknown',
      label: decision || 'Chưa xác định',
      shortLabel: key ? key.toUpperCase() : 'UNKNOWN',
      level: 'unknown',
      hexColor: '#64748B',
      badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
      cardClass: 'bg-slate-50 border-slate-200',
      textClass: 'text-slate-600',
    }
  );
};

export const DEVICE_STATUS_META = {
  online: {
    status: 'online',
    label: 'Trực tuyến',
    shortLabel: 'ONLINE',
    level: 'green',
    hexColor: '#006E2D',
    badgeClass: 'bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]',
    dotClass: 'bg-[#006E2D]',
    textClass: 'text-[#006E2D]',
  },
  offline: {
    status: 'offline',
    label: 'Mất kết nối',
    shortLabel: 'OFFLINE',
    level: 'yellow',
    hexColor: '#64748B',
    badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
    dotClass: 'bg-slate-400',
    textClass: 'text-slate-600',
  },
  error: {
    status: 'error',
    label: 'Lỗi thiết bị',
    shortLabel: 'ERROR',
    level: 'red',
    hexColor: '#BA1A1A',
    badgeClass: 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#BA1A1A]/30',
    dotClass: 'bg-[#BA1A1A]',
    textClass: 'text-[#BA1A1A]',
  },
};

export const getDeviceStatusMeta = (status) => {
  const key = String(status || '').trim().toLowerCase();
  return (
    DEVICE_STATUS_META[key] || {
      status: key || 'unknown',
      label: status || 'Không rõ',
      shortLabel: key ? key.toUpperCase() : 'UNKNOWN',
      level: 'unknown',
      hexColor: '#64748B',
      badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
      dotClass: 'bg-slate-400',
      textClass: 'text-slate-600',
    }
  );
};

export const ALERT_SEVERITY_META = {
  1: {
    severity: 1,
    key: 'info',
    label: 'Theo dõi',
    shortLabel: 'INFO',
    hexColor: '#006398',
    badgeClass: 'bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE]',
    cardClass: 'border-slate-200 bg-[#F8F9FF]',
    titleClass: 'text-[#0B1C30]',
    iconClass: 'text-[#006398]',
    dotClass: 'bg-[#006398]',
  },
  2: {
    severity: 2,
    key: 'warning',
    label: 'Cảnh báo',
    shortLabel: 'WARNING',
    hexColor: '#9D4300',
    badgeClass: 'bg-amber-100 text-[#9D4300] border border-amber-200',
    cardClass: 'border-amber-200 bg-[#FFF8F5]',
    titleClass: 'text-[#9D4300]',
    iconClass: 'text-[#EA580C]',
    dotClass: 'bg-[#F59E0B]',
  },
  3: {
    severity: 3,
    key: 'critical',
    label: 'Nguy cấp',
    shortLabel: 'CRITICAL',
    hexColor: '#BA1A1A',
    badgeClass: 'bg-red-100 text-[#BA1A1A] border border-red-200',
    cardClass: 'border-red-200 bg-red-50/60',
    titleClass: 'text-[#BA1A1A]',
    iconClass: 'text-[#BA1A1A]',
    dotClass: 'bg-[#BA1A1A]',
  },
};

export const getAlertSeverityMeta = (severity) => {
  const num = Number(severity);
  if (num === 3) return ALERT_SEVERITY_META[3];
  if (num === 2) return ALERT_SEVERITY_META[2];
  if (num === 1) return ALERT_SEVERITY_META[1];

  const str = String(severity || '').trim().toLowerCase();
  if (str === 'critical') return ALERT_SEVERITY_META[3];
  if (str === 'warning') return ALERT_SEVERITY_META[2];
  return ALERT_SEVERITY_META[1];
};
