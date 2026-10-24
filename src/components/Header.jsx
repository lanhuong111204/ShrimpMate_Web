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
  Bell,
  Waves
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
          bg: 'bg-[#FFF8F5] text-[#9D4300] border-[#FFDBCA]',
        };
      case 'manager':
        return {
          label: 'Quản lý trại',
          bg: 'bg-[#EFF4FF] text-[#006398] border-[#D3E4FE]',
        };
      case 'farmer':
      default:
        return {
          label: 'Kỹ thuật viên',
          bg: 'bg-[#E8F5E9] text-[#006E2D] border-[#7CF994]',
        };
    }
  };

  const roleInfo = getRoleBadge(role);
  const displayName = user?.fullName || user?.email || 'Người vận hành';
  const initialChar = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 h-15 bg-white text-[#0B1C30] border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between select-none shadow-2xs">
      {/* Left: Mobile-Synced Brand Logo & Farm/Pond Selector Pills */}
      <div className="flex items-center gap-3 md:gap-4">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FB923C] to-[#EA580C] text-white flex items-center justify-center font-display font-bold text-xs tracking-tight shrink-0 shadow-xs">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-sm tracking-tight text-[#0B1C30] leading-tight">
              ShrimpMate
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#EA580C]">
              Aquaculture OS
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200 hidden md:block" />

        {/* Mobile-Synced Ocean Blue Farm & Pond Pill + Bio Green Status Pill */}
        <div className="hidden md:flex items-center gap-2.5 text-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE] font-semibold">
            <span className="truncate max-w-[200px]">Trại Ba Đầm – Bạc Liêu</span>
            <span className="text-[#40A2E7]">•</span>
            <span className="font-mono-num font-bold text-[#0B1C30] bg-white px-2 py-0.5 rounded-md border border-[#D3E4FE]">
              {activePondCode}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#006E2D]" />
            <span>Hệ thống ổn định (4/4 Ao)</span>
          </div>
        </div>
      </div>

      {/* Right: Sync + Notifications + User Profile + Mobile Red E-Stop */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Sync Button */}
        <button
          onClick={onSync}
          title="Đồng bộ dữ liệu cảm biến"
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#F8F9FF] hover:bg-[#EFF4FF] text-[#0B1C30] border border-slate-200 text-xs font-semibold transition cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 text-[#006398] ${isSyncing ? 'animate-spin text-[#EA580C]' : ''}`} />
          <span className="font-mono-num">{currentTime}</span>
          <span className="hidden sm:inline text-slate-600">Đồng bộ</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={() => navigate('/logs')}
          title="Xem nhật ký & cảnh báo"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#F8F9FF] hover:bg-[#FFF8F5] text-[#0B1C30] border border-slate-200 transition cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {alertSummary?.open > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#BA1A1A] text-white font-mono-num font-bold text-[10px] flex items-center justify-center">
              {alertSummary.open}
            </span>
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-xl hover:bg-[#F8F9FF] border border-transparent hover:border-slate-200 transition cursor-pointer"
          >
            <div className="hidden md:block text-right">
              <div className="text-xs font-bold text-[#0B1C30] leading-tight truncate max-w-[140px]">
                {displayName}
              </div>
              <div className="text-[11px] font-medium text-[#006398]">
                {roleInfo.label}
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-[#FFDBCA] border border-[#EA580C]/30 flex items-center justify-center font-bold text-xs text-[#9D4300]">
              {initialChar}
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 text-xs font-sans">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-bold text-[#0B1C30] truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || user?.phoneNumber}</p>
                <span className={`inline-block mt-2 text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${roleInfo.bg}`}>
                  {roleInfo.label}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsProfileOpen(true);
                  }}
                  className="w-full px-4 py-2 text-left text-[#0B1C30] hover:bg-[#F8F9FF] flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#006398]" />
                  <span>Hồ sơ cá nhân</span>
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsChangePassOpen(true);
                  }}
                  className="w-full px-4 py-2 text-left text-[#0B1C30] hover:bg-[#F8F9FF] flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Đổi mật khẩu</span>
                </button>

                {role === 'admin' && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full px-4 py-2 text-left text-[#0B1C30] hover:bg-[#F8F9FF] flex items-center gap-2.5 transition cursor-pointer font-medium"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#006E2D]" />
                    <span>Quản trị hệ thống (Admin)</span>
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-[#BA1A1A] hover:bg-[#FFF8F8] flex items-center gap-2.5 transition cursor-pointer font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Stop Button synced with Mobile #BA1A1A */}
        <button
          onClick={onEmergencyStop}
          className="h-9 px-3.5 rounded-xl bg-[#BA1A1A] hover:bg-[#93000A] active:scale-[0.99] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
          title="Ngắt khẩn cấp toàn bộ máy cho ăn"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Dừng khẩn cấp (E-STOP)</span>
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
