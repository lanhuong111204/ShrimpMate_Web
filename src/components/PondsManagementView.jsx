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
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { farmService } from '../services/farmService';
import { pondService } from '../services/pondService';
import { getErrorMessage } from '../services/apiClient';
import { FarmModal } from './ponds/FarmModal';
import { PondModal } from './ponds/PondModal';
import { ClaimDeviceModal } from './ponds/ClaimDeviceModal';
import { CropSeasonModal } from './ponds/CropSeasonModal';

export const PondsManagementView = ({
  ponds: enrichedPonds = [],
  onSelectPond,
  onNavigateTab,
  onRefillFeed,
  onRefreshGlobalData,
}) => {
  const { role } = useAuth();
  const canManage = role === 'manager';

  // Quản lý trang trại
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);

  // Quản lý ao nuôi từ Backend
  const [apiPonds, setApiPonds] = useState([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState(false);
  const [isLoadingPonds, setIsLoadingPonds] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals cho ao nuôi
  const [isPondModalOpen, setIsPondModalOpen] = useState(false);
  const [editingPond, setEditingPond] = useState(null);

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimTargetPond, setClaimTargetPond] = useState(null);

  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [seasonTargetPond, setSeasonTargetPond] = useState(null);

  // 1. Tải danh sách trang trại thật của người dùng
  const fetchFarms = async (preferredFarmId = null) => {
    setIsLoadingFarms(true);
    setErrorMessage('');
    try {
      const res = await farmService.getFarms();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setFarms(list);
      if (list.length > 0) {
        setSelectedFarm((prev) => {
          if (preferredFarmId && list.some((f) => f.id === preferredFarmId)) {
            return list.find((f) => f.id === preferredFarmId);
          }
          if (prev && list.some((f) => f.id === prev.id)) {
            return list.find((f) => f.id === prev.id);
          }
          return list[0];
        });
      } else {
        setSelectedFarm(null);
        setApiPonds([]);
      }
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Không thể tải danh sách trang trại từ máy chủ.'));
      setFarms([]);
      setSelectedFarm(null);
      setApiPonds([]);
    } finally {
      setIsLoadingFarms(false);
    }
  };

  // 2. Tải danh sách ao nuôi thuộc trang trại đang chọn
  const fetchPonds = async (farmId) => {
    if (!farmId) {
      setApiPonds([]);
      return;
    }
    setIsLoadingPonds(true);
    setErrorMessage('');
    try {
      const res = await pondService.getPondsByFarm(farmId);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setApiPonds(list);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Không thể tải danh sách ao nuôi từ máy chủ.'));
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
    } else {
      setApiPonds([]);
    }
  }, [selectedFarm?.id]);

  // Ghép dữ liệu thực tế (telemetry, vụ nuôi, thiết bị) từ enrichedPonds vào danh sách ao của trang trại đang chọn
  const displayPonds = apiPonds.map((p) => {
    const enriched = enrichedPonds.find((ep) => ep.id === p.id) || {};
    return {
      ...enriched,
      ...p,
      id: p.id,
      code: p.code,
      name: p.name,
      farmId: p.farmId || selectedFarm?.id,
      farmName: selectedFarm?.name || enriched.farmName || 'Chưa xác định',
      areaM2: Number(p.areaM2 || 0),
      area: `${Number(p.areaM2 || 0).toLocaleString('vi-VN')} m²`,
      status: enriched.status || p.status || 'active',
      dbStatus: p.status || 'active',
      do: enriched.do ?? null,
      temp: enriched.temp ?? null,
      ph: enriched.ph ?? null,
      shrimpType: enriched.shrimpType || 'Chưa khai báo vụ nuôi',
      feederDevice: enriched.feederDevice || null,
      devices: enriched.devices || [],
    };
  });

  // Xóa trang trại
  const handleDeleteFarm = async () => {
    if (!selectedFarm?.id) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa trang trại [${selectedFarm.name}]? Tất cả các ao nuôi trực thuộc sẽ được xóa mềm.`
      )
    ) {
      return;
    }

    try {
      await farmService.deleteFarm(selectedFarm.id);
      await fetchFarms();
      onRefreshGlobalData?.();
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể xóa trang trại.');
      setErrorMessage(msg);
      alert('Lỗi xóa trang trại: ' + msg);
    }
  };

  // Xóa ao nuôi
  const handleDeletePond = async (pond) => {
    const targetFarmId = pond.farmId || selectedFarm?.id;
    if (!targetFarmId) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ao nuôi [${pond.code} - ${pond.name}]? Các thiết bị gán vào ao sẽ được hoàn trả về kho.`
      )
    ) {
      return;
    }

    try {
      await pondService.deletePond(targetFarmId, pond.id);
      await fetchPonds(targetFarmId);
      onRefreshGlobalData?.();
    } catch (err) {
      const msg = getErrorMessage(err, 'Không thể xóa ao nuôi.');
      setErrorMessage(msg);
      alert('Không thể xóa ao nuôi: ' + msg);
    }
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {/* Banner chế độ thanh tra dành cho Quản trị viên */}
      {role === 'admin' && (
        <div className="p-3.5 bg-[#0B1C30] border border-slate-800 text-slate-200 rounded-2xl flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-[#7FFC97]" />
            <span>
              <strong>Chế độ thanh tra và giám sát cơ sở nuôi:</strong> Quản trị viên theo dõi dữ liệu trang trại, ao nuôi phục vụ hỗ trợ kỹ thuật và kiểm tra chéo chỉ số FCR (chế độ chỉ đọc).
            </span>
          </div>
          <span className="font-mono-num font-bold text-[10px] bg-[#FFDAD6] text-[#93000A] px-2.5 py-0.5 rounded-full">
            Chế độ chỉ đọc
          </span>
        </div>
      )}

      {/* 1. Header & Bộ chọn Trang trại */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30] tracking-tight font-display">
            Quản lý trang trại và ao nuôi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quản lý cơ sở nuôi, diện tích mặt nước, vụ nuôi và cấu hình thiết bị theo từng ao.
          </p>
        </div>

        {/* Điều khiển: Chọn trang trại & Khởi tạo */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Dropdown chọn trang trại */}
          <div className="flex items-center gap-2 bg-[#EFF4FF] border border-[#D3E4FE] rounded-xl px-3 h-9">
            <Warehouse className="w-4 h-4 text-[#006398]" />
            <span className="text-[#006398] font-medium">Trang trại:</span>
            {farms.length > 0 ? (
              <select
                value={selectedFarm?.id || ''}
                onChange={(e) => {
                  const target = farms.find((f) => f.id === e.target.value);
                  setSelectedFarm(target || null);
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
              <strong className="text-slate-500">Chưa có trang trại nào</strong>
            )}
          </div>

          {/* Nút sửa / xóa trang trại */}
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

          {/* Nút thêm trang trại & khai báo ao mới */}
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
                <span>Thêm trang trại</span>
              </button>

              <button
                onClick={() => {
                  if (!selectedFarm || farms.length === 0) return;
                  setEditingPond(null);
                  setIsPondModalOpen(true);
                }}
                disabled={!selectedFarm || farms.length === 0}
                title={
                  !selectedFarm || farms.length === 0
                    ? 'Vui lòng tạo trang trại trước khi khai báo ao nuôi'
                    : `Thêm ao nuôi mới vào ${selectedFarm.name}`
                }
                className="h-9 px-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Khai báo ao mới</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Danh sách các ao nuôi hoặc Trạng thái rỗng (Empty State) */}
      {isLoadingFarms || isLoadingPonds ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-[#006398]" />
          <span>Đang tải dữ liệu trang trại và ao nuôi từ máy chủ...</span>
        </div>
      ) : farms.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF4FF] text-[#006398] flex items-center justify-center mx-auto">
            <Warehouse className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#0B1C30]">
              Tài khoản của bạn chưa có trang trại nào
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Để bắt đầu khai báo ao nuôi, thả giống và kết nối thiết bị cảm biến / máy cho ăn, vui lòng khởi tạo trang trại đầu tiên của bạn.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => {
                setEditingFarm(null);
                setIsFarmModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo trang trại đầu tiên</span>
            </button>
          )}
        </div>
      ) : displayPonds.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF8F5] text-[#EA580C] flex items-center justify-center mx-auto">
            <Waves className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#0B1C30]">
              Trang trại &ldquo;{selectedFarm?.name}&rdquo; chưa có ao nuôi nào
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hãy bấm nút bên dưới để khai báo ao nuôi đầu tiên thuộc trang trại <strong>{selectedFarm?.name}</strong>.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => {
                setEditingPond(null);
                setIsPondModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Khai báo ao mới cho {selectedFarm?.name}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayPonds.map((pond) => {
            const isAlert = pond.status === 'empty_hopper';
            const isMaintenance = pond.dbStatus === 'maintenance';
            const isInactive = pond.dbStatus === 'inactive';

            return (
              <div
                key={pond.id}
                className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between transition-all ${
                  isAlert ? 'border-amber-300' : 'border-slate-200 hover:border-[#EA580C]/50'
                }`}
              >
                <div className="space-y-4">
                  {/* Header Ao nuôi kèm Tên trang trại */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        <Warehouse className="w-3 h-3 text-[#006398]" />
                        <span>{pond.farmName}</span>
                      </div>
                      <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                        <h3 className="font-display font-bold text-lg text-[#0B1C30] tracking-tight">
                          {pond.name}
                        </h3>
                        <span className="text-[11px] font-mono-num bg-[#EFF4FF] text-[#006398] px-2 py-0.5 rounded-md font-bold border border-[#D3E4FE]">
                          {pond.code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono-num">
                        Diện tích: <strong className="text-[#0B1C30]">{pond.area}</strong>
                        {pond.shrimpType && ` • ${pond.shrimpType}`}
                      </div>
                    </div>

                    {/* Nhãn trạng thái */}
                    {isAlert ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-amber-300 flex items-center gap-1.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                        Cảnh báo phễu
                      </span>
                    ) : isMaintenance ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFDBCA] text-[#9D4300] flex items-center gap-1.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                        Đang cải tạo
                      </span>
                    ) : isInactive ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        Tạm ngưng
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994] flex items-center gap-1.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[#006E2D]" />
                        Đang thả nuôi
                      </span>
                    )}
                  </div>

                  {/* 3 Chỉ số quan trắc thực tế từ Database */}
                  <div className="grid grid-cols-3 gap-2 font-mono-num">
                    <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#7CF994]/60 text-center">
                      <div className="text-[10px] text-[#006E2D] font-bold">Oxy hòa tan (DO)</div>
                      <div className="text-lg font-extrabold text-[#006E2D] mt-0.5">
                        {pond.do !== null && pond.do !== undefined ? pond.do.toFixed(2) : '--'}
                      </div>
                      <div className="text-[10px] text-[#005320]">
                        {pond.do !== null && pond.do !== undefined ? 'mg/L' : 'Chưa đo'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FFF8F5] border border-[#FFDBCA] text-center">
                      <div className="text-[10px] text-[#9D4300] font-bold">Nhiệt độ nước</div>
                      <div className="text-lg font-extrabold text-[#9D4300] mt-0.5">
                        {pond.temp !== null && pond.temp !== undefined ? pond.temp.toFixed(1) : '--'}
                      </div>
                      <div className="text-[10px] text-[#EA580C]">
                        {pond.temp !== null && pond.temp !== undefined ? '°C' : 'Chưa đo'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#EFF4FF] border border-[#D3E4FE] text-center">
                      <div className="text-[10px] text-[#006398] font-bold">Độ pH nước</div>
                      <div className="text-lg font-extrabold text-[#006398] mt-0.5">
                        {pond.ph !== null && pond.ph !== undefined ? pond.ph.toFixed(1) : '--'}
                      </div>
                      <div className="text-[10px] text-[#006398]">
                        {pond.ph !== null && pond.ph !== undefined ? 'pH' : 'Chưa đo'}
                      </div>
                    </div>
                  </div>

                  {/* Dải quản trị: Gán thiết bị & Vụ nuôi FCR */}
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
                        <span>Thiết bị IoT ({pond.devices?.length || 0})</span>
                      </button>

                      <button
                        onClick={() => {
                          setSeasonTargetPond(pond);
                          setIsSeasonModalOpen(true);
                        }}
                        className="flex-1 py-2 px-2 rounded-xl bg-[#E8F5E9] hover:bg-[#7CF994]/40 text-[#006E2D] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border border-[#7CF994]"
                      >
                        <Sprout className="w-3.5 h-3.5 text-[#006E2D]" />
                        <span>Vụ nuôi & FCR</span>
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

                {/* Dải nút thao tác điều khiển */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => {
                      onSelectPond(pond.id);
                      onNavigateTab('feeder', pond.id);
                    }}
                    className="py-2 px-2 bg-[#0B1C30] hover:bg-[#131B2E] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-[#FB923C]" />
                    <span>Máy cho ăn</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectPond(pond.id);
                      onNavigateTab('schedule', pond.id);
                    }}
                    className="py-2 px-2 bg-[#F8F9FF] hover:bg-slate-100 text-[#0B1C30] border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#006398]" />
                    <span>Lịch cho ăn</span>
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
      )}

      {/* Các Modals */}
      <FarmModal
        isOpen={isFarmModalOpen}
        farm={editingFarm}
        onClose={() => setIsFarmModalOpen(false)}
        onSuccess={async (savedFarm) => {
          await fetchFarms(savedFarm?.id);
          onRefreshGlobalData?.();
        }}
      />

      <PondModal
        isOpen={isPondModalOpen}
        farmId={selectedFarm?.id}
        farms={farms}
        pond={editingPond}
        onClose={() => setIsPondModalOpen(false)}
        onSuccess={async (targetFarmId) => {
          const fId = targetFarmId || selectedFarm?.id;
          if (fId) {
            await fetchFarms(fId);
            await fetchPonds(fId);
          }
          onRefreshGlobalData?.();
        }}
      />

      <ClaimDeviceModal
        isOpen={isClaimModalOpen}
        farmId={selectedFarm?.id}
        pond={claimTargetPond}
        onClose={() => setIsClaimModalOpen(false)}
        onSuccess={async () => {
          if (selectedFarm?.id) await fetchPonds(selectedFarm.id);
          onRefreshGlobalData?.();
        }}
      />

      <CropSeasonModal
        isOpen={isSeasonModalOpen}
        pond={seasonTargetPond}
        onClose={() => setIsSeasonModalOpen(false)}
        onSuccess={async () => {
          if (selectedFarm?.id) await fetchPonds(selectedFarm.id);
          onRefreshGlobalData?.();
        }}
      />
    </div>
  );
};

export default PondsManagementView;
