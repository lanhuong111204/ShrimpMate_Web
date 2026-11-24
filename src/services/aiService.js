import apiClient from './apiClient';

/**
 * Service Dự báo & Khuyến nghị AI (/ponds/:pondId/ai & /admin/ai-service-status)
 */
export const aiService = {
  /**
   * Chạy mô hình dự báo lượng cám khuyến nghị cho cữ ăn tiếp theo
   * @param {string} pondId
   * @param {Object} dto
   */
  predictFeed: async (pondId, dto = {}) => {
    return await apiClient.post(`/ponds/${pondId}/ai/predict-feed`, dto);
  },

  /**
   * Lấy dự báo xu hướng DO 1h-2h tới và khuyến nghị thích ứng
   * @param {string} pondId
   */
  getPredictedTrends: async (pondId) => {
    return await apiClient.get(`/ponds/${pondId}/ai/predicted-trends`);
  },

  /**
   * Lấy khuyến nghị AI mới nhất cho ao nuôi (unwrap object recommendation)
   * @param {string} pondId
   */
  getLatestRecommendation: async (pondId) => {
    const res = await apiClient.get(`/ponds/${pondId}/ai/recommendations/latest`);
    return res?.recommendation ?? (res?.predictedFeedAmountKg !== undefined ? res : null);
  },

  /**
   * Lấy lịch sử các khuyến nghị AI
   * @param {string} pondId
   * @param {number} limit
   */
  getRecommendations: async (pondId, limit = 10) => {
    return await apiClient.get(`/ponds/${pondId}/ai/recommendations`, {
      params: { limit },
    });
  },

  /**
   * Dự báo sinh khối và tốc độ tăng trưởng tôm
   * @param {string} pondId
   */
  getBiomassForecast: async (pondId) => {
    return await apiClient.get(`/ponds/${pondId}/ai/forecast-biomass`);
  },

  /**
   * [Admin] Kiểm tra trạng thái hoạt động của dịch vụ AI
   */
  getAiServiceStatus: async () => {
    return await apiClient.get('/admin/ai-service-status');
  },
};

export default aiService;
