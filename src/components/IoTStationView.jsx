import React from 'react';
import { Radio, Wifi, BatteryCharging, Clock, ShieldCheck } from 'lucide-react';

export const IoTStationView = () => {
  const stations = [
    { id: 'ST-01', name: 'Trạm bờ Ao số 1', rssi: '-68 dBm', quality: 'Rất tốt', battery: '100% (27.4V)', latency: '18 ms' },
    { id: 'ST-02', name: 'Trạm bờ Ao số 2', rssi: '-72 dBm', quality: 'Tốt', battery: '98% (27.1V)', latency: '22 ms' },
    { id: 'ST-03', name: 'Trạm bờ Ao số 3', rssi: '-75 dBm', quality: 'Ổn định', battery: '96% (26.9V)', latency: '25 ms' },
    { id: 'ST-04', name: 'Trạm bờ Ao số 4', rssi: '-70 dBm', quality: 'Rất tốt', battery: '100% (27.5V)', latency: '19 ms' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Trạm thiết bị & Kết nối IoT
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Giám sát tín hiệu kết nối không dây, nguồn điện dự phòng và trạng thái đồng bộ của các tủ điều khiển tại bờ ao.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            4 / 4 trạm đang trực tuyến
          </span>
        </div>
      </div>

      {/* Station Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stations.map((st) => (
          <div key={st.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="font-semibold text-sm text-slate-900">{st.name}</div>
                <div className="text-xs font-mono-num text-slate-400 mt-0.5">Mã trạm: {st.id}</div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Online
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-slate-400" />
                  Tín hiệu thu phát:
                </span>
                <strong className="text-slate-900 font-mono-num">
                  {st.rssi} ({st.quality})
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <BatteryCharging className="w-3.5 h-3.5 text-slate-400" />
                  Nguồn dự phòng:
                </span>
                <strong className="text-slate-900 font-mono-num">{st.battery}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Độ trễ phản hồi:
                </span>
                <strong className="text-slate-900 font-mono-num">{st.latency}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <h3 className="font-semibold text-sm text-slate-900">
            Cơ chế vận hành độc lập khi mất kết nối mạng
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Mỗi tủ điều khiển tại bờ ao được tích hợp bộ nhớ lưu trữ lịch ăn và đồng hồ thời gian thực độc lập. Khi kết nối Internet bị gián đoạn, thiết bị vẫn tự động thực hiện đúng lịch rải cám và duy trì các quy tắc khóa an toàn theo nồng độ oxy hòa tan (DO) tại hiện trường.
        </p>
      </div>
    </div>
  );
};
