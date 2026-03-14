export interface ApiResponse<T = unknown> {
  data: T
  statusCode: number
  timestamp: string
}

export interface ApiError {
  statusCode: number
  message: string
}
