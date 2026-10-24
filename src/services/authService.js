import apiClient, { setTokens, setStoredUser, clearTokens } from './apiClient';

/**
 * Service xử lý toàn bộ các luồng API Xác thực & Người dùng (/auth)
 */
export const authService = {
  /**
   * Kiểm tra tình trạng kết nối máy chủ Backend
   */
  checkHealth: async () => {
    return await apiClient.get('/');
  },

  /**
   * Đăng ký tài khoản Quản lý (Manager)
   * @param {Object} data - { email, phoneNumber, password, fullName }
   */
  register: async ({ email, phoneNumber, password, fullName }) => {
    const data = await apiClient.post('/auth/register', {
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      password,
      fullName: fullName.trim(),
    });
    if (data.accessToken) {
      setTokens(data.accessToken, data.refreshToken);
      setStoredUser(data.user);
    }
    return data;
  },

  /**
   * Đăng nhập hệ thống bằng Email hoặc Số điện thoại
   * @param {string} identifier - Email hoặc Số điện thoại
   * @param {string} password - Mật khẩu
   */
  login: async (identifier, password) => {
    const data = await apiClient.post('/auth/login', {
      identifier: identifier.trim(),
      password,
    });
    if (data.accessToken) {
      setTokens(data.accessToken, data.refreshToken);
      setStoredUser(data.user);
    }
    return data;
  },

  /**
   * Làm mới Access Token bằng Refresh Token
   * @param {string} refreshToken
   */
  refreshToken: async (refreshToken) => {
    return await apiClient.post('/auth/refresh-token', { refreshToken });
  },

  /**
   * Lấy thông tin tài khoản hiện tại từ Token
   */
  getMe: async () => {
    const user = await apiClient.get('/auth/me');
    if (user) {
      setStoredUser(user);
    }
    return user;
  },

  /**
   * Cập nhật hồ sơ cá nhân
   * @param {Object} data - { fullName, phoneNumber }
   */
  updateProfile: async ({ fullName, phoneNumber }) => {
    const user = await apiClient.patch('/auth/profile', {
      fullName: fullName?.trim(),
      phoneNumber: phoneNumber?.trim(),
    });
    if (user) {
      setStoredUser(user);
    }
    return user;
  },

  /**
   * Đổi mật khẩu chủ động
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  changePassword: async (currentPassword, newPassword) => {
    return await apiClient.patch('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Yêu cầu gửi mã OTP khôi phục mật khẩu (6 chữ số, hiệu lực 5 phút)
   * @param {string} identifier - Email hoặc Số điện thoại
   */
  forgotPassword: async (identifier) => {
    return await apiClient.post('/auth/forgot-password', {
      identifier: identifier.trim(),
    });
  },

  /**
   * Gửi lại mã OTP
   * @param {string} identifier
   */
  resendOtp: async (identifier) => {
    return await apiClient.post('/auth/resend-otp', {
      identifier: identifier.trim(),
    });
  },

  /**
   * Xác thực mã OTP trước khi cho phép nhập mật khẩu mới
   * @param {string} identifier
   * @param {string} otp
   */
  verifyResetOtp: async (identifier, otp) => {
    return await apiClient.post('/auth/verify-reset-otp', {
      identifier: identifier.trim(),
      otp: otp.trim(),
    });
  },

  /**
   * Đặt lại mật khẩu mới bằng OTP
   * @param {string} identifier
   * @param {string} otp
   * @param {string} newPassword
   */
  resetPassword: async (identifier, otp, newPassword) => {
    return await apiClient.post('/auth/reset-password', {
      identifier: identifier.trim(),
      otp: otp.trim(),
      newPassword,
    });
  },

  /**
   * Kiểm tra nhanh quyền Admin
   */
  checkAdminRole: async () => {
    return await apiClient.get('/auth/admin-check');
  },

  /**
   * Kiểm tra nhanh quyền Manager
   */
  checkManagerRole: async () => {
    return await apiClient.get('/auth/manager-check');
  },

  /**
   * Kiểm tra nhanh quyền Farmer
   */
  checkFarmerRole: async () => {
    return await apiClient.get('/auth/farmer-check');
  },

  /**
   * Đăng xuất hệ thống (xóa token cục bộ)
   */
  logout: () => {
    clearTokens();
  },
};

export default authService;
