import type { User } from '../types/auth'
import type { Todo } from '../types'

interface AdminStats {
  users: { total: number; verified: number; joined_today: number }
  notes: { total: number; completed: number; deleted: number; active: number }
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
    getUsers: (page = 1, search?: string) => {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set('search', search)
      return request<{ count: number; next: string | null; previous: string | null; results: User[] }>(`${base}/users/?${params}`)
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
    getTodos: (page = 1, search?: string) => {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set('search', search)
      return request<{ count: number; next: string | null; previous: string | null; results: AdminTodo[] }>(`${base}/notes/?${params}`)
    },
    getTodo: (id: number) => request<AdminTodo>(`${base}/notes/${id}/`),
    deleteTodo: (id: number) =>
      request(`${base}/notes/${id}/`, { method: 'DELETE' }),
  }
}
