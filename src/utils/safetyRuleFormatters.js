export const RULE_FIELD_LABELS = {
  dissolvedOxygenMgL: 'Oxy hòa tan (DO)',
  ph: 'Độ pH',
  temperatureC: 'Nhiệt độ nước',
  ammoniaMgL: 'Khí độc NH₃',
  salinityPpt: 'Độ mặn',
  turbidityNtu: 'Độ đục',
  deltaTan: 'Biến thiên ΔTAN',
  morningRainMm: 'Lượng mưa sáng (mm)',
};

export const formatRuleCondition = (condition) => {
  if (!condition || typeof condition !== 'object') return 'Không có điều kiện';
  if (condition.checkDevice) {
    return 'Kiểm tra trạng thái kết nối máy cho ăn / E-Stop';
  }
  if (Array.isArray(condition.or)) {
    return condition.or.map((c) => formatRuleCondition(c)).join(' HOẶC ');
  }
  if (Array.isArray(condition.and)) {
    return condition.and.map((c) => formatRuleCondition(c)).join(' VÀ ');
  }
  const fieldKey = condition.field || condition.parameter;
  const fieldLabel = RULE_FIELD_LABELS[fieldKey] || fieldKey || 'Chỉ số';
  const operator = condition.operator || '';
  const threshold = condition.value ?? condition.threshold ?? '';
  return `${fieldLabel} ${operator} ${threshold}`.trim();
};
