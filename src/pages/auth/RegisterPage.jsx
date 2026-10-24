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
  CheckCircle2,
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
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-neutral-800 selection:text-white relative overflow-hidden">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white text-neutral-950 flex items-center justify-center font-display font-black text-lg tracking-tight shadow-md">
            SM
          </div>
          <div className="text-left">
            <h1 className="font-display font-extrabold text-lg text-white tracking-wider uppercase">
              SHRIMPMATE SCADA
            </h1>
            <p className="text-[11px] text-neutral-400 font-mono-num uppercase tracking-widest">
              Đăng Ký Tài Khoản Quản Lý Trang Trại
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          <div className="mb-6 border-b border-neutral-800 pb-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Khởi Tạo Tài Khoản Quản Lý (Manager)
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Dành riêng cho chủ cơ sở hoặc người quản lý trang trại tôm công nghệ cao.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 uppercase tracking-wider font-mono-num">
                Họ và Tên Quản Lý <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ví dụ: Nguyễn Văn Quản Lý"
                  className="w-full bg-neutral-950 pl-9 pr-3 py-2 text-xs text-white border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/80 placeholder:text-neutral-600 transition"
                  required
                />
              </div>
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 uppercase tracking-wider font-mono-num">
                Số Điện Thoại (10 chữ số) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0901234567"
                  className="w-full bg-neutral-950 pl-9 pr-3 py-2 text-xs text-white border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/80 placeholder:text-neutral-600 font-mono-num transition"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 uppercase tracking-wider font-mono-num">
                Địa Chỉ Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@shrimpmate.vn"
                  className="w-full bg-neutral-950 pl-9 pr-3 py-2 text-xs text-white border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/80 placeholder:text-neutral-600 transition"
                  required
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 uppercase tracking-wider font-mono-num">
                Mật Khẩu (Tối thiểu 6 ký tự) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 pl-9 pr-10 py-2 text-xs text-white border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/80 placeholder:text-neutral-600 transition"
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

            {/* Nhập lại mật khẩu */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 uppercase tracking-wider font-mono-num">
                Xác Nhận Lại Mật Khẩu <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 pl-9 pr-3 py-2 text-xs text-white border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/80 placeholder:text-neutral-600 transition"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
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

          <div className="mt-5 text-center text-xs text-neutral-400">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-neutral-600 font-mono-num flex items-center justify-center gap-2">
          <Waves className="w-3.5 h-3.5 text-neutral-500" />
          <span>Lưu ý: Tài khoản Người nuôi (Farmer) do Manager tạo trực tiếp trong hệ thống</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
