import apiClient from './apiClient';

/**
 * Service Thị giác Máy tính & Cường độ Bắt mồi FIS (Camera Computer Vision - UC014, UC019)
 * Xử lý song song 2 luồng: YOLO11n-seg (phân đoạn sàng ăn & đếm tôm) + MobileNetV3 (phân loại hành vi ăn)
 */
export const cameraFisService = {
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
};

export default cameraFisService;
