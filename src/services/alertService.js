import apiClient from './apiClient';

/**
 * Service Cảnh báo & Xử lý Sự cố (Alert Management - UC015)
 */
export const alertService = {
  /**
   * Lấy tổng kết số lượng cảnh báo (Dành cho Badge trên Header & Dashboard)
   * @param {string} pondId - Tùy chọn lọc theo ao
   */
  getSummary: async (pondId = '') => {
    return await apiClient.get('/alerts/summary', {
      params: pondId ? { pondId } : {},
    });
  },

  /**
   * Lấy danh sách toàn bộ cảnh báo có phân trang & bộ lọc
   * @param {Object} params - { status: 'open'|'acknowledged'|'resolved', severity: 1|2|3, pondId, deviceId, type, page, limit }
   */
  getAlerts: async (params = {}) => {
    return await apiClient.get('/alerts', {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        ...(params.status ? { status: params.status } : {}),
        ...(params.severity ? { severity: params.severity } : {}),
        ...(params.pondId ? { pondId: params.pondId } : {}),
        ...(params.deviceId ? { deviceId: params.deviceId } : {}),
        ...(params.type ? { type: params.type } : {}),
      },
    });
  },

  /**
   * Lấy danh sách cảnh báo theo từng ao cụ thể
   * @param {string} pondId
   * @param {string} status - 'open' | 'acknowledged' | 'resolved'
   */
  getPondAlerts: async (pondId, status = 'open') => {
    return await apiClient.get(`/ponds/${pondId}/alerts`, {
      params: { status },
    });
  },

  /**
   * Xác nhận đã tiếp nhận sự cố (Acknowledge)
   * @param {string} id
   */
  acknowledgeAlert: async (id) => {
    return await apiClient.patch(`/alerts/${id}/acknowledge`);
  },

  /**
   * Xác nhận đã khắc phục sự cố xong ngoài ao (Resolve)
   * @param {string} id
   */
  resolveAlert: async (id) => {
    return await apiClient.patch(`/alerts/${id}/resolve`);
  },
};

export default alertService;
