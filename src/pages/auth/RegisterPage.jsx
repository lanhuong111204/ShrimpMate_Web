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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !phoneNumber.trim() || !email.trim() || !password) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    // Kiểm tra định dạng số điện thoại VN 10 số
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    const phoneRegex = /^(0|\+84|84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage('Số điện thoại không hợp lệ (Phải là số di động Việt Nam gồm 10 chữ số)!');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu bảo mật phải có tối thiểu 6 ký tự!');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp!');
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

      // Đăng ký thành công -> Manager được cấp token và chuyển thẳng vào Dashboard
      navigate('/', { replace: true });
    } catch (error) {
      const msg = getErrorMessage(error, 'Đăng ký tài khoản không thành công!');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Subtle Top Accent Gradient */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-[#0B1C30] to-transparent pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <div className="inline-flex items-center gap-3.5 mb-2 bg-[#0B1C30] px-5 py-3 rounded-2xl border border-[#1E293B] shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FB923C] to-[#EA580C] text-white flex items-center justify-center shadow-md shadow-[#EA580C]/30">
            <Waves className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="font-bold text-lg text-white tracking-tight">
              ShrimpMate <span className="text-[#FB923C]">SCADA</span>
            </h1>
            <p className="text-[11px] text-[#7CF994] font-semibold uppercase tracking-wider">
              Đăng Ký Quản Lý Trang Trại
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl relative">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-[#0B1C30] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#EA580C]" />
              Khởi tạo tài khoản Quản lý (Manager)
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
                Họ và Tên Quản lý <span className="text-[#BA1A1A]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Quản Lý"
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
                Địa chỉ Email <span className="text-[#BA1A1A]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@shrimpmate.vn"
                  className="w-full bg-[#F8F9FF] pl-10 pr-3.5 py-2.5 text-xs text-[#0B1C30] font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] placeholder:text-slate-400 transition"
                  required
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                Mật khẩu (Tối thiểu 6 ký tự) <span className="text-[#BA1A1A]">*</span>
              </label>
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
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8F9FF] pl-10 pr-3.5 py-2.5 text-xs text-[#0B1C30] font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] placeholder:text-slate-400 transition"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-[#FB923C] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#EA580C]/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Đang tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Hoàn Tất Đăng Ký Quản Lý</span>
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

        <div className="mt-5 text-center text-[11px] text-slate-500 font-mono-num flex items-center justify-center gap-2">
          <Waves className="w-3.5 h-3.5 text-[#006398]" />
          <span>Lưu ý: Tài khoản Người nuôi (Farmer) do Manager tạo trực tiếp trong hệ thống</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
