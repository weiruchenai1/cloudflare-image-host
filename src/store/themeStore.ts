import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ThemeConfig } from '@/types'

interface ThemeStore {
  config: ThemeConfig
  setTheme: (mode: 'light' | 'dark' | 'system') => void
  setPrimaryColor: (color: string) => void
  setAccentColor: (color: string) => void
  toggleGlassEffect: () => void
  toggleAnimations: () => void
  toggleParticles: () => void
  resetToDefaults: () => void
}

const defaultTheme: ThemeConfig = {
  mode: 'system',
  primaryColor: '#3b82f6',
  accentColor: '#10b981',
  glassEffect: true,
  animations: true,
  particles: true,
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      config: defaultTheme,

      setTheme: (mode) => {
        set((state) => ({
          config: { ...state.config, mode },
        }))

        // Apply theme to document
        const applyTheme = () => {
          const isDark = mode === 'dark' || 
            (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
          
          if (isDark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }

        applyTheme()

        // Listen for system theme changes if mode is 'system'
        if (mode === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleChange = () => applyTheme()
          mediaQuery.addEventListener('change', handleChange)
          
          // Cleanup function would be needed in a real component
          return () => mediaQuery.removeEventListener('change', handleChange)
        }
      },

      setPrimaryColor: (color) => {
        set((state) => ({
          config: { ...state.config, primaryColor: color },
        }))
        
        // Apply CSS custom property
        document.documentElement.style.setProperty('--primary-color', color)
      },

      setAccentColor: (color) => {
        set((state) => ({
          config: { ...state.config, accentColor: color },
        }))
        
        // Apply CSS custom property
        document.documentElement.style.setProperty('--accent-color', color)
      },

      toggleGlassEffect: () => {
        set((state) => ({
          config: { ...state.config, glassEffect: !state.config.glassEffect },
        }))
      },

      toggleAnimations: () => {
        set((state) => ({
          config: { ...state.config, animations: !state.config.animations },
        }))
        
        // Apply reduced motion preference
        const { animations } = get().config
        if (!animations) {
          document.documentElement.style.setProperty('--animation-duration', '0s')
        } else {
          document.documentElement.style.removeProperty('--animation-duration')
        }
      },

      toggleParticles: () => {
        set((state) => ({
          config: { ...state.config, particles: !state.config.particles },
        }))
      },

      resetToDefaults: () => {
        set({ config: defaultTheme })
        
        // Reset CSS custom properties
        document.documentElement.style.removeProperty('--primary-color')
        document.documentElement.style.removeProperty('--accent-color')
        document.documentElement.style.removeProperty('--animation-duration')
        
        // Reapply default theme
        get().setTheme(defaultTheme.mode)
      },
    }),
    {
      name: 'theme-storage',
    }
  )
)

// Initialize theme on app load
export const initializeTheme = () => {
  const { config, setTheme, setPrimaryColor, setAccentColor } = useThemeStore.getState()
  
  setTheme(config.mode)
  setPrimaryColor(config.primaryColor)
  setAccentColor(config.accentColor)
  
  if (!config.animations) {
    document.documentElement.style.setProperty('--animation-duration', '0s')
  }
}
