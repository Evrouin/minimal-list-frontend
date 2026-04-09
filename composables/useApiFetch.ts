import type { FetchError, RequestOptions } from '~/types/api'

export interface ApiError {
  statusCode: number
  message: string
  field?: string
}

const isRetryable = (status: number) => (status >= 500 && status !== 503) || status === 0

const withRetry = async <T>(fn: () => Promise<T>, retries = 2): Promise<T> => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      const status =
        (err as FetchError).response?.status || 0
      if (i === retries || !isRetryable(status)) throw err
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i))
    }
  }
  throw new Error('unreachable')
}

let refreshPromise: Promise<string> | null = null

export const useApiFetch = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.authApiBase.replace('/api/auth', '')

  const refreshAccessToken = async (): Promise<string> => {
    const tokens = JSON.parse(localStorage.getItem('auth_tokens') || 'null')
    if (!tokens?.refresh) throw new Error('no refresh token')

    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      try {
        const res = await $fetch(
          `${baseUrl}/api/auth/token/refresh/`,
          { method: 'POST', body: { refresh: tokens.refresh } },
        ) as { access: string; refresh?: string }
        const newTokens = { ...tokens, access: res.access, ...(res.refresh && { refresh: res.refresh }) }
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens))
        return res.access
      } catch (e: unknown) {
        const refreshStatus = (e as FetchError).response?.status
        if (refreshStatus === 429) {
          throw Object.assign(new Error('too many requests. try again later.'), { statusCode: 429 })
        }
        const { clearAuth } = useAuthStore()
        clearAuth()
        if (globalThis.location.pathname !== '/auth/login') {
          navigateTo('/auth/login')
        }
        throw new Error('refresh failed')
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  const parseErrorMessage = (data: Record<string, unknown> | undefined): string => {
    if (!data) return 'something went wrong'
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.error === 'string') return data.error
    if (typeof data.message === 'string') return data.message
    const firstField = Object.entries(data).find(([, v]) => Array.isArray(v))
    if (firstField) return `${firstField[0]}: ${(firstField[1] as string[])[0]}`
    return 'something went wrong'
  }

  const handleErrorStatus = async <T>(status: number, message: string, tokens: { refresh?: string } | null, url: string, opts: RequestOptions): Promise<T> => {
    if (status === 401 && tokens?.refresh && !opts._retried) {
      try {
        await refreshAccessToken()
        return await request<T>(url, { ...opts, _retried: true })
      } catch (refreshErr: unknown) {
        if ((refreshErr as ApiError)?.statusCode === 429) throw Object.assign(new Error('too many requests. try again later.'), { statusCode: 429 })
        throw Object.assign(new Error('session expired'), { statusCode: 401 })
      }
    }
    if (status === 429) throw Object.assign(new Error('too many requests. try again later.'), { statusCode: 429 })
    if (status === 503) {
      navigateTo('/maintenance')
      throw Object.assign(new Error('service unavailable'), { statusCode: 503 })
    }
    if (status >= 500) throw Object.assign(new Error(message), { statusCode: status })
    if (status === 401) {
      const { clearAuth } = useAuthStore()
      clearAuth()
      if (globalThis.location.pathname !== '/auth/login') navigateTo('/auth/login')
    }
    throw Object.assign(new Error(message), { statusCode: status })
  }

  const request = async <T>(
    url: string,
    opts: RequestOptions = {},
  ): Promise<T> => {
    const tokens = JSON.parse(localStorage.getItem('auth_tokens') || 'null')
    const headers: Record<string, string> = {}
    if (tokens?.access) {
      headers.Authorization = `Bearer ${tokens.access}`
    }

    try {
      return (await withRetry(() =>
        $fetch(`${baseUrl}${url}`, {
          ...opts,
          headers: { ...headers, ...(opts.headers as Record<string, string>) },
          timeout: 15000,
        }),
      )) as T
    } catch (err: unknown) {
      const error = err as FetchError
      const status = error.response?.status || 500
      const message = parseErrorMessage(error.response?._data)
      return handleErrorStatus<T>(status, message, tokens, url, opts)
    }
  }

  return { request }
}
