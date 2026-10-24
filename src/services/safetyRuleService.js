import apiClient from './apiClient';

/**
 * Service Quy tắc An toàn Nước (Safety Rule Engine - UC018)
 */
export const safetyRuleService = {
  /**
   * Xem danh mục quy tắc an toàn toàn hệ thống
   */
  getSafetyRules: async () => {
    return await apiClient.get('/safety-rules');
  },

  /**
   * [Admin] Tạo quy tắc an toàn mới
   * @param {Object} data - { code, name, priority, isEnabled, condition, action }
   */
  createSafetyRule: async (data) => {
    return await apiClient.post('/safety-rules', data);
  },

  /**
   * [Admin] Xem chi tiết quy tắc
   * @param {string} id
   */
  getSafetyRuleById: async (id) => {
    return await apiClient.get(`/safety-rules/${id}`);
  },

  /**
   * [Admin] Cập nhật điều kiện, ngưỡng hoặc bật/tắt luật an toàn
   * @param {string} id
   * @param {Object} data
   */
  updateSafetyRule: async (id, data) => {
    return await apiClient.patch(`/safety-rules/${id}`, data);
  },

  /**
   * [Admin] Xóa quy tắc an toàn
   * @param {string} id
   */
  deleteSafetyRule: async (id) => {
    return await apiClient.delete(`/safety-rules/${id}`);
  },

  /**
   * Thử nghiệm đánh giá an toàn trước khi cho ăn (Preview Safety Evaluation)
   * Kiểm tra xem các số đo môi trường hiện tại có vi phạm luật không trước khi xả cám thực tế
   * @param {string} pondId
   * @param {Object} data - { deviceId, requestedAmountKg }
   */
  evaluateSafetyPreview: async (pondId, { deviceId, requestedAmountKg }) => {
    return await apiClient.post(`/ponds/${pondId}/safety-rules/evaluate`, {
      deviceId,
      requestedAmountKg: Number(requestedAmountKg),
    });
  },
};

export default safetyRuleService;
