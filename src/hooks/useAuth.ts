import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = useCallback(async (username: string, password: string) => {
    try {
      setLoading(true);
      const response = await api.login({ username, password });
      if (response.success && response.data?.token) {
        api.setToken(response.data.token);
        // 获取用户信息
        const userResponse = await api.getUsers();
        if (userResponse.success && userResponse.data) {
          const currentUser = userResponse.data.find(u => u.username === username);
          if (currentUser) {
            setUser(currentUser);
            navigate('/');
            toast.success('登录成功');
          }
        }
      } else {
        toast.error(response.error || '登录失败');
      }
    } catch (error) {
      toast.error('登录失败');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const register = useCallback(async (data: {
    username: string;
    email: string;
    password: string;
    inviteCode: string;
  }) => {
    try {
      setLoading(true);
      const response = await api.register(data);
      if (response.success && response.data?.token) {
        api.setToken(response.data.token);
        // 获取用户信息
        const userResponse = await api.getUsers();
        if (userResponse.success && userResponse.data) {
          const currentUser = userResponse.data.find(u => u.username === data.username);
          if (currentUser) {
            setUser(currentUser);
            navigate('/');
            toast.success('注册成功');
          }
        }
      } else {
        toast.error(response.error || '注册失败');
      }
    } catch (error) {
      toast.error('注册失败');
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
      api.clearToken();
      setUser(null);
      navigate('/login');
      toast.success('已退出登录');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('退出登录失败');
    }
  }, [navigate]);

  return {
    user,
    loading,
    login,
    register,
    logout,
  };
}
