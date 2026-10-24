import apiClient from './apiClient';

/**
 * Service Quan trắc Chất lượng Nước (Telemetry - UC013)
 * Quản lý 6 thông số: DO (Oxy hòa tan), pH, Nhiệt độ, Độ mặn, NH3 (Ammonia), Độ đục
 */
export const telemetryService = {
  /**
   * Lấy chỉ số môi trường nước mới nhất của ao nuôi (Dành cho Gauges)
   * @param {string} pondId
   */
  getLatestTelemetry: async (pondId) => {
    return await apiClient.get(`/ponds/${pondId}/telemetry/latest`);
  },

  /**
   * Lấy lịch sử đo môi trường nước (Vẽ đồ thị chuỗi thời gian & Phân trang)
   * @param {string} pondId
   * @param {Object} params - { startDate, endDate, deviceId, page, limit }
   */
  getTelemetryHistory: async (pondId, params = {}) => {
    return await apiClient.get(`/ponds/${pondId}/telemetry/history`, {
      params: {
        page: params.page || 1,
        limit: params.limit || 50,
        ...(params.startDate ? { startDate: params.startDate } : {}),
        ...(params.endDate ? { endDate: params.endDate } : {}),
        ...(params.deviceId ? { deviceId: params.deviceId } : {}),
      },
    });
  },

  /**
   * Ghi nhận số đo cảm biến (REST Ingestion / Simulator)
   * @param {string} pondId
   * @param {Object} data - { deviceId, ph, dissolvedOxygenMgL, temperatureC, salinityPpt, ammoniaMgL, turbidityNtu }
   */
  ingestTelemetry: async (pondId, data) => {
    return await apiClient.post(`/ponds/${pondId}/telemetry`, data);
  },
};

export default telemetryService;
