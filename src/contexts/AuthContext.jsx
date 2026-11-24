import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { getAccessToken, getStoredUser, clearTokens } from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  // Xác minh phiên làm việc với Backend khi tải ứng dụng
  const verifySession = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getMe();
      if (currentUser && currentUser.isActive) {
        setUser(currentUser);
      } else {
        // Tài khoản bị khóa hoặc không hợp lệ
        clearTokens();
        setUser(null);
      }
    } catch (error) {
      console.warn('Phiên đăng nhập hết hạn hoặc không hợp lệ:', error?.message);
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();

    // Lắng nghe sự kiện hết hạn phiên làm việc từ apiClient
    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener('shrimpmate:auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('shrimpmate:auth:expired', handleAuthExpired);
    };
  }, [verifySession]);

  // Hành động Đăng nhập
  const login = async (identifier, password) => {
    const data = await authService.login(identifier, password);
    setUser(data.user);
    return data;
  };

  // Hành động Đăng ký Manager
  const register = async (formData) => {
    const data = await authService.register(formData);
    setUser(data.user);
    return data;
  };

  // Hành động Đăng xuất
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Cập nhật hồ sơ
  const updateProfile = async (data) => {
    const updatedUser = await authService.updateProfile(data);
    setUser(updatedUser);
    return updatedUser;
  };

  // Đổi mật khẩu
  const changePassword = async (currentPassword, newPassword) => {
    return await authService.changePassword(currentPassword, newPassword);
  };

  // Tải lại thông tin User
  const refreshUser = async () => {
    const freshUser = await authService.getMe();
    setUser(freshUser);
    return freshUser;
  };

  const role = user?.role || null;
  const isAuthenticated = !!user && user.isActive !== false;
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isFarmer = role === 'farmer';

  const value = {
    user,
    role,
    isAuthenticated,
    isLoading,
    isAdmin,
    isManager,
    isFarmer,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook useAuth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};

export default AuthContext;
