import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  Clock, 
  Plus, 
  Warehouse, 
  Waves, 
  Cpu, 
  Sprout, 
  Edit3, 
  Trash2, 
  RotateCw, 
  AlertCircle,
  ChevronDown,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { farmService } from '../services/farmService';
import { pondService } from '../services/pondService';
import { FarmModal } from './ponds/FarmModal';
import { PondModal } from './ponds/PondModal';
import { ClaimDeviceModal } from './ponds/ClaimDeviceModal';
import { CropSeasonModal } from './ponds/CropSeasonModal';

export const PondsManagementView = ({
  ponds: mockPonds,
  onSelectPond,
  onNavigateTab,
  onRefillFeed,
}) => {
  const { role } = useAuth();
  const canManage = role === 'manager';
  // Quản lý Trang trại
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);

  // Quản lý Ao nuôi từ Backend
  const [apiPonds, setApiPonds] = useState([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState(false);
  const [isLoadingPonds, setIsLoadingPonds] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals cho Ao nuôi
  const [isPondModalOpen, setIsPondModalOpen] = useState(false);
  const [editingPond, setEditingPond] = useState(null);

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimTargetPond, setClaimTargetPond] = useState(null);

  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [seasonTargetPond, setSeasonTargetPond] = useState(null);

  // 1. Tải danh sách trang trại của Manager
  const fetchFarms = async () => {
    setIsLoadingFarms(true);
    setErrorMessage('');
    try {
      const res = await farmService.getFarms();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setFarms(list);
      if (list.length > 0) {
        setSelectedFarm((prev) => {
          if (prev && list.some((f) => f.id === prev.id)) {
            return list.find((f) => f.id === prev.id);
          }
          return list[0];
        });
      } else {
        setSelectedFarm(null);
      }
    } catch (err) {
      console.warn('Chưa thể kết nối API trang trại:', err);
    } finally {
      setIsLoadingFarms(false);
    }
  };

  // 2. Tải danh sách ao nuôi thuộc trang trại đang chọn
  const fetchPonds = async (farmId) => {
    if (!farmId) return;
    setIsLoadingPonds(true);
    try {
      const res = await pondService.getPondsByFarm(farmId);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setApiPonds(list);
    } catch (err) {
      console.warn('Chưa thể kết nối API ao nuôi:', err);
      setApiPonds([]);
    } finally {
      setIsLoadingPonds(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm?.id) {
      fetchPonds(selectedFarm.id);
    }
  }, [selectedFarm?.id]);

  // Hợp nhất danh sách ao: nếu backend có ao thật thì ưu tiên, nếu chưa thì fallback mockPonds
  const displayPonds = apiPonds.length > 0
    ? apiPonds.map((p, idx) => {
        // Map với các thuộc tính SCADA trực quan
        const mockMatch = mockPonds?.find((m) => m.code === p.code) || mockPonds?.[idx % mockPonds.length] || {};
        return {
          ...mockMatch,
          ...p,
          id: p.id,
          code: p.code,
          name: p.name,
          areaM2: p.areaM2 || 2500,
          area: `${(p.areaM2 || 2500).toLocaleString('vi-VN')} m²`,
          status: p.status || mockMatch.status || 'active',
          do: mockMatch.do || 5.8,
          temp: mockMatch.temp || 28.5,
          ph: mockMatch.ph || 7.8,
          currentMeal: mockMatch.currentMeal || 'Cữ 3: 13:30',
          sprayedKg: mockMatch.sprayedKg || 8.5,
          targetKg: mockMatch.targetKg || 12.0,
          hopperKg: mockMatch.hopperKg || 38.5,
          hydrophoneStatus: mockMatch.hydrophoneStatus || 'Ăn mạnh (FIS 3)',
        };
      })
    : mockPonds || [];

  // Xóa trang trại
  const handleDeleteFarm = async () => {
    if (!selectedFarm?.id) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa trang trại [${selectedFarm.name}]? Tất cả các ao nuôi trực thuộc sẽ được xóa mềm.`)) {
      return;
    }

    try {
      await farmService.deleteFarm(selectedFarm.id);
      await fetchFarms();
    } catch (err) {
      alert('Lỗi xóa trang trại: ' + (err?.message || 'Lỗi hệ thống'));
    }
  };

  // Xóa ao nuôi
  const handleDeletePond = async (pond) => {
    if (!selectedFarm?.id) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ao nuôi [${pond.code} - ${pond.name}]? Các thiết bị gán vào ao sẽ được hoàn trả về kho.`)) {
      return;
    }

    try {
      await pondService.deletePond(selectedFarm.id, pond.id);
      await fetchPonds(selectedFarm.id);
    } catch (err) {
      alert('Không thể xóa ao nuôi: ' + (err?.message || 'Lỗi hệ thống'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Chế độ Thanh tra dành cho Admin */}
      {role === 'admin' && (
        <div className="p-3.5 bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-2xl flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>Chế độ Thanh tra & Giám sát Cơ sở Nuôi Toàn diện:</strong> Quản trị viên theo dõi dữ liệu trang trại, ao nuôi phục vụ hỗ trợ kỹ thuật và kiểm tra chéo chỉ số FCR (Chế độ xem chỉ đọc).
            </span>
          </div>
          <span className="font-mono-num font-bold text-[10px] bg-red-950/80 text-red-300 border border-red-800 px-2 py-0.5 rounded">
            READ-ONLY INSPECTION
          </span>
        </div>
      )}

      {/* 1. Header & Farm Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quản lý trang trại & Ao nuôi
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý cơ sở nuôi, diện tích mặt nước, vụ nuôi và cấu hình thiết bị theo từng ao.
          </p>
        </div>

        {/* Action Controls: Chọn Trang Trại & Khởi tạo */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Farm Switcher Dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 h-9">
            <Warehouse className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500">Trang trại:</span>
            {farms.length > 0 ? (
              <select
                value={selectedFarm?.id || ''}
                onChange={(e) => {
                  const target = farms.find((f) => f.id === e.target.value);
                  setSelectedFarm(target);
                }}
                className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            ) : (
              <strong className="text-slate-700">Trại mặc định</strong>
            )}
          </div>

          {/* Nút Sửa / Xóa Trang trại */}
          {canManage && selectedFarm && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setEditingFarm(selectedFarm);
                  setIsFarmModalOpen(true);
                }}
                className="h-9 w-9 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg flex items-center justify-center transition cursor-pointer"
                title="Sửa thông tin trang trại"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDeleteFarm}
                className="h-9 w-9 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg flex items-center justify-center transition cursor-pointer"
                title="Xóa trang trại"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Nút Khởi tạo Trang Trại Mới & Khai Báo Ao Mới */}
          {canManage && (
            <>
              <button
                onClick={() => {
                  setEditingFarm(null);
                  setIsFarmModalOpen(true);
                }}
                className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm trại</span>
              </button>

              <button
                onClick={() => {
                  setEditingPond(null);
                  setIsPondModalOpen(true);
                }}
                disabled={!selectedFarm && farms.length > 0}
                className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Khai báo ao mới</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Danh sách các Ao nuôi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayPonds.map((pond) => {
          const isAlert = pond.status === 'empty_hopper';
          const isPaused = pond.status === 'paused';
          const isIdle = pond.status === 'idle' || pond.status === 'maintenance';

          return (
            <div
              key={pond.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
                isAlert ? 'border-red-300 ring-1 ring-red-100' : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="space-y-4">
                {/* Header Ao Nuôi */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display font-bold text-lg text-neutral-900 tracking-tight">
                        {pond.name}
                      </h3>
                      <span className="text-[11px] font-mono-num bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-bold border border-neutral-200">
                        {pond.code}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 font-mono-num">
                      Diện tích: <strong className="text-neutral-800">{pond.areaM2 ? `${pond.areaM2.toLocaleString('vi-VN')} m²` : pond.area}</strong>
                      {pond.shrimpType && ` • ${pond.shrimpType}`}
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isAlert ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono-num font-bold bg-red-50 text-red-600 border border-red-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      HẾT CÁM PHỄU
                    </span>
                  ) : isPaused ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono-num font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      TẠM DỪNG
                    </span>
                  ) : isIdle ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono-num font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                      CẢI TẠO / NGHỈ
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono-num font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      ĐANG NUÔI
                    </span>
                  )}
                </div>

                {/* 3 Chỉ số quan trắc mẫu */}
                <div className="grid grid-cols-3 gap-2 py-3 bg-neutral-50 rounded-xl text-center font-mono-num border border-neutral-100">
                  <div className="border-r border-neutral-200/60">
                    <div className="text-[10px] text-neutral-400 uppercase">Oxy Hòa Tan</div>
                    <div className="text-lg font-bold text-neutral-900 mt-0.5">
                      {typeof pond.do === 'number' ? pond.do.toFixed(2) : pond.do || '--'}
                    </div>
                    <div className="text-[10px] text-neutral-400">mg/L</div>
                  </div>
                  <div className="border-r border-neutral-200/60">
                    <div className="text-[10px] text-neutral-400 uppercase">Nhiệt Độ Nước</div>
                    <div className="text-lg font-bold text-neutral-900 mt-0.5">
                      {typeof pond.temp === 'number' ? pond.temp.toFixed(1) : pond.temp || '--'}
                    </div>
                    <div className="text-[10px] text-neutral-400">°C</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase">Độ Kiềm / pH</div>
                    <div className="text-lg font-bold text-neutral-900 mt-0.5">
                      {typeof pond.ph === 'number' ? pond.ph.toFixed(1) : pond.ph || '--'}
                    </div>
                    <div className="text-[10px] text-neutral-400">Ổn định</div>
                  </div>
                </div>

                {/* Dải Quản Trị: Gán Thiết Bị & Vụ Nuôi FCR (Chỉ dành cho Manager) */}
                {canManage && (
                  <div className="flex items-center gap-2 pt-1 font-mono-num text-xs">
                    <button
                      onClick={() => {
                        setClaimTargetPond(pond);
                        setIsClaimModalOpen(true);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-neutral-200"
                    >
                      <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Thiết Bị IoT</span>
                    </button>

                    <button
                      onClick={() => {
                        setSeasonTargetPond(pond);
                        setIsSeasonModalOpen(true);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border border-emerald-200"
                    >
                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Vụ Nuôi & FCR</span>
                    </button>

                    {/* Sửa Ao */}
                    <button
                      onClick={() => {
                        setEditingPond(pond);
                        setIsPondModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
                      title="Chỉnh sửa thông tin ao"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Xóa Ao */}
                    <button
                      onClick={() => handleDeletePond(pond)}
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Xóa ao nuôi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Dải Nút Thao Tác SCADA */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-neutral-100 text-xs font-mono-num">
                <button
                  onClick={() => {
                    onSelectPond(pond.id);
                    onNavigateTab('feeder', pond.id);
                  }}
                  className="py-2 px-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Máy Ăn</span>
                </button>

                <button
                  onClick={() => {
                    onSelectPond(pond.id);
                    onNavigateTab('schedule', pond.id);
                  }}
                  className="py-2 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Lịch Cữ</span>
                </button>

                <button
                  onClick={() => onRefillFeed(pond.id, 25)}
                  className="py-2 px-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+25kg</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Các Modals */}
      <FarmModal
        isOpen={isFarmModalOpen}
        farm={editingFarm}
        onClose={() => setIsFarmModalOpen(false)}
        onSuccess={fetchFarms}
      />

      <PondModal
        isOpen={isPondModalOpen}
        farmId={selectedFarm?.id}
        pond={editingPond}
        onClose={() => setIsPondModalOpen(false)}
        onSuccess={() => {
          if (selectedFarm?.id) fetchPonds(selectedFarm.id);
        }}
      />

      <ClaimDeviceModal
        isOpen={isClaimModalOpen}
        farmId={selectedFarm?.id}
        pond={claimTargetPond}
        onClose={() => setIsClaimModalOpen(false)}
        onSuccess={() => {
          if (selectedFarm?.id) fetchPonds(selectedFarm.id);
        }}
      />

      <CropSeasonModal
        isOpen={isSeasonModalOpen}
        pond={seasonTargetPond}
        onClose={() => setIsSeasonModalOpen(false)}
        onSuccess={() => {
          if (selectedFarm?.id) fetchPonds(selectedFarm.id);
        }}
      />
    </div>
  );
};

export default PondsManagementView;
