import React, { useState } from 'react';
import { AlertOctagon, RefreshCw, RotateCw, AlertCircle } from 'lucide-react';
import { deviceService } from '../services/deviceService';
import { getErrorMessage } from '../services/apiClient';

export const EStopModal = ({ isOpen, onReset, activeDeviceId = null }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetMode, setResetMode] = useState('automatic');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleConfirmReset = async () => {
    setIsResetting(true);
    setErrorMessage('');
    try {
      if (activeDeviceId) {
        await deviceService.updateDevice(activeDeviceId, { mode: resetMode });
      }
      onReset?.();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Không thể gửi lệnh khôi phục thiết bị lên máy chủ.'));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 !mt-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full border-2 border-red-600 ring-1 ring-red-600/20 shadow-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 text-red-600">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-7 h-7 animate-bounce" />
          </div>
          <div>
            <div className="text-[10px] font-mono-num font-bold tracking-wider uppercase text-red-600">
              CẢNH BÁO AN TOÀN PHẦN CỨNG BẬC CAO (UC012)
            </div>
            <h3 className="font-display font-black text-xl text-neutral-900 uppercase">
              E-STOP KHẨN CẤP ĐÃ KÍCH HOẠT
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-mono-num space-y-2 text-neutral-800">
          <div className="flex items-center justify-between font-bold text-red-700">
            <span>TRẠNG THÁI SCADA &amp; MQTT:</span>
            <span>CÁCH LY TOÀN BỘ RƠ-LE</span>
          </div>
          <p className="text-neutral-600 font-sans leading-relaxed">
            Hệ thống đã phát lệnh ngắt khẩn cấp (Emergency Stop) qua MQTT đến tủ điều khiển máy cho ăn bờ ao. Toàn bộ
            mâm rải, phễu rung và motor cấp liệu đã ngừng xả cám ngay lập tức để bảo vệ đàn tôm.
          </p>
          <div className="pt-2 border-t border-red-200/80 grid grid-cols-2 gap-2 text-[11px]">
            <div>• Rơ-le mâm rải: <strong>NGẮT (TRIP)</strong></div>
            <div>• Motor phễu rung: <strong>NGẮT (OPEN)</strong></div>
            <div>• Chế độ thiết bị: <strong>EMERGENCY_STOP</strong></div>
            <div>• Lệnh MQTT: <strong>SENT (EMERGENCY_STOP)</strong></div>
          </div>
        </div>

        <div className="space-y-3">
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div>{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    onReset?.();
                  }}
                  className="mt-1 underline font-semibold cursor-pointer"
                >
                  Vẫn đóng cảnh báo trên màn hình
                </button>
              </div>
            </div>
          )}

          {activeDeviceId && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Chế độ sau khi khôi phục máy cho ăn:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setResetMode('automatic')}
                  className={`py-2 px-3 rounded-lg border font-bold cursor-pointer transition ${
                    resetMode === 'automatic'
                      ? 'bg-[#006E2D] text-white border-[#006E2D]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Tự động (Automatic)
                </button>
                <button
                  type="button"
                  onClick={() => setResetMode('manual')}
                  className={`py-2 px-3 rounded-lg border font-bold cursor-pointer transition ${
                    resetMode === 'manual'
                      ? 'bg-[#EA580C] text-white border-[#EA580C]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Thủ công (Manual)
                </button>
              </div>
            </div>
          )}

          <div className="text-xs text-neutral-500">
            Kỹ sư vận hành cần kiểm tra hiện trường ao nuôi trước khi khôi phục hệ thống SCADA.
          </div>
          <button
            onClick={handleConfirmReset}
            disabled={isResetting}
            className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white font-mono-num text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isResetting ? <RotateCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>XÁC NHẬN AN TOÀN &amp; KHÔI PHỤC HỆ THỐNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EStopModal;
