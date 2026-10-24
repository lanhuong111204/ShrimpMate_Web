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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* TOP ADMIN HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand & Admin Tag */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Waves className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-slate-900">
                ShrimpMate
              </span>
              <span className="text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                Quản trị hệ thống
              </span>
            </div>
          </div>

          {/* Right: Switch to Field Dashboard & Profile Dropdown */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Quay lại Bảng điều hành trại</span>
            </button>

            <div className="h-4 w-px bg-slate-200" />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer text-right"
              >
                <div className="hidden md:block text-right">
                  <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Quản trị viên
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center font-bold text-xs text-white">
                  {initialChar}
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 text-xs">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 text-left">
                    <p className="font-semibold text-slate-900 truncate">{displayName}</p>
                    <p className="text-[11px] text-slate-500 font-mono-num truncate mt-0.5">{user?.email || user?.phoneNumber}</p>
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
          </div>
        </div>
      </header>

      {/* HORIZONTAL NAVIGATION BAR */}
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'bg-teal-50 text-teal-800 font-semibold border border-teal-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
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
