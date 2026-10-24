import apiClient from './apiClient';

/**
 * Service quản lý Trang trại (Farm Management - UC005)
 */
export const farmService = {
  /**
   * Lấy danh sách trang trại của Manager (có phân trang)
   * @param {number} page
   * @param {number} limit
   */
  getFarms: async (page = 1, limit = 20) => {
    return await apiClient.get('/farms', {
      params: { page, limit },
    });
  },

  /**
   * Lấy chi tiết trang trại theo ID kèm danh sách ao trực thuộc
   * @param {string} id
   */
  getFarmById: async (id) => {
    return await apiClient.get(`/farms/${id}`);
  },

  /**
   * Tạo trang trại mới
   * @param {Object} data - { name, address, status }
   */
  createFarm: async ({ name, address, status = 'active' }) => {
    return await apiClient.post('/farms', {
      name: name.trim(),
      address: address?.trim() || '',
      status,
    });
  },

  /**
   * Cập nhật thông tin trang trại
   * @param {string} id
   * @param {Object} data - { name, address, status }
   */
  updateFarm: async (id, data) => {
    return await apiClient.patch(`/farms/${id}`, data);
  },

  /**
   * Xóa mềm trang trại (tự động xóa mềm các ao trực thuộc)
   * @param {string} id
   */
  deleteFarm: async (id) => {
    return await apiClient.delete(`/farms/${id}`);
  },
};

export default farmService;
