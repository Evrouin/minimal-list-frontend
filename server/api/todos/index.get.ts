import type { Todo } from '../../../types'

const todos: Todo[] = []

export default defineEventHandler(async () => {
  return apiResponse(todos.filter((t) => !t.deleted))
})
