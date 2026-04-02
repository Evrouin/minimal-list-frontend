import type { Todo } from '../types'
import type { ApiResponse } from '../server/types/api'

export const useTodoApi = () => {
  const { request } = useApiFetch()
  const base = '/api/notes'

  return {
    fetchTodos: (params?: string, cursor?: string) => {
      if (cursor) return request<ApiResponse<Todo[]>>(cursor)
      return request<ApiResponse<Todo[]>>(`${base}/${params ? `?${params}` : ''}`)
    },

    createTodo: (todo: Partial<Todo> | FormData) =>
      request<ApiResponse<Todo>>(`${base}/`, { method: 'POST', body: todo }),

    updateTodo: (id: number, todo: Partial<Todo> | FormData) =>
      request<ApiResponse<Todo>>(`${base}/${id}/`, {
        method: 'PATCH',
        body: todo,
      }),

    deleteTodo: (id: number) =>
      request<ApiResponse<{ success: boolean }>>(`${base}/${id}/`, {
        method: 'DELETE',
      }),

    bulkDelete: (ids: number[]) =>
      request<{ success: boolean }>(`${base}/bulk-delete/`, {
        method: 'POST',
        body: { ids },
      }),

    bulkPin: (ids: number[], pinned: boolean) =>
      request<{ success: boolean }>(`${base}/bulk-pin/`, {
        method: 'POST',
        body: { ids, pinned },
      }),

    bulkRestore: (ids: number[]) =>
      request<{ success: boolean }>(`${base}/bulk-restore/`, {
        method: 'POST',
        body: { ids },
      }),
  }
}
