export interface Todo {
  id: number
  title: string
  body: string
  completed: boolean
  deleted: boolean
  pinned: boolean
  editing: boolean
  created_at?: string
  updated_at?: string
}
