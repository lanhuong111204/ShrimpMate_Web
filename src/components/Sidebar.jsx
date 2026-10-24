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
    `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
      isActive
        ? 'bg-gradient-to-r from-[#FB923C] to-[#EA580C] text-white font-semibold shadow-sm'
        : 'text-slate-300 hover:text-white hover:bg-[#131B2E]'
    }`;

  return (
    <aside className="w-full md:w-64 bg-[#0B1C30] text-slate-200 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div className="p-3.5 space-y-1">
        {role === 'admin' && (
          <div className="mb-3 pb-3 border-b border-slate-800/80">
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#131B2E] hover:bg-slate-800 text-[#FFDBCA] border border-[#EA580C]/40 transition cursor-pointer"
              title="Quay lại trang Quản trị viên"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-[#FB923C]" />
                <span>Trang Quản trị Admin</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#FB923C]" />
            </button>
          </div>
        )}

        <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          Giám sát & Vận hành
        </div>

        <button
          onClick={() => onSelectTab('overview')}
          className={navItemClass(currentTab === 'overview')}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Tổng quan trại nuôi</span>
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
            className={`font-mono-num text-[11px] font-bold px-2 py-0.5 rounded-full ${
              currentTab === 'ponds'
                ? 'bg-white/20 text-white'
                : 'bg-[#131B2E] text-[#7FFC97] border border-slate-700/80'
            }`}
          >
            {activePondCount} Ao
          </span>
        </button>

        <button
          onClick={() => onSelectTab('feeder')}
          className={navItemClass(currentTab === 'feeder')}
        >
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-4 h-4 shrink-0" />
            <span>Điều khiển Máy cho ăn</span>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              currentTab === 'feeder' ? 'bg-white' : 'bg-[#7FFC97]'
            }`}
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
            <span>Chỉ số Nước & Camera FIS</span>
          </div>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              currentTab === 'camera-fis' || currentTab === 'acoustics'
                ? 'bg-white/20 text-white'
                : 'bg-[#006398]/40 text-[#CCE5FF]'
            }`}
          >
            6 Chỉ số
          </span>
        </button>

        <div className="pt-3.5 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          Quản lý & Hạ tầng
        </div>

        {role !== 'farmer' && (
          <button
            onClick={() => onSelectTab('farmers')}
            className={navItemClass(currentTab === 'farmers')}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 shrink-0" />
              <span>Nhân sự & Phân quyền</span>
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

      {/* Mobile-Synced Dark Navy Status Footer */}
      <div className="hidden md:block p-3.5 border-t border-slate-800/80">
        <div className="px-3.5 py-3 bg-[#131B2E] rounded-xl border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Trạm IoT Trung tâm</span>
            <span className="w-2 h-2 rounded-full bg-[#7FFC97]" />
          </div>
          <div className="font-semibold text-[#7FFC97] flex items-center justify-between">
            <span>Đang kết nối ({feederReadyCount}/{activePondCount} Ao)</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono-num">
            MQTT • Safety Rule Engine ON
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
