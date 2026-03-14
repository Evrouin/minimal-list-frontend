import type { Todo } from '../../types'

export const validateTodo = (data: Partial<Todo>): boolean => {
  return !!(data.title?.trim())
}

export const sanitizeTodo = (data: Partial<Todo>): Partial<Todo> => ({
  ...data,
  title: data.title?.toLowerCase().trim(),
  description: data.description?.toLowerCase().trim(),
})
