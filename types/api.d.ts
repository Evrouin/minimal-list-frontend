export interface FetchError {
  response?: { status?: number; _data?: Record<string, unknown> }
  message?: string
}

export interface RequestOptions extends Record<string, unknown> {
  _retried?: boolean
  headers?: Record<string, string>
}

export interface CardRef {
  $el?: HTMLElement
}
