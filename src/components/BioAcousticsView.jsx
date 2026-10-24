import React, { useState, useEffect } from 'react';
import { Activity, Radio } from 'lucide-react';

export const BioAcousticsView = () => {
  const [selectedSensor, setSelectedSensor] = useState('HYDRO-02');
  const [freqBands, setFreqBands] = useState([
    { band: '15 - 20 kHz', label: 'Búng mồi xa', val: 68 },
    { band: '20 - 30 kHz', label: 'Búng nhá chính', val: 94 },
    { band: '30 - 40 kHz', label: 'Tiêu thụ bạt đáy', val: 78 },
    { band: '40 - 50 kHz', label: 'Xung cao tần', val: 52 },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setFreqBands((prev) =>
        prev.map((b) => ({
          ...b,
          val: Math.min(100, Math.max(25, Math.round(b.val + (Math.random() - 0.49) * 8))),
        }))
      );
    }, 600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Phân tích âm thanh bắt mồi (Hydrophone)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Phân tích phổ tần số âm thanh bắt mồi dưới nước (15kHz – 45kHz) để đánh giá mức độ thèm ăn thực tế của đàn tôm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSensor}
            onChange={(e) => setSelectedSensor(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 cursor-pointer"
          >
            <option value="HYDRO-01">Cảm biến Hydrophone Ao 1</option>
            <option value="HYDRO-02">Cảm biến Hydrophone Ao 2 (Đang chọn)</option>
            <option value="HYDRO-03">Cảm biến Hydrophone Ao 3</option>
            <option value="HYDRO-04">Cảm biến Hydrophone Ao 4</option>
          </select>
        </div>
      </div>

      {/* Acoustic Frequency Bands */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {freqBands.map((band, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 space-y-2.5">
            <div className="flex justify-between text-xs font-mono-num text-slate-500">
              <span className="font-semibold text-slate-900">{band.band}</span>
              <span>{band.val}%</span>
            </div>
            <div className="text-xs text-slate-500">{band.label}</div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${band.val}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Acoustic Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-sm text-slate-900">
              Tỷ lệ tiêu thụ cám & Khuyến nghị điều chỉnh
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cảm biến Hydrophone ghi nhận nhịp ăn đạt đỉnh sau 12 phút mở máy rải. Không phát hiện nhiễu từ động cơ quạt nước trong dải tần bắt mồi.
          </p>
          <div className="p-3.5 bg-teal-50/50 border border-teal-200/80 rounded-xl text-xs space-y-1 text-slate-800">
            <div className="font-semibold text-teal-900">Đề xuất vận hành:</div>
            <div>• Tăng 5% – 10% lượng cám cữ trưa và cữ chiều.</div>
            <div>• Giảm thời gian nghỉ giữa các nhịp phun từ 25s xuống 20s.</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Radio className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-sm text-slate-900">
              Thông số đầu dò thu âm dưới nước
            </h3>
          </div>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Độ sâu lắp đặt đầu dò:</span>
              <strong className="text-slate-900 font-mono-num">0.8m cách mặt nước</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Độ nhạy cảm biến:</span>
              <strong className="text-slate-900 font-mono-num">-195 dB re 1V/µPa</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Tần số lấy mẫu:</span>
              <strong className="text-slate-900 font-mono-num">192 kHz / 24-bit</strong>
            </div>
            <div className="flex justify-between py-1">
              <span>Tình trạng đầu dò:</span>
              <strong className="text-emerald-700 font-medium">Hoạt động ổn định</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
