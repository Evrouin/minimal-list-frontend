import type { Todo } from '../../../types'

const todos: Todo[] = []

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const method = getMethod(event)

  const todo = todos.find((t) => t.id === id)
  if (!todo) {
    return apiError('Todo not found', 404)
  }

  if (method === 'GET') {
    return apiResponse(todo)
  }

  if (method === 'PUT') {
    const body = await validateBody<Partial<Todo>>(event)
    const sanitized = sanitizeTodo(body)
    Object.assign(todo, sanitized)
    return apiResponse(todo)
  }

  if (method === 'DELETE') {
    const index = todos.findIndex((t) => t.id === id)
    todos.splice(index, 1)
    return apiResponse({ success: true })
  }
})
