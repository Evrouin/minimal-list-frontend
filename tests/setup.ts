import { vi } from 'vitest'
import { ref } from 'vue'

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
vi.stubGlobal('useReminders', () => ({
  schedule: vi.fn(),
  cancel: vi.fn(),
  syncAll: vi.fn(),
}))
vi.stubGlobal('useLinkPreviews', () => ({
  extractUrls: vi.fn().mockReturnValue([]),
  fetchPreviews: vi.fn().mockResolvedValue([]),
  isLoading: ref(false),
}))
