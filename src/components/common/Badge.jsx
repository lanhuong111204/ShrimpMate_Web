import React from 'react';

export const Badge = ({ children, variant = 'optimal', size = 'md', className = '' }) => {
  const variants = {
    optimal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-pulse" />
      {children}
    </span>
  );
};
