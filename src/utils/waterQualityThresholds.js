/**
 * Quy ước ngưỡng chất lượng nước, mức độ cảnh báo, quyết định Safety Engine
 * và trạng thái thiết bị IoT theo Chương 7 tài liệu đặc tả ShrimpMate.
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
    unit: 'mg/L',
    optimalRangeText: '≥ 5.0 mg/L',
    warningRangeText: '3.5 – < 5.0 mg/L',
    dangerRangeText: '< 3.5 mg/L',
    evaluate: (raw) => {
      const v = toValidNumber(raw);
      if (v === null) return 'unknown';
      if (v >= 5.0) return 'green';
      if (v >= 3.5) return 'yellow';
      return 'red';
    },
  },
  ph: {
    key: 'ph',
    label: 'Độ pH',
    unit: 'pH',
    optimalRangeText: '7.5 – 8.5',
    warningRangeText: '7.0 – < 7.5 hoặc > 8.5 – 9.0',
    dangerRangeText: '< 7.0 hoặc > 9.0',
    evaluate: (raw) => {
      const v = toValidNumber(raw);
      if (v === null) return 'unknown';
      if (v >= 7.5 && v <= 8.5) return 'green';
      if ((v >= 7.0 && v < 7.5) || (v > 8.5 && v <= 9.0)) return 'yellow';
      return 'red';
    },
  },
  temperatureC: {
    key: 'temperatureC',
    label: 'Nhiệt độ nước',
    unit: '°C',
    optimalRangeText: '28 – 32 °C',
    warningRangeText: '26 – < 28 hoặc > 32 – 34 °C',
    dangerRangeText: '< 26 hoặc > 34 °C',
    evaluate: (raw) => {
      const v = toValidNumber(raw);
      if (v === null) return 'unknown';
      if (v >= 28 && v <= 32) return 'green';
      if ((v >= 26 && v < 28) || (v > 32 && v <= 34)) return 'yellow';
      return 'red';
    },
  },
  salinityPpt: {
    key: 'salinityPpt',
    label: 'Độ mặn',
    unit: '‰',
    optimalRangeText: '10 – 25 ‰',
    warningRangeText: '5 – < 10 hoặc > 25 – 30 ‰',
    dangerRangeText: '< 5 hoặc > 30 ‰',
    evaluate: (raw) => {
      const v = toValidNumber(raw);
      if (v === null) return 'unknown';
      if (v >= 10 && v <= 25) return 'green';
      if ((v >= 5 && v < 10) || (v > 25 && v <= 30)) return 'yellow';
      return 'red';
    },
  },
  ammoniaMgL: {
    key: 'ammoniaMgL',
    label: 'Khí độc NH₃',
    unit: 'mg/L',
    optimalRangeText: '≤ 0.1 mg/L',
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
};

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
