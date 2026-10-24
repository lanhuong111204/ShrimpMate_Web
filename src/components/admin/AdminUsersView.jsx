import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Lock, 
  Unlock, 
  Shield, 
  RotateCw, 
  AlertCircle, 
  CheckCircle2, 
  Filter
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../services/apiClient';

export const AdminUsersView = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await adminService.getUsers();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setUsers(list);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Lỗi nạp danh sách tài khoản!'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Khóa / Mở khóa tài khoản
  const handleToggleStatus = async (targetUser) => {
    if (targetUser.id === currentAdmin?.id) {
      alert('Chính sách bảo mật: Bạn không được phép tự khóa tài khoản của chính mình!');
      return;
    }

    const nextStatus = !targetUser.isActive;
    const actionLabel = nextStatus ? 'mở khóa' : 'khóa';

    if (!window.confirm(`Xác nhận ${actionLabel} tài khoản [${targetUser.fullName || targetUser.email}]?`)) {
      return;
    }

    try {
      await adminService.updateUserStatus(targetUser.id, nextStatus);
      setSuccessToast(`Đã ${actionLabel} tài khoản thành công.`);
      await fetchUsers();
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      alert(getErrorMessage(err, 'Không thể cập nhật trạng thái tài khoản!'));
    }
  };

  // Phân vai trò (Role)
  const handleChangeRole = async (targetUser, newRole) => {
    if (targetUser.id === currentAdmin?.id) {
      alert('Chính sách bảo mật: Quản trị viên không được phép tự hạ quyền của chính mình!');
      return;
    }

    if (!window.confirm(`Xác nhận chuyển vai trò của [${targetUser.fullName}] sang [${newRole.toUpperCase()}]?`)) {
      return;
    }

    try {
      await adminService.updateUserRole(targetUser.id, newRole);
      setSuccessToast(`Đã chuyển vai trò người dùng sang ${newRole.toUpperCase()}.`);
      await fetchUsers();
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      alert(getErrorMessage(err, 'Lỗi thay đổi vai trò!'));
    }
  };

  // Lọc tìm kiếm
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phoneNumber || '').includes(searchTerm);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header View */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-red-600 rounded-full inline-block"></span>
            <h1 className="font-display font-bold text-base md:text-lg text-neutral-900 tracking-tight uppercase">
              QUẢN LÝ TÀI KHOẢN TOÀN HỆ THỐNG (UC004)
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Quản trị viên giám sát tài khoản Manager & Farmer, cấp quyền, khóa/mở khóa tài khoản vi phạm.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm Mới</span>
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

      {/* 2. Thanh Tìm kiếm & Lọc */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email hoặc SĐT..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto font-mono-num text-xs">
          <Filter className="w-4 h-4 text-neutral-400" />
          <span className="text-neutral-500">Vai trò:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 border border-neutral-300 rounded-xl bg-white font-semibold text-neutral-800 cursor-pointer"
          >
            <option value="all">Tất cả ({users.length})</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="farmer">Farmer</option>
          </select>
        </div>
      </div>

      {/* 3. Bảng Danh sách Người Dùng */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/60 font-mono-num text-[11px] uppercase text-neutral-500 font-semibold">
                <th className="py-3 px-6">Họ và Tên</th>
                <th className="py-3 px-4">Tài Khoản / Email</th>
                <th className="py-3 px-4">Số Điện Thoại</th>
                <th className="py-3 px-4 text-center">Vai Trò (Role)</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-6 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentAdmin?.id;
                return (
                  <tr key={u.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-3.5 px-6 font-semibold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-xs text-neutral-700">
                          {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <span>{u.fullName}</span>
                          {isSelf && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-neutral-900 text-white text-[9px] font-mono-num font-bold">
                              BẠN
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono-num text-neutral-600 truncate max-w-[200px]">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4 font-mono-num text-neutral-600">
                      {u.phoneNumber || '--'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => handleChangeRole(u, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono-num font-bold uppercase border cursor-pointer ${
                          u.role === 'admin'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : u.role === 'manager'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                      >
                        <option value="farmer">FARMER</option>
                        <option value="manager">MANAGER</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono-num">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Bị khóa
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={isSelf}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono-num flex items-center gap-1 ml-auto transition cursor-pointer ${
                          isSelf
                            ? 'opacity-30 cursor-not-allowed border-neutral-200 text-neutral-400'
                            : u.isActive
                            ? 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Khóa</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mở khóa</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersView;
