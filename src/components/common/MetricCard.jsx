import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { formatNumber } from '../../utils/formatters';

export const MetricCard = ({
  title,
  value,
  unit,
  icon: Icon,
  status = 'optimal',
  safeRange = '',
  description = '',
}) => {
  const statusLabels = {
    optimal: 'Tối ưu',
    warning: 'Cảnh báo',
    danger: 'Nguy hiểm',
  };

  const borderAccents = {
    optimal: 'hover:border-emerald-500/50',
    warning: 'hover:border-amber-500/50',
    danger: 'hover:border-rose-500/50',
  };

  const textAccents = {
    optimal: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-rose-400',
  };

  return (
    <Card hover className={`relative overflow-hidden group ${borderAccents[status] || ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            {safeRange && <p className="text-[11px] text-slate-500">Ngưỡng an toàn: {safeRange}</p>}
          </div>
        </div>
        <Badge variant={status}>{statusLabels[status] || 'Bình thường'}</Badge>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className={`text-3xl font-bold tracking-tight ${textAccents[status] || 'text-slate-100'}`}>
          {formatNumber(value)}
        </span>
        <span className="text-sm font-medium text-slate-400">{unit}</span>
      </div>

      {description && <p className="mt-2 text-xs text-slate-400/90">{description}</p>}
    </Card>
  );
};
