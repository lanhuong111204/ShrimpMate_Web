import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Lock, 
  Unlock, 
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#EA580C] rounded-full inline-block"></span>
            <h1 className="font-bold text-base md:text-lg text-[#0B1C30] tracking-tight">
              Quản lý tài khoản toàn hệ thống (RBAC)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị viên giám sát tài khoản Manager & Farmer, cấp quyền và khóa/mở khóa tài khoản vi phạm.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-[#EFF4FF] hover:bg-[#D3E4FE] text-[#006398] border border-[#D3E4FE] text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
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

      {/* 2. Thanh Tìm kiếm & Lọc */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email hoặc SĐT..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8F9FF] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 font-medium">Vai trò:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl bg-[#F8F9FF] font-bold text-[#0B1C30] cursor-pointer focus:outline-none focus:border-[#EA580C]"
          >
            <option value="all">Tất cả ({users.length})</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="farmer">Farmer</option>
          </select>
        </div>
      </div>

      {/* 3. Bảng Danh sách Người Dùng */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8F9FF] text-[11px] uppercase text-slate-500 font-bold tracking-wider">
                <th className="py-3.5 px-6">Họ và Tên</th>
                <th className="py-3.5 px-4">Tài khoản / Email</th>
                <th className="py-3.5 px-4">Số điện thoại</th>
                <th className="py-3.5 px-4 text-center">Vai trò (Role)</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentAdmin?.id;
                return (
                  <tr key={u.id} className="hover:bg-[#F8F9FF] transition">
                    <td className="py-3.5 px-6 font-bold text-[#0B1C30]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#FFF8F5] border border-[#FFDBCA] flex items-center justify-center font-bold text-xs text-[#EA580C]">
                          {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <span>{u.fullName}</span>
                          {isSelf && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-[#0B1C30] text-white text-[9px] font-bold">
                              BẠN
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono-num text-slate-600 truncate max-w-[200px]">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4 font-mono-num text-slate-600">
                      {u.phoneNumber || '--'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => handleChangeRole(u, e.target.value)}
                        className={`px-3 py-1 rounded-full text-[10px] font-mono-num font-bold uppercase border cursor-pointer ${
                          u.role === 'admin'
                            ? 'bg-[#FFF8F5] text-[#EA580C] border-[#FFDBCA]'
                            : u.role === 'manager'
                            ? 'bg-[#EFF4FF] text-[#006398] border-[#D3E4FE]'
                            : 'bg-[#E8F5E9] text-[#006E2D] border-[#7CF994]'
                        } disabled:opacity-70 disabled:cursor-not-allowed`}
                      >
                        <option value="farmer">FARMER</option>
                        <option value="manager">MANAGER</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono-num">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#006E2D] border border-[#7CF994]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006E2D]"></span>
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFDAD6] text-[#BA1A1A] border border-[#BA1A1A]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A]"></span>
                          Bị khóa
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={isSelf}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ml-auto transition cursor-pointer ${
                          isSelf
                            ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-400'
                            : u.isActive
                            ? 'border-[#FFDAD6] text-[#BA1A1A] hover:bg-[#FFDAD6]/40'
                            : 'border-[#7CF994] text-[#006E2D] hover:bg-[#E8F5E9]'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Khóa</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
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
