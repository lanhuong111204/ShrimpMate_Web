import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  RotateCw, 
  AlertCircle, 
  Layers, 
  Copy, 
  Key, 
  X, 
  Trash2, 
  Warehouse, 
  Waves,
  Eye,
  Edit3
} from 'lucide-react';
import { farmerService } from '../services/farmerService';
import { farmService } from '../services/farmService';
import { pondService } from '../services/pondService';
import { getErrorMessage } from '../services/apiClient';

export const FarmersManagementView = () => {
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // 1. Modal Thêm Farmer mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1.1 Modal Chỉnh sửa Farmer
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [isUpdatingFarmer, setIsUpdatingFarmer] = useState(false);

  // 2. Modal Hiển thị Mật khẩu ban đầu (Chỉ hiện 1 lần duy nhất!)
  const [initialPasswordModal, setInitialPasswordModal] = useState({
    isOpen: false,
    farmerName: '',
    phone: '',
    password: '',
  });

  // 3. Modal Phân công ao nuôi
  const [assignmentModal, setAssignmentModal] = useState({
    isOpen: false,
    farmer: null,
  });
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [farmPonds, setFarmPonds] = useState([]);
  const [selectedPondIds, setSelectedPondIds] = useState([]);
  const [assignWholeFarm, setAssignWholeFarm] = useState(false);
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Tải danh sách Farmer
  const fetchFarmers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await farmerService.getFarmers();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setFarmers(list);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lỗi tải danh sách người nuôi!'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  // Xử lý tạo Farmer mới
  const handleCreateFarmer = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) {
      setErrorMessage('Vui lòng nhập họ tên và số điện thoại Người nuôi!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await farmerService.createFarmer({
        fullName,
        phoneNumber,
        email,
      });

      setIsCreateModalOpen(false);
      setFullName('');
      setPhoneNumber('');
      setEmail('');

      // Mở modal hiển thị mật khẩu ban đầu
      setInitialPasswordModal({
        isOpen: true,
        farmerName: res?.farmer?.fullName || fullName,
        phone: res?.farmer?.phoneNumber || phoneNumber,
        password: res?.initialPassword || 'Chưa cung cấp',
      });

      await fetchFarmers();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Không thể tạo tài khoản Farmer!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Khóa / Mở khóa tài khoản
  const handleToggleStatus = async (farmer) => {
    const nextStatus = !farmer.isActive;
    const actionName = nextStatus ? 'mở khóa' : 'khóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản [${farmer.fullName}]?`)) {
      return;
    }

    try {
      await farmerService.toggleStatus(farmer.id, nextStatus);
      setSuccessToast(`Đã ${actionName} tài khoản thành công.`);
      await fetchFarmers();
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      alert(getErrorMessage(err, 'Lỗi cập nhật trạng thái tài khoản!'));
    }
  };

  // Mở modal phân công
  const handleOpenAssignment = async (farmer) => {
    setAssignmentModal({ isOpen: true, farmer });
    setSelectedPondIds([]);
    setAssignWholeFarm(false);
    setIsLoadingAssignments(true);

    try {
      // 1. Tải danh sách các trang trại của Manager
      const farmsRes = await farmService.getFarms();
      const fList = Array.isArray(farmsRes) ? farmsRes : (farmsRes?.data || []);
      setFarms(fList);
      if (fList.length > 0) {
        setSelectedFarmId(fList[0].id);
        // Tải các ao của trại đầu tiên
        const pondsRes = await pondService.getPondsByFarm(fList[0].id);
        setFarmPonds(Array.isArray(pondsRes) ? pondsRes : (pondsRes?.data || []));
      }

      // 2. Tải danh sách phân công hiện tại của Farmer
      const assignRes = await farmerService.getAssignments(farmer.id);
      setCurrentAssignments(Array.isArray(assignRes) ? assignRes : (assignRes?.assignments || []));
    } catch (err) {
      console.warn('Lỗi tải dữ liệu phân công:', err);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  // Khi đổi Farm trong modal phân công
  const handleFarmChange = async (farmId) => {
    setSelectedFarmId(farmId);
    setSelectedPondIds([]);
    try {
      const pondsRes = await pondService.getPondsByFarm(farmId);
      setFarmPonds(Array.isArray(pondsRes) ? pondsRes : (pondsRes?.data || []));
    } catch (err) {
      setFarmPonds([]);
    }
  };

  // Lưu phân công ao
  const handleSaveAssignment = async () => {
    if (!assignmentModal.farmer?.id || !selectedFarmId) return;

    if (!assignWholeFarm && selectedPondIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 ao nuôi hoặc chọn "Phân công toàn bộ trang trại"!');
      return;
    }

    setIsSubmitting(true);
    try {
      await farmerService.assignPonds(assignmentModal.farmer.id, {
        farmId: selectedFarmId,
        pondIds: assignWholeFarm ? [] : selectedPondIds,
      });

      setSuccessToast(`Đã phân công ao nuôi cho [${assignmentModal.farmer.fullName}] thành công.`);
      setAssignmentModal({ isOpen: false, farmer: null });
      await fetchFarmers();
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      alert(getErrorMessage(err, 'Lỗi phân công ao nuôi!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thu hồi một phân công
  const handleRevokeAssignment = async (assignmentId) => {
    if (!assignmentModal.farmer?.id) return;
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi phân công này?')) return;

    try {
      await farmerService.revokeAssignment(assignmentModal.farmer.id, assignmentId);
      // Tải lại danh sách phân công
      const assignRes = await farmerService.getAssignments(assignmentModal.farmer.id);
      setCurrentAssignments(Array.isArray(assignRes) ? assignRes : (assignRes?.assignments || []));
      await fetchFarmers();
    } catch (err) {
      alert(getErrorMessage(err, 'Lỗi thu hồi phân công!'));
    }
  };

  // Thu hồi tất cả phân công của Farmer
  const handleRevokeAllAssignments = async () => {
    if (!assignmentModal.farmer?.id) return;
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi TOÀN BỘ phân công của [${assignmentModal.farmer.fullName}]?`)) return;

    try {
      await farmerService.revokeAllAssignments(assignmentModal.farmer.id);
      setCurrentAssignments([]);
      await fetchFarmers();
      setSuccessToast(`Đã thu hồi toàn bộ phân công của [${assignmentModal.farmer.fullName}].`);
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      alert(getErrorMessage(err, 'Lỗi thu hồi toàn bộ phân công!'));
    }
  };

  // Mở modal sửa thông tin Farmer
  const handleOpenEdit = (farmer) => {
    setEditingFarmer(farmer);
    setEditFullName(farmer.fullName || '');
    setEditPhoneNumber(farmer.phoneNumber || '');
    setIsEditModalOpen(true);
  };

  // Cập nhật Farmer
  const handleUpdateFarmer = async (e) => {
    e.preventDefault();
    if (!editingFarmer) return;

    if (!editFullName.trim() || !editPhoneNumber.trim()) {
      alert('Vui lòng điền đầy đủ họ tên và số điện thoại!');
      return;
    }

    setIsUpdatingFarmer(true);
    try {
      await farmerService.updateFarmer(editingFarmer.id, {
        fullName: editFullName.trim(),
        phoneNumber: editPhoneNumber.trim(),
      });
      setSuccessToast(`Đã cập nhật thông tin [${editFullName.trim()}] thành công.`);
      setIsEditModalOpen(false);
      setEditingFarmer(null);
      await fetchFarmers();
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      alert(getErrorMessage(err, 'Lỗi cập nhật thông tin Người nuôi!'));
    } finally {
      setIsUpdatingFarmer(false);
    }
  };

  // Copy password to clipboard
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(initialPasswordModal.password);
    alert('Đã sao chép mật khẩu vào bộ nhớ tạm!');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0B1C30] tracking-tight font-display">
            Quản lý nhân sự & Phân công ao nuôi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quản lý tài khoản nhân viên kỹ thuật (Farmer) và phân quyền phụ trách từng ao nuôi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 px-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm nhân sự mới</span>
          </button>
        </div>
      </div>

      {/* Thông báo lỗi / thành công */}
      {errorMessage && (
        <div className="p-3 bg-[#FFF8F8] border border-[#FFDAD6] text-[#BA1A1A] rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#BA1A1A]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successToast && (
        <div className="p-3 bg-[#E8F5E9] border border-[#7CF994] text-[#006E2D] rounded-xl text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#006E2D]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 2. Bảng Danh sách Người nuôi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F8F9FF]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#006398]" />
            <h3 className="font-display font-bold text-xs uppercase text-[#0B1C30] tracking-wider">
              Danh Sách Kỹ Thuật Viên / Farmer ({farmers.length})
            </h3>
          </div>

          <button
            onClick={fetchFarmers}
            className="text-xs text-[#006398] hover:text-[#EA580C] font-bold flex items-center gap-1 font-mono-num cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-500 font-mono-num flex items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-[#EA580C]" />
            <span>Đang nạp danh sách nhân sự...</span>
          </div>
        ) : farmers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-3">
            <p>Chưa có tài khoản Người nuôi nào trực thuộc cơ sở này.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-[#FFF8F5] hover:bg-[#FFDBCA] text-[#9D4300] border border-[#FFDBCA] font-bold rounded-xl text-xs cursor-pointer"
            >
              + Tạo tài khoản Farmer đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8F9FF] font-mono-num text-[11px] uppercase text-slate-500 font-bold">
                  <th className="py-3.5 px-6">Họ và Tên</th>
                  <th className="py-3.5 px-4">Số Điện Thoại</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4 text-center">Ao Phân Công</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {farmers.map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-[#F8F9FF] transition">
                    <td className="py-3.5 px-6 font-bold text-[#0B1C30]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#FFDBCA] border border-[#EA580C]/20 flex items-center justify-center font-bold text-xs text-[#9D4300]">
                          {farmer.fullName?.charAt(0)?.toUpperCase() || 'F'}
                        </div>
                        <span>{farmer.fullName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono-num text-slate-600">
                      {farmer.phoneNumber}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono-num truncate max-w-[180px]">
                      {farmer.email || '--'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono-num font-bold bg-[#EFF4FF] text-[#006398] border border-[#D3E4FE]">
                        {farmer.assignmentCount ?? 0} ao
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono-num">
                      {farmer.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006E2D]" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFDAD6] text-[#BA1A1A]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A]" />
                          Đã khóa
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 font-mono-num">
                        <button
                          onClick={() => handleOpenAssignment(farmer)}
                          className="px-3 py-1 rounded-xl bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#006398] text-[11px] font-bold flex items-center gap-1 transition cursor-pointer border border-[#D3E4FE]"
                        >
                          <Layers className="w-3.5 h-3.5 text-[#006398]" />
                          <span>Phân công</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(farmer)}
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Sửa thông tin Farmer (Họ tên, SĐT)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(farmer)}
                          className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
                            farmer.isActive
                              ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                              : 'border-[#7CF994] text-[#006E2D] hover:bg-[#E8F5E9]'
                          }`}
                          title={farmer.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {farmer.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. MODAL TẠO FARMER MỚI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-2xl overflow-hidden">
            <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                  Cấp Tài Khoản Người Nuôi Mới
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFarmer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                  Họ và Tên Farmer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ví dụ: Trần Văn Nuôi"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                  Số Điện Thoại (10 chữ số) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0903123456"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono-num"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                  Địa Chỉ Email (Tùy chọn)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nuoi.tran@example.com (để trống hệ thống tự gán)"
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-600">
                * Hệ thống sẽ tự động sinh mật khẩu ban đầu ngẫu nhiên an toàn và hiển thị ở bước tiếp theo để bàn giao cho Farmer.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Tạo Tài Khoản</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL HIỂN THỊ MẬT KHẨU BAN ĐẦU (CHỈ 1 LẦN DUY NHẤT) */}
      {initialPasswordModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-2xl overflow-hidden">
            <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-white" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                  Mật Khẩu Ban Đầu (Cấp 1 Lần)
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-neutral-900 text-base">{initialPasswordModal.farmerName}</h4>
                <p className="text-xs text-neutral-500 font-mono-num">
                  Tài khoản đăng nhập: <strong>{initialPasswordModal.phone}</strong>
                </p>
              </div>

              {/* Password Box */}
              <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 text-center space-y-2">
                <span className="text-[10px] text-neutral-400 uppercase font-mono-num tracking-wider">
                  Mật Khẩu Tạm Thời:
                </span>
                <div className="text-2xl font-mono-num font-black tracking-widest text-emerald-400 select-all">
                  {initialPasswordModal.password}
                </div>
                <button
                  onClick={handleCopyPassword}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-mono-num font-semibold transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép Mật Khẩu</span>
                </button>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <strong>LƯU Ý QUAN TRỌNG:</strong> Mật khẩu này chỉ hiển thị duy nhất một lần và không lưu dưới dạng văn bản rõ. Hãy chuyển mật khẩu này cho Người nuôi để đăng nhập trên Farmer Mobile App và đổi mật khẩu ở lần đầu tiên.
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setInitialPasswordModal({ isOpen: false, farmerName: '', phone: '', password: '' })}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Tôi Đã Lưu & Bàn Giao Xong
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL PHÂN CÔNG AO NUÔI (UC021) */}
      {assignmentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                    Phân Công Ao Nuôi (UC021)
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono-num">
                    Farmer: <strong className="text-white">{assignmentModal.farmer?.fullName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignmentModal({ isOpen: false, farmer: null })}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Chọn Trang Trại */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 font-mono-num uppercase">
                  Chọn Trang Trại Phân Công
                </label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => handleFarmChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.address || 'Khu nuôi'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tùy chọn phân công toàn bộ */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-neutral-800">Phân công toàn bộ trang trại</div>
                  <div className="text-[11px] text-neutral-500">Farmer được quyền quản lý tất cả các ao thuộc trại này</div>
                </div>
                <input
                  type="checkbox"
                  checked={assignWholeFarm}
                  onChange={(e) => setAssignWholeFarm(e.target.checked)}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Danh sách các ao cụ thể */}
              {!assignWholeFarm && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-700 font-mono-num uppercase">
                    Hoặc chọn các ao nuôi cụ thể:
                  </label>
                  {farmPonds.length === 0 ? (
                    <div className="p-4 border border-dashed rounded-xl text-center text-xs text-neutral-500">
                      Trang trại này chưa có ao nuôi nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                      {farmPonds.map((p) => {
                        const isChecked = selectedPondIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`p-3 rounded-xl border text-xs font-mono-num flex items-center justify-between cursor-pointer transition ${
                              isChecked
                                ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                                : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-800'
                            }`}
                          >
                            <div>
                              <div>{p.code}</div>
                              <div className={`text-[10px] ${isChecked ? 'text-neutral-300' : 'text-neutral-500'}`}>
                                {p.areaM2 ? `${p.areaM2} m²` : p.name}
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPondIds([...selectedPondIds, p.id]);
                                } else {
                                  setSelectedPondIds(selectedPondIds.filter((id) => id !== p.id));
                                }
                              }}
                              className="sr-only"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Danh sách phân công hiện tại */}
              <div className="pt-3 border-t border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase text-neutral-700 font-mono-num">
                    Phân Công Đang Có ({currentAssignments.length})
                  </span>
                  {currentAssignments.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRevokeAllAssignments}
                      className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Thu hồi tất cả</span>
                    </button>
                  )}
                </div>
                {currentAssignments.length === 0 ? (
                  <div className="text-xs text-neutral-400 italic">Chưa có phân công nào.</div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {currentAssignments.map((a) => (
                      <div
                        key={a.id}
                        className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-mono-num flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-neutral-800">
                            {a.pondId ? `Ao ID: ${a.pondId.slice(0, 8)}...` : 'Toàn bộ trang trại'}
                          </span>
                          <span className="text-[10px] text-neutral-400 block">Trại: {a.farmId?.slice(0, 8)}...</span>
                        </div>
                        <button
                          onClick={() => handleRevokeAssignment(a.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition cursor-pointer"
                          title="Thu hồi phân công này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignmentModal({ isOpen: false, farmer: null })}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveAssignment}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Lưu Phân Công</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL CHỈNH SỬA THÔNG TIN FARMER */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-2xl overflow-hidden font-sans">
            <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                  Cập Nhật Người Nuôi
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFarmer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                  Họ và Tên *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 font-mono-num uppercase">
                  Số Điện Thoại (Nhận OTP SMS) *
                </label>
                <input
                  type="tel"
                  required
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono-num"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingFarmer}
                  className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isUpdatingFarmer && <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
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

export default FarmersManagementView;
