import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-lg shadow-cyan-500/25 focus:ring-cyan-400',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-400',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 focus:ring-emerald-500',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 focus:ring-rose-500',
    outline: 'border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 focus:ring-cyan-500',
    ghost: 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 focus:ring-slate-500',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
};
