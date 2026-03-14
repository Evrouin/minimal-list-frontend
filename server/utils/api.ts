import type { H3Event } from 'h3'

export const apiResponse = <T>(data: T, statusCode = 200) => ({
  data,
  statusCode,
  timestamp: new Date().toISOString(),
})

export const apiError = (message: string, statusCode = 400) => {
  throw createError({ statusCode, message })
}

export const validateBody = async <T>(event: H3Event): Promise<T> => {
  try {
    return await readBody(event)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid request body' })
  }
}
