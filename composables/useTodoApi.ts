import type { Todo } from '../types'
import type { Folder } from '../types/folder'
import type { ApiResponse } from '../server/types/api'

export const useTodoApi = () => {
  const { request } = useApiFetch()
  const base = '/api/notes'

  return {
    fetchTodos: (params?: string, cursor?: string) => {
      if (cursor) return request<ApiResponse<Todo[]>>(cursor)
      const query = params ? `?${params}` : ''
      return request<ApiResponse<Todo[]>>(`${base}/${query}`)
    },

    createTodo: (todo: Partial<Todo> | FormData) =>
      request<ApiResponse<Todo>>(`${base}/`, { method: 'POST', body: todo }),

    updateTodo: (id: string, todo: Partial<Todo> | FormData) =>
      request<ApiResponse<Todo>>(`${base}/${id}/`, { method: 'PATCH', body: todo }),

    deleteTodo: (id: string) =>
      request<ApiResponse<{ success: boolean }>>(`${base}/${id}/`, { method: 'DELETE' }),

    bulkDelete: (ids: string[]) =>
      request<{ success: boolean }>(`${base}/bulk-delete/`, { method: 'POST', body: { ids } }),

    bulkPin: (ids: string[], pinned: boolean) =>
      request<{ success: boolean }>(`${base}/bulk-pin/`, { method: 'POST', body: { ids, pinned } }),

    bulkRestore: (ids: string[]) =>
      request<{ success: boolean }>(`${base}/bulk-restore/`, { method: 'POST', body: { ids } }),

    bulkReorder: (uuid: string, newPosition: number, pinned: boolean) =>
      request<{ success: boolean }>(`${base}/bulk-reorder/`, {
        method: 'POST',
        body: { uuid, new_position: newPosition, pinned },
      }),

    bulkArchive: (ids: string[], archived: boolean) =>
      request<{ success: boolean }>(`${base}/bulk-archive/`, { method: 'POST', body: { ids, archived } }),

    archiveNote: (id: string) =>
      request<ApiResponse<Todo>>(`${base}/${id}/archive/`, { method: 'POST' }),

    unarchiveNote: (id: string) =>
      request<ApiResponse<Todo>>(`${base}/${id}/unarchive/`, { method: 'POST' }),

    fetchLinkPreview: (url: string) =>
      request<import('~/types/todo').LinkPreview>(`${base}/link-preview/`, {
        method: 'POST',
        body: { url },
      }),

    clearTodos: (password: string) =>
      request<{ success: boolean }>(`${base}/clear-all/`, { method: 'POST', body: { password } }),

    emptyTrash: () =>
      request<{ success: boolean }>(`${base}/empty-trash/`, { method: 'DELETE' }),

    // Folder endpoints
    fetchFolders: (archived = false) =>
      request<ApiResponse<Folder[]>>(`${base}/folders/${archived ? '?archived=true' : ''}`),

    createFolder: (name: string) =>
      request<Folder>(`${base}/folders/`, { method: 'POST', body: { name } }),

    updateFolder: (id: string, data: { name?: string; order?: number }) =>
      request<Folder>(`${base}/folders/${id}/`, { method: 'PATCH', body: data }),

    deleteFolder: (id: string) =>
      request<{ success: boolean }>(`${base}/folders/${id}/`, { method: 'DELETE' }),

    archiveFolder: (id: string) =>
      request<Folder>(`${base}/folders/${id}/archive/`, { method: 'POST' }),

    unarchiveFolder: (id: string) =>
      request<Folder>(`${base}/folders/${id}/unarchive/`, { method: 'POST' }),

    reorderFolders: (folders: { uuid: string; order: number }[]) =>
      request<{ success: boolean }>(`${base}/folders/reorder/`, { method: 'POST', body: { folders } }),
  }
}

