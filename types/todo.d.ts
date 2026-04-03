export type NoteColor = 'default' | 'red' | 'yellow' | 'green' | 'purple'

export interface LinkPreview {
  url: string
  title: string
  description: string
  image: string
  domain: string
}

export interface Todo {
  uuid: string
  title: string
  body: string
  image?: string
  thumbnail?: string
  audio?: string | null
  color: NoteColor
  completed: boolean
  deleted: boolean
  pinned: boolean
  editing: boolean
  reminder_at?: string | null
  link_previews?: LinkPreview[]
  created_at?: string
  updated_at?: string
}
