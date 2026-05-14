import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true })
      },

      updateUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      hasRole: (roles) => {
        const { user } = get()
        if (!user || !user.role) return false
        return roles.includes(user.role.role_name)
      },

      hasPermission: (permissions) => {
        const { user } = get()
        if (!user) return false
        if (user.role?.role_name === 'super_admin') return true
        
        const userPermissions = user.custom_permissions || []
        if (typeof permissions === 'string') {
          return userPermissions.includes(permissions)
        }
        return permissions.some(p => userPermissions.includes(p))
      },
    }),
    {
      name: 'it-training-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
