import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
  const user = ref<User | null>(null)
  const tokens = ref<AuthTokens | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!tokens.value?.access)

  // Restore tokens from localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored) tokens.value = JSON.parse(stored)
  }

  const saveTokens = (newTokens: AuthTokens) => {
    tokens.value = newTokens
    localStorage.setItem(TOKEN_KEY, JSON.stringify(newTokens))
  }

  const clearAuth = () => {
    tokens.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  const apiBase = () => {
    const config = useRuntimeConfig()
    return config.public.authApiBase as string
  }

  const authFetch = async <T>(
    url: string,
    opts: Record<string, unknown> = {},
  ): Promise<T> => {
    const headers: Record<string, string> = {}
    if (tokens.value?.access) {
      headers.Authorization = `Bearer ${tokens.value.access}`
    }
    return $fetch<T>(`${apiBase()}${url}`, {
      ...opts,
      headers: { ...headers, ...(opts.headers as Record<string, string>) },
    })
  }

  const register = async (payload: RegisterPayload) => {
    loading.value = true
    error.value = null
    try {
      const res = await authFetch<{ message: string }>('/register/', {
        method: 'POST',
        body: payload,
      })
      return res
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Registration failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  const login = async (payload: LoginPayload) => {
    loading.value = true
    error.value = null
    try {
      const res = await authFetch<AuthTokens>('/login/', {
        method: 'POST',
        body: payload,
      })
      saveTokens(res)
      await fetchProfile()
      return res
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Login failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  const googleLogin = async (googleToken: string) => {
    loading.value = true
    error.value = null
    try {
      const res = await authFetch<{ tokens: AuthTokens; user: User }>(
        '/login/google/',
        { method: 'POST', body: { token: googleToken } },
      )
      saveTokens(res.tokens)
      user.value = res.user
      return res
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Google login failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  const refreshToken = async () => {
    if (!tokens.value?.refresh) return clearAuth()
    try {
      const res = await $fetch<{ access: string }>(
        `${apiBase()}/token/refresh/`,
        { method: 'POST', body: { refresh: tokens.value.refresh } },
      )
      saveTokens({ ...tokens.value, access: res.access })
    } catch {
      clearAuth()
    }
  }

  const fetchProfile = async () => {
    try {
      user.value = await authFetch<User>('/profile/')
    } catch {
      // token might be expired, try refresh
      await refreshToken()
      if (tokens.value?.access) {
        user.value = await authFetch<User>('/profile/')
      }
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    user.value = await authFetch<User>('/profile/', {
      method: 'PATCH',
      body: data,
    })
    return user.value
  }

  const changePassword = async (payload: ChangePasswordPayload) => {
    return authFetch<{ message: string }>('/change-password/', {
      method: 'PUT',
      body: payload,
    })
  }

  const verifyEmail = async (token: string) => {
    return authFetch<{ message: string }>(`/verify-email/${token}/`, {
      method: 'POST',
    })
  }

  const requestPasswordReset = async (
    payload: PasswordResetRequestPayload,
  ) => {
    return authFetch<{ message: string }>('/password-reset/', {
      method: 'POST',
      body: payload,
    })
  }

  const confirmPasswordReset = async (
    payload: PasswordResetConfirmPayload,
  ) => {
    return authFetch<{ message: string }>('/password-reset/confirm/', {
      method: 'POST',
      body: payload,
    })
  }

  const deleteAccount = async () => {
    await authFetch('/delete-account/', { method: 'DELETE' })
    clearAuth()
  }

  const logout = () => clearAuth()

  return {
    user,
    tokens,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    googleLogin,
    refreshToken,
    fetchProfile,
    updateProfile,
    changePassword,
    verifyEmail,
    requestPasswordReset,
    confirmPasswordReset,
    deleteAccount,
    logout,
  }
})
