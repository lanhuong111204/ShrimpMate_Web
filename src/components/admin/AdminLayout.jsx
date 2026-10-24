import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Users, 
  Cpu, 
  ShieldCheck, 
  Radio, 
  ArrowLeft, 
  LogOut, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AdminOverviewView from './AdminOverviewView';
import AdminUsersView from './AdminUsersView';
import AdminCatalogView from './AdminCatalogView';
import AdminSafetyRulesView from './AdminSafetyRulesView';
import AdminMqttTestView from './AdminMqttTestView';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* TOP ADMIN HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand & Admin Tag */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-500/20">
              SM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-wide">SHRIMPMATE ADMIN</span>
                <span className="text-[10px] uppercase font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  Root Console
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Hệ thống Quản trị & Điều phối Toàn cục Trung tâm
              </p>
            </div>
          </div>

          {/* Right: Switch to Field SCADA & Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition shadow-sm cursor-pointer"
              title="Chuyển sang màn hình điều hành ao nuôi tại hiện trường"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chế độ Xem Bàn SCADA</span>
            </button>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs uppercase">
                {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block text-left text-xs">
                <div className="font-semibold text-white leading-tight">{user?.fullName || user?.email}</div>
                <div className="text-[10px] text-rose-400 font-mono">ROLE: SYSTEM_ADMIN</div>
              </div>

              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HORIZONTAL NAVIGATION BAR */}
      <nav className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-rose-600 text-white font-semibold shadow-md shadow-rose-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
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
    </div>
  );
}
