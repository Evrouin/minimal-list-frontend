import type { Todo } from '../types'
import type { ApiResponse } from '../server/types/api'

export const useTodoApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.authApiBase as string
  const todosBase = apiBase.replace('/auth', '/todos')

  const todoFetch = <T>(url: string, opts: Record<string, unknown> = {}): Promise<T> => {
    const tokens = JSON.parse(localStorage.getItem('auth_tokens') || 'null')
    const headers: Record<string, string> = {}
    if (tokens?.access) {
      headers.Authorization = `Bearer ${tokens.access}`
    }
    return $fetch<T>(`${todosBase}${url}`, {
      ...opts,
      headers: { ...headers, ...(opts.headers as Record<string, string>) },
    })
  }

  const fetchTodos = (includeDeleted = false) =>
    todoFetch<ApiResponse<Todo[]>>(
      `/${includeDeleted ? '?include_deleted=true' : ''}`,
    )

  const createTodo = (todo: Partial<Todo>) =>
    todoFetch<ApiResponse<Todo>>('/', { method: 'POST', body: todo })

  const updateTodo = (id: number, todo: Partial<Todo>) =>
    todoFetch<ApiResponse<Todo>>(`/${id}/`, { method: 'PATCH', body: todo })

  const deleteTodo = (id: number) =>
    todoFetch<ApiResponse<{ success: boolean }>>(`/${id}/`, { method: 'DELETE' })

  return {
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
  }
}
