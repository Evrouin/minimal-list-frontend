export interface ApiError {
  statusCode: number
  message: string
  field?: string
}

export const useApiFetch = () => {
  const config = useRuntimeConfig()
  const baseUrl = (config.public.authApiBase as string).replace('/api/auth', '')

  const request = async <T>(
    url: string,
    opts: Record<string, unknown> = {},
  ): Promise<T> => {
    const tokens = JSON.parse(
      localStorage.getItem('auth_tokens') || 'null',
    )
    const headers: Record<string, string> = {}
    if (tokens?.access) {
      headers.Authorization = `Bearer ${tokens.access}`
    }

    try {
      return await $fetch<T>(`${baseUrl}${url}`, {
        ...opts,
        headers: { ...headers, ...(opts.headers as Record<string, string>) },
      })
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; _data?: Record<string, unknown> }; message?: string }
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
          const firstField = Object.entries(data).find(
            ([, v]) => Array.isArray(v),
          )
          if (firstField) message = `${firstField[0]}: ${(firstField[1] as string[])[0]}`
        }
      }

      // auto-redirect on 401 (token expired beyond refresh)
      if (status === 401) {
        localStorage.removeItem('auth_tokens')
        if (window.location.pathname !== '/auth/login') {
          navigateTo('/auth/login')
        }
      }

      throw { statusCode: status, message } as ApiError
    }
  }

  return { request }
}
