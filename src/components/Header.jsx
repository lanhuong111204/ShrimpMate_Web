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
  Waves,
  Warehouse
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
  farms = [],
  selectedFarmId = 'all',
  onSelectFarm,
  ponds = [],
  activePond = null,
  onSelectPond,
}) => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [alertSummary, setAlertSummary] = useState(null);
  const pondIdsKey = ponds.map((p) => p.id).join(',');

  useEffect(() => {
    const fetchAlertSummary = async () => {
      try {
        if (selectedFarmId === 'all') {
          const res = await alertService.getSummary().catch(() => null);
          if (res) setAlertSummary(res);
          return;
        }
        if (ponds.length === 0) {
          setAlertSummary({ open: 0 });
          return;
        }
        const summaries = await Promise.all(
          ponds.map((p) => alertService.getSummary(p.id).catch(() => null))
        );
        const totalOpen = summaries.reduce((sum, s) => sum + Number(s?.open || 0), 0);
        setAlertSummary({ open: totalOpen });
      } catch (err) {
        console.warn('Lỗi lấy tổng hợp cảnh báo:', err);
      }
    };
    fetchAlertSummary();
    const interval = setInterval(fetchAlertSummary, 15000);
    return () => clearInterval(interval);
  }, [selectedFarmId, pondIdsKey]);

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

  const activePondCount = ponds.filter((p) => p.status === 'active').length;

  return (
    <header className="sticky top-0 z-40 h-16 bg-white text-[#0B1C30] border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 select-none shadow-2xs">
      {/* Left: Brand Logo & Real Farm/Pond Selector Pills */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FB923C] to-[#EA580C] text-white flex items-center justify-center font-display font-bold text-xs tracking-tight shrink-0 shadow-xs">
            <Waves className="w-5 h-5" />
          </div>
          <div className="whitespace-nowrap">
            <div className="font-display font-bold text-sm tracking-tight text-[#0B1C30] leading-tight">
              ShrimpMate
            </div>
            <div className="text-[10px] font-bold tracking-wider text-[#EA580C]">
              Hệ điều hành trại tôm
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200 hidden md:block shrink-0" />

        {/* Bộ chọn Trang trại & Ao nuôi thực tế từ Database */}
        <div className="hidden md:flex items-center gap-2.5 text-xs min-w-0">
          {farms.length > 0 ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE] font-semibold">
              <Warehouse className="w-3.5 h-3.5 text-[#006398] shrink-0" />
              <select
                value={selectedFarmId}
                onChange={(e) => onSelectFarm?.(e.target.value)}
                className="bg-transparent font-bold text-[#006398] focus:outline-none cursor-pointer max-w-[190px] truncate"
                title="Chọn trang trại hiển thị"
              >
                <option value="all">Tất cả trang trại ({farms.length})</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              {ponds.length > 0 && (
                <>
                  <span className="text-[#40A2E7]">•</span>
                  <select
                    value={activePond?.id || ''}
                    onChange={(e) => onSelectPond?.(e.target.value)}
                    className="font-mono-num font-bold text-[#0B1C30] bg-white px-2 py-0.5 rounded-md border border-[#D3E4FE] focus:outline-none cursor-pointer"
                    title="Chọn ao nuôi đang điều khiển"
                  >
                    {ponds.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} ({p.name})
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/ponds')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-semibold hover:bg-amber-100 transition cursor-pointer"
            >
              <Warehouse className="w-3.5 h-3.5 text-amber-600" />
              <span>Chưa có trang trại • Bấm để khởi tạo</span>
            </button>
          )}

          {ponds.length > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994] font-semibold whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#006E2D] shrink-0" />
              <span>
                Đang hoạt động ({activePondCount}/{ponds.length} ao)
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span>0 ao nuôi</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Sync + Notifications + User Profile + E-Stop */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Sync Button */}
        <button
          onClick={onSync}
          title="Đồng bộ dữ liệu thực tế từ máy chủ"
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#F8F9FF] hover:bg-[#EFF4FF] text-[#0B1C30] border border-slate-200 text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
        >
          <RotateCw className={`w-3.5 h-3.5 text-[#006398] ${isSyncing ? 'animate-spin text-[#EA580C]' : ''}`} />
          <span className="font-mono-num">{currentTime}</span>
          <span className="hidden sm:inline text-slate-600">Đồng bộ</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={() => navigate('/logs')}
          title="Xem nhật ký và cảnh báo"
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
                    <span>Quản trị hệ thống</span>
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

        {/* Emergency Stop Button */}
        <button
          onClick={onEmergencyStop}
          disabled={ponds.length === 0}
          className="h-9 px-3.5 rounded-xl bg-[#BA1A1A] hover:bg-[#93000A] active:scale-[0.99] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Ngắt khẩn cấp toàn bộ máy cho ăn"
        >
          <AlertOctagon className="w-4 h-4" />
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
