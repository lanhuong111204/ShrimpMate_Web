import apiClient from './apiClient';

/**
 * Service quản lý Người nuôi & Phân công ao nuôi (UC020, UC021)
 */
export const farmerService = {
  /**
   * Lấy danh sách Người nuôi trực thuộc Manager (kèm số lượng ao đã phân công)
   */
  getFarmers: async () => {
    return await apiClient.get('/farmers');
  },

  /**
   * Xem thông tin chi tiết của 1 Farmer kèm danh sách toàn bộ các phân công
   * @param {string} id
   */
  getFarmerById: async (id) => {
    return await apiClient.get(`/farmers/${id}`);
  },

  /**
   * Tạo tài khoản Farmer mới (Hệ thống tự sinh mật khẩu ban đầu)
   * @param {Object} data - { fullName, phoneNumber, email }
   */
  createFarmer: async ({ fullName, phoneNumber, email }) => {
    return await apiClient.post('/farmers', {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      ...(email?.trim() ? { email: email.trim() } : {}),
    });
  },

  /**
   * Cập nhật thông tin Farmer (Họ tên, SĐT)
   * @param {string} id
   * @param {Object} data - { fullName, phoneNumber }
   */
  updateFarmer: async (id, data) => {
    return await apiClient.patch(`/farmers/${id}`, data);
  },

  /**
   * Khóa hoặc mở khóa tài khoản Farmer
   * @param {string} id
   * @param {boolean} isActive
   */
  toggleStatus: async (id, isActive) => {
    return await apiClient.patch(`/farmers/${id}/status`, { isActive });
  },

  /**
   * Phân công ao nuôi hoặc toàn bộ trang trại cho Farmer
   * @param {string} id - Farmer ID
   * @param {Object} data - { farmId, pondIds?: string[] }
   */
  assignPonds: async (id, { farmId, pondIds = [] }) => {
    const payload = { farmId };
    if (pondIds && pondIds.length > 0) {
      payload.pondIds = pondIds;
    }
    return await apiClient.post(`/farmers/${id}/assignments`, payload);
  },

  /**
   * Xem danh sách phân công của một Farmer
   * @param {string} id
   */
  getAssignments: async (id) => {
    return await apiClient.get(`/farmers/${id}/assignments`);
  },

  /**
   * Thu hồi một phân công cụ thể của Farmer
   * @param {string} id - Farmer ID
   * @param {string} assignmentId
   */
  revokeAssignment: async (id, assignmentId) => {
    return await apiClient.delete(`/farmers/${id}/assignments/${assignmentId}`);
  },

  /**
   * Thu hồi toàn bộ phân công của Farmer
   * @param {string} id - Farmer ID
   */
  revokeAllAssignments: async (id) => {
    return await apiClient.delete(`/farmers/${id}/assignments`);
  },
};

export default farmerService;
