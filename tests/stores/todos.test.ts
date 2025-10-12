import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTodoStore } from '~/stores/todos'
import type { Todo } from '~/types'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

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

  it('should add a new todo', () => {
    const store = useTodoStore()
    const newTodo: Todo = {
      id: 1,
      title: 'test todo',
      body: 'test description',
      completed: false,
      deleted: false,
      editing: false,
    }

    store.addTodo(newTodo)
    expect(store.todos).toHaveLength(1)
    expect(store.todos[0]).toEqual(newTodo)
  })

  it('should toggle todo completion', () => {
    const store = useTodoStore()
    const todo: Todo = {
      id: 1,
      title: 'test',
      body: 'test',
      completed: false,
      deleted: false,
      editing: false,
    }

    store.addTodo(todo)
    store.toggleTodoCompletion(1)
    expect(store.todos[0].completed).toBe(true)

    store.toggleTodoCompletion(1)
    expect(store.todos[0].completed).toBe(false)
  })

  it('should update todo', () => {
    const store = useTodoStore()
    const todo: Todo = {
      id: 1,
      title: 'original',
      body: 'original',
      completed: false,
      deleted: false,
      editing: false,
    }

    store.addTodo(todo)
    store.updateTodo({ ...todo, title: 'updated', body: 'updated' })

    expect(store.todos[0].title).toBe('updated')
    expect(store.todos[0].body).toBe('updated')
  })

  it('should soft delete todo', () => {
    const store = useTodoStore()
    const todo: Todo = {
      id: 1,
      title: 'test',
      body: 'test',
      completed: false,
      deleted: false,
      editing: false,
    }

    store.addTodo(todo)
    store.deleteTodo(1, false)
    expect(store.todos[0].deleted).toBe(true)
  })

  it('should permanently delete todo', () => {
    const store = useTodoStore()
    const todo: Todo = {
      id: 1,
      title: 'test',
      body: 'test',
      completed: false,
      deleted: true,
      editing: false,
    }

    store.addTodo(todo)
    store.deleteTodo(1, true)
    expect(store.todos).toHaveLength(0)
  })

  it('should filter todos correctly', () => {
    const store = useTodoStore()
    const todos: Todo[] = [
      {
        id: 1,
        title: 'active',
        body: 'test',
        completed: false,
        deleted: false,
        editing: false,
      },
      {
        id: 2,
        title: 'completed',
        body: 'test',
        completed: true,
        deleted: false,
        editing: false,
      },
      {
        id: 3,
        title: 'deleted',
        body: 'test',
        completed: false,
        deleted: true,
        editing: false,
      },
    ]

    todos.forEach((todo) => store.addTodo(todo))

    // Test all filter
    store.changeFilter('all')
    expect(store.filteredTodos).toHaveLength(2) // active + completed

    // Test active filter
    store.changeFilter('active')
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0].title).toBe('active')

    // Test completed filter
    store.changeFilter('completed')
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0].title).toBe('completed')

    // Test deleted filter
    store.changeFilter('deleted')
    expect(store.filteredTodos).toHaveLength(1)
    expect(store.filteredTodos[0].title).toBe('deleted')
  })

  it('should change filter type', () => {
    const store = useTodoStore()

    store.changeFilter('completed')
    expect(store.filterType).toBe('completed')

    store.changeFilter('active')
    expect(store.filterType).toBe('active')
  })
})
