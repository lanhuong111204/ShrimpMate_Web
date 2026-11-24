/**
 * Chuẩn hóa mức độ nghiêm trọng (severity) của cảnh báo từ Backend.
 * Hỗ trợ dạng số (3 = Critical, 2 = Warning, 1 = Monitoring/Info) và chuỗi.
 */
export const getAlertSeverityLevel = (alert) => {
  const sevNum = Number(alert?.severity);
  if (!Number.isNaN(sevNum) && sevNum >= 1) {
    if (sevNum >= 3) return 3;
    if (sevNum === 2) return 2;
    return 1;
  }

  const sevStr = String(alert?.severity || '').toLowerCase();
  if (sevStr === 'critical') return 3;
  if (sevStr === 'warning') return 2;
  if (sevStr === 'monitoring' || sevStr === 'info') return 1;

  const typeStr = String(alert?.type || '').toUpperCase();
  if (typeStr.startsWith('CRITICAL') || typeStr.includes('OFFLINE') || typeStr.includes('STALL')) {
    return 3;
  }
  if (typeStr.startsWith('WARNING')) {
    return 2;
  }
  return 1;
};

export const isAlertSeverity = (alert) => getAlertSeverityLevel(alert) >= 2;

export const getSeverityMeta = (severityLevel) => {
  switch (Number(severityLevel)) {
    case 3:
      return {
        label: 'Nguy cấp',
        shortLabel: 'CRITICAL',
        badgeClass: 'bg-red-100 text-[#BA1A1A] border border-red-200',
        cardClass: 'border-red-200 bg-red-50/60 hover:bg-red-50',
        titleClass: 'text-[#BA1A1A]',
        iconClass: 'text-[#BA1A1A]',
      };
    case 2:
      return {
        label: 'Cảnh báo',
        shortLabel: 'WARNING',
        badgeClass: 'bg-amber-100 text-[#9D4300] border border-amber-200',
        cardClass: 'border-amber-200 bg-[#FFF8F5] hover:bg-[#FFDBCA]/30',
        titleClass: 'text-[#9D4300]',
        iconClass: 'text-[#EA580C]',
      };
    case 1:
    default:
      return {
        label: 'Theo dõi',
        shortLabel: 'INFO',
        badgeClass: 'bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE]',
        cardClass: 'border-slate-200 bg-[#F8F9FF] hover:bg-slate-50',
        titleClass: 'text-[#0B1C30]',
        iconClass: 'text-[#006398]',
      };
  }
};

export const getAlertStatusMeta = (status) => {
  switch (status) {
    case 'open':
      return {
        label: 'Chưa xử lý',
        badgeClass: 'bg-red-50 text-[#BA1A1A] border border-red-200',
      };
    case 'acknowledged':
      return {
        label: 'Đã tiếp nhận',
        badgeClass: 'bg-amber-50 text-[#9D4300] border border-amber-200',
      };
    case 'resolved':
      return {
        label: 'Đã xử lý',
        badgeClass: 'bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]',
      };
    default:
      return {
        label: status || 'Không rõ',
        badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
      };
  }
};

export const formatLogTimestamp = (iso) => {
  if (!iso) return '--:--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--:--';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const mapAlertToLogItem = (a) => {
  const timeIso = a?.triggeredAt || a?.createdAt;
  const severityLevel = getAlertSeverityLevel(a);
  return {
    id: `alert-${a.id}`,
    alertId: a.id,
    kind: 'alert',
    severityLevel,
    type: severityLevel >= 2 ? 'alert' : 'info',
    rawType: a.type,
    title: `${a.type?.toUpperCase() || 'CẢNH BÁO'}${a.pond?.code ? ` • ${a.pond.code}` : ''}`,
    message: a.message,
    timestamp: formatLogTimestamp(timeIso),
    rawTime: new Date(timeIso || 0).getTime() || 0,
    pondId: a.pondId,
    pondCode: a.pond?.code || null,
    pondName: a.pond?.name || null,
    deviceName: a.device?.name || null,
    deviceUid: a.device?.deviceUid || null,
    actionRecommendation: a.metadata?.actionRecommendation || null,
    status: a.status,
  };
};
