import React from 'react';
import {
  Wifi,
  BatteryCharging,
  Clock,
  ShieldCheck,
  Cpu,
  RotateCcw,
  Building2,
} from 'lucide-react';

export const IoTStationView = ({
  devices = [],
  ponds = [],
  onRefreshData,
  onNavigateTab,
}) => {
  const pondMap = new Map(ponds.map((p) => [p.id, p]));
  const onlineCount = devices.filter((d) => d.status === 'online').length;

  const getDeviceTypeLabel = (type) => {
    switch (type) {
      case 'feeder':
        return 'Máy cho ăn tự động';
      case 'sensor_node':
      case 'sensor_station':
        return 'Trạm cảm biến môi trường';
      case 'camera':
      case 'camera_fis':
        return 'Camera AI giám sát nhá';
      case 'edge_gateway':
        return 'Bộ thu phát trung tâm (Edge Gateway)';
      case 'aerator':
        return 'Tủ điều khiển quạt oxy';
      default:
        return type || 'Thiết bị IoT';
    }
  };

  const getDeviceAccentColor = (type) => {
    switch (type) {
      case 'feeder':
        return '#EA580C';
      case 'sensor_node':
      case 'sensor_station':
        return '#006398';
      case 'camera':
      case 'camera_fis':
        return '#006E2D';
      default:
        return '#40A2E7';
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30] tracking-tight font-display">
            Trạm thiết bị & Kết nối IoT
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Giám sát tín hiệu kết nối không dây, nguồn điện dự phòng và trạng thái đồng bộ thực tế của các thiết bị tại bờ ao.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994] rounded-full text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#006E2D]" />
            {onlineCount} / {devices.length} thiết bị đang trực tuyến
          </span>
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State khi chưa có thiết bị IoT */}
      {devices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF4FF] text-[#006398] flex items-center justify-center mx-auto">
            <Cpu className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#0B1C30]">
            Chưa có thiết bị IoT nào được gán cho trang trại của bạn
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Khi quản trị viên đăng ký và gán máy cho ăn tự động, trạm cảm biến hoặc camera AI vào ao nuôi của bạn, thông số kết nối thực tế sẽ hiển thị tại đây.
          </p>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('ponds')}
              className="mt-2 h-9 px-4 rounded-xl bg-[#006398] hover:bg-[#004e78] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Đi đến Quản lý trang trại & ao nuôi</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((dev) => {
            const assignedPond = dev.pondId ? pondMap.get(dev.pondId) : null;
            const meta = dev.metadata || {};
            const isOnline = dev.status === 'online';
            const rssiText = meta.rssiDbm != null ? `${meta.rssiDbm} dBm` : 'Chưa ghi nhận';
            const batteryText =
              meta.batteryLevel != null ? `${meta.batteryLevel}%` : 'Nguồn điện lưới 220V';
            const latencyText = meta.latencyMs != null ? `${meta.latencyMs} ms` : '—';

            return (
              <div
                key={dev.id}
                className="bg-white rounded-2xl border border-slate-200 border-t-4 p-5 space-y-4 shadow-2xs"
                style={{ borderTopColor: getDeviceAccentColor(dev.type) }}
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <div className="font-bold text-sm text-[#0B1C30]">{dev.name}</div>
                    <div className="text-xs font-mono-num text-slate-500 mt-0.5">
                      Mã định danh: {dev.deviceUid}
                    </div>
                    <div className="text-[11px] font-semibold text-[#006398] mt-1">
                      {getDeviceTypeLabel(dev.type)} • Firmware {dev.firmwareVersion || 'v1.0.0'}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                      isOnline
                        ? 'bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isOnline ? 'Trực tuyến' : dev.status === 'error' ? 'Báo lỗi' : 'Ngoại tuyến'}
                  </span>
                </div>

                {/* Thông tin Ao & Trang trại được gán */}
                <div className="rounded-xl bg-[#F8F9FF] border border-slate-200/70 px-3 py-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#006398]" />
                    Vị trí lắp đặt:
                  </span>
                  {assignedPond ? (
                    <span className="font-bold text-[#0B1C30]">
                      {assignedPond.farmName} • {assignedPond.code}
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-600">Chưa gán vào ao</span>
                  )}
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-[#006398]" />
                      Tín hiệu thu phát:
                    </span>
                    <strong className="text-[#0B1C30] font-mono-num">{rssiText}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <BatteryCharging className="w-3.5 h-3.5 text-[#006E2D]" />
                      Nguồn điện / Pin dự phòng:
                    </span>
                    <strong className="text-[#006E2D] font-mono-num">{batteryText}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                      Độ trễ phản hồi MQTT:
                    </span>
                    <strong className="text-[#EA580C] font-mono-num">{latencyText}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-[#EFF4FF] rounded-2xl border border-[#D3E4FE] p-5 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#006398]" />
          <h3 className="font-bold text-sm text-[#0B1C30]">
            Cơ chế vận hành độc lập khi mất kết nối mạng
          </h3>
        </div>
        <p className="text-xs text-[#0B1C30]/80 leading-relaxed">
          Mỗi tủ điều khiển tại bờ ao được tích hợp bộ nhớ lưu trữ lịch ăn tự động và đồng hồ thời gian thực độc lập. Khi kết nối Internet bị gián đoạn, thiết bị vẫn tự động thực hiện đúng lịch rải cám và duy trì các quy tắc Safety Rule Engine theo nồng độ oxy hòa tan (DO) tại hiện trường.
        </p>
      </div>
    </div>
  );
};
