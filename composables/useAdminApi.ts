import type { User } from '../types/auth'
import type { Todo } from '../types'
import type { ApiResponse } from '../server/types/api'

interface AdminStats {
  users: { total: number; verified: number; joined_today: number }
  todos: { total: number; completed: number; deleted: number; active: number }
}

interface AdminTodo extends Todo {
  user_email: string
  username: string
}

export type { AdminTodo }

export const useAdminApi = () => {
  const { request } = useApiFetch()
  const base = '/api/admin'

  return {
    getStats: () => request<AdminStats>(`${base}/stats/`),
    getUsers: (search?: string) => {
      const query = search ? `?search=${encodeURIComponent(search)}` : ''
      return request<{ results: User[] }>(`${base}/users/${query}`).then(
        (r) => r.results
      )
    },
    getUser: (id: number) => request<User>(`${base}/users/${id}/`),
    createUser: (data: {
      email: string
      username: string
      password: string
      is_superuser?: boolean
      is_verified?: boolean
    }) => request<User>(`${base}/users/`, { method: 'POST', body: data }),
    updateUser: (id: number, data: Partial<User>) =>
      request<User>(`${base}/users/${id}/`, { method: 'PATCH', body: data }),
    deleteUser: (id: number) =>
      request(`${base}/users/${id}/`, { method: 'DELETE' }),
    getTodos: (cursor?: string, search?: string) => {
      if (cursor)
        return request<ApiResponse<AdminTodo[]> & { results?: AdminTodo[] }>(
          cursor
        )
      const query = search ? `?search=${encodeURIComponent(search)}` : ''
      return request<ApiResponse<AdminTodo[]> & { results?: AdminTodo[] }>(
        `${base}/todos/${query}`
      )
    },
    getTodo: (id: number) => request<AdminTodo>(`${base}/todos/${id}/`),
    deleteTodo: (id: number) =>
      request(`${base}/todos/${id}/`, { method: 'DELETE' }),
  }
}
