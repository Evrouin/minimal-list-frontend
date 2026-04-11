import { vi } from 'vitest'
import { ref, watch } from 'vue'

vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('watch', watch)
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { authApiBase: 'http://localhost:8000/api/auth', googleClientId: '' },
}))
vi.stubGlobal('useTodoApi', () => ({
  fetchTodos: vi.fn().mockResolvedValue({ data: [] }),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  bulkDelete: vi.fn(),
  bulkPin: vi.fn(),
  bulkRestore: vi.fn(),
  bulkReorder: vi.fn(),
  archiveNote: vi.fn(),
  unarchiveNote: vi.fn(),
  fetchFolders: vi.fn().mockResolvedValue({ data: [] }),
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
vi.stubGlobal('useFolderStore', () => ({
  activeFolder: null,
  folders: [],
}))
