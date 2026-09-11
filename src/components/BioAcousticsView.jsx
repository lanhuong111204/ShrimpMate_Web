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
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-neutral-900 rounded-full inline-block"></span>
            <h1 className="font-display font-bold text-base md:text-lg text-neutral-900 tracking-tight uppercase">
              AI BIO-ACOUSTIC – PHÂN TÍCH ÂM THANH BẮT MỒI HYDROPHONE
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Thuật toán FFT tách lọc tiếng búng vỏ tôm trong dải 15kHz-45kHz để xác định chính xác độ thèm ăn thực tế.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSensor}
            onChange={(e) => setSelectedSensor(e.target.value)}
            className="h-8 px-3 rounded-lg border border-neutral-300 bg-white text-xs font-mono-num font-semibold text-neutral-800 cursor-pointer"
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
          <div key={idx} className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm space-y-2">
            <div className="flex justify-between text-xs font-mono-num text-neutral-500">
              <span className="font-bold text-neutral-800">{band.band}</span>
              <span>{band.val}% Cường độ</span>
            </div>
            <div className="text-xs font-medium text-neutral-600">{band.label}</div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-neutral-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${band.val}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Acoustic Deep Dive Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Activity className="w-4 h-4 text-neutral-700" />
            <h3 className="font-display font-bold text-sm text-neutral-900 uppercase">
              Tỷ Lệ Tiêu Thụ Cám & Khuyến Nghị Tự Động
            </h3>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Hệ thống hydrophone ghi nhận nhịp ăn đạt đỉnh sau 12 phút mở máy rải. Không phát hiện tiếng ồn lạ từ động cơ
            hoặc bọt khí quạt nước xâm lấn dải tần búng mồi.
          </p>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono-num space-y-1 text-emerald-800">
            <div className="font-bold uppercase">Khuyến nghị điều hành:</div>
            <div>• Tăng 5% - 10% lượng cám cữ trưa và cữ chiều.</div>
            <div>• Giảm thời gian nghỉ giữa các nhịp phun từ 25s xuống 20s.</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Radio className="w-4 h-4 text-neutral-700" />
            <h3 className="font-display font-bold text-sm text-neutral-900 uppercase">
              Thông Số Phần Cứng Thu Âm Dưới Nước
            </h3>
          </div>
          <div className="space-y-2 font-mono-num text-xs text-neutral-600">
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span>Độ sâu lắp đặt đầu dò:</span>
              <strong className="text-neutral-900">0.8m cách mặt nước</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span>Độ nhạy Hydrophone:</span>
              <strong className="text-neutral-900">-195 dB re 1V/µPa</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span>Tốc độ lấy mẫu ADC:</span>
              <strong className="text-neutral-900">192 kHz / 24-bit Hi-Res</strong>
            </div>
            <div className="flex justify-between py-1">
              <span>Tình trạng màng rung piezo:</span>
              <strong className="text-emerald-600">Sạch, không bám rong rêu</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
