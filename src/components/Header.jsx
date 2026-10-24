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
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ChangePasswordModal } from './auth/ChangePasswordModal';
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
  const dropdownRef = useRef(null);

  // Tổng kết số lượng sự cố cảnh báo
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

  // Đóng dropdown khi click ra ngoài
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

  // Màu sắc và nhãn theo vai trò
  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'admin':
        return {
          label: 'ADMIN',
          bg: 'bg-red-950/80 text-red-300 border-red-800',
        };
      case 'manager':
        return {
          label: 'QUẢN LÝ TRẠI',
          bg: 'bg-blue-950/80 text-blue-300 border-blue-800',
        };
      case 'farmer':
      default:
        return {
          label: 'NGƯỜI NUÔI',
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
        };
    }
  };

  const roleInfo = getRoleBadge(role);
  const displayName = user?.fullName || user?.email || 'Người dùng SCADA';
  const initialChar = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 h-14 bg-neutral-950 text-white border-b border-neutral-800 px-3 sm:px-6 flex items-center justify-between shadow-sm select-none">
      {/* Left: Branding & Site Info */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white text-neutral-950 flex items-center justify-center font-display font-extrabold text-sm tracking-tight shadow-sm shrink-0">
            SM
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xs tracking-wider text-white uppercase">
                SHRIMPMATE SCADA
              </span>
              <span className="text-[10px] font-mono-num bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-700 font-medium">
                v4.2 PRO
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 font-normal truncate max-w-[180px] sm:max-w-none">
              Trại CNC Ba Đầm – Giá Rai, Bạc Liêu
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-neutral-800 hidden md:block" />

        {/* Live IoT Telemetry Ping */}
        <div className="hidden sm:flex items-center gap-3.5 text-xs font-mono-num">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-neutral-400 text-[11px]">LoRa Gateway:</span>
            <span className="text-neutral-200 font-medium text-[11px]">915MHz OK (-68dBm)</span>
          </div>
          <div className="h-3 w-px bg-neutral-800" />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-neutral-400 text-[11px]">Sensor Phao:</span>
            <span className="text-neutral-200 font-medium text-[11px]">4/4 Trực tuyến</span>
          </div>
          <div className="h-3 w-px bg-neutral-800" />
          <div className="flex items-center gap-1.5 text-neutral-300">
            <span className="text-neutral-400 text-[11px]">Ao tập trung:</span>
            <span className="text-emerald-400 font-semibold text-[11px]">{activePondCode}</span>
          </div>
        </div>
      </div>

      {/* Right: Telemetry sync + Operator Profile Dropdown + E-Stop Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync telemetry button */}
        <button
          onClick={onSync}
          title="Đồng bộ hóa tức thời dữ liệu telemetry"
          className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-medium transition cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 text-neutral-400 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          <span className="font-mono-num text-[11px]">{currentTime} Đồng bộ</span>
        </button>

        {/* Alerts Badge Indicator */}
        <button
          onClick={() => navigate('/logs')}
          title="Xem trung tâm cảnh báo sự cố SCADA"
          className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5 text-neutral-300" />
          {alertSummary?.open > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-mono-num font-bold text-[9px] flex items-center justify-center animate-pulse shadow-sm">
              {alertSummary.open}
            </span>
          )}
        </button>

        {/* User Profile & Account Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition cursor-pointer text-right"
          >
            <div className="hidden md:block text-right">
              <div className="text-xs font-semibold text-neutral-200 leading-tight truncate max-w-[140px]">
                {displayName}
              </div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span
                  className={`text-[9px] font-mono-num px-1 py-0.2 rounded border font-semibold ${roleInfo.bg}`}
                >
                  {roleInfo.label}
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-200 shadow-sm">
              {initialChar}
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl py-2 z-50 text-xs animate-fade-in font-sans">
              <div className="px-4 py-2 border-b border-neutral-800 text-left">
                <p className="font-semibold text-white truncate">{displayName}</p>
                <p className="text-[11px] text-neutral-400 font-mono-num truncate">{user?.email || user?.phoneNumber}</p>
                <div className="mt-1.5">
                  <span
                    className={`inline-block text-[9px] font-mono-num px-1.5 py-0.5 rounded border font-bold ${roleInfo.bg}`}
                  >
                    VAI TRÒ: {roleInfo.label}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsChangePassOpen(true);
                  }}
                  className="w-full px-4 py-2 text-left text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Đổi mật khẩu</span>
                </button>

                {role === 'admin' && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full px-4 py-2 text-left text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-red-400" />
                    <span>Trang Quản trị Admin</span>
                  </button>
                )}
              </div>

              <div className="border-t border-neutral-800 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-neutral-800 flex items-center gap-2.5 transition cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất hệ thống</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* E-STOP BUTTON */}
        <button
          onClick={onEmergencyStop}
          className="h-8 px-2.5 sm:px-3 rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 text-white font-display font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
          title="Ngắt khẩn cấp rơ-le toàn bộ máy rải cám và mâm quay"
        >
          <AlertOctagon className="w-4 h-4" />
          <span className="uppercase text-[11px] sm:text-xs">E-STOP KHẨN CẤP</span>
        </button>
      </div>

      {/* Modal Đổi mật khẩu */}
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
        onSuccess={() => {}}
      />
    </header>
  );
};

export default Header;
