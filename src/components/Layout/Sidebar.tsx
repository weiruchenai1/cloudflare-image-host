import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Upload, 
  FolderOpen, 
  Share, 
  Settings,
  Users,
  BarChart3,
  FileText,
  ChevronDown,
  Crown
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const Sidebar: React.FC = () => {
  const { user, language, sidebarCollapsed } = useAppStore();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>(['admin']);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: Home, 
      label: language === 'zh' ? '控制台' : 'Dashboard',
      badge: null
    },
    { 
      path: '/upload', 
      icon: Upload, 
      label: language === 'zh' ? '上传文件' : 'Upload',
      badge: null
    },
    { 
      path: '/files', 
      icon: FolderOpen, 
      label: language === 'zh' ? '文件管理' : 'Files',
      badge: null
    },
    { 
      path: '/shares', 
      icon: Share, 
      label: language === 'zh' ? '分享管理' : 'Shares',
      badge: 3 // 示例徽章
    },
    { 
      path: '/settings', 
      icon: Settings, 
      label: language === 'zh' ? '设置' : 'Settings',
      badge: null
    }
  ];

  const adminMenuItems = [
    { 
      path: '/admin/users', 
      icon: Users, 
      label: language === 'zh' ? '用户管理' : 'Users',
      badge: null
    },
    { 
      path: '/admin/analytics', 
      icon: BarChart3, 
      label: language === 'zh' ? '数据分析' : 'Analytics',
      badge: null
    }
  ];

  // 折叠状态的渲染
  if (sidebarCollapsed) {
    return (
      <div className="w-16 h-full flex flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-r border-gray-200 dark:border-gray-700">
        {/* 折叠状态的 Logo */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* 折叠状态的菜单 */}
        <nav className="flex-1 p-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {user?.role === 'admin' && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`
                      relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-purple-500 text-white shadow-lg' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>
      </div>
    );
  }

  // 完整状态的渲染
  return (
    <div className="w-70 h-full flex flex-col">
      {/* Logo区域 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center space-x-3"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              云图床
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              v1.0.0
            </p>
          </div>
        </motion.div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <motion.div
              key={item.path}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  group relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium flex-1">{item.label}</span>
                
                {item.badge && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    location.pathname === item.path
                      ? 'bg-white/20 text-white' 
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
                
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-2 w-2 h-2 bg-white rounded-full"
                  />
                )}
              </NavLink>
            </motion.div>
          );
        })}

        {/* 管理员菜单 */}
        {user?.role === 'admin' && (
          <div className="pt-4">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-2"
            >
              <button
                onClick={() => toggleMenu('admin')}
                className="w-full flex items-center space-x-3 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <Crown className="w-4 h-4" />
                <span className="text-sm font-medium flex-1">
                  {language === 'zh' ? '管理功能' : 'Administration'}
                </span>
                <motion.div
                  animate={{ rotate: expandedMenus.includes('admin') ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </button>
            </motion.div>

            <AnimatePresence>
              {expandedMenus.includes('admin') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1 overflow-hidden"
                >
                  {adminMenuItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <motion.div
                        key={item.path}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <NavLink
                          to={item.path}
                          className={({ isActive }) => `
                            group relative flex items-center space-x-3 px-4 py-2 ml-4 rounded-lg transition-all duration-200
                            ${isActive 
                              ? 'bg-purple-500 text-white shadow-lg' 
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.label}</span>
                          
                          {isActive && (
                            <motion.div
                              layoutId="adminActiveIndicator"
                              className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"
                            />
                          )}
                        </NavLink>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* 用户信息 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.username}
            </p>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role === 'admin' ? (language === 'zh' ? '管理员' : 'Admin') : (language === 'zh' ? '用户' : 'User')}
              </p>
              {user?.role === 'admin' && (
                <Crown className="w-3 h-3 text-yellow-500" />
              )}
            </div>
          </div>
        </motion.div>
        
        {/* 存储使用情况简要显示 */}
        <div className="mt-3 px-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>{language === 'zh' ? '存储使用' : 'Storage'}</span>
            <span>
              {((user?.storageUsed || 0) / 1024 / 1024 / 1024).toFixed(1)}GB / 
              {((user?.storageQuota || 0) / 1024 / 1024 / 1024).toFixed(0)}GB
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(((user?.storageUsed || 0) / (user?.storageQuota || 1)) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
