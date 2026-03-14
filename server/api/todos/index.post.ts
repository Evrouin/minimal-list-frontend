import type { Todo } from '../../../types'

const todos: Todo[] = []

export default defineEventHandler(async (event) => {
  const body = await validateBody<Partial<Todo>>(event)

  if (!validateTodo(body)) {
    return apiError('Title is required', 400)
  }

  const sanitized = sanitizeTodo(body)
  const newTodo: Todo = {
    id: Date.now(),
    title: sanitized.title || '',
    description: sanitized.description || '',
    completed: false,
    deleted: false,
  }

  todos.push(newTodo)
  return apiResponse(newTodo, 201)
})
