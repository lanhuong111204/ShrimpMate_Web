import React from 'react';
import { Wifi, BatteryCharging, Clock, ShieldCheck } from 'lucide-react';

export const IoTStationView = () => {
  const stations = [
    { id: 'ST-01', name: 'Trạm bờ Ao Bạt A1', rssi: '-68 dBm', quality: 'Rất tốt', battery: '100% (27.4V)', latency: '14 ms', color: '#EA580C' },
    { id: 'ST-02', name: 'Trạm bờ Ao Bạt A2', rssi: '-72 dBm', quality: 'Tốt', battery: '98% (27.1V)', latency: '18 ms', color: '#006398' },
    { id: 'ST-03', name: 'Trạm bờ Ao Bạt B1', rssi: '-75 dBm', quality: 'Ổn định', battery: '96% (26.9V)', latency: '21 ms', color: '#006E2D' },
    { id: 'ST-04', name: 'Trạm bờ Ao Ương V1', rssi: '-70 dBm', quality: 'Rất tốt', battery: '100% (27.5V)', latency: '15 ms', color: '#40A2E7' },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30] tracking-tight font-display">
            Trạm thiết bị & Kết nối IoT
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Giám sát tín hiệu kết nối không dây, nguồn điện dự phòng và trạng thái đồng bộ của các tủ điều khiển tại bờ ao.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994] rounded-full text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#006E2D]" />
            4 / 4 trạm đang trực tuyến
          </span>
        </div>
      </div>

      {/* Station Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stations.map((st) => (
          <div
            key={st.id}
            className="bg-white rounded-2xl border border-slate-200 border-t-4 p-5 space-y-4 shadow-2xs"
            style={{ borderTopColor: st.color }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="font-bold text-sm text-[#0B1C30]">{st.name}</div>
                <div className="text-xs font-mono-num text-slate-400 mt-0.5">Mã trạm: {st.id}</div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]">
                Online
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-[#006398]" />
                  Tín hiệu thu phát:
                </span>
                <strong className="text-[#0B1C30] font-mono-num">
                  {st.rssi} ({st.quality})
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-[#006E2D]" />
                  Nguồn dự phòng:
                </span>
                <strong className="text-[#006E2D] font-mono-num">{st.battery}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                  Độ trễ MQTT:
                </span>
                <strong className="text-[#EA580C] font-mono-num">{st.latency}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="bg-[#EFF4FF] rounded-2xl border border-[#D3E4FE] p-5 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#006398]" />
          <h3 className="font-bold text-sm text-[#0B1C30]">
            Cơ chế vận hành độc lập khi mất kết nối mạng
          </h3>
        </div>
        <p className="text-xs text-[#0B1C30]/80 leading-relaxed">
          Mỗi tủ điều khiển tại bờ ao được tích hợp bộ nhớ lưu trữ lịch ăn 4 cữ và đồng hồ thời gian thực độc lập. Khi kết nối Internet bị gián đoạn, thiết bị vẫn tự động thực hiện đúng lịch rải cám và duy trì các quy tắc Safety Rule Engine theo nồng độ oxy hòa tan (DO) tại hiện trường.
        </p>
      </div>
    </div>
  );
};
