import React, { useState, useEffect } from 'react';
import { X, Cpu, RotateCw, AlertCircle, Plus, Unlink, CheckCircle2, Radio } from 'lucide-react';
import { deviceService } from '../../services/deviceService';
import { pondService } from '../../services/pondService';
import { getErrorMessage } from '../../services/apiClient';

export const ClaimDeviceModal = ({ isOpen, onClose, farmId, pond, onSuccess }) => {
  const [deviceUid, setDeviceUid] = useState('');
  const [assignedDevices, setAssignedDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Tải danh sách thiết bị hiện có trong ao
  const fetchPondDevices = async () => {
    if (!farmId || !pond?.id) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      // 1. Thử lấy từ chi tiết ao
      const pondDetail = await pondService.getPondById(farmId, pond.id);
      if (pondDetail?.devices) {
        setAssignedDevices(pondDetail.devices);
      } else {
        // 2. Lấy tất cả thiết bị của Manager và lọc theo pondId
        const allDevices = await deviceService.getDevices();
        const devicesList = Array.isArray(allDevices) ? allDevices : (allDevices?.data || []);
        setAssignedDevices(devicesList.filter((d) => d.pondId === pond.id));
      }
    } catch (err) {
      console.warn('Lỗi tải thiết bị của ao:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && pond) {
      fetchPondDevices();
      setDeviceUid('');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, pond]);

  if (!isOpen || !pond) return null;

  // Xử lý Claim thiết bị vào ao
  const handleClaimDevice = async (e) => {
    e.preventDefault();
    if (!deviceUid.trim()) {
      setErrorMessage('Vui lòng nhập mã định danh deviceUid trên tem thiết bị!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await deviceService.claimDevice({
        deviceUid: deviceUid.trim(),
        pondId: pond.id,
      });
      setSuccessMessage(`Đã gán thành công thiết bị [${deviceUid.trim()}] vào ao ${pond.code}!`);
      setDeviceUid('');
      await fetchPondDevices();
      onSuccess?.();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Không thể gán thiết bị. Vui lòng kiểm tra lại mã deviceUid!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý Gỡ thiết bị (Unassign)
  const handleUnassign = async (deviceId, uid) => {
    if (!window.confirm(`Bạn có chắc chắn muốn gỡ thiết bị [${uid}] khỏi ao này để trả về kho bảo dưỡng?`)) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await deviceService.unassignDevice(deviceId);
      setSuccessMessage(`Đã gỡ thiết bị [${uid}] về kho catalog thành công.`);
      await fetchPondDevices();
      onSuccess?.();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Không thể gỡ thiết bị khỏi ao!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                Gán & Quản Lý Thiết Bị IoT (UC009)
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono-num">
                Ao: <strong className="text-white">{pond.code}</strong> • {pond.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Claim Device */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Ô nhập claim */}
          <form onSubmit={handleClaimDevice} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800 uppercase font-mono-num flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                Claim Thiết Bị Mới Vào Ao
              </span>
              <span className="text-[10px] text-neutral-500 font-mono-num">Theo mã tem phần cứng</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={deviceUid}
                onChange={(e) => setDeviceUid(e.target.value)}
                placeholder="Nhập mã deviceUid (ví dụ: DEV-FEEDER-VN-002, CAM-01-A1)"
                className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono-num uppercase"
              />
              <button
                type="submit"
                disabled={isSubmitting || !deviceUid.trim()}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                {isSubmitting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : 'Gán vào ao'}
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 italic">
              * Thiết bị phải tồn tại trong Catalog hệ thống và chưa bị ao khác gán.
            </p>
          </form>

          {/* Danh sách thiết bị hiện có trong ao */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-800 uppercase font-mono-num flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-neutral-600" />
                Thiết Bị Đang Kết Nối Trong Ao ({assignedDevices.length})
              </h4>
              <button
                type="button"
                onClick={fetchPondDevices}
                className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 font-mono-num"
              >
                <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-neutral-500 font-mono-num flex items-center justify-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Đang quét thiết bị ao...</span>
              </div>
            ) : assignedDevices.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-neutral-200 rounded-xl text-center text-xs text-neutral-500">
                Chưa có thiết bị nào được gán vào ao này. Hãy nhập mã <span className="font-mono-num font-semibold text-neutral-700">deviceUid</span> ở trên để kích hoạt.
              </div>
            ) : (
              <div className="space-y-2">
                {assignedDevices.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-3 bg-white border border-neutral-200 rounded-xl flex items-center justify-between hover:border-neutral-300 transition shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-bold text-xs text-neutral-900">
                          {dev.deviceUid || dev.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-num uppercase bg-neutral-100 text-neutral-700 border border-neutral-200 font-semibold">
                          {dev.type || 'Thiết bị'}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dev.status === 'online' ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-neutral-300'
                          }`}
                          title={dev.status === 'online' ? 'Online' : 'Offline'}
                        />
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono-num">
                        {dev.name} • FW: {dev.firmwareVersion || '1.0.0'}
                        {dev.mode && ` • Chế độ: ${dev.mode}`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnassign(dev.id, dev.deviceUid)}
                      disabled={isSubmitting}
                      title="Gỡ thiết bị trả về kho bảo dưỡng"
                      className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Gỡ</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-200/80 rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClaimDeviceModal;
