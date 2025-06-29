// src/App.tsx - 修复版本
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store/useAppStore';
import { api } from './utils/api';
import ErrorBoundary from './components/ErrorBoundary';
import Loading from './components/Loading';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import InitSetupPage from './pages/auth/InitSetupPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import FilesPage from './pages/FilesPage';
import SharesPage from './pages/SharesPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/admin/UsersPage';
import NotFoundPage from './pages/NotFoundPage';

// Layout
import MainLayout from './components/Layout/MainLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5分钟
      refetchOnWindowFocus: false,
    },
  },
});

// 系统初始化检查组件
const SystemInitChecker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const status = await api.getSystemStatus();
      setIsInitialized(status.initialized);
    } catch (error) {
      console.error('Failed to check system status:', error);
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading text="检查系统状态..." fullScreen />;
  }

  if (!isInitialized) {
    return <InitSetupPage />;
  }

  return <>{children}</>;
};

// 认证检查组件
const AuthChecker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, setUser, setAuthenticated, logout } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      api.setToken(token);
      const response = await api.validateToken();
      if (response.user) {
        setUser(response.user);
        setAuthenticated(true);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading text="验证身份..." fullScreen />;
  }

  return <>{children}</>;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { isAuthenticated, user } = useAppStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <SystemInitChecker>
            <AuthChecker>
              <div className="App">
                <Routes>
                  {/* 公开路由 */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  
                  {/* 受保护的路由 */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="upload" element={<UploadPage />} />
                    <Route path="files" element={<FilesPage />} />
                    <Route path="shares" element={<SharesPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    
                    {/* 管理员路由 */}
                    <Route path="admin/users" element={
                      <ProtectedRoute adminOnly>
                        <UsersPage />
                      </ProtectedRoute>
                    } />
                  </Route>

                  {/* 404页面 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: 'var(--toast-bg)',
                      color: 'var(--toast-color)',
                      border: '1px solid var(--toast-border)',
                    },
                    className: 'backdrop-blur-md',
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#ffffff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#ffffff',
                      },
                    },
                  }}
                />
              </div>
            </AuthChecker>
          </SystemInitChecker>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;