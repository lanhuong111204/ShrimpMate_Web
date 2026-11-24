import apiClient from './apiClient';

/**
 * Service Thị giác Máy tính & Cường độ Bắt mồi FIS (Camera Computer Vision - UC014, UC019)
 * và Module 12: Đề xuất AI & Tối ưu cữ ăn (/ponds/:pondId/ai)
 */
export const cameraFisService = {
  // ================= 1. CAMERA COMPUTER VISION (MODULE 11) =================
  /**
   * Lấy kết quả FIS mới nhất theo ao nuôi (trạng thái bắt mồi, tỷ lệ thức ăn thừa, mật độ tôm)
   * @param {string} pondId
   */
  getLatestFis: async (pondId) => {
    return await apiClient.get(`/camera/ponds/${pondId}/latest-fis`);
  },

  /**
   * Lấy lịch sử chuỗi thời gian FIS (Vẽ biểu đồ phân vị và xu hướng)
   * @param {string} pondId
   * @param {Object} params - { from, to, deviceId, feedingRecordId, appetiteLevel, page, limit }
   */
  getFisHistory: async (pondId, params = {}) => {
    return await apiClient.get(`/camera/ponds/${pondId}/fis-history`, {
      params: {
        page: params.page || 1,
        limit: params.limit || 50,
        ...(params.from ? { from: params.from } : {}),
        ...(params.to ? { to: params.to } : {}),
        ...(params.deviceId ? { deviceId: params.deviceId } : {}),
        ...(params.feedingRecordId ? { feedingRecordId: params.feedingRecordId } : {}),
        ...(params.appetiteLevel !== undefined ? { appetiteLevel: params.appetiteLevel } : {}),
      },
    });
  },

  /**
   * Danh sách thiết bị camera được gán vào ao nuôi
   * @param {string} pondId
   */
  getCameraDevices: async (pondId) => {
    return await apiClient.get(`/camera/ponds/${pondId}/devices`);
  },

  /**
   * Cập nhật vùng quan sát cố định cho Camera (ROI - Region of Interest)
   * @param {string} deviceId
   * @param {Object} data - { x, y, width, height, polygon, resolutionWidth, resolutionHeight }
   */
  updateRoi: async (deviceId, data) => {
    return await apiClient.patch(`/camera/devices/${deviceId}/roi`, data);
  },

  /**
   * Tinh chỉnh trọng số thành phần w1, w2, w3, w4 và các phân vị thuật toán FIS
   * @param {string} pondId
   * @param {Object} data - { weightRt, weightVt, weightDt, weightCt, quantile25, quantile50, quantile75, samplingIntervalSeconds }
   */
  updateWeights: async (pondId, data) => {
    return await apiClient.patch(`/camera/ponds/${pondId}/weights`, data);
  },

  /**
   * Gửi khung hình phân tích AI (Song song 2 luồng YOLO + MobileNet)
   * @param {Object} data - { pondId, deviceId, feedingRecordId, frameUrl, timeDeltaSeconds, roi, simulatedMetrics }
   */
  analyzeFrame: async (data) => {
    return await apiClient.post('/camera/analyze', data);
  },

  // ================= 2. ĐỀ XUẤT AI & TỐI ƯU CỮ ĂN (MODULE 12) =================
  /**
   * Lấy khuyến nghị AI mới nhất cho ao nuôi (Mục 12.1)
   * @param {string} pondId
   */
  getLatestAiRecommendation: async (pondId) => {
    try {
      return await apiClient.get(`/ponds/${pondId}/ai/recommendations/latest`);
    } catch (err) {
      // Fallback endpoint nếu backend cấu hình theo Tài liệu 1
      return await apiClient.get(`/ai-integration/ponds/${pondId}/recommendations`);
    }
  },

  /**
   * Lấy lịch sử các khuyến nghị AI (Mục 12.2)
   * @param {string} pondId
   * @param {number} limit
   */
  getAiRecommendationHistory: async (pondId, limit = 10) => {
    return await apiClient.get(`/ponds/${pondId}/ai/recommendations`, {
      params: { limit },
    });
  },

  /**
   * Dự báo sinh khối và tốc độ tăng trưởng tôm
   * @param {string} pondId
   */
  getBiomassForecast: async (pondId) => {
    return await apiClient.get(`/ai-integration/ponds/${pondId}/forecast-biomass`);
  },
};

export default cameraFisService;
