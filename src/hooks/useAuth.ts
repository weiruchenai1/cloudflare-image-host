// src/hooks/useAuth.ts
import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, setAuthenticated, logout } = useAppStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      api.setToken(token);
      validateToken();
    }
  }, [isAuthenticated]);

  const validateToken = async () => {
    try {
      const response = await api.validateToken() as { user?: any };
      if (response.user) {
        setUser(response.user);
        setAuthenticated(true);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      logout();
    }
  };

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await api.login(credentials) as { token: string; user: any };
      api.setToken(response.token);
      setUser(response.user);
      setAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
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
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    api.clearToken();
    logout();
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout: handleLogout,
    validateToken,
  };
};
