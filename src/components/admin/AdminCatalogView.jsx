import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Plus, 
  Trash2, 
  Edit3,
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Layers, 
  HardDrive,
  Search,
  Filter
} from 'lucide-react';
import { deviceService } from '../../services/deviceService';
import { getErrorMessage } from '../../services/apiClient';

export const AdminCatalogView = () => {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Modal Khai báo thiết bị mới
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceUid, setDeviceUid] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('feeder');
  const [firmwareVersion, setFirmwareVersion] = useState('1.0.0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Cập nhật thiết bị
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editName, setEditName] = useState('');
  const [editFirmwareVersion, setEditFirmwareVersion] = useState('');
  const [editStatus, setEditStatus] = useState('offline');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchDevices = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await deviceService.getDevices();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setDevices(list);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lỗi nạp danh mục thiết bị catalog!'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    if (!deviceUid.trim() || !name.trim()) {
      setErrorMessage('Vui lòng nhập mã deviceUid duy nhất và tên thiết bị!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await deviceService.createDevice({
        deviceUid: deviceUid.trim(),
        name: name.trim(),
        type,
        firmwareVersion: firmwareVersion.trim() || '1.0.0',
        metadata: {
          registeredBy: 'admin',
          createdAt: new Date().toISOString(),
        },
      });

      setSuccessToast(`Đã thêm thiết bị [${deviceUid.trim()}] vào kho Catalog thành công.`);
      setIsModalOpen(false);
      setDeviceUid('');
      setName('');
      await fetchDevices();
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lỗi tạo thiết bị vào Catalog!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (dev) => {
    setEditingDevice(dev);
    setEditName(dev.name || '');
    setEditFirmwareVersion(dev.firmwareVersion || '1.0.0');
    setEditStatus(dev.status || 'offline');
    setIsEditModalOpen(true);
  };

  const handleUpdateDevice = async (e) => {
    e.preventDefault();
    if (!editingDevice) return;

    setIsUpdating(true);
    setErrorMessage('');

    try {
      await deviceService.updateDevice(editingDevice.id, {
        name: editName.trim(),
        firmwareVersion: editFirmwareVersion.trim(),
        status: editStatus,
      });

      setSuccessToast(`Đã cập nhật thông tin thiết bị [${editingDevice.deviceUid}] thành công.`);
      setIsEditModalOpen(false);
      setEditingDevice(null);
      await fetchDevices();
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lỗi cập nhật thiết bị!'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteDevice = async (dev) => {
    if (!window.confirm(`Xóa vĩnh viễn thiết bị [${dev.deviceUid}] khỏi danh mục catalog hệ thống?`)) {
      return;
    }

    try {
      await deviceService.deleteDevice(dev.id);
      setSuccessToast(`Đã xóa thiết bị [${dev.deviceUid}] khỏi catalog.`);
      await fetchDevices();
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      alert(getErrorMessage(err, 'Lỗi xóa thiết bị!'));
    }
  };

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      (d.deviceUid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            <h1 className="font-display font-bold text-base md:text-lg text-neutral-900 tracking-tight uppercase">
              QUẢN LÝ CATALOG THIẾT BỊ IOT CHUẨN (UC008)
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Khai báo danh mục phần cứng chuẩn (Hardware Catalog) với mã deviceUid duy nhất trước khi xuất kho tới trang trại.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Thêm Thiết Bị Vào Kho</span>
        </button>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Thanh lọc & Tìm kiếm */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo deviceUid hoặc tên máy..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono-num"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto font-mono-num text-xs">
          <Filter className="w-4 h-4 text-neutral-400" />
          <span className="text-neutral-500">Loại thiết bị:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-neutral-300 rounded-xl bg-white font-semibold text-neutral-800 cursor-pointer"
          >
            <option value="all">Tất cả ({devices.length})</option>
            <option value="feeder">Máy Cho Ăn (Feeder)</option>
            <option value="sensor_node">Trạm Cảm Biến (Sensor)</option>
            <option value="camera">Camera AI</option>
            <option value="edge_gateway">Edge Gateway</option>
          </select>
        </div>
      </div>

      {/* 3. Bảng Catalog Thiết Bị */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/60 font-mono-num text-[11px] uppercase text-neutral-500 font-semibold">
                <th className="py-3 px-6">Mã Phần Cứng (deviceUid)</th>
                <th className="py-3 px-4">Tên Thiết Bị</th>
                <th className="py-3 px-4 text-center">Phân Loại</th>
                <th className="py-3 px-4 text-center">Firmware</th>
                <th className="py-3 px-4 text-center">Vị Trí Gán</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono-num">
              {filteredDevices.map((dev) => (
                <tr key={dev.id} className="hover:bg-neutral-50/70 transition">
                  <td className="py-3.5 px-6 font-bold text-neutral-900">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-neutral-500" />
                      <span>{dev.deviceUid}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-sans text-neutral-800 font-medium">
                    {dev.name}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 text-neutral-700 border border-neutral-200">
                      {dev.type}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center text-neutral-600">
                    v{dev.firmwareVersion || '1.0.0'}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {dev.pondId ? (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        ĐÃ GÁN VÀO AO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-500 text-[10px] font-semibold">
                        TRONG KHO CHUẨN
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {dev.status === 'online' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-500 border border-neutral-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                        Offline
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(dev)}
                        className="p-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
                        title="Chỉnh sửa thiết bị"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(dev)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Xóa khỏi Catalog"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL KHAI BÁO THIẾT BỊ MỚI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-2xl overflow-hidden font-sans">
            <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                  Khai Báo Thiết Bị Chuẩn Vào Kho
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                  Mã Định Danh Duy Nhất (deviceUid) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={deviceUid}
                  onChange={(e) => setDeviceUid(e.target.value.toUpperCase())}
                  placeholder="ví dụ: DEV-FEEDER-VN-003 hoặc CAM-02-A1"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono-num uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                  Tên Thiết Bị Chuẩn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ví dụ: Máy cho ăn tự động 50kg v2"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                    Loại Thiết Bị
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  >
                    <option value="feeder">Máy Cho Ăn (Feeder)</option>
                    <option value="sensor_node">Trạm Cảm Biến</option>
                    <option value="camera">Camera AI Sàng Ăn</option>
                    <option value="edge_gateway">Edge Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                    Phiên Bản Firmware
                  </label>
                  <input
                    type="text"
                    value={firmwareVersion}
                    onChange={(e) => setFirmwareVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono-num"
                  />
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600">
                * Thiết bị mới được khởi tạo ở trạng thái trong kho chuẩn (<code className="text-neutral-800 font-bold">pondId = null</code>, <code className="text-neutral-800 font-bold">offline</code>). Người nuôi sẽ dùng mã <code className="text-emerald-700 font-bold">deviceUid</code> để claim vào ao của họ.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Thêm Vào Catalog</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL CHỈNH SỬA THIẾT BỊ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-2xl overflow-hidden font-sans">
            <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                  Cập Nhật Thiết Bị: {editingDevice?.deviceUid}
                </h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDevice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                  Tên Thiết Bị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                    Firmware
                  </label>
                  <input
                    type="text"
                    value={editFirmwareVersion}
                    onChange={(e) => setEditFirmwareVersion(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                    Trạng Thái
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  >
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isUpdating && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCatalogView;
