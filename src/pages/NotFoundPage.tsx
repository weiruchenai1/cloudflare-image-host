import React from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

const NotFoundPage: React.FC = () => {
  const { language } = useAppStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        {/* 404 图标 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <div className="relative">
            <div className="text-9xl font-bold text-gray-200 dark:text-gray-700">404</div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
            >
              <Search className="w-6 h-6 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* 错误信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {language === 'zh' ? '页面未找到' : 'Page Not Found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {language === 'zh' 
              ? '抱歉，您访问的页面不存在或已被移动。' 
              : 'Sorry, the page you are looking for does not exist or has been moved.'}
          </p>
        </motion.div>

        {/* 操作按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'zh' ? '返回上页' : 'Go Back'}</span>
          </motion.button>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/dashboard"
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>{language === 'zh' ? '回到首页' : 'Go Home'}</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* 装饰元素 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-sm text-gray-400 dark:text-gray-600"
        >
          {language === 'zh' ? '如果您认为这是一个错误，请联系管理员。' : 'If you believe this is an error, please contact the administrator.'}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
