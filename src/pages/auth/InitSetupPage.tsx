import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Database, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

const InitSetupPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [setupData, setSetupData] = useState({
    adminUsername: '',
    adminPassword: '',
    confirmPassword: '',
    siteName: '云图床',
    siteTitle: 'CloudFlare Image Host',
    defaultStorageQuota: 5,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSetupData((prev: typeof setupData) => ({
      ...prev,
      [name]: name === 'defaultStorageQuota' ? parseInt(value) || 0 : value
    }));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!setupData.adminUsername.trim()) {
          toast.error('请输入管理员用户名');
          return false;
        }
        if (setupData.adminUsername.length < 3) {
          toast.error('用户名至少需要3个字符');
          return false;
        }
        if (!setupData.adminPassword) {
          toast.error('请输入管理员密码');
          return false;
        }
        if (setupData.adminPassword.length < 6) {
          toast.error('密码至少需要6个字符');
          return false;
        }
        if (setupData.adminPassword !== setupData.confirmPassword) {
          toast.error('两次输入的密码不一致');
          return false;
        }
        return true;
      case 2:
        if (!setupData.siteName.trim()) {
          toast.error('请输入网站名称');
          return false;
        }
        if (!setupData.siteTitle.trim()) {
          toast.error('请输入网站标题');
          return false;
        }
        return true;
      case 3:
        if (setupData.defaultStorageQuota < 1 || setupData.defaultStorageQuota > 100) {
          toast.error('存储配额必须在1-100GB之间');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep() && step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    if (!validateStep()) return;

    try {
      console.log('Sending setup data:', setupData);

      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      let data;
      try {
        data = await response.json() as { success?: boolean; message?: string };
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        const text = await response.text();
        console.log('Response text:', text);
        toast.error('服务器响应格式错误');
        return;
      }

      if (response.ok && data.success) {
        toast.success('初始化完成！');
        window.location.href = '/login';
      } else {
        toast.error(data.message || '初始化失败');
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast.error('网络错误，请检查连接');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                创建管理员账户
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                设置系统管理员的登录凭据
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  管理员用户名
                </label>
                <input
                  type="text"
                  name="adminUsername"
                  value={setupData.adminUsername}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                  placeholder="请输入管理员用户名"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  管理员密码
                </label>
                <input
                  type="password"
                  name="adminPassword"
                  value={setupData.adminPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                  placeholder="请输入密码"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  确认密码
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={setupData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                  placeholder="请再次输入密码"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                网站基本设置
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                配置网站的基本信息
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  网站名称
                </label>
                <input
                  type="text"
                  name="siteName"
                  value={setupData.siteName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                  placeholder="请输入网站名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  网站标题
                </label>
                <input
                  type="text"
                  name="siteTitle"
                  value={setupData.siteTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                  placeholder="请输入网站标题"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                存储配置
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                设置默认的存储配额
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  默认用户存储配额 (GB)
                </label>
                <input
                  type="number"
                  name="defaultStorageQuota"
                  min="1"
                  max="100"
                  value={setupData.defaultStorageQuota}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  配置总结
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• 管理员用户名: {setupData.adminUsername}</li>
                  <li>• 网站名称: {setupData.siteName}</li>
                  <li>• 网站标题: {setupData.siteTitle}</li>
                  <li>• 默认存储配额: {setupData.defaultStorageQuota} GB</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* 进度指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber <= step
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {stepNumber}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              第 {step} 步，共 3 步
            </p>
          </div>
        </div>

        {/* 主要内容 */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-200/50 dark:border-gray-700/50"
        >
          {renderStep()}

          {/* 导航按钮 */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handlePrev}
              disabled={step === 1}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              上一步
            </button>

            {step < 3 ? (
              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <span>下一步</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={handleFinish}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>完成初始化</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default InitSetupPage;

