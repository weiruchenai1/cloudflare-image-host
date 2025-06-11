import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

const BackgroundContainer: React.FC = () => {
  const { settings } = useAppStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bingImage, setBingImage] = useState<string>('');

  useEffect(() => {
    if (settings.backgroundMode === 'bing') {
      fetchBingImage();
    }
  }, [settings.backgroundMode]);

  useEffect(() => {
    if (settings.backgroundMode === 'carousel' && settings.backgroundImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev: number) =>
          (prev + 1) % settings.backgroundImages.length
        );
      }, settings.backgroundInterval);

      return () => clearInterval(interval);
    }
  }, [settings.backgroundMode, settings.backgroundImages, settings.backgroundInterval]);

  const fetchBingImage = async () => {
    try {
      const response = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1');
      const data = await response.json() as { images?: { url: string }[] };
      if (data.images && data.images[0]) {
        setBingImage(`https://www.bing.com${data.images[0].url}`);
      }
    } catch (error) {
      console.error('Failed to fetch Bing image:', error);
    }
  };

  const getBackgroundImage = () => {
    switch (settings.backgroundMode) {
      case 'single':
        return settings.backgroundImages[0];
      case 'carousel':
        return settings.backgroundImages[currentImageIndex];
      case 'bing':
        return bingImage;
      default:
        return '';
    }
  };

  const backgroundImage = getBackgroundImage();

  if (!backgroundImage) return null;

  return (
    <div className="fixed inset-0 -z-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={backgroundImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: settings.backgroundOpacity }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
        />
      </AnimatePresence>
      
      {/* 渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 dark:from-black/20 dark:to-white/10" />
    </div>
  );
};

export default BackgroundContainer;
