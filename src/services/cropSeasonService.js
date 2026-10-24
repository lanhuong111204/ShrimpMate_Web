import apiClient from './apiClient';

/**
 * Service quản lý Vụ nuôi & Thống kê hệ số FCR (UC007, UC016)
 */
export const cropSeasonService = {
  /**
   * Lấy danh sách các vụ nuôi của một ao nuôi cụ thể
   * @param {string} pondId
   */
  getSeasonsByPond: async (pondId) => {
    return await apiClient.get(`/ponds/${pondId}/crop-seasons`);
  },

  /**
   * Khởi tạo vụ nuôi mới cho ao nuôi
   * @param {string} pondId
   * @param {Object} data - { name, stockingDate, initialCount, stockingDensity, initialAverageWeightG, estimatedSurvivalRate, status }
   */
  createSeason: async (pondId, data) => {
    return await apiClient.post(`/ponds/${pondId}/crop-seasons`, {
      ...data,
      initialCount: Number(data.initialCount),
      stockingDensity: Number(data.stockingDensity || 0),
      initialAverageWeightG: Number(data.initialAverageWeightG || 0.02),
      estimatedSurvivalRate: Number(data.estimatedSurvivalRate || 85.0),
      status: data.status || 'active',
    });
  },

  /**
   * Xem thông tin chi tiết một vụ nuôi
   * @param {string} id
   */
  getSeasonById: async (id) => {
    return await apiClient.get(`/crop-seasons/${id}`);
  },

  /**
   * Xem báo cáo thống kê chi tiết vụ nuôi & Hệ số FCR
   * @param {string} id
   */
  getSeasonStatistics: async (id) => {
    return await apiClient.get(`/crop-seasons/${id}/statistics`);
  },

  /**
   * Cập nhật thông số vụ nuôi (hoặc đóng vụ thu hoạch: status = 'completed')
   * @param {string} id
   * @param {Object} data
   */
  updateSeason: async (id, data) => {
    return await apiClient.patch(`/crop-seasons/${id}`, data);
  },

  /**
   * Xóa vụ nuôi
   * @param {string} id
   */
  deleteSeason: async (id) => {
    return await apiClient.delete(`/crop-seasons/${id}`);
  },
};

export default cropSeasonService;
