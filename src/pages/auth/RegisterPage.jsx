import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  UserPlus, 
  RotateCw, 
  AlertCircle,
  Waves
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../services/apiClient';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !phoneNumber.trim() || !email.trim() || !password) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    // Kiểm tra định dạng số điện thoại Việt Nam 10 số
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    const phoneRegex = /^(0|\+84|84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage('Số điện thoại không hợp lệ (phải là số di động Việt Nam gồm 10 chữ số).');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Mật khẩu phải có tối thiểu 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await register({
        fullName,
        phoneNumber: cleanPhone,
        email,
        password,
      });

      navigate('/', { replace: true });
    } catch (error) {
      const msg = getErrorMessage(error, 'Đăng ký tài khoản không thành công.');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
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
        <div className="inline-flex items-center gap-3.5 mb-2 bg-[#0B1C30]/85 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 shadow-xl">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FB923C] to-[#EA580C] text-white flex items-center justify-center shadow-md shadow-[#EA580C]/30">
            <Waves className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="font-bold text-lg text-white tracking-tight">
              ShrimpMate <span className="text-[#FB923C]">SCADA</span>
            </h1>
            <p className="text-[11px] text-[#7CF994] font-semibold tracking-wide">
              Đăng ký quản lý trang trại
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-[#0B1C30] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#EA580C]" />
              Khởi tạo tài khoản quản lý trang trại
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Dành riêng cho chủ cơ sở hoặc người quản lý trang trại tôm công nghệ cao.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3.5 bg-[#FFDAD6]/60 border border-[#BA1A1A]/30 text-[#93000A] rounded-xl text-xs font-medium flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#BA1A1A] mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                Họ và tên người quản lý <span className="text-[#BA1A1A]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full bg-[#F8F9FF] pl-10 pr-3.5 py-2.5 text-xs text-[#0B1C30] font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] placeholder:text-slate-400 transition"
                  required
                />
              </div>
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                Số điện thoại (10 chữ số) <span className="text-[#BA1A1A]">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0901234567"
                  className="w-full bg-[#F8F9FF] pl-10 pr-3.5 py-2.5 text-xs text-[#0B1C30] font-mono-num font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] placeholder:text-slate-400 transition"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                Địa chỉ email <span className="text-[#BA1A1A]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="quanly@shrimpmate.vn"
                  className="w-full bg-[#F8F9FF] pl-10 pr-3.5 py-2.5 text-xs text-[#0B1C30] font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] placeholder:text-slate-400 transition"
                  required
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                Mật khẩu (tối thiểu 8 ký tự) <span className="text-[#BA1A1A]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập tối thiểu 8 ký tự"
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

            {/* Nhập lại mật khẩu */}
            <div>
              <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                Xác nhận lại mật khẩu <span className="text-[#BA1A1A]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu ở trên"
                  className="w-full bg-[#F8F9FF] pl-10 pr-10 py-2.5 text-xs text-[#0B1C30] font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] placeholder:text-slate-400 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-[#FB923C] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] active:scale-[0.99] text-white font-bold text-xs tracking-wide rounded-xl shadow-md shadow-[#EA580C]/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Đang tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Hoàn tất đăng ký quản lý</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="text-[#EA580C] hover:text-[#9D4300] font-bold hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>

        <div className="mt-5 text-center text-[11px] text-slate-300/80 font-mono-num flex items-center justify-center gap-2">
          <Waves className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Lưu ý: Tài khoản kỹ thuật viên nuôi tôm do người quản lý tạo trực tiếp trong hệ thống</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
