import React, { useState, useEffect } from 'react';
import { X, Mail, KeyRound, Lock, ArrowRight, CheckCircle2, RotateCw, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../services/apiClient';

export const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Gửi yêu cầu, 2: Nhập OTP, 3: Đặt pass mới
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Bộ đếm ngược OTP 5 phút (300 giây)
  const [countdown, setCountdown] = useState(300);
  const [isTimerActive, setIsTimerActive] = useState(false);

  useEffect(() => {
    let timer = null;
    if (isTimerActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(timer);
  }, [isTimerActive, countdown]);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setIdentifier('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
    setIsTimerActive(false);
    onClose();
  };

  // Bước 1: Yêu cầu OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Vui lòng nhập Email hoặc Số điện thoại đăng ký!');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await authService.forgotPassword(identifier);
      setSuccessMsg(res?.message || 'Mã OTP đã được gửi đến tài khoản của bạn.');
      setStep(2);
      setCountdown(300);
      setIsTimerActive(true);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Không thể gửi yêu cầu đặt lại mật khẩu!'));
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (countdown > 0 && isTimerActive) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      await authService.resendOtp(identifier);
      setCountdown(300);
      setIsTimerActive(true);
      setSuccessMsg('Đã phát hành mã OTP mới thành công.');
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Không thể gửi lại mã OTP!'));
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 2: Xác thực OTP trước khi cho nhập pass mới
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      setErrorMsg('Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số!');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      await authService.verifyResetOtp(identifier, otp);
      setStep(3);
      setSuccessMsg('Mã OTP hợp lệ. Vui lòng thiết lập mật khẩu mới!');
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Mã OTP không đúng hoặc đã hết hạn!'));
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 3: Đặt lại mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp!');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await authService.resetPassword(identifier, otp, newPassword);
      if (onSuccess) {
        onSuccess(res?.message || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      }
      handleClose();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Không thể đặt lại mật khẩu!'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-emerald-400" />
            <h3 className="font-display font-bold text-sm uppercase tracking-wider">
              Khôi Phục Mật Khẩu
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tiến trình 3 bước */}
        <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200/80 flex items-center justify-between text-xs font-mono-num">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-neutral-900 font-bold' : 'text-neutral-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
              1
            </span>
            <span>Tài khoản</span>
          </div>
          <div className="w-6 h-px bg-neutral-300" />
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-neutral-900 font-bold' : 'text-neutral-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
              2
            </span>
            <span>Xác thực OTP</span>
          </div>
          <div className="w-6 h-px bg-neutral-300" />
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-neutral-900 font-bold' : 'text-neutral-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
              3
            </span>
            <span>Mật khẩu mới</span>
          </div>
        </div>

        {/* Nội dung Form */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && !errorMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* BƯỚC 1: NHẬP IDENTIFIER */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-xs text-neutral-600">
                Nhập Email hoặc Số điện thoại bạn đã đăng ký để nhận mã OTP khôi phục bảo mật.
              </p>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Email hoặc Số điện thoại
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="ví dụ: admin@shrimpmate.local hoặc 0901234567"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isLoading && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Gửi mã OTP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* BƯỚC 2: NHẬP VÀ XÁC THỰC MÃ OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Mã OTP 6 chữ số
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full py-2.5 text-center tracking-[0.5em] font-mono-num font-bold text-lg border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-500 font-mono-num">
                <span>
                  Thời gian hiệu lực:{' '}
                  <strong className={countdown < 60 ? 'text-red-600' : 'text-neutral-800'}>
                    {formatCountdown()}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isTimerActive && countdown > 0}
                  className="text-emerald-700 hover:underline disabled:opacity-40 disabled:no-underline font-semibold"
                >
                  Gửi lại mã
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isLoading && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xác thực OTP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* BƯỚC 3: ĐẶT MẬT KHẨU MỚI */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Mật khẩu mới (tối thiểu 6 ký tự)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Xác nhận lại mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isLoading && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu mật khẩu mới</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
