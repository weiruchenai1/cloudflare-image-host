import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthState } from '@/types'
import { apiClient } from '@/utils/api'
import Cookies from 'js-cookie'

interface AuthStore extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (data: { email: string; username: string; password: string; invitationCode: string }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true })
        try {
          const response = await apiClient.post('/auth/login', {
            email,
            password,
            rememberMe,
          })

          const { user, token } = response.data
          
          // Store token in cookies with appropriate expiration
          const cookieOptions = {
            expires: rememberMe ? 30 : 1, // 30 days or 1 day
            secure: window.location.protocol === 'https:',
            sameSite: 'strict' as const,
          }
          
          Cookies.set('auth_token', token, cookieOptions)

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({ isLoading: false })
          throw new Error(error.response?.data?.message || 'Login failed')
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const response = await apiClient.post('/auth/register', data)
          const { user, token } = response.data

          Cookies.set('auth_token', token, {
            expires: 1,
            secure: window.location.protocol === 'https:',
            sameSite: 'strict',
          })

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({ isLoading: false })
          throw new Error(error.response?.data?.message || 'Registration failed')
        }
      },

      logout: () => {
        Cookies.remove('auth_token')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      refreshUser: async () => {
        const token = get().token || Cookies.get('auth_token')
        if (!token) {
          get().logout()
          return
        }

        try {
          const response = await apiClient.get('/auth/me')
          
          set({
            user: response.data,
            token,
            isAuthenticated: true,
          })
        } catch (error) {
          get().logout()
        }
      },

      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          })
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Initialize auth state on app load
export const initializeAuth = async () => {
  const token = Cookies.get('auth_token')
  if (token) {
    useAuthStore.setState({ token })
    await useAuthStore.getState().refreshUser()
  }
}
