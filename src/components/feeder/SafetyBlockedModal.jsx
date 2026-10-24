import React from 'react';
import { ShieldAlert, X, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const SafetyBlockedModal = ({ isOpen, onClose, safetyResult }) => {
  if (!isOpen || !safetyResult) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full border-2 border-red-600 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <div>
              <h3 className="font-display font-black text-sm uppercase tracking-wider">
                SAFETY RULE ENGINE: TỪ CHỐI LỆNH CHO ĂN
              </h3>
              <p className="text-[11px] text-red-100 font-mono-num">
                Quy Chuẩn An Toàn Môi Trường Ao Nuôi Tôm (UC018)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-red-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung vi phạm */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-2">
            <div className="flex items-center justify-between font-mono-num text-xs font-bold text-red-800">
              <span>QUYẾT ĐỊNH CỦA HỆ THỐNG:</span>
              <span className="px-2 py-0.5 rounded bg-red-600 text-white uppercase text-[10px]">
                BLOCKED (CẤM RẢI CÁM)
              </span>
            </div>

            <div className="text-xs text-red-900 leading-relaxed font-sans pt-1">
              {safetyResult.reasons && safetyResult.reasons.length > 0 ? (
                safetyResult.reasons.map((reason, idx) => (
                  <p key={idx} className="font-semibold">• {reason}</p>
                ))
              ) : (
                <p className="font-semibold">• Nồng độ oxy hòa tan (DO) hoặc chỉ số môi trường vượt ngưỡng nguy hại cho đàn tôm.</p>
              )}
            </div>
          </div>

          {/* Chi tiết số đo môi trường tức thời */}
          {safetyResult.telemetrySnapshot && (
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-mono-num space-y-1 text-neutral-600">
              <span className="font-bold text-neutral-800 uppercase text-[10px] block">
                Số Đo Cảm Biến Lúc Đánh Giá:
              </span>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 bg-white rounded-lg border border-neutral-200">
                  <div className="text-[10px] text-neutral-400">DO</div>
                  <strong className="text-red-600 text-sm">
                    {safetyResult.telemetrySnapshot.dissolvedOxygenMgL ?? '--'} mg/L
                  </strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-neutral-200">
                  <div className="text-[10px] text-neutral-400">pH</div>
                  <strong className="text-neutral-800 text-sm">
                    {safetyResult.telemetrySnapshot.ph ?? '--'}
                  </strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-neutral-200">
                  <div className="text-[10px] text-neutral-400">Nhiệt độ</div>
                  <strong className="text-neutral-800 text-sm">
                    {safetyResult.telemetrySnapshot.temperatureC ?? '--'} °C
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
            <strong>BIỆN PHÁP KHẮC PHỤC:</strong> Để bảo vệ đàn tôm khỏi nguy cơ ngạt và sốc môi trường, hệ thống đã chặn phát lệnh MQTT tới mâm phun. Hãy bật quạt nước tăng oxy hoặc thay nước ao trước khi cho ăn lại.
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              Tôi Đã Hiểu & Đi Kiểm Tra Ao
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyBlockedModal;
