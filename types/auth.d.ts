export interface User {
  id: number
  email: string
  username: string
  phone: string
  avatar: string
  avatar_url: string
  bio: string
  has_password: boolean
  is_active: boolean
  is_verified: boolean
  is_superuser: boolean
  created_at: string
  updated_at: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  username: string
  password: string
  password2: string
  phone?: string
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
  new_password2: string
}

export interface PasswordResetRequestPayload {
  email: string
}

export interface PasswordResetConfirmPayload {
  token: string
  new_password: string
  new_password2: string
}
