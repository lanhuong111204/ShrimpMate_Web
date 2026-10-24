import apiClient from './apiClient';

/**
 * Service quản lý Ao nuôi (Pond Management - UC006)
 */
export const pondService = {
  /**
   * Lấy danh sách ao nuôi thuộc một trang trại cụ thể
   * @param {string} farmId
   * @param {number} page
   * @param {number} limit
   */
  getPondsByFarm: async (farmId, page = 1, limit = 50) => {
    return await apiClient.get(`/farms/${farmId}/ponds`, {
      params: { page, limit },
    });
  },

  /**
   * Lấy chi tiết ao nuôi kèm danh sách thiết bị IoT gán vào ao
   * @param {string} farmId
   * @param {string} pondId
   */
  getPondById: async (farmId, pondId) => {
    return await apiClient.get(`/farms/${farmId}/ponds/${pondId}`);
  },

  /**
   * Tạo ao nuôi mới trong trang trại
   * @param {string} farmId
   * @param {Object} data - { code, name, areaM2, status }
   */
  createPond: async (farmId, { code, name, areaM2, status = 'active' }) => {
    return await apiClient.post(`/farms/${farmId}/ponds`, {
      code: code.trim(),
      name: name.trim(),
      areaM2: Number(areaM2),
      status,
    });
  },

  /**
   * Cập nhật thông tin ao nuôi
   * @param {string} farmId
   * @param {string} pondId
   * @param {Object} data - { name, areaM2, status }
   */
  updatePond: async (farmId, pondId, data) => {
    return await apiClient.patch(`/farms/${farmId}/ponds/${pondId}`, {
      ...data,
      ...(data.areaM2 ? { areaM2: Number(data.areaM2) } : {}),
    });
  },

  /**
   * Xóa mềm ao nuôi (tự động unassign thiết bị IoT về kho catalog)
   * @param {string} farmId
   * @param {string} pondId
   */
  deletePond: async (farmId, pondId) => {
    return await apiClient.delete(`/farms/${farmId}/ponds/${pondId}`);
  },
};

export default pondService;
