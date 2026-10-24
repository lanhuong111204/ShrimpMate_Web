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
  Search,
  Filter
} from 'lucide-react';
import { deviceService } from '../../services/deviceService';
import { getErrorMessage } from '../../services/apiClient';

export const AdminCatalogView = () => {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
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
    setErrorMessage('');
    try {
      const res = await deviceService.getDevices();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setDevices(list);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lỗi nạp danh mục thiết bị catalog!'));
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#EA580C] rounded-full inline-block"></span>
            <h1 className="font-bold text-base md:text-lg text-[#0B1C30] tracking-tight">
              Danh mục thiết bị IoT chuẩn (Hardware Catalog)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Khai báo danh mục phần cứng chuẩn với mã <code className="font-mono-num font-bold text-[#EA580C]">deviceUid</code> duy nhất trước khi bàn giao tới trang trại.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#FB923C] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm thiết bị vào kho</span>
        </button>
      </div>

      {successToast && (
        <div className="p-3.5 bg-[#E8F5E9] border border-[#7CF994] text-[#006E2D] rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#006E2D] shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-[#FFDAD6]/60 border border-[#BA1A1A]/30 text-[#93000A] rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#BA1A1A] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Thanh lọc & Tìm kiếm */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo deviceUid hoặc tên máy..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] font-mono-num"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 font-medium">Loại thiết bị:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl bg-[#F8F9FF] font-bold text-[#0B1C30] cursor-pointer focus:outline-none focus:border-[#EA580C]"
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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8F9FF] text-[11px] uppercase text-slate-500 font-bold tracking-wider">
                <th className="py-3.5 px-6">Mã phần cứng (deviceUid)</th>
                <th className="py-3.5 px-4">Tên thiết bị</th>
                <th className="py-3.5 px-4 text-center">Phân loại</th>
                <th className="py-3.5 px-4 text-center">Firmware</th>
                <th className="py-3.5 px-4 text-center">Vị trí gán</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono-num">
              {filteredDevices.map((dev) => (
                <tr key={dev.id} className="hover:bg-[#F8F9FF] transition">
                  <td className="py-3.5 px-6 font-bold text-[#0B1C30]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#FFF8F5] border border-[#FFDBCA] flex items-center justify-center text-[#EA580C]">
                        <Cpu className="w-3.5 h-3.5" />
                      </div>
                      <span>{dev.deviceUid}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-sans text-[#0B1C30] font-semibold">
                    {dev.name}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE]">
                      {dev.type}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center text-slate-600">
                    v{dev.firmwareVersion || '1.0.0'}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {dev.pondId ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFF8F5] text-[#EA580C] border border-[#FFDBCA] text-[10px] font-bold">
                        ĐÃ GÁN VÀO AO
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                        TRONG KHO CHUẨN
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {dev.status === 'online' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#006E2D]"></span>
                        Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Offline
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(dev)}
                        className="p-1.5 rounded-xl border border-slate-200 text-[#006398] hover:bg-[#EFF4FF] transition cursor-pointer"
                        title="Chỉnh sửa thiết bị"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(dev)}
                        className="p-1.5 rounded-xl border border-[#FFDAD6] text-[#BA1A1A] hover:bg-[#FFDAD6]/40 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1C30]/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden font-sans">
            <div className="bg-[#0B1C30] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-[#FB923C]" />
                <h3 className="font-bold text-sm uppercase tracking-wider">
                  Khai báo thiết bị chuẩn vào kho
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                  Mã định danh duy nhất (deviceUid) <span className="text-[#BA1A1A]">*</span>
                </label>
                <input
                  type="text"
                  value={deviceUid}
                  onChange={(e) => setDeviceUid(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: DEV-FEEDER-VN-003 hoặc CAM-02-A1"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] font-mono-num uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                  Tên thiết bị chuẩn <span className="text-[#BA1A1A]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Máy cho ăn tự động 50kg v2"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                    Loại thiết bị
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none focus:border-[#EA580C]"
                  >
                    <option value="feeder">Máy Cho Ăn (Feeder)</option>
                    <option value="sensor_node">Trạm Cảm Biến</option>
                    <option value="camera">Camera AI Sàng Ăn</option>
                    <option value="edge_gateway">Edge Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                    Phiên bản Firmware
                  </label>
                  <input
                    type="text"
                    value={firmwareVersion}
                    onChange={(e) => setFirmwareVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="w-full px-3 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none focus:border-[#EA580C] font-mono-num"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#FFF8F5] rounded-xl border border-[#FFDBCA] text-[11px] text-[#9D4300]">
                * Thiết bị mới được khởi tạo ở trạng thái trong kho chuẩn (<code className="font-bold">pondId = null</code>, <code className="font-bold">offline</code>). Người nuôi sẽ dùng mã <code className="text-[#EA580C] font-bold">deviceUid</code> để claim vào ao của họ.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FB923C] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Thêm vào Catalog</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL CHỈNH SỬA THIẾT BỊ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1C30]/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden font-sans">
            <div className="bg-[#0B1C30] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-[#FB923C]" />
                <h3 className="font-bold text-sm uppercase tracking-wider">
                  Cập nhật thiết bị: {editingDevice?.deviceUid}
                </h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDevice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                  Tên thiết bị <span className="text-[#BA1A1A]">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none focus:border-[#EA580C]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                    Firmware
                  </label>
                  <input
                    type="text"
                    value={editFirmwareVersion}
                    onChange={(e) => setEditFirmwareVersion(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none focus:border-[#EA580C] font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B1C30] mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none focus:border-[#EA580C]"
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
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FB923C] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isUpdating && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu thay đổi</span>
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
