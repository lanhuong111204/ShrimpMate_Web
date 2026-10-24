import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Waves, 
  Users, 
  Settings2, 
  Clock, 
  Camera, 
  Radio, 
  History,
  Shield,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Sidebar = ({
  currentTab,
  onSelectTab,
  activePondCount = 4,
  feederReadyCount = 4,
}) => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const navItemClass = (isActive) =>
    `w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
      isActive
        ? 'bg-slate-900 text-white font-semibold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <aside className="w-full md:w-60 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
      <div className="p-3 space-y-1">
        {role === 'admin' && (
          <div className="mb-2 pb-2 border-b border-slate-100">
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 transition cursor-pointer"
              title="Quay lại trang Quản trị viên"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-700" />
                <span>Trang Quản trị Admin</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        )}

        <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
          Điều hành ao nuôi
        </div>

        <button
          onClick={() => onSelectTab('overview')}
          className={navItemClass(currentTab === 'overview')}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Tổng quan hệ thống</span>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('ponds')}
          className={navItemClass(currentTab === 'ponds')}
        >
          <div className="flex items-center gap-2.5">
            <Waves className="w-4 h-4 shrink-0" />
            <span>Trang trại & Ao nuôi</span>
          </div>
          <span
            className={`font-mono-num text-[11px] font-semibold px-1.5 py-0.5 rounded ${
              currentTab === 'ponds' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {activePondCount}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('feeder')}
          className={navItemClass(currentTab === 'feeder')}
        >
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-4 h-4 shrink-0" />
            <span>Điều khiển máy ăn</span>
          </div>
          <span
            className="w-2 h-2 rounded-full bg-emerald-500"
            title={`${feederReadyCount} máy sẵn sàng`}
          />
        </button>

        <button
          onClick={() => onSelectTab('schedule')}
          className={navItemClass(currentTab === 'schedule')}
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Lịch cho ăn tự động</span>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('camera-fis')}
          className={navItemClass(currentTab === 'camera-fis' || currentTab === 'acoustics')}
        >
          <div className="flex items-center gap-2.5">
            <Camera className="w-4 h-4 shrink-0" />
            <span>Camera & Bắt mồi (FIS)</span>
          </div>
        </button>

        <div className="pt-3 px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
          Quản lý & Hạ tầng
        </div>

        {role !== 'farmer' && (
          <button
            onClick={() => onSelectTab('farmers')}
            className={navItemClass(currentTab === 'farmers')}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 shrink-0" />
              <span>Quản lý người nuôi</span>
            </div>
          </button>
        )}

        <button
          onClick={() => onSelectTab('iot')}
          className={navItemClass(currentTab === 'iot')}
        >
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 shrink-0" />
            <span>Trạm thiết bị IoT</span>
          </div>
        </button>

        <button
          onClick={() => onSelectTab('logs')}
          className={navItemClass(currentTab === 'logs')}
        >
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 shrink-0" />
            <span>Nhật ký vận hành</span>
          </div>
        </button>
      </div>

      {/* Minimal System Status Footer */}
      <div className="hidden md:block p-3 border-t border-slate-200">
        <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs flex items-center justify-between">
          <span className="text-slate-500">Hệ thống</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Hoạt động ổn định
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
