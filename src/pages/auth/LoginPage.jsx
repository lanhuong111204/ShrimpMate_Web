import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  RotateCw, 
  AlertCircle, 
  Sparkles,
  Waves
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../services/apiClient';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Modal quên mật khẩu
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Trang muốn chuyển tới sau khi đăng nhập xong
  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tài khoản và mật khẩu!');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await login(identifier, password);
      const userRole = data?.user?.role;

      // Điều hướng thông minh theo vai trò
      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from === '/login' ? '/' : from, { replace: true });
      }
    } catch (error) {
      const msg = getErrorMessage(error, 'Đăng nhập không thành công. Vui lòng kiểm tra lại!');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Nút điền nhanh tài khoản Seed chuẩn từ Backend
  const handleQuickFill = (idVal, passVal) => {
    setIdentifier(idVal);
    setPassword(passVal);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-neutral-800 selection:text-white relative overflow-hidden">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        {/* Logo Brand */}
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white text-neutral-950 flex items-center justify-center font-display font-black text-lg tracking-tight shadow-md">
            SM
          </div>
          <div className="text-left">
            <h1 className="font-display font-extrabold text-lg text-white tracking-wider uppercase">
              SHRIMPMATE SCADA
            </h1>
            <p className="text-[11px] text-neutral-400 font-mono-num uppercase tracking-widest">
              Hệ Sinh Thái Nuôi Tôm Thông Minh
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          <div className="mb-6 border-b border-neutral-800 pb-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Đăng Nhập Điều Hành
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Nhập Email hoặc Số điện thoại để truy cập trung tâm SCADA.
            </p>
          </div>

          {/* Thông báo lỗi */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Thông báo thành công từ modal OTP */}
          {successToast && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successToast}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Input Identifier */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono-num">
                Email hoặc Số Điện Thoại
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@shrimpmate.local hoặc 0901234567"
                  className="w-full bg-neutral-950 pl-9 pr-3 py-2.5 text-xs text-white border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/80 focus:border-transparent placeholder:text-neutral-600 transition"
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono-num">
                  Mật Khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-neutral-400 hover:text-emerald-400 transition"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 pl-9 pr-10 py-2.5 text-xs text-white border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/80 focus:border-transparent placeholder:text-neutral-600 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nút Đăng nhập */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Nhập Hệ Thống</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Fill Demo Seed Accounts */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono-num mb-2.5">
              <span>Tài khoản Seed mẫu Backend:</span>
              <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300">
                1-Click Test
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono-num">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@shrimpmate.local', 'Admin@123456')}
                className="px-2.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-red-900/50 text-neutral-300 hover:text-white transition text-left cursor-pointer flex flex-col"
              >
                <span className="text-[10px] font-bold text-red-400 uppercase">Quản trị viên (Admin)</span>
                <span className="text-[11px] text-neutral-400 truncate">admin@shrimpmate...</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('farmer@shrimpmate.local', 'Farmer@123456')}
                className="px-2.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-900/50 text-neutral-300 hover:text-white transition text-left cursor-pointer flex flex-col"
              >
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Người nuôi (Farmer)</span>
                <span className="text-[11px] text-neutral-400 truncate">farmer@shrimpmate...</span>
              </button>
            </div>
          </div>

          {/* Đăng ký Quản lý */}
          <div className="mt-6 text-center text-xs text-neutral-400">
            Bạn là Quản lý trang trại mới?{' '}
            <Link
              to="/register"
              className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline"
            >
              Đăng ký tài khoản Quản lý (Manager)
            </Link>
          </div>
        </div>

        {/* Footer ghi chú hệ thống */}
        <div className="mt-6 text-center text-[11px] text-neutral-600 font-mono-num flex items-center justify-center gap-2">
          <Waves className="w-3.5 h-3.5 text-neutral-500" />
          <span>ShrimpMate SCADA Gateway • JWT Stateless RBAC</span>
        </div>
      </div>

      {/* Modal Quên mật khẩu */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onSuccess={(msg) => setSuccessToast(msg)}
      />
    </div>
  );
};

export default LoginPage;
