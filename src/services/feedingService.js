import apiClient from './apiClient';

/**
 * Service Quản lý Cho ăn: Lịch Tự Động & Cữ Ăn Thực Tế (UC011, UC012)
 */
export const feedingService = {
  // ================= LỊCH CHO ĂN TỰ ĐỘNG (FEEDING SCHEDULES) =================
  /**
   * Lấy danh sách lịch cho ăn của một ao nuôi cụ thể
   * @param {string} pondId
   */
  getSchedules: async (pondId) => {
    return await apiClient.get(`/ponds/${pondId}/feeding-schedules`);
  },

  /**
   * Tạo lịch cho ăn tự động mới
   * @param {string} pondId
   * @param {Object} data - { name, timeOfDay, feedAmountKg, spreadRateKgPerMinute, daysOfWeek, isEnabled }
   */
  createSchedule: async (pondId, data) => {
    return await apiClient.post(`/ponds/${pondId}/feeding-schedules`, {
      name: data.name.trim(),
      timeOfDay: data.timeOfDay,
      feedAmountKg: Number(data.feedAmountKg),
      spreadRateKgPerMinute: Number(data.spreadRateKgPerMinute || 1.5),
      daysOfWeek: data.daysOfWeek || [1, 2, 3, 4, 5, 6, 0],
      isEnabled: data.isEnabled ?? true,
    });
  },

  /**
   * Cập nhật thông số lịch cho ăn
   * @param {string} scheduleId
   * @param {Object} data
   */
  updateSchedule: async (scheduleId, data) => {
    return await apiClient.patch(`/feeding-schedules/${scheduleId}`, data);
  },

  /**
   * Xóa lịch cho ăn tự động
   * @param {string} scheduleId
   */
  deleteSchedule: async (scheduleId) => {
    return await apiClient.delete(`/feeding-schedules/${scheduleId}`);
  },

  // ================= CỮ CHO ĂN THỰC TẾ & SAFETY ENGINE (FEEDING RECORDS) =================
  /**
   * Xem lịch sử nhật ký các lần cho ăn của ao
   * @param {string} pondId
   */
  getRecords: async (pondId) => {
    return await apiClient.get(`/ponds/${pondId}/feeding-records`);
  },

  /**
   * Kích hoạt cữ cho ăn mới (Tự động bảo vệ qua Safety Rule Engine)
   * @param {string} pondId
   * @param {Object} data - { deviceId, scheduleId, requestedAmountKg, source: 'manual'|'schedule'|'ai' }
   */
  createRecord: async (pondId, data) => {
    return await apiClient.post(`/ponds/${pondId}/feeding-records`, {
      deviceId: data.deviceId,
      scheduleId: data.scheduleId || null,
      requestedAmountKg: Number(data.requestedAmountKg),
      source: data.source || 'manual',
    });
  },

  /**
   * Cập nhật tiến trình cho ăn (hoàn thành, dừng, thất bại, thức ăn dư trên sàng)
   * @param {string} recordId
   * @param {Object} data - { status: 'completed'|'stopped'|'failed', actualAmountKg, leftoverPercent, appetiteLevel }
   */
  updateRecord: async (recordId, data) => {
    return await apiClient.patch(`/feeding-records/${recordId}`, data);
  },
};

export default feedingService;
