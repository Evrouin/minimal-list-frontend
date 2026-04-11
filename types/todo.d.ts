export type NoteColor = 'default' | 'red' | 'yellow' | 'green' | 'purple'
export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'monthly'

export interface LinkPreview {
  url: string
  title: string
  description: string
  image: string
  domain: string
}

export interface Todo {
  uuid: string
  folder: string | null
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
  is_archived: boolean
  archived_by_folder: boolean
  order_id?: number
  reminder_at?: string | null
  recurrence_rule?: RecurrenceRule
  snoozed_until?: string | null
  link_previews?: LinkPreview[]
  created_at?: string
  updated_at?: string
}
