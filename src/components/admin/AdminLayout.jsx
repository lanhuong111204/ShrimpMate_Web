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
  ChevronDown
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
      label: 'Tổng quan Nền tảng',
      icon: LayoutDashboard,
      description: 'KPIs, thiết bị offline, cảnh báo nguy cấp'
    },
    {
      path: '/admin/users',
      label: 'Quản lý Tài khoản',
      icon: Users,
      description: 'Phân quyền RBAC, khóa/mở khóa'
    },
    {
      path: '/admin/catalog',
      label: 'IoT Hardware Catalog',
      icon: Cpu,
      description: 'Khai báo thiết bị kho chuẩn, thu hồi'
    },
    {
      path: '/admin/safety-rules',
      label: 'Quy tắc An toàn Nước',
      icon: ShieldCheck,
      description: 'Ngưỡng DO, pH, Temp bảo vệ phần cứng'
    },
    {
      path: '/admin/mqtt',
      label: 'Kiểm thử MQTT Broker',
      icon: Radio,
      description: 'Giao tiếp 2 chiều, test Feeder'
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
    <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col font-sans">
      {/* TOP ADMIN HEADER */}
      <header className="sticky top-0 z-40 bg-neutral-950 text-white border-b border-neutral-800 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand & Admin Tag */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-neutral-950 flex items-center justify-center font-display font-extrabold text-sm tracking-tight shadow-sm shrink-0">
              SM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xs tracking-wider text-white uppercase">
                  SHRIMPMATE ADMIN
                </span>
                <span className="text-[10px] uppercase font-mono font-bold bg-red-950/80 text-red-300 border border-red-800 px-2 py-0.2 rounded">
                  ROOT CONSOLE
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Hệ thống Quản trị & Điều phối Toàn cục Nền tảng
              </p>
            </div>
          </div>

          {/* Right: Switch to Field SCADA & Profile Dropdown */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold border border-neutral-800 transition cursor-pointer"
              title="Chuyển sang màn hình điều hành ao nuôi tại hiện trường"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chế độ Xem Bàn SCADA</span>
            </button>

            <div className="h-4 w-px bg-neutral-800" />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition cursor-pointer text-right"
              >
                <div className="hidden md:block text-right">
                  <div className="text-xs font-semibold text-neutral-200 leading-tight truncate max-w-[140px]">
                    {displayName}
                  </div>
                  <div className="text-[9px] text-red-400 font-mono font-semibold">
                    ADMINISTRATOR
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-200 shadow-sm">
                  {initialChar}
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl py-2 z-50 text-xs animate-fade-in font-sans">
                  <div className="px-4 py-2 border-b border-neutral-800 text-left">
                    <p className="font-semibold text-white truncate">{displayName}</p>
                    <p className="text-[11px] text-neutral-400 font-mono-num truncate">{user?.email || user?.phoneNumber}</p>
                    <div className="mt-1.5">
                      <span className="inline-block text-[9px] font-mono-num px-1.5 py-0.5 rounded border font-bold bg-red-950/80 text-red-300 border-red-800">
                        VAI TRÒ: QUẢN TRỊ VIÊN
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsProfileOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Hồ sơ cá nhân</span>
                    </button>

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
          </div>
        </div>
      </header>

      {/* HORIZONTAL NAVIGATION BAR */}
      <nav className="bg-white border-b border-neutral-200 px-4 sm:px-6 overflow-x-auto scrollbar-none shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-neutral-500'}`} />
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
        onSuccess={() => {}}
      />
    </div>
  );
}
