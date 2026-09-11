/**
 * Định dạng số với số chữ số thập phân
 */
export const formatNumber = (value, decimals = 1) => {
  if (value === null || value === undefined) return '--';
  return Number(value).toLocaleString('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Định dạng thời gian
 */
export const formatDateTime = (date = new Date()) => {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

/**
 * Trả về class màu sắc theo ngưỡng cảnh báo môi trường nước
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'optimal':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        dot: 'bg-emerald-400',
      };
    case 'warning':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        dot: 'bg-amber-400',
      };
    case 'danger':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/20',
        dot: 'bg-rose-400',
      };
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/20',
        dot: 'bg-slate-400',
      };
  }
};
