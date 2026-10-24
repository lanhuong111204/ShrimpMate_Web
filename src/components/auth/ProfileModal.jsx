import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Shield, RotateCw, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../services/apiClient';

export const ProfileModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMessage('');
    setSuccessMessage('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ họ tên và số điện thoại!');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      setSuccessMessage('Cập nhật hồ sơ cá nhân thành công!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 1200);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Không thể cập nhật hồ sơ cá nhân. Vui lòng thử lại!'));
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'admin':
        return { label: 'QUẢN TRỊ VIÊN (ADMIN)', bg: 'bg-red-50 text-red-700 border-red-200' };
      case 'manager':
        return { label: 'QUẢN LÝ TRẠI (MANAGER)', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'farmer':
      default:
        return { label: 'NGƯỜI NUÔI (FARMER)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-emerald-400" />
            <h3 className="font-display font-bold text-sm uppercase tracking-wider">
              Hồ Sơ Cá Nhân
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Email (Read-only) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
              Địa chỉ Email (Định danh hệ thống)
            </label>
            <div className="relative">
              <input
                type="text"
                disabled
                value={user?.email || 'Chưa liên kết email'}
                className="w-full pl-9 pr-3 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 font-mono-num text-xs cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Vai trò (Read-only) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">
              Vai Trò & Quyền Hạn
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <Shield className="w-4 h-4 text-neutral-500" />
              <span className={`text-xs font-mono-num font-bold px-2 py-0.5 rounded border ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>

          {/* Họ và tên (Editable) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Họ và Tên *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-xl text-neutral-900 text-xs focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
              />
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Số điện thoại (Editable) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Số Điện Thoại (Nhận OTP SMS) *
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ví dụ: 0901234567"
                className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-xl text-neutral-900 font-mono-num text-xs focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
              />
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lưu Hồ Sơ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
