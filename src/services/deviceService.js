import apiClient from './apiClient';

/**
 * Service quản lý Thiết bị IoT & Catalog Phần cứng (UC008, UC009, UC012)
 */
export const deviceService = {
  /**
   * Lấy danh sách thiết bị IoT (Admin: toàn bộ catalog; Manager: thiết bị ao thuộc farm sở hữu)
   */
  getDevices: async () => {
    return await apiClient.get('/devices');
  },

  /**
   * Xem chi tiết thiết bị theo ID
   * @param {string} id
   */
  getDeviceById: async (id) => {
    return await apiClient.get(`/devices/${id}`);
  },

  /**
   * [Admin] Khai báo thiết bị chuẩn vào danh mục Catalog
   * @param {Object} data - { deviceUid, name, type, firmwareVersion, metadata }
   */
  createDevice: async (data) => {
    return await apiClient.post('/devices', data);
  },

  /**
   * [Manager/Farmer] Đăng ký gán thiết bị vào ao nuôi (Claim Device)
   * @param {Object} data - { deviceUid, pondId }
   */
  claimDevice: async ({ deviceUid, pondId }) => {
    return await apiClient.post('/devices/claim', {
      deviceUid: deviceUid.trim(),
      pondId,
    });
  },

  /**
   * [Manager/Farmer] Hủy gán thiết bị khỏi ao nuôi (Unassign Device)
   * @param {string} id
   */
  unassignDevice: async (id) => {
    return await apiClient.post(`/devices/${id}/unassign`);
  },

  /**
   * Cập nhật thông tin thiết bị (tên, mode...)
   * @param {string} id
   * @param {Object} data
   */
  updateDevice: async (id, data) => {
    return await apiClient.patch(`/devices/${id}`, data);
  },

  /**
   * [Admin] Xóa thiết bị khỏi catalog
   * @param {string} id
   */
  deleteDevice: async (id) => {
    return await apiClient.delete(`/devices/${id}`);
  },

  /**
   * Kích hoạt Dừng khẩn cấp cho thiết bị (Emergency Stop)
   * @param {string} id
   */
  emergencyStop: async (id) => {
    return await apiClient.post(`/devices/${id}/emergency-stop`);
  },

  /**
   * Gửi tín hiệu nhịp tim phần cứng (Heartbeat)
   * @param {string} id
   */
  sendHeartbeat: async (id) => {
    return await apiClient.post(`/devices/${id}/heartbeat`);
  },
};

export default deviceService;
