import React from 'react';

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl transition-all duration-300 ${
        hover ? 'hover:border-cyan-500/40 hover:shadow-cyan-500/5 hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
