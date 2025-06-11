import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AppSettings } from '../types';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'zh' | 'en';
  sidebarCollapsed: boolean;
  settings: AppSettings;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuth: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (lang: 'zh' | 'en') => void;
  toggleSidebar: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      theme: 'system',
      language: 'zh',
      sidebarCollapsed: false,
      settings: {
        siteName: '云图床',
        siteTitle: 'CloudFlare Image Host',
        backgroundMode: 'bing',
        backgroundImages: [],
        backgroundOpacity: 0.1,
        backgroundInterval: 30000,
        showFooter: true,
        footerLinks: [],
        defaultLanguage: 'zh',
        allowRegistration: true,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedFileTypes: ['image/*', 'video/*', '.pdf', '.zip', '.rar']
      },

      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      updateSettings: (newSettings) => 
        set({ settings: { ...get().settings, ...newSettings } }),
      logout: () => set({ user: null, isAuthenticated: false })
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed
      })
    }
  )
);
