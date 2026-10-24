import axios from 'axios';

// Khóa lưu trữ LocalStorage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'shrimpmate_access_token',
  REFRESH_TOKEN: 'shrimpmate_refresh_token',
  USER: 'shrimpmate_user',
};

// Các hàm tiện ích thao tác Token & User
export const getAccessToken = () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
export const getRefreshToken = () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
};

export const clearTokens = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Lỗi phân tích dữ liệu user từ LocalStorage:', error);
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};

// Trích xuất thông báo lỗi chuẩn từ phản hồi của Backend
export const getErrorMessage = (error, defaultMessage = 'Đã có lỗi xảy ra, vui lòng thử lại!') => {
  if (!error) return defaultMessage;
  if (error.response?.data?.message) {
    const msg = error.response.data.message;
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    if (error.message === 'Network Error') {
      return 'Không thể kết nối đến máy chủ Backend (Network Error). Vui lòng kiểm tra địa chỉ API hoặc kết nối mạng!';
    }
    return error.message;
  }
  return defaultMessage;
};

// Cấu hình Base URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 15000;

// Khởi tạo instance Axios chính
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Biến quản lý hàng đợi khi đang Refresh Token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor: Tự động đính kèm Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Bóc tách data và xử lý Silent Refresh Token
apiClient.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp data từ phản hồi
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu không có phản hồi từ máy chủ (lỗi mạng hoặc server tắt)
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status, config } = error.response;
    const requestUrl = config?.url || '';

    // Bỏ qua nếu là các endpoint auth không cần hoặc không thể refresh
    const isAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh-token') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/verify-reset-otp') ||
      requestUrl.includes('/auth/reset-password');

    // Xử lý mã 401 Unauthorized và tự động refresh token
    if (status === 401 && !isAuthRoute && !originalRequest._retry) {
      if (isRefreshing) {
        // Đã có tiến trình refresh đang chạy -> Đưa request vào hàng đợi chờ token mới
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const currentRefreshToken = getRefreshToken();

      if (!currentRefreshToken) {
        // Không có refresh token -> Buộc đăng xuất
        clearTokens();
        isRefreshing = false;
        window.dispatchEvent(new CustomEvent('shrimpmate:auth:expired'));
        return Promise.reject(error);
      }

      try {
        // Gọi thẳng axios gốc không qua interceptor để tránh vòng lặp
        const response = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          { refreshToken: currentRefreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = response.data;

        setTokens(newAccessToken, newRefreshToken || currentRefreshToken);
        if (user) {
          setStoredUser(user);
        }

        // Cập nhật header cho request gốc
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Thông báo cho các request trong hàng đợi chạy lại
        processQueue(null, newAccessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token cũng đã hết hạn hoặc không hợp lệ
        processQueue(refreshError, null);
        isRefreshing = false;
        clearTokens();
        window.dispatchEvent(new CustomEvent('shrimpmate:auth:expired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
