import type { Todo } from '../types'
import type { ApiResponse } from '../server/types/api'

export const useTodoApi = () => {
  const { request } = useApiFetch()
  const base = '/api/todos'

  return {
    fetchTodos: (includeDeleted = false) =>
      request<ApiResponse<Todo[]>>(
        `${base}/${includeDeleted ? '?include_deleted=true' : ''}`,
      ),

    createTodo: (todo: Partial<Todo>) =>
      request<ApiResponse<Todo>>(`${base}/`, { method: 'POST', body: todo }),

    updateTodo: (id: number, todo: Partial<Todo>) =>
      request<ApiResponse<Todo>>(`${base}/${id}/`, { method: 'PATCH', body: todo }),

    deleteTodo: (id: number) =>
      request<ApiResponse<{ success: boolean }>>(`${base}/${id}/`, { method: 'DELETE' }),
  }
}
