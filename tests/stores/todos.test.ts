import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Todo } from '~/types'
import { useTodoStore } from '~/stores/todos'

const makeTodo = (overrides: Partial<Todo> & { uuid: string }): Todo => ({
  folder: null,
  title: '',
  body: '',
  color: 'default',
  completed: false,
  deleted: false,
  pinned: false,
  editing: false,
  is_archived: false,
  archived_by_folder: false,
  ...overrides,
})

const mockApi = {
  fetchTodos: vi.fn(),
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
}

vi.stubGlobal('useTodoApi', () => mockApi)

describe('Todo Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with empty todos', () => {
    const store = useTodoStore()
    expect(store.todos).toEqual([])
    expect(store.filterType).toBe('all')
  })

  it('should load todos from API', async () => {
    mockApi.fetchTodos.mockResolvedValue({
      data: [makeTodo({ uuid: 'test-uuid-1', title: 'test', body: 'body' })],
    })
    const store = useTodoStore()
    await store.loadTodos()
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0]!.title).toBe('test')
    expect(store.todos[0]!.editing).toBe(false)
  })

  it('should set loading state during loadTodos', async () => {
    mockApi.fetchTodos.mockResolvedValue({ data: [] })
    const store = useTodoStore()
    const promise = store.loadTodos()
    expect(store.loading).toBe(true)
    await promise
    expect(store.loading).toBe(false)
  })

  it('should add a todo via API', async () => {
    const newTodo = makeTodo({ uuid: 'test-uuid-1', title: 'new', body: 'body' })
    mockApi.createTodo.mockResolvedValue({ data: newTodo })
    const store = useTodoStore()
    await store.addTodo({ title: 'new', body: 'body' })
    expect(mockApi.createTodo).toHaveBeenCalledWith({ title: 'new', body: 'body' })
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0]!.title).toBe('new')
  })

  it('should optimistically update and call API', async () => {
    const todo = makeTodo({ uuid: 'test-uuid-1', title: 'original', body: 'body' })
    mockApi.updateTodo.mockResolvedValue({ data: { ...todo, title: 'updated' } })
    const store = useTodoStore()
    store.todos = [todo]
    await store.updateTodo({ ...todo, title: 'updated' })
    expect(store.todos[0]!.title).toBe('updated')
  })

  it('should rollback on update failure', async () => {
    const todo = makeTodo({ uuid: 'test-uuid-1', title: 'original', body: 'body' })
    mockApi.updateTodo.mockRejectedValue(new Error('fail'))
    const store = useTodoStore()
    store.todos = [todo]
    await expect(store.updateTodo({ ...todo, title: 'updated' })).rejects.toThrow()
    expect(store.todos[0]!.title).toBe('original')
  })

  it('should toggle todo completion', async () => {
    const todo = makeTodo({ uuid: 'test-uuid-1', title: 'test', body: 'body' })
    mockApi.updateTodo.mockResolvedValue({ data: { ...todo, completed: true } })
    const store = useTodoStore()
    store.todos = [todo]
    await store.toggleTodoCompletion('test-uuid-1')
    expect(store.todos[0]!.completed).toBe(true)
  })

  it('should dismiss reminder when completing a note with reminder_at', async () => {
    const todo = makeTodo({ uuid: 'test-uuid-1', reminder_at: '2026-01-01T00:00:00Z' })
    mockApi.updateTodo.mockResolvedValue({ data: { ...todo, completed: true, reminder_at: null } })
    const store = useTodoStore()
    store.todos = [todo]
    await store.toggleTodoCompletion('test-uuid-1')
    const call = mockApi.updateTodo.mock.calls[0]!
    expect(call[1]).toMatchObject({ completed: true, reminder_at: null })
  })

  it('should fetch trash and set filterType to deleted', async () => {
    mockApi.fetchTodos.mockResolvedValue({
      data: [makeTodo({ uuid: 'test-uuid-1', deleted: true })],
    })
    const store = useTodoStore()
    await store.fetchTrash()
    expect(mockApi.fetchTodos).toHaveBeenCalledWith('deleted_only=true')
    expect(store.filterType).toBe('deleted')
    expect(store.todos).toHaveLength(1)
  })

  it('should fetch archived and set filterType to archived', async () => {
    mockApi.fetchTodos.mockResolvedValue({
      data: [makeTodo({ uuid: 'test-uuid-1', is_archived: true })],
    })
    const store = useTodoStore()
    await store.fetchArchived()
    expect(mockApi.fetchTodos).toHaveBeenCalledWith('archived_only=true')
    expect(store.filterType).toBe('archived')
    expect(store.todos).toHaveLength(1)
  })

  it('should archive a note optimistically', async () => {
    mockApi.archiveNote.mockResolvedValue({ data: {} })
    const store = useTodoStore()
    store.todos = [makeTodo({ uuid: 'test-uuid-1' })]
    await store.archiveNote('test-uuid-1')
    expect(store.todos).toHaveLength(0)
    expect(mockApi.archiveNote).toHaveBeenCalledWith('test-uuid-1')
  })

  it('should rollback archive on failure', async () => {
    mockApi.archiveNote.mockRejectedValue(new Error('fail'))
    const store = useTodoStore()
    store.todos = [makeTodo({ uuid: 'test-uuid-1' })]
    await expect(store.archiveNote('test-uuid-1')).rejects.toThrow()
    expect(store.todos).toHaveLength(1)
  })

  it('should clearTodos', () => {
    const store = useTodoStore()
    store.todos = [makeTodo({ uuid: 'test-uuid-1' })]
    store.clearTodos()
    expect(store.todos).toHaveLength(0)
  })

  it('should reorder pinned todos and call bulkReorder', async () => {
    const todos = [
      makeTodo({ uuid: 'test-uuid-1', pinned: true, order_id: 3 }),
      makeTodo({ uuid: 'test-uuid-2', pinned: true, order_id: 2 }),
      makeTodo({ uuid: 'test-uuid-3', order_id: 1 }),
    ]
    mockApi.bulkReorder.mockResolvedValue({ success: true })
    const store = useTodoStore()
    store.todos = todos
    const snapshot = store.reorderTodosBySection('pinned', ['test-uuid-1'])
    await store.bulkReorderCommit('test-uuid-1', 2, true)
    expect(mockApi.bulkReorder).toHaveBeenCalledWith('test-uuid-1', 2, true)
    expect(store.todos.find((t) => t.uuid === 'test-uuid-2')!.order_id)
      .toBeGreaterThan(store.todos.find((t) => t.uuid === 'test-uuid-1')!.order_id!)
    expect(snapshot[0]!.uuid).toBe('test-uuid-1')
  })

  it('should rollback reorder on failure', async () => {
    const todos = [
      makeTodo({ uuid: 'test-uuid-1', pinned: true, order_id: 2 }),
      makeTodo({ uuid: 'test-uuid-2', pinned: true, order_id: 1 }),
    ]
    mockApi.bulkReorder.mockRejectedValue(new Error('fail'))
    const store = useTodoStore()
    store.todos = todos
    const snapshot = store.reorderTodosBySection('pinned', ['test-uuid-1'])
    await expect(store.bulkReorderCommit('test-uuid-1', 2, true)).rejects.toThrow()
    store.reorderRollback(snapshot)
    expect(store.todos[0]!.uuid).toBe('test-uuid-1')
    expect(store.todos[1]!.uuid).toBe('test-uuid-2')
  })

  it('should soft delete (optimistic)', () => {
    const store = useTodoStore()
    store.todos = [makeTodo({ uuid: 'test-uuid-1' })]
    store.deleteTodo('test-uuid-1', false)
    expect(store.todos[0]!.deleted).toBe(true)
  })

  it('should permanently delete (optimistic)', () => {
    const store = useTodoStore()
    store.todos = [makeTodo({ uuid: 'test-uuid-1', deleted: true })]
    store.deleteTodo('test-uuid-1', true)
    expect(store.todos).toHaveLength(0)
  })

  it('should rollback on delete', () => {
    const store = useTodoStore()
    store.todos = [makeTodo({ uuid: 'test-uuid-1' })]
    const snapshot = store.deleteTodo('test-uuid-1', false)
    expect(store.todos[0]!.deleted).toBe(true)
    store.deleteTodoRollback(snapshot)
    expect(store.todos[0]!.deleted).toBe(false)
  })

  it('should filter todos correctly', () => {
    const store = useTodoStore()
    store.todos = [
      makeTodo({ uuid: 'test-uuid-1', title: 'active' }),
      makeTodo({ uuid: 'test-uuid-2', title: 'completed', completed: true }),
      makeTodo({ uuid: 'test-uuid-3', title: 'deleted', deleted: true }),
      makeTodo({ uuid: 'test-uuid-4', title: 'archived', is_archived: true }),
    ]

    store.filterType = 'all'
    expect(store.filteredTodos).toHaveLength(2)

    store.filterType = 'active'
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0]!.title).toBe('active')

    store.filterType = 'completed'
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0]!.title).toBe('completed')

    store.filterType = 'deleted'
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0]!.title).toBe('deleted')

    store.filterType = 'archived'
    // archived bypasses client filter — API pre-filters; all todos in store pass through
    expect(store.filteredTodos).toHaveLength(4)
  })
})
