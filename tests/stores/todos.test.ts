import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTodoStore } from '~/stores/todos'

const mockApi = {
  fetchTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
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
      data: [{ id: 1, title: 'test', body: 'body', completed: false, deleted: false }],
    })
    const store = useTodoStore()
    await store.loadTodos()
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0].title).toBe('test')
    expect(store.todos[0].editing).toBe(false)
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
    const newTodo = { id: 1, title: 'new', body: 'body', completed: false, deleted: false }
    mockApi.createTodo.mockResolvedValue({ data: newTodo })
    const store = useTodoStore()
    await store.addTodo({ title: 'new', body: 'body' })
    expect(mockApi.createTodo).toHaveBeenCalledWith({ title: 'new', body: 'body' })
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0].title).toBe('new')
  })

  it('should optimistically update and call API', async () => {
    const todo = { id: 1, title: 'original', body: 'body', completed: false, deleted: false, editing: false }
    mockApi.updateTodo.mockResolvedValue({ data: { ...todo, title: 'updated' } })
    const store = useTodoStore()
    store.todos = [todo]
    await store.updateTodo({ ...todo, title: 'updated' })
    expect(store.todos[0].title).toBe('updated')
  })

  it('should rollback on update failure', async () => {
    const todo = { id: 1, title: 'original', body: 'body', completed: false, deleted: false, editing: false }
    mockApi.updateTodo.mockRejectedValue(new Error('fail'))
    const store = useTodoStore()
    store.todos = [todo]
    await expect(store.updateTodo({ ...todo, title: 'updated' })).rejects.toThrow()
    expect(store.todos[0].title).toBe('original')
  })

  it('should toggle todo completion', async () => {
    const todo = { id: 1, title: 'test', body: 'body', completed: false, deleted: false, editing: false }
    mockApi.updateTodo.mockResolvedValue({ data: { ...todo, completed: true } })
    const store = useTodoStore()
    store.todos = [todo]
    await store.toggleTodoCompletion(1)
    expect(store.todos[0].completed).toBe(true)
  })

  it('should soft delete (optimistic)', async () => {
    const todo = { id: 1, title: 'test', body: 'body', completed: false, deleted: false, editing: false }
    mockApi.deleteTodo.mockResolvedValue({})
    const store = useTodoStore()
    store.todos = [todo]
    await store.deleteTodo(1, false)
    expect(store.todos[0].deleted).toBe(true)
  })

  it('should permanently delete (optimistic)', async () => {
    const todo = { id: 1, title: 'test', body: 'body', completed: false, deleted: true, editing: false }
    mockApi.deleteTodo.mockResolvedValue({})
    const store = useTodoStore()
    store.todos = [todo]
    await store.deleteTodo(1, true)
    expect(store.todos).toHaveLength(0)
  })

  it('should rollback on delete failure', async () => {
    const todo = { id: 1, title: 'test', body: 'body', completed: false, deleted: false, editing: false }
    mockApi.deleteTodo.mockRejectedValue(new Error('fail'))
    const store = useTodoStore()
    store.todos = [todo]
    await expect(store.deleteTodo(1, false)).rejects.toThrow()
    expect(store.todos[0].deleted).toBe(false)
  })

  it('should filter todos correctly', () => {
    const store = useTodoStore()
    store.todos = [
      { id: 1, title: 'active', body: '', completed: false, deleted: false, editing: false },
      { id: 2, title: 'completed', body: '', completed: true, deleted: false, editing: false },
      { id: 3, title: 'deleted', body: '', completed: false, deleted: true, editing: false },
    ]

    store.filterType = 'all'
    expect(store.filteredTodos).toHaveLength(2)

    store.filterType = 'active'
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0].title).toBe('active')

    store.filterType = 'completed'
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0].title).toBe('completed')

    store.filterType = 'deleted'
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0].title).toBe('deleted')
  })
})
