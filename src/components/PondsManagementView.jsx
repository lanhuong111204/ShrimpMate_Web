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
        <div className="p-3.5 bg-[#0B1C30] border border-slate-800 text-slate-200 rounded-2xl flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-[#7FFC97]" />
            <span>
              <strong>Chế độ Thanh tra & Giám sát Cơ sở Nuôi Toàn diện:</strong> Quản trị viên theo dõi dữ liệu trang trại, ao nuôi phục vụ hỗ trợ kỹ thuật và kiểm tra chéo chỉ số FCR (Chế độ xem chỉ đọc).
            </span>
          </div>
          <span className="font-mono-num font-bold text-[10px] bg-[#FFDAD6] text-[#93000A] px-2.5 py-0.5 rounded-full">
            READ-ONLY INSPECTION
          </span>
        </div>
      )}

      {/* 1. Header & Farm Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30] tracking-tight font-display">
            Quản lý trang trại & Ao nuôi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quản lý cơ sở nuôi, diện tích mặt nước, vụ nuôi và cấu hình thiết bị theo từng ao.
          </p>
        </div>

        {/* Action Controls: Chọn Trang Trại & Khởi tạo */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Farm Switcher Dropdown */}
          <div className="flex items-center gap-2 bg-[#EFF4FF] border border-[#D3E4FE] rounded-xl px-3 h-9">
            <Warehouse className="w-4 h-4 text-[#006398]" />
            <span className="text-[#006398] font-medium">Trang trại:</span>
            {farms.length > 0 ? (
              <select
                value={selectedFarm?.id || ''}
                onChange={(e) => {
                  const target = farms.find((f) => f.id === e.target.value);
                  setSelectedFarm(target);
                }}
                className="bg-transparent font-bold text-[#0B1C30] focus:outline-none cursor-pointer"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            ) : (
              <strong className="text-[#0B1C30]">Trại Ba Đầm – Bạc Liêu</strong>
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
                className="h-9 w-9 bg-white hover:bg-slate-50 border border-slate-200 text-[#0B1C30] rounded-xl flex items-center justify-center transition cursor-pointer"
                title="Sửa thông tin trang trại"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDeleteFarm}
                className="h-9 w-9 bg-[#FFF8F8] hover:bg-[#FFDAD6] border border-[#FFDAD6] text-[#BA1A1A] rounded-xl flex items-center justify-center transition cursor-pointer"
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
                className="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-[#0B1C30] font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#006398]" />
                <span>Thêm trại</span>
              </button>

              <button
                onClick={() => {
                  setEditingPond(null);
                  setIsPondModalOpen(true);
                }}
                disabled={!selectedFarm && farms.length > 0}
                className="h-9 px-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
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
              className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between transition-all ${
                isAlert ? 'border-amber-300' : 'border-slate-200 hover:border-[#EA580C]/50'
              }`}
            >
              <div className="space-y-4">
                {/* Header Ao Nuôi */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display font-bold text-lg text-[#0B1C30] tracking-tight">
                        {pond.name}
                      </h3>
                      <span className="text-[11px] font-mono-num bg-[#EFF4FF] text-[#006398] px-2 py-0.5 rounded-md font-bold border border-[#D3E4FE]">
                        {pond.code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono-num">
                      Diện tích: <strong className="text-[#0B1C30]">{pond.areaM2 ? `${pond.areaM2.toLocaleString('vi-VN')} m²` : pond.area}</strong>
                      {pond.shrimpType && ` • ${pond.shrimpType}`}
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isAlert ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-amber-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      CẢNH BÁO PHỄU
                    </span>
                  ) : isPaused ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFDBCA] text-[#9D4300] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                      TẠM DỪNG
                    </span>
                  ) : isIdle ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE]">
                      CHỜ LỊCH KẾ TIẾP
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#006E2D]" />
                      ĐANG NUÔI
                    </span>
                  )}
                </div>

                {/* 3 Chỉ số quan trắc mẫu */}
                <div className="grid grid-cols-3 gap-2 font-mono-num">
                  <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#7CF994]/60 text-center">
                    <div className="text-[10px] text-[#006E2D] font-bold uppercase">Oxy Hòa Tan</div>
                    <div className="text-lg font-extrabold text-[#006E2D] mt-0.5">
                      {typeof pond.do === 'number' ? pond.do.toFixed(2) : pond.do || '--'}
                    </div>
                    <div className="text-[10px] text-[#005320]">mg/L</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FFF8F5] border border-[#FFDBCA] text-center">
                    <div className="text-[10px] text-[#9D4300] font-bold uppercase">Nhiệt Độ Nước</div>
                    <div className="text-lg font-extrabold text-[#9D4300] mt-0.5">
                      {typeof pond.temp === 'number' ? pond.temp.toFixed(1) : pond.temp || '--'}
                    </div>
                    <div className="text-[10px] text-[#EA580C]">°C</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#EFF4FF] border border-[#D3E4FE] text-center">
                    <div className="text-[10px] text-[#006398] font-bold uppercase">Độ pH Nước</div>
                    <div className="text-lg font-extrabold text-[#006398] mt-0.5">
                      {typeof pond.ph === 'number' ? pond.ph.toFixed(1) : pond.ph || '--'}
                    </div>
                    <div className="text-[10px] text-[#006398]">Ổn định</div>
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
                      className="flex-1 py-2 px-2 rounded-xl bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#006398] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border border-[#D3E4FE]"
                    >
                      <Cpu className="w-3.5 h-3.5 text-[#006398]" />
                      <span>Thiết Bị IoT</span>
                    </button>

                    <button
                      onClick={() => {
                        setSeasonTargetPond(pond);
                        setIsSeasonModalOpen(true);
                      }}
                      className="flex-1 py-2 px-2 rounded-xl bg-[#E8F5E9] hover:bg-[#7CF994]/40 text-[#006E2D] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border border-[#7CF994]"
                    >
                      <Sprout className="w-3.5 h-3.5 text-[#006E2D]" />
                      <span>Vụ Nuôi & FCR</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingPond(pond);
                        setIsPondModalOpen(true);
                      }}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      title="Chỉnh sửa thông tin ao"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeletePond(pond)}
                      className="p-2 rounded-xl border border-[#FFDAD6] text-[#BA1A1A] hover:bg-[#FFF8F8] transition cursor-pointer"
                      title="Xóa ao nuôi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Dải Nút Thao Tác SCADA */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                <button
                  onClick={() => {
                    onSelectPond(pond.id);
                    onNavigateTab('feeder', pond.id);
                  }}
                  className="py-2 px-2 bg-[#0B1C30] hover:bg-[#131B2E] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Settings2 className="w-3.5 h-3.5 text-[#FB923C]" />
                  <span>Máy Ăn</span>
                </button>

                <button
                  onClick={() => {
                    onSelectPond(pond.id);
                    onNavigateTab('schedule', pond.id);
                  }}
                  className="py-2 px-2 bg-[#F8F9FF] hover:bg-slate-100 text-[#0B1C30] border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-[#006398]" />
                  <span>Lịch Cữ</span>
                </button>

                <button
                  onClick={() => onRefillFeed(pond.id, 25)}
                  className="py-2 px-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+Nạp 25kg</span>
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
