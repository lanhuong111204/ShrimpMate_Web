import React, { useState, useEffect } from 'react';
import { X, Warehouse, RotateCw, AlertCircle } from 'lucide-react';
import { farmService } from '../../services/farmService';
import { getErrorMessage } from '../../services/apiClient';

export const FarmModal = ({ isOpen, onClose, farm = null, onSuccess }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (farm) {
      setName(farm.name || '');
      setAddress(farm.address || '');
      setStatus(farm.status || 'active');
    } else {
      setName('');
      setAddress('');
      setStatus('active');
    }
    setErrorMessage('');
  }, [farm, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên trang trại!');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (farm) {
        await farmService.updateFarm(farm.id, { name, address, status });
      } else {
        await farmService.createFarm({ name, address, status });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lưu thông tin trang trại thất bại!'));
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
            <Warehouse className="w-5 h-5 text-emerald-400" />
            <h3 className="font-display font-bold text-sm uppercase tracking-wider">
              {farm ? 'Cập Nhật Trang Trại' : 'Khai Báo Trang Trại Mới'}
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

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase font-mono-num">
              Tên Trang Trại <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ví dụ: Trang Trại Nuôi Tôm Sông Xanh"
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase font-mono-num">
              Địa Chỉ / Khu Vực
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ví dụ: Xã Vĩnh Hậu, Huyện Hòa Bình, Tỉnh Bạc Liêu"
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase font-mono-num">
              Trạng Thái Hoạt Động
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
            >
              <option value="active">Đang hoạt động (Active)</option>
              <option value="inactive">Tạm ngưng hoạt động (Inactive)</option>
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
              <span>{farm ? 'Lưu thay đổi' : 'Tạo trang trại'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FarmModal;
