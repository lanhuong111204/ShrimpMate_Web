import React from 'react';

export const IoTStationView = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-neutral-900 rounded-full inline-block"></span>
            <h1 className="font-display font-bold text-base md:text-lg text-neutral-900 tracking-tight uppercase">
              HẠ TẦNG KỸ THUẬT & TRẠM IOT GATEWAY BỜ AO
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Quản lý mạng LoRa 915MHz công nghiệp, vi điều khiển STM32F4 và bộ nhớ đệm offline tại hiện trường.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-mono-num font-semibold">
            TẤT CẢ 4 TRẠM HOẠT ĐỘNG
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gateway Station 1 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm space-y-3 font-mono-num text-xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <span className="font-bold text-neutral-900">TRẠM BỜ AO 1 (ST-01)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="space-y-1 text-neutral-600 text-[11px]">
            <div className="flex justify-between">
              <span>Tín hiệu LoRa:</span>
              <strong className="text-neutral-900">-68 dBm (Tuyệt vời)</strong>
            </div>
            <div className="flex justify-between">
              <span>Pin dự phòng:</span>
              <strong className="text-neutral-900">100% (27.4V Solar)</strong>
            </div>
            <div className="flex justify-between">
              <span>Độ trễ phản hồi:</span>
              <strong className="text-neutral-900">18 ms</strong>
            </div>
          </div>
        </div>

        {/* Gateway Station 2 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm space-y-3 font-mono-num text-xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <span className="font-bold text-neutral-900">TRẠM BỜ AO 2 (ST-02)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="space-y-1 text-neutral-600 text-[11px]">
            <div className="flex justify-between">
              <span>Tín hiệu LoRa:</span>
              <strong className="text-neutral-900">-72 dBm (Rất tốt)</strong>
            </div>
            <div className="flex justify-between">
              <span>Pin dự phòng:</span>
              <strong className="text-neutral-900">98% (27.1V Solar)</strong>
            </div>
            <div className="flex justify-between">
              <span>Độ trễ phản hồi:</span>
              <strong className="text-neutral-900">22 ms</strong>
            </div>
          </div>
        </div>

        {/* Gateway Station 3 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm space-y-3 font-mono-num text-xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <span className="font-bold text-neutral-900">TRẠM BỜ AO 3 (ST-03)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="space-y-1 text-neutral-600 text-[11px]">
            <div className="flex justify-between">
              <span>Tín hiệu LoRa:</span>
              <strong className="text-neutral-900">-75 dBm (Ổn định)</strong>
            </div>
            <div className="flex justify-between">
              <span>Pin dự phòng:</span>
              <strong className="text-neutral-900">96% (26.9V Solar)</strong>
            </div>
            <div className="flex justify-between">
              <span>Độ trễ phản hồi:</span>
              <strong className="text-neutral-900">25 ms</strong>
            </div>
          </div>
        </div>

        {/* Gateway Station 4 */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm space-y-3 font-mono-num text-xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <span className="font-bold text-neutral-900">TRẠM BỜ AO 4 (ST-04)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="space-y-1 text-neutral-600 text-[11px]">
            <div className="flex justify-between">
              <span>Tín hiệu LoRa:</span>
              <strong className="text-neutral-900">-70 dBm (Rất tốt)</strong>
            </div>
            <div className="flex justify-between">
              <span>Pin dự phòng:</span>
              <strong className="text-neutral-900">100% (27.5V Solar)</strong>
            </div>
            <div className="flex justify-between">
              <span>Độ trễ phản hồi:</span>
              <strong className="text-neutral-900">19 ms</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-sm text-neutral-900 uppercase">
          Kiến Trúc Độc Lập Mất Mạng (Local Autonomy Architecture)
        </h3>
        <p className="text-xs text-neutral-600 leading-relaxed font-sans">
          Mỗi tủ máy tại bờ ao được trang bị vi điều khiển công nghiệp tích hợp bộ nhớ không biến dạng (EEPROM) cùng đồng
          hồ thời gian thực độ chính xác cao RTC DS3231 (sai số &lt; 2 phút/năm). Ngay cả khi toàn bộ kết nối
          Internet/4G bị gián đoạn, lịch rải và cơ chế rơ-le khóa an toàn oxy hòa tan vẫn tự động vận hành chính xác 100%
          tại hiện trường.
        </p>
      </div>
    </div>
  );
};
