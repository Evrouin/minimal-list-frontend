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

    updateTodo: (id: string, todo: Partial<Todo> | FormData) =>
      request<ApiResponse<Todo>>(`${base}/${id}/`, {
        method: 'PATCH',
        body: todo,
      }),

    deleteTodo: (id: string) =>
      request<ApiResponse<{ success: boolean }>>(`${base}/${id}/`, {
        method: 'DELETE',
      }),

    bulkDelete: (ids: string[]) =>
      request<{ success: boolean }>(`${base}/bulk-delete/`, {
        method: 'POST',
        body: { ids },
      }),

    bulkPin: (ids: string[], pinned: boolean) =>
      request<{ success: boolean }>(`${base}/bulk-pin/`, {
        method: 'POST',
        body: { ids, pinned },
      }),

    bulkRestore: (ids: string[]) =>
      request<{ success: boolean }>(`${base}/bulk-restore/`, {
        method: 'POST',
        body: { ids },
      }),

    fetchLinkPreview: (url: string) =>
      request<import('~/types/todo').LinkPreview>(`${base}/link-preview/`, {
        method: 'POST',
        body: { url },
      }),
  }
}
