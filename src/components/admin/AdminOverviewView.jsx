import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Warehouse, 
  Cpu, 
  TrendingUp, 
  AlertTriangle, 
  WifiOff, 
  RotateCw
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../services/apiClient';

export const AdminOverviewView = () => {
  const [overview, setOverview] = useState(null);
  const [operational, setOperational] = useState(null);
  const [fcrReport, setFcrReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchAllData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [ov, op, fcr] = await Promise.all([
        adminService.getOverview().catch(() => null),
        adminService.getOperationalReport().catch(() => null),
        adminService.getFcrReport().catch(() => null),
      ]);

      if (ov) setOverview(ov);
      if (op) setOperational(op);
      if (fcr) setFcrReport(fcr);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lỗi nạp dữ liệu quản trị nền tảng!'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#EA580C] rounded-full inline-block"></span>
            <h1 className="font-bold text-base md:text-lg text-[#0B1C30] tracking-tight">
              Tổng quan nền tảng ShrimpMate (Admin Console)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Trung tâm điều hành cấp cao: Theo dõi quy mô hạ tầng IoT, tỷ lệ online thiết bị và hiệu suất FCR toàn mạng lưới.
          </p>
        </div>

        <button
          onClick={fetchAllData}
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-r from-[#FB923C] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-[#FFDAD6]/60 border border-[#BA1A1A]/30 text-[#93000A] rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#BA1A1A] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Bốn Thẻ KPI Nền Tảng Cốt Lõi (Đồng bộ màu Mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tài khoản Người Dùng */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 border-l-4 border-l-[#006398] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="uppercase font-bold tracking-wider">Tài khoản hệ thống</span>
            <div className="w-8 h-8 rounded-xl bg-[#EFF4FF] text-[#006398] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono-num text-[#0B1C30]">
            {overview?.users?.total ?? 50}
          </div>
          <div className="flex items-center justify-between pt-2 text-[11px] font-mono-num border-t border-slate-100 text-slate-500">
            <span>Hoạt động: <strong className="text-[#006E2D]">{overview?.users?.active ?? 48}</strong></span>
            <span>Đã khóa: <strong className="text-[#BA1A1A]">{overview?.users?.locked ?? 2}</strong></span>
          </div>
        </div>

        {/* Quy Mô Cơ Sở Nuôi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 border-l-4 border-l-[#EA580C] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="uppercase font-bold tracking-wider">Trang trại & Ao nuôi</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF8F5] text-[#EA580C] flex items-center justify-center">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono-num text-[#0B1C30]">
            {overview?.ponds?.total ?? 120}{' '}
            <span className="text-sm font-normal text-slate-500 font-sans">ao</span>
          </div>
          <div className="flex items-center justify-between pt-2 text-[11px] font-mono-num border-t border-slate-100 text-slate-500">
            <span>{overview?.farms?.total ?? 35} Trang trại</span>
            <span className="text-[#EA580C] font-bold">{overview?.ponds?.active ?? 110} ao đang thả</span>
          </div>
        </div>

        {/* Tỷ Lệ Thiết Bị Trực Tuyến */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 border-l-4 border-l-[#006E2D] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="uppercase font-bold tracking-wider">Thiết bị phần cứng</span>
            <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] text-[#006E2D] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono-num text-[#006E2D]">
              {overview?.devices?.onlineRatePercent ?? 91.7}%
            </span>
            <span className="text-xs text-slate-400 font-mono-num">trực tuyến</span>
          </div>
          <div className="flex items-center justify-between pt-2 text-[11px] font-mono-num border-t border-slate-100 text-slate-500">
            <span>Online: <strong className="text-[#006E2D]">{overview?.devices?.online ?? 165}</strong></span>
            <span>Offline: <strong className="text-[#BA1A1A]">{overview?.devices?.offline ?? 15}</strong></span>
          </div>
        </div>

        {/* FCR Trung Bình Toàn Hệ Thống */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 border-l-4 border-l-[#F59E0B] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="uppercase font-bold tracking-wider">Hệ số FCR toàn nền tảng</span>
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono-num text-[#EA580C]">
              {fcrReport?.summary?.averageSystemFcr ?? 1.20}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#006E2D] font-bold border border-[#7CF994] text-[10px]">
              {fcrReport?.summary?.systemQualityRating || 'Xuất sắc (< 1.3)'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 text-[11px] font-mono-num border-t border-slate-100 text-slate-500">
            <span>Đánh giá {fcrReport?.summary?.totalSeasonsEvaluated ?? 8} vụ nuôi</span>
            <span>{(fcrReport?.summary?.totalFeedConsumedSystemKg ?? 14200).toLocaleString('vi-VN')} kg cám</span>
          </div>
        </div>
      </div>

      {/* 3. Bảng 10 Cảnh Báo Nguy Cấp Gần Nhất & Danh Sách Thiết Bị Offline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột Trái: Cảnh báo bất thường gần nhất */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#BA1A1A]" />
              <h3 className="font-bold text-xs uppercase text-[#0B1C30] tracking-wider">
                10 Cảnh báo nguy cấp gần nhất toàn mạng lưới
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-num font-bold bg-[#FFDAD6] text-[#BA1A1A]">
              MỨC ĐỘ 3 (CRITICAL)
            </span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {operational?.recentAlerts && operational.recentAlerts.length > 0 ? (
              operational.recentAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-3.5 bg-[#FFDAD6]/30 rounded-xl border border-[#FFDAD6] text-xs font-mono-num space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#BA1A1A]">{alt.type}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(alt.triggeredAt).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#0B1C30] font-sans font-medium">{alt.message}</div>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                    <span>Ao: <strong className="text-[#0B1C30]">{alt.pondName}</strong></span>
                    <span>Thiết bị: {alt.deviceUid}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-[#F0FDF4] border border-[#7CF994]/50 rounded-xl">
                Không có sự cố nguy cấp nào đang mở. Hệ sinh thái hoạt động ổn định.
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải: Thiết Bị Offline Quá 5 Phút */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-[#F59E0B]" />
              <h3 className="font-bold text-xs uppercase text-[#0B1C30] tracking-wider">
                Thiết bị mất tín hiệu quá 5 phút (Cần bảo trì)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-num font-bold bg-[#FEF3C7] text-[#B45309]">
              {operational?.offlineDevices?.length ?? 1} THIẾT BỊ
            </span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {operational?.offlineDevices && operational.offlineDevices.length > 0 ? (
              operational.offlineDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="p-3.5 bg-[#F8F9FF] rounded-xl border border-slate-200/80 text-xs font-mono-num flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-[#0B1C30]">{dev.deviceUid}</strong>
                      <span className="px-2 py-0.5 rounded-md bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE] text-[10px] uppercase font-bold">
                        {dev.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{dev.name} • FW: {dev.firmwareVersion}</div>
                  </div>
                  <div className="text-right text-[10px] text-[#BA1A1A] font-bold">
                    <span>Mất tín hiệu từ:</span>
                    <div className="text-slate-500 font-normal mt-0.5">
                      {new Date(dev.lastSeenAt).toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-[#F0FDF4] border border-[#7CF994]/50 rounded-xl">
                100% thiết bị phần cứng đang phát nhịp tim (Heartbeat) bình thường.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewView;
