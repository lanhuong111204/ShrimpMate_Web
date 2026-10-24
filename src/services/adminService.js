import apiClient from './apiClient';

/**
 * Service Quản Trị Viên Nền Tảng (Admin Platform Management - UC004, UC008, UC010)
 * Tất cả các API yêu cầu quyền role = 'admin'
 */
export const adminService = {
  // ================= 1. BÁO CÁO & GIÁM SÁT TOÀN NỀN TẢNG =================
  /**
   * Thống kê tổng quan toàn nền tảng (người dùng, trang trại, ao nuôi, thiết bị, cảnh báo)
   */
  getOverview: async () => {
    return await apiClient.get('/admin/overview');
  },

  /**
   * Báo cáo vận hành toàn nền tảng (10 cảnh báo nguy cấp, thiết bị offline > 5 phút)
   */
  getOperationalReport: async () => {
    return await apiClient.get('/admin/reports/operational');
  },

  /**
   * Báo cáo hiệu quả chuyển đổi thức ăn (FCR) toàn hệ thống trên mọi vụ nuôi
   */
  getFcrReport: async () => {
    return await apiClient.get('/admin/reports/fcr');
  },

  // ================= 2. QUẢN LÝ TÀI KHOẢN TOÀN HỆ THỐNG =================
  /**
   * Xem danh sách tất cả tài khoản trong hệ thống
   */
  getUsers: async () => {
    return await apiClient.get('/auth/users');
  },

  /**
   * Khóa hoặc mở khóa tài khoản người dùng (Chặn admin tự khóa chính mình)
   * @param {string} id
   * @param {boolean} isActive
   */
  updateUserStatus: async (id, isActive) => {
    return await apiClient.patch(`/auth/users/${id}/status`, { isActive });
  },

  /**
   * Phân bổ vai trò tài khoản (admin, manager, farmer - Chặn admin tự hạ quyền)
   * @param {string} id
   * @param {string} role - 'admin' | 'manager' | 'farmer'
   */
  updateUserRole: async (id, role) => {
    return await apiClient.patch(`/auth/users/${id}/role`, { role });
  },

  // ================= 3. KIỂM THỬ GIAO TIẾP PHẦN CỨNG MQTT =================
  /**
   * Kiểm tra trạng thái kết nối MQTT Broker
   */
  getMqttStatus: async () => {
    return await apiClient.get('/mqtt/status');
  },

  /**
   * Gửi lệnh phát xung kiểm thử Feeder trực tiếp qua MQTT topic
   * @param {string} deviceUid
   * @param {Object} data - { feedAmountKg, spreadRateKgPerMinute, durationSeconds }
   */
  testFeederMqtt: async (deviceUid, data = {}) => {
    return await apiClient.post(`/mqtt/devices/${deviceUid}/feeder-test`, {
      command: 'FEED',
      feedAmountKg: Number(data.feedAmountKg || 2.0),
      spreadRateKgPerMinute: Number(data.spreadRateKgPerMinute || 1.5),
      durationSeconds: Number(data.durationSeconds || 60),
    });
  },
};

export default adminService;
