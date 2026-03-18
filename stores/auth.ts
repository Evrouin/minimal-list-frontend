import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTodoStore } from './todos'
import type {
  User,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  ChangePasswordPayload,
  PasswordResetRequestPayload,
  PasswordResetConfirmPayload,
} from '../types/auth'

const TOKEN_KEY = 'auth_tokens'

export const useAuthStore = defineStore('auth', () => {
  const api = useAuthApi()

  const user = ref<User | null>(null)
  const tokens = ref<AuthTokens | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!tokens.value?.access)
  const isAdmin = computed(() => !!user.value?.is_superuser)

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored && stored !== 'undefined') {
      try {
        tokens.value = JSON.parse(stored)
      } catch {
        localStorage.removeItem(TOKEN_KEY)
      }
    }
  }

  const saveTokens = (newTokens: AuthTokens) => {
    tokens.value = newTokens
    localStorage.setItem(TOKEN_KEY, JSON.stringify(newTokens))
  }

  const clearAuth = () => {
    tokens.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    const todoStore = useTodoStore()
    todoStore.todos = []
    todoStore.filterType = 'all'
    todoStore.initialLoad = true
    const { flushAll } = useUndoToast()
    flushAll()
  }

  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (e: unknown) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }

  const register = (payload: RegisterPayload) =>
    withLoading(() => api.register(payload))

  const login = (payload: LoginPayload) =>
    withLoading(async () => {
      const res = await api.login(payload)
      saveTokens(res)
      await fetchProfile()
      return res
    })

  const googleLogin = (googleToken: string) =>
    withLoading(async () => {
      const res = await api.googleLogin(googleToken)
      saveTokens(res.tokens)
      user.value = res.user
      return res
    })

  const refreshToken = async () => {
    if (!tokens.value?.refresh) return clearAuth()
    try {
      const res = await api.refreshToken(tokens.value.refresh)
      saveTokens({ ...tokens.value, access: res.access })
    } catch {
      clearAuth()
    }
  }

  const fetchProfile = async () => {
    try {
      user.value = await api.fetchProfile()
    } catch {
      await refreshToken()
      if (tokens.value?.access) {
        user.value = await api.fetchProfile()
      }
    }
  }

  const updateProfile = async (data: Partial<User> | FormData) => {
    user.value = await api.updateProfile(data)
    return user.value
  }

  const changePassword = async (payload: ChangePasswordPayload) => {
    const response = await api.changePassword(payload)
    if (response.tokens) {
      tokens.value = response.tokens
      localStorage.setItem(TOKEN_KEY, JSON.stringify(response.tokens))
    }
  }

  const setPassword = async (payload: { new_password: string; confirm_password: string; current_password?: string }) => {
    const response = await api.setPassword(payload)
    if (response.tokens) {
      tokens.value = response.tokens
      localStorage.setItem(TOKEN_KEY, JSON.stringify(response.tokens))
    }
    if (user.value) user.value.has_password = true
    return response
  }

  const verifyEmail = (token: string) => api.verifyEmail(token)

  const requestPasswordReset = (payload: PasswordResetRequestPayload) =>
    api.requestPasswordReset(payload)

  const confirmPasswordReset = (payload: PasswordResetConfirmPayload) =>
    api.confirmPasswordReset(payload)

  const deleteAccount = async () => {
    await api.deleteAccount()
    clearAuth()
  }

  const logout = () => {
    const refresh = tokens.value?.refresh
    clearAuth()
    if (refresh) api.logout(refresh).catch(() => {})
  }

  return {
    user,
    tokens,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    register,
    login,
    googleLogin,
    refreshToken,
    fetchProfile,
    updateProfile,
    changePassword,
    setPassword,
    verifyEmail,
    requestPasswordReset,
    confirmPasswordReset,
    deleteAccount,
    logout,
  }
})
