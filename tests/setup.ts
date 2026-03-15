import { vi } from 'vitest'

// Mock Nuxt auto-imports
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { authApiBase: 'http://localhost:8000/api/auth', googleClientId: '' },
}))
vi.stubGlobal('useTodoApi', () => ({
  fetchTodos: vi.fn().mockResolvedValue({ data: [] }),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}))
vi.stubGlobal('useApiFetch', () => ({
  request: vi.fn(),
}))
