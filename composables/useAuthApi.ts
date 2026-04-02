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
  const { request } = useApiFetch()
  const base = '/api/auth'

  return {
    login: (payload: LoginPayload) =>
      request<AuthTokens>(`${base}/login/`, { method: 'POST', body: payload }),

    register: (payload: RegisterPayload) =>
      request<{ message: string }>(`${base}/register/`, {
        method: 'POST',
        body: payload,
      }),

    googleLogin: (token: string) =>
      request<{ tokens: AuthTokens; user: User }>(`${base}/login/google/`, {
        method: 'POST',
        body: { token },
      }),

    refreshToken: (refresh: string) =>
      request<{ access: string }>(`${base}/token/refresh/`, {
        method: 'POST',
        body: { refresh },
      }),

    fetchProfile: () => request<User>(`${base}/profile/`),

    updateProfile: (data: Partial<User> | FormData) =>
      request<User>(`${base}/profile/`, { method: 'PATCH', body: data }),

    changePassword: (payload: ChangePasswordPayload) =>
      request<{ message: string; tokens: { access: string; refresh: string } }>(
        `${base}/change-password/`,
        { method: 'PUT', body: payload }
      ),

    setPassword: (payload: { new_password: string; confirm_password: string; current_password?: string }) =>
      request<{ message: string; tokens: AuthTokens }>(
        `${base}/set-password/`,
        { method: 'POST', body: payload }
      ),

    logout: (refresh: string) =>
      request<{ message: string }>(`${base}/logout/`, {
        method: 'POST',
        body: { refresh },
      }),

    verifyEmail: (token: string) =>
      request<{ message: string }>(`${base}/verify-email/${token}/`, {
        method: 'POST',
      }),

    requestPasswordReset: (payload: PasswordResetRequestPayload) =>
      request<{ message: string }>(`${base}/password-reset/`, {
        method: 'POST',
        body: payload,
      }),

    confirmPasswordReset: (payload: PasswordResetConfirmPayload) =>
      request<{ message: string }>(`${base}/password-reset/confirm/`, {
        method: 'POST',
        body: payload,
      }),

    deleteAccount: () =>
      request(`${base}/delete-account/`, { method: 'DELETE' }),

    unlockAccount: (token: string) =>
      request<{ message: string }>(`${base}/unlock-account/${token}/`, { method: 'POST' }),
  }
}
