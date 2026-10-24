import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RotateCw, Waves } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-neutral-950 flex items-center justify-center font-display font-black text-lg tracking-tight shadow-md animate-pulse">
            SM
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-sm tracking-wider uppercase">
              SHRIMPMATE SCADA
            </span>
            <span className="text-[10px] text-neutral-400 font-mono-num">
              Đang xác minh phiên làm việc...
            </span>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs font-mono-num text-emerald-400">
          <RotateCw className="w-4 h-4 animate-spin" />
          <span>Đang kết nối cổng an toàn...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
