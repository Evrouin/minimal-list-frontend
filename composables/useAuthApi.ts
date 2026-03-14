import type {
  User,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  ChangePasswordPayload,
  PasswordResetRequestPayload,
  PasswordResetConfirmPayload,
} from '../types/auth'

export const useAuthApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.authApiBase as string

  const authFetch = <T>(
    url: string,
    opts: Record<string, unknown> = {},
  ): Promise<T> => {
    const tokens = JSON.parse(localStorage.getItem('auth_tokens') || 'null')
    const headers: Record<string, string> = {}
    if (tokens?.access) {
      headers.Authorization = `Bearer ${tokens.access}`
    }
    return $fetch<T>(`${apiBase}${url}`, {
      ...opts,
      headers: { ...headers, ...(opts.headers as Record<string, string>) },
    })
  }

  const login = (payload: LoginPayload) =>
    authFetch<AuthTokens>('/login/', { method: 'POST', body: payload })

  const register = (payload: RegisterPayload) =>
    authFetch<{ message: string }>('/register/', { method: 'POST', body: payload })

  const googleLogin = (token: string) =>
    authFetch<{ tokens: AuthTokens; user: User }>('/login/google/', {
      method: 'POST',
      body: { token },
    })

  const refreshToken = (refresh: string) =>
    $fetch<{ access: string }>(`${apiBase}/token/refresh/`, {
      method: 'POST',
      body: { refresh },
    })

  const fetchProfile = () => authFetch<User>('/profile/')

  const updateProfile = (data: Partial<User>) =>
    authFetch<User>('/profile/', { method: 'PATCH', body: data })

  const changePassword = (payload: ChangePasswordPayload) =>
    authFetch<{ message: string }>('/change-password/', { method: 'PUT', body: payload })

  const verifyEmail = (token: string) =>
    authFetch<{ message: string }>(`/verify-email/${token}/`, { method: 'POST' })

  const requestPasswordReset = (payload: PasswordResetRequestPayload) =>
    authFetch<{ message: string }>('/password-reset/', { method: 'POST', body: payload })

  const confirmPasswordReset = (payload: PasswordResetConfirmPayload) =>
    authFetch<{ message: string }>('/password-reset/confirm/', { method: 'POST', body: payload })

  const deleteAccount = () =>
    authFetch('/delete-account/', { method: 'DELETE' })

  return {
    login,
    register,
    googleLogin,
    refreshToken,
    fetchProfile,
    updateProfile,
    changePassword,
    verifyEmail,
    requestPasswordReset,
    confirmPasswordReset,
    deleteAccount,
  }
}
