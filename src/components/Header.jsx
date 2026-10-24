import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertOctagon, 
  RotateCw, 
  ChevronDown, 
  LogOut, 
  KeyRound, 
  User as UserIcon, 
  Shield,
  Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ChangePasswordModal } from './auth/ChangePasswordModal';
import { ProfileModal } from './auth/ProfileModal';
import { alertService } from '../services/alertService';

export const Header = ({
  currentTime,
  onEmergencyStop,
  onSync,
  isSyncing,
  activePondCode = 'AO-02',
}) => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [alertSummary, setAlertSummary] = useState(null);

  useEffect(() => {
    const fetchAlertSummary = async () => {
      try {
        const res = await alertService.getSummary().catch(() => null);
        if (res) setAlertSummary(res);
      } catch (err) {
        console.warn('Lỗi lấy summary cảnh báo:', err);
      }
    };
    fetchAlertSummary();
    const interval = setInterval(fetchAlertSummary, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'admin':
        return {
          label: 'Quản trị viên',
          bg: 'bg-red-50 text-red-700 border-red-200',
        };
      case 'manager':
        return {
          label: 'Quản lý trại',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'farmer':
      default:
        return {
          label: 'Người nuôi',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
    }
  };

  const roleInfo = getRoleBadge(role);
  const displayName = user?.fullName || user?.email || 'Người vận hành';
  const initialChar = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 h-14 bg-white text-slate-900 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between select-none">
      {/* Left: Brand & Active Farm Context */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-display font-bold text-xs tracking-tight shrink-0">
            SM
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm tracking-tight text-slate-900">
              ShrimpMate
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-400">•</span>
            <span className="hidden sm:inline-block text-xs text-slate-500 font-medium truncate max-w-[220px]">
              Trại Ba Đầm – Giá Rai, Bạc Liêu
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden md:block" />

        {/* Clean Status Indicators */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>4/4 trạm trực tuyến</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span>Ao đang chọn:</span>
            <span className="text-slate-900 font-semibold font-mono-num">{activePondCode}</span>
          </div>
        </div>
      </div>

      {/* Right: Sync + Notifications + User Profile + E-Stop */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Sync Button */}
        <button
          onClick={onSync}
          title="Đồng bộ dữ liệu cảm biến"
          className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
          <span className="font-mono-num">{currentTime}</span>
          <span className="hidden sm:inline">Đồng bộ</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={() => navigate('/logs')}
          title="Xem nhật ký & cảnh báo"
          className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {alertSummary?.open > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white font-mono-num font-bold text-[10px] flex items-center justify-center">
              {alertSummary.open}
            </span>
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer"
          >
            <div className="hidden md:block text-right">
              <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
                {displayName}
              </div>
              <div className="text-[11px] text-slate-500">
                {roleInfo.label}
              </div>
            </div>

            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-xs text-slate-700">
              {initialChar}
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 text-xs font-sans">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="font-semibold text-slate-900 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || user?.phoneNumber}</p>
                <span className={`inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-md border font-medium ${roleInfo.bg}`}>
                  {roleInfo.label}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsProfileOpen(true);
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hồ sơ cá nhân</span>
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsChangePassOpen(true);
                  }}
                  className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Đổi mật khẩu</span>
                </button>

                {role === 'admin' && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    <span>Quản trị hệ thống (Admin)</span>
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Stop Button */}
        <button
          onClick={onEmergencyStop}
          className="h-8 px-3 rounded-lg bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
          title="Ngắt khẩn cấp toàn bộ máy cho ăn"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Dừng khẩn cấp</span>
        </button>
      </div>

      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
        onSuccess={() => {}}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSuccess={() => {}}
      />
    </header>
  );
};

export default Header;
