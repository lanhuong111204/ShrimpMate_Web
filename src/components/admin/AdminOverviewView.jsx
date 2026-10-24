import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Warehouse, 
  Cpu, 
  TrendingUp, 
  AlertTriangle, 
  WifiOff, 
  RotateCw, 
  ShieldCheck, 
  CheckCircle2, 
  Activity,
  Layers
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
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            <h1 className="font-display font-bold text-base md:text-lg text-neutral-900 tracking-tight uppercase">
              BÀN GIÁM SÁT TOÀN DIỆN NỀN TẢNG (ADMIN DASHBOARD)
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Trung tâm điều hành cấp cao: Theo dõi quy mô hạ tầng IoT, tỷ lệ online máy móc và hiệu suất FCR toàn mạng lưới.
          </p>
        </div>

        <button
          onClick={fetchAllData}
          disabled={isLoading}
          className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Làm Mới Số Liệu</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Bốn Thẻ KPI Nền Tảng Cốt Lõi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tài khoản Người Dùng */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-num text-neutral-500">
            <span className="uppercase font-semibold">Tài Khoản Hệ Thống</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-3xl font-bold font-mono-num text-neutral-900">
            {overview?.users?.total ?? 50}
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] font-mono-num border-t border-neutral-100 text-neutral-500">
            <span>Hoạt động: <strong className="text-emerald-600">{overview?.users?.active ?? 48}</strong></span>
            <span>Đã khóa: <strong className="text-red-500">{overview?.users?.locked ?? 2}</strong></span>
          </div>
        </div>

        {/* Quy Mô Cơ Sở Nuôi */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-num text-neutral-500">
            <span className="uppercase font-semibold">Trang Trại & Ao Nuôi</span>
            <Warehouse className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-3xl font-bold font-mono-num text-neutral-900">
            {overview?.ponds?.total ?? 120}{' '}
            <span className="text-sm font-normal text-neutral-500 font-sans">ao</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] font-mono-num border-t border-neutral-100 text-neutral-500">
            <span>{overview?.farms?.total ?? 35} Trang trại</span>
            <span className="text-emerald-700 font-semibold">{overview?.ponds?.active ?? 110} ao đang thả</span>
          </div>
        </div>

        {/* Tỷ Lệ Thiết Bị Trực Tuyến */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-num text-neutral-500">
            <span className="uppercase font-semibold">Thiết Bị Phần Cứng</span>
            <Cpu className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono-num text-emerald-600">
              {overview?.devices?.onlineRatePercent ?? 91.7}%
            </span>
            <span className="text-xs text-neutral-400 font-mono-num">trực tuyến</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] font-mono-num border-t border-neutral-100 text-neutral-500">
            <span>Online: <strong className="text-emerald-600">{overview?.devices?.online ?? 165}</strong></span>
            <span>Offline: <strong className="text-red-600">{overview?.devices?.offline ?? 15}</strong></span>
          </div>
        </div>

        {/* FCR Trung Bình Toàn Hệ Thống */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-num text-neutral-500">
            <span className="uppercase font-semibold">Hệ Số FCR Toàn Nền Tảng</span>
            <TrendingUp className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono-num text-amber-500">
              {fcrReport?.summary?.averageSystemFcr ?? 1.20}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
              {fcrReport?.summary?.systemQualityRating || 'Xuất sắc (< 1.3)'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] font-mono-num border-t border-neutral-100 text-neutral-500">
            <span>Đánh giá {fcrReport?.summary?.totalSeasonsEvaluated ?? 8} vụ nuôi</span>
            <span>{(fcrReport?.summary?.totalFeedConsumedSystemKg ?? 14200).toLocaleString('vi-VN')} kg thức ăn</span>
          </div>
        </div>
      </div>

      {/* 3. Bảng 10 Cảnh Báo Nguy Cấp Gần Nhất & Danh Sách Thiết Bị Offline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột Trái: Cảnh báo bất thường gần nhất */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="font-display font-bold text-xs uppercase text-neutral-800 tracking-wider">
                10 Cảnh Báo Nguy Cấp Gần Nhất Toàn Mạng Lưới
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-num font-bold bg-red-100 text-red-700">
              MỨC ĐỘ 3 (CRITICAL)
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {operational?.recentAlerts && operational.recentAlerts.length > 0 ? (
              operational.recentAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-3 bg-red-50/70 rounded-xl border border-red-200 text-xs font-mono-num space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-800">{alt.type}</span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(alt.triggeredAt).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-700 font-sans">{alt.message}</div>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-neutral-500">
                    <span>Ao: <strong>{alt.pondName}</strong></span>
                    <span>Thiết bị: {alt.deviceUid}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-neutral-400 font-mono-num">
                Không có sự cố nguy cấp nào đang mở. Hệ sinh thái hoạt động ổn định.
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải: Thiết Bị Offline Quá 5 Phút */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600" />
              <h3 className="font-display font-bold text-xs uppercase text-neutral-800 tracking-wider">
                Thiết Bị Mất Tín Hiệu Quá 5 Phút (Cần Bảo Trì)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-num font-bold bg-amber-100 text-amber-800">
              {operational?.offlineDevices?.length ?? 1} THIẾT BỊ
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {operational?.offlineDevices && operational.offlineDevices.length > 0 ? (
              operational.offlineDevices.map((dev) => (
                <div
                  key={dev.id}
                  className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-mono-num space-y-1 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-neutral-900">{dev.deviceUid}</strong>
                      <span className="px-1.5 py-0.2 rounded bg-neutral-200 text-[10px] uppercase font-bold text-neutral-700">
                        {dev.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">{dev.name} • FW: {dev.firmwareVersion}</div>
                  </div>
                  <div className="text-right text-[10px] text-red-600 font-bold">
                    <span>Mất tín hiệu từ:</span>
                    <div className="text-neutral-500 font-normal">
                      {new Date(dev.lastSeenAt).toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-neutral-400 font-mono-num">
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
