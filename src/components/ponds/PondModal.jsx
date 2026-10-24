import React, { useState, useEffect } from 'react';
import { X, Waves, RotateCw, AlertCircle } from 'lucide-react';
import { pondService } from '../../services/pondService';
import { getErrorMessage } from '../../services/apiClient';

export const PondModal = ({ isOpen, onClose, farmId, pond = null, onSuccess }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [areaM2, setAreaM2] = useState('');
  const [status, setStatus] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (pond) {
      setCode(pond.code || '');
      setName(pond.name || '');
      setAreaM2(pond.areaM2 || pond.area || '');
      setStatus(pond.status || 'active');
    } else {
      setCode('');
      setName('');
      setAreaM2('2500');
      setStatus('active');
    }
    setErrorMessage('');
  }, [pond, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !areaM2) {
      setErrorMessage('Vui lòng điền đầy đủ Mã ao, Tên ao và Diện tích mặt nước!');
      return;
    }

    if (Number(areaM2) <= 0) {
      setErrorMessage('Diện tích ao phải là một số dương hợp lệ!');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (pond) {
        await pondService.updatePond(farmId, pond.id, {
          name,
          areaM2: Number(areaM2),
          status,
        });
      } else {
        await pondService.createPond(farmId, {
          code,
          name,
          areaM2: Number(areaM2),
          status,
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lưu thông tin ao nuôi thất bại!'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Waves className="w-5 h-5 text-emerald-400" />
            <h3 className="font-display font-bold text-sm uppercase tracking-wider">
              {pond ? `Cập Nhật Ao: ${pond.code}` : 'Khai Báo Ao Nuôi Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase font-mono-num">
                Mã Định Danh Ao <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="AO-01"
                disabled={!!pond} // Mã ao không nên đổi khi sửa
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono-num uppercase disabled:bg-neutral-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase font-mono-num">
                Diện Tích (m²) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={areaM2}
                onChange={(e) => setAreaM2(e.target.value)}
                placeholder="3000"
                min="100"
                step="50"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono-num"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase font-mono-num">
              Tên Gọi Ao Nuôi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ví dụ: Ao nuôi số 1 - Khu A"
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase font-mono-num">
              Trạng Thái Ao
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
            >
              <option value="active">Đang thả nuôi (Active)</option>
              <option value="maintenance">Đang cải tạo / Nghỉ vụ (Maintenance)</option>
              <option value="inactive">Tạm ngưng sử dụng (Inactive)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              {isLoading && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{pond ? 'Lưu thay đổi' : 'Thêm ao nuôi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PondModal;
