import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Palette,
  Globe,
  Bell,
  Database,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { toast } from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { user, language, settings, updateSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'profile', icon: User, label: language === 'zh' ? '个人资料' : 'Profile' },
    { id: 'security', icon: Shield, label: language === 'zh' ? '安全设置' : 'Security' },
    { id: 'appearance', icon: Palette, label: language === 'zh' ? '外观设置' : 'Appearance' },
    { id: 'site', icon: Globe, label: language === 'zh' ? '网站设置' : 'Site Settings' },
    { id: 'notifications', icon: Bell, label: language === 'zh' ? '通知设置' : 'Notifications' },
    { id: 'storage', icon: Database, label: language === 'zh' ? '存储设置' : 'Storage' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    toast.success(language === 'zh' ? '设置已保存' : 'Settings saved successfully');
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {language === 'zh' ? '基本信息' : 'Basic Information'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'zh' ? '用户名' : 'Username'}
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'zh' ? '邮箱地址' : 'Email Address'}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {language === 'zh' ? '账户统计' : 'Account Statistics'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
              {language === 'zh' ? '已使用存储' : 'Storage Used'}
            </p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {((user?.storageUsed || 0) / 1024 / 1024 / 1024).toFixed(2)} GB
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400 mb-1">
              {language === 'zh' ? '文件总数' : 'Total Files'}
            </p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">1,284</p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">
              {language === 'zh' ? '分享链接' : 'Share Links'}
            </p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">156</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {language === 'zh' ? '修改密码' : 'Change Password'}
        </h3>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'zh' ? '当前密码' : 'Current Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'zh' ? '新密码' : 'New Password'}
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'zh' ? '确认新密码' : 'Confirm New Password'}
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {language === 'zh' ? '两步验证' : 'Two-Factor Authentication'}
        </h3>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {language === 'zh' ? '启用两步验证' : 'Enable Two-Factor Authentication'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'zh' ? '为您的账户添加额外的安全保护' : 'Add an extra layer of security to your account'}
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            {language === 'zh' ? '启用' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {language === 'zh' ? '背景设置' : 'Background Settings'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'zh' ? '背景模式' : 'Background Mode'}
            </label>
            <select 
              value={settings.backgroundMode}
              onChange={(e) => updateSettings({ backgroundMode: e.target.value as any })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="single">{language === 'zh' ? '单张图片' : 'Single Image'}</option>
              <option value="carousel">{language === 'zh' ? '图片轮播' : 'Image Carousel'}</option>
              <option value="bing">{language === 'zh' ? 'Bing每日壁纸' : 'Bing Daily Wallpaper'}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'zh' ? '背景透明度' : 'Background Opacity'}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.backgroundOpacity}
              onChange={(e) => updateSettings({ backgroundOpacity: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0%</span>
              <span>{Math.round(settings.backgroundOpacity * 100)}%</span>
              <span>100%</span>
            </div>
          </div>
          
          {settings.backgroundMode === 'carousel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'zh' ? '切换间隔（秒）' : 'Switch Interval (seconds)'}
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={settings.backgroundInterval / 1000}
                onChange={(e) => updateSettings({ backgroundInterval: parseInt(e.target.value) * 1000 })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSiteTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {language === 'zh' ? '网站基本信息' : 'Site Information'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'zh' ? '网站名称' : 'Site Name'}
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => updateSettings({ siteName: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'zh' ? '网站标题' : 'Site Title'}
            </label>
            <input
              type="text"
              value={settings.siteTitle}
              onChange={(e) => updateSettings({ siteTitle: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {language === 'zh' ? '功能设置' : 'Feature Settings'}
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {language === 'zh' ? '允许用户注册' : 'Allow User Registration'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'zh' ? '是否允许新用户通过邀请码注册' : 'Whether to allow new users to register with invitation codes'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowRegistration}
              onChange={(e) => updateSettings({ allowRegistration: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {language === 'zh' ? '显示页脚' : 'Show Footer'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'zh' ? '是否在页面底部显示页脚信息' : 'Whether to show footer information at the bottom of pages'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showFooter}
              onChange={(e) => updateSettings({ showFooter: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'security': return renderSecurityTab();
      case 'appearance': return renderAppearanceTab();
      case 'site': return renderSiteTab();
      default: return renderProfileTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {language === 'zh' ? '设置' : 'Settings'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {language === 'zh' ? '管理您的账户和应用程序设置' : 'Manage your account and application settings'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧标签栏 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* 右侧内容区 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            {renderContent()}
            
            {/* 保存按钮 */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                onClick={handleSave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{language === 'zh' ? '保存设置' : 'Save Settings'}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
