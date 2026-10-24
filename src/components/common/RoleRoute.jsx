import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RotateCw } from 'lucide-react';

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { role, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-neutral-500 gap-2">
        <RotateCw className="w-4 h-4 animate-spin text-emerald-600" />
        <span className="text-xs font-mono-num">Đang kiểm tra quyền hạn vai trò...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasPermission = allowedRoles.includes(role);

  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
