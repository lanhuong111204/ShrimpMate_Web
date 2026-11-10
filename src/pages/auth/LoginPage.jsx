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
      setErrorMessage('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await login(identifier, password);
      const userRole = data?.user?.role;

      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from === '/login' ? '/' : from, { replace: true });
      }
    } catch (error) {
      const msg = getErrorMessage(error, 'Đăng nhập không thành công, vui lòng kiểm tra lại thông tin.');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (idVal, passVal) => {
    setIdentifier(idVal);
    setPassword(passVal);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07192B] via-[#0B2B45] to-[#0E415C] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Họa tiết ánh sáng & sóng nước nền */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#0284C7]/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-[#EA580C]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[32rem] h-[32rem] rounded-full bg-[#10B981]/15 blur-3xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        {/* Logo thương hiệu */}
        <div className="inline-flex items-center gap-3.5 mb-2 bg-[#0B1C30]/85 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 shadow-xl">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FB923C] to-[#EA580C] text-white flex items-center justify-center shadow-md shadow-[#EA580C]/30">
            <Waves className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="font-bold text-lg text-white tracking-tight">
              ShrimpMate <span className="text-[#FB923C]">SCADA</span>
            </h1>
            <p className="text-[11px] text-[#7CF994] font-semibold tracking-wide">
              Hệ sinh thái nuôi tôm thông minh
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-[#0B1C30] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#EA580C]" />
              Đăng nhập hệ thống điều hành
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Nhập email hoặc số điện thoại để truy cập trung tâm quản lý trang trại.
            </p>
          </div>

          {/* Thông báo lỗi */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-[#FFDAD6]/60 border border-[#BA1A1A]/30 text-[#93000A] rounded-xl text-xs font-medium flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#BA1A1A] mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Thông báo thành công từ modal OTP */}
          {successToast && (
            <div className="mb-4 p-3.5 bg-[#E8F5E9] border border-[#7CF994] text-[#006E2D] rounded-xl text-xs font-medium flex items-start gap-2.5 leading-relaxed">
              <Sparkles className="w-4 h-4 shrink-0 text-[#006E2D] mt-0.5" />
              <span>{successToast}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Input Identifier */}
            <div>
              <label className="block text-xs font-bold text-[#0B1C30] mb-1.5">
                Email hoặc số điện thoại
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="manager@shrimpmate.local hoặc 0901000002"
                  className="w-full bg-[#F8F9FF] pl-10 pr-3.5 py-2.5 text-xs text-[#0B1C30] font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] placeholder:text-slate-400 transition"
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#0B1C30]">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-semibold text-[#006398] hover:text-[#EA580C] transition cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8F9FF] pl-10 pr-10 py-2.5 text-xs text-[#0B1C30] font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] placeholder:text-slate-400 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nút đăng nhập */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-[#FB923C] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] active:scale-[0.99] text-white font-bold text-xs tracking-wide rounded-xl shadow-md shadow-[#EA580C]/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập hệ thống</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Điền nhanh tài khoản thử nghiệm từ cơ sở dữ liệu */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-2.5">
              <span>Tài khoản mẫu có sẵn dữ liệu:</span>
              <span className="text-[10px] bg-[#FFF8F5] border border-[#FFDBCA] px-2 py-0.5 rounded-full text-[#EA580C] font-bold">
                Điền nhanh
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@shrimpmate.local', 'Admin@123456')}
                className="px-2.5 py-2 rounded-xl bg-[#FFF8F5] hover:bg-[#FFDBCA]/50 border border-[#FFDBCA] text-left transition cursor-pointer flex flex-col"
              >
                <span className="text-[10px] font-bold text-[#EA580C]">Quản trị viên</span>
                <span className="text-[10px] text-[#9D4300] font-mono-num truncate mt-0.5">admin@shrimpmate...</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager@shrimpmate.local', 'Manager@123456')}
                className="px-2.5 py-2 rounded-xl bg-[#EFF4FF] hover:bg-[#DCE9FF]/70 border border-[#D3E4FE] text-left transition cursor-pointer flex flex-col"
              >
                <span className="text-[10px] font-bold text-[#006398]">Quản lý trại</span>
                <span className="text-[10px] text-slate-600 font-mono-num truncate mt-0.5">manager@shrimp...</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('farmer@shrimpmate.local', 'Farmer@123456')}
                className="px-2.5 py-2 rounded-xl bg-[#E8F5E9]/70 hover:bg-[#E8F5E9] border border-[#7CF994] text-left transition cursor-pointer flex flex-col"
              >
                <span className="text-[10px] font-bold text-[#006E2D]">Người nuôi</span>
                <span className="text-[10px] text-slate-600 font-mono-num truncate mt-0.5">farmer@shrimpmate...</span>
              </button>
            </div>
          </div>

          {/* Đăng ký quản lý */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Bạn là chủ trang trại mới?{' '}
            <Link
              to="/register"
              className="text-[#EA580C] hover:text-[#9D4300] font-bold hover:underline"
            >
              Đăng ký tài khoản quản lý
            </Link>
          </div>
        </div>

        {/* Ghi chú chân trang */}
        <div className="mt-5 text-center text-[11px] text-slate-300/80 font-mono-num flex items-center justify-center gap-2">
          <Waves className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Hệ thống điều hành và giám sát trang trại nuôi tôm ShrimpMate</span>
        </div>
      </div>

      {/* Modal quên mật khẩu */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onSuccess={(msg) => setSuccessToast(msg)}
      />
    </div>
  );
};

export default LoginPage;
