import React, { useState, useEffect } from 'react';
import { X, Waves, Warehouse, RotateCw, AlertCircle } from 'lucide-react';
import { pondService } from '../../services/pondService';
import { getErrorMessage } from '../../services/apiClient';

export const PondModal = ({
  isOpen,
  onClose,
  farmId,
  farms = [],
  pond = null,
  onSuccess,
}) => {
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [areaM2, setAreaM2] = useState('');
  const [status, setStatus] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (pond) {
      setSelectedFarmId(pond.farmId || farmId || farms[0]?.id || '');
      setCode(pond.code || '');
      setName(pond.name || '');
      setAreaM2(pond.areaM2 || '');
      setStatus(pond.status || 'active');
    } else {
      setSelectedFarmId(farmId || farms[0]?.id || '');
      setCode('');
      setName('');
      setAreaM2('2500');
      setStatus('active');
    }
    setErrorMessage('');
  }, [pond, farmId, farms, isOpen]);

  if (!isOpen) return null;

  const targetFarm = farms.find((f) => f.id === selectedFarmId);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFarmId) {
      setErrorMessage('Bạn chưa có trang trại nào. Vui lòng tạo trang trại trước khi khai báo ao nuôi.');
      return;
    }

    if (!code.trim() || !name.trim() || !areaM2) {
      setErrorMessage('Vui lòng điền đầy đủ mã ao, tên ao và diện tích mặt nước.');
      return;
    }

    if (Number(areaM2) <= 0) {
      setErrorMessage('Diện tích ao phải là một số dương hợp lệ.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (pond) {
        await pondService.updatePond(selectedFarmId, pond.id, {
          name,
          areaM2: Number(areaM2),
          status,
        });
      } else {
        await pondService.createPond(selectedFarmId, {
          code,
          name,
          areaM2: Number(areaM2),
          status,
        });
      }
      onSuccess?.(selectedFarmId);
      onClose();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lưu thông tin ao nuôi thất bại.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 !mt-0 z-[100] flex items-center justify-center p-4 bg-slate-900/15 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 ring-1 ring-slate-900/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Waves className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide">
                {pond ? `Cập nhật ao: ${pond.code}` : 'Khai báo ao nuôi mới'}
              </h3>
              {targetFarm && (
                <p className="text-[11px] text-neutral-400">
                  Thuộc trang trại: <strong className="text-emerald-400">{targetFarm.name}</strong>
                </p>
              )}
            </div>
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

          {/* Chọn trang trại trực thuộc */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Trang trại trực thuộc <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Warehouse className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                disabled={!!pond || farms.length === 0}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-neutral-900 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-neutral-50 disabled:opacity-75"
                required
              >
                {farms.length === 0 ? (
                  <option value="">-- Chưa có trang trại nào --</option>
                ) : (
                  farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.address ? `(${f.address})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Mã định danh ao <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="POND-01"
                disabled={!!pond}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono-num uppercase disabled:bg-neutral-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Diện tích (m²) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={areaM2}
                onChange={(e) => setAreaM2(e.target.value)}
                placeholder="2500"
                min="50"
                step="50"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono-num"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Tên gọi ao nuôi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Ao số 1 - Khu nuôi thương phẩm"
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Trạng thái ao
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
            >
              <option value="active">Đang thả nuôi</option>
              <option value="maintenance">Đang cải tạo / nghỉ vụ</option>
              <option value="inactive">Tạm ngưng sử dụng</option>
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
              disabled={isLoading || !selectedFarmId}
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
