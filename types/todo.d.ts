export type NoteColor = 'default' | 'red' | 'yellow' | 'green' | 'purple'

export interface Todo {
  id: number
  title: string
  body: string
  image?: string
  thumbnail?: string
  color: NoteColor
  completed: boolean
  deleted: boolean
  pinned: boolean
  editing: boolean
  reminder_at?: string | null
  created_at?: string
  updated_at?: string
}
