import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export const EStopModal = ({ isOpen, onReset }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full border-2 border-red-600 shadow-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 text-red-600">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-7 h-7 animate-bounce" />
          </div>
          <div>
            <div className="text-[10px] font-mono-num font-bold tracking-wider uppercase text-red-600">
              CẢNH BÁO AN TOÀN PHẦN CỨNG BẬC CAO
            </div>
            <h3 className="font-display font-black text-xl text-neutral-900 uppercase">
              E-STOP KHẨN CẤP ĐÃ KÍCH HOẠT
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-mono-num space-y-2 text-neutral-800">
          <div className="flex items-center justify-between font-bold text-red-700">
            <span>TRẠNG THÁI SCADA:</span>
            <span>CÁCH LY TOÀN BỘ RƠ-LE</span>
          </div>
          <p className="text-neutral-600 font-sans leading-relaxed">
            Hệ thống đã gửi tín hiệu ngắt cấp 1 (Master Hardware Trip) đến 4 tủ điều khiển biến tần bờ ao. Toàn bộ mâm
            quay, phễu rung và motor cấp liệu đã ngừng hoạt động ngay lập tức.
          </p>
          <div className="pt-2 border-t border-red-200/80 grid grid-cols-2 gap-2 text-[11px]">
            <div>• Rơ-le mâm rải: <strong>NGẮT (OPEN)</strong></div>
            <div>• Motor phễu rung: <strong>NGẮT (OPEN)</strong></div>
            <div>• Biến tần VFD: <strong>DISARMED (0Hz)</strong></div>
            <div>• Còi cảnh báo bờ: <strong>ON (105dB)</strong></div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-neutral-500">
            Kỹ sư vận hành cần kiểm tra hiện trường ao nuôi trước khi khôi phục hệ thống SCADA.
          </div>
          <button
            onClick={onReset}
            className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white font-mono-num text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>XÁC NHẬN AN TOÀN & KHÔI PHỤC HỆ THỐNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
