import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Cpu, 
  ShieldCheck, 
  Radio, 
  ArrowLeft, 
  LogOut, 
  KeyRound,
  User as UserIcon,
  ChevronDown,
  Waves
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AdminOverviewView from './AdminOverviewView';
import AdminUsersView from './AdminUsersView';
import AdminCatalogView from './AdminCatalogView';
import AdminSafetyRulesView from './AdminSafetyRulesView';
import AdminMqttTestView from './AdminMqttTestView';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { ProfileModal } from '../auth/ProfileModal';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    {
      path: '/admin',
      alias: '/admin/overview',
      label: 'Tổng quan nền tảng',
      icon: LayoutDashboard,
    },
    {
      path: '/admin/users',
      label: 'Quản lý tài khoản',
      icon: Users,
    },
    {
      path: '/admin/catalog',
      label: 'Danh mục thiết bị IoT',
      icon: Cpu,
    },
    {
      path: '/admin/safety-rules',
      label: 'Quy tắc an toàn nước',
      icon: ShieldCheck,
    },
    {
      path: '/admin/mqtt',
      label: 'Kiểm thử kết nối MQTT',
      icon: Radio,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (item) => {
    if (item.path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/' || location.pathname === '/admin/overview';
    }
    return location.pathname.startsWith(item.path);
  };

  const displayName = user?.fullName || user?.email || 'Quản trị viên';
  const initialChar = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-[#0B1C30] flex flex-col font-sans">
      {/* TOP ADMIN HEADER (Deep Ocean Navy #0B1C30) */}
      <header className="sticky top-0 z-40 bg-[#0B1C30] border-b border-[#1E293B] px-4 sm:px-6 h-16 flex items-center shadow-md">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand & Admin Tag */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FB923C] to-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#EA580C]/30">
              <Waves className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-base tracking-tight text-white">
                ShrimpMate <span className="text-[#FB923C]">Admin</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-[#131B2E] text-[#7CF994] border border-[#1E293B] px-2.5 py-0.5 rounded-full">
                Quản trị hệ thống
              </span>
            </div>
          </div>

          {/* Center: Horizontal Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-[#131B2E] p-1 rounded-xl border border-[#1E293B]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#FB923C] to-[#EA580C] text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Switch to Field Dashboard & Profile Dropdown */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#131B2E] hover:bg-[#1E293B] text-[#7CF994] text-xs font-bold border border-[#7CF994]/30 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#7CF994]" />
              <span className="hidden sm:inline">Quay lại Trang vận hành</span>
            </button>

            <div className="h-5 w-px bg-[#1E293B]" />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-xl hover:bg-[#131B2E] border border-transparent hover:border-[#1E293B] transition cursor-pointer text-right"
              >
                <div className="hidden md:block text-right">
                  <div className="text-xs font-semibold text-white leading-tight truncate max-w-[140px]">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-[#FB923C] font-semibold">
                    Quản trị viên
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FB923C] to-[#EA580C] flex items-center justify-center font-bold text-xs text-white shadow-sm">
                  {initialChar}
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 text-xs">
                  <div className="px-4 py-2.5 border-b border-slate-100 text-left">
                    <p className="font-bold text-[#0B1C30] truncate">{displayName}</p>
                    <p className="text-[11px] text-slate-500 font-mono-num truncate mt-0.5">{user?.email || user?.phoneNumber}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsProfileOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-[#F8F9FF] flex items-center gap-2.5 transition cursor-pointer font-medium"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#006398]" />
                      <span>Hồ sơ cá nhân</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsChangePassOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-[#F8F9FF] flex items-center gap-2.5 transition cursor-pointer font-medium"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>Đổi mật khẩu</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-[#BA1A1A] hover:bg-[#FFDAD6]/40 flex items-center gap-2.5 transition cursor-pointer font-bold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE / TABLET SUB-NAV BAR */}
      <nav className="lg:hidden bg-white border-b border-slate-200 px-4 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'bg-[#FFF8F5] text-[#EA580C] border border-[#FFDBCA]'
                    : 'text-slate-600 hover:text-[#0B1C30] hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#EA580C]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* MAIN ADMIN WORKSPACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={<AdminOverviewView />} />
          <Route path="/overview" element={<AdminOverviewView />} />
          <Route path="/users" element={<AdminUsersView />} />
          <Route path="/catalog" element={<AdminCatalogView />} />
          <Route path="/safety-rules" element={<AdminSafetyRulesView />} />
          <Route path="/mqtt" element={<AdminMqttTestView />} />
          <Route path="*" element={<AdminOverviewView />} />
        </Routes>
      </main>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
        onSuccess={() => {}}
      />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
