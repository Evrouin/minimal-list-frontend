export interface ApiResponse<T = unknown> {
  data: T
  statusCode: number
  timestamp: string
  next?: string | null
  previous?: string | null
}

export interface ApiError {
  statusCode: number
  message: string
}
