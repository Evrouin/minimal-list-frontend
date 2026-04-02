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
        (err as { response?: { status?: number } }).response?.status || 0
      if (i === retries || !isRetryable(status)) throw err
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i))
    }
  }
  throw new Error('unreachable')
}

export const useApiFetch = () => {
  const config = useRuntimeConfig()
  const baseUrl = (config.public.authApiBase as string).replace('/api/auth', '')

  const request = async <T>(
    url: string,
    opts: Record<string, unknown> = {}
  ): Promise<T> => {
    const tokens = JSON.parse(localStorage.getItem('auth_tokens') || 'null')
    const headers: Record<string, string> = {}
    if (tokens?.access) {
      headers.Authorization = `Bearer ${tokens.access}`
    }

    try {
      return (await withRetry(() =>
        $fetch<T>(`${baseUrl}${url}`, {
          ...opts,
          headers: { ...headers, ...(opts.headers as Record<string, string>) },
        })
      )) as T
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; _data?: Record<string, unknown> }
        message?: string
      }
      const status = error.response?.status || 500
      const data = error.response?._data as Record<string, unknown> | undefined

      // extract message from DRF error responses
      let message = 'something went wrong'
      if (data) {
        if (typeof data.detail === 'string') message = data.detail
        else if (typeof data.error === 'string') message = data.error
        else if (typeof data.message === 'string') message = data.message
        else {
          // field errors like { email: ["already exists"] }
          const firstField = Object.entries(data).find(([, v]) =>
            Array.isArray(v)
          )
          if (firstField)
            message = `${firstField[0]}: ${(firstField[1] as string[])[0]}`
        }
      }

      // auto-refresh on 401, retry once
      if (status === 401 && tokens?.refresh && !opts._retried) {
        try {
          const refreshRes = await $fetch<{ access: string }>(
            `${baseUrl}/api/auth/token/refresh/`,
            {
              method: 'POST',
              body: { refresh: tokens.refresh },
            }
          )
          const newTokens = { ...tokens, access: refreshRes.access }
          localStorage.setItem('auth_tokens', JSON.stringify(newTokens))
          return await request<T>(url, { ...opts, _retried: true })
        } catch {
          // refresh failed — clear and redirect
        }
      }

      if (status === 503) {
        window.location.href = '/maintenance'
        return new Promise<never>(() => {})
      }

      if (status >= 500) {
        showError({ statusCode: status, message })
        return new Promise<never>(() => {})
      }

      if (status === 401) {
        const { clearAuth } = useAuthStore()
        clearAuth()
        if (window.location.pathname !== '/auth/login') {
          navigateTo('/auth/login')
        }
      }

      throw { statusCode: status, message } as ApiError
    }
  }

  return { request }
}
