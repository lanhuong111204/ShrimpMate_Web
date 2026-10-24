import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const UnauthorizedView = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-800 flex items-center justify-center mx-auto text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display font-bold text-xl text-white uppercase tracking-wide">
            403 - Quyền Truy Cập Bị Từ Chối
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Tài khoản của bạn hiện có vai trò{' '}
            <strong className="text-emerald-400 font-mono-num uppercase">
              {user?.role || 'Chưa xác định'}
            </strong>
            . Bạn không có quyền truy cập vào phân hệ điều hành này theo chính sách bảo mật RBAC của ShrimpMate.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="h-10 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trở về Bàn Tổng Quan</span>
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="h-10 px-4 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đổi Tài Khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedView;
