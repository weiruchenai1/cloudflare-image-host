// src/hooks/useAuth.ts - 修复版本
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, setAuthenticated, logout: storeLogout } = useAppStore();

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await api.login(credentials);
      
      if (response.token && response.user) {
        api.setToken(response.token);
        setUser(response.user);
        setAuthenticated(true);
        return response;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    inviteCode: string;
  }) => {
    try {
      const response = await api.register(data);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const validateToken = async () => {
    try {
      const response = await api.validateToken();
      if (response.user) {
        setUser(response.user);
        setAuthenticated(true);
        return response;
      } else {
        logout();
        return null;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      logout();
      return null;
    }
  };

  const logout = () => {
    api.clearToken();
    storeLogout();
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    validateToken,
  };
};