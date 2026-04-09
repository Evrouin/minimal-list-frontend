import { Capacitor } from '@capacitor/core'
import type { Todo } from '~/types'

const uuidToInt = (uuid: string) => {
  let hash = 0
  for (let i = 0; i < uuid.length; i++) {
    hash = Math.trunc((hash << 5) - hash + (uuid.codePointAt(i) ?? 0))
  }
  return Math.abs(hash)
}

export const useReminders = () => {
  const schedule = async (todo: Todo) => {
    if (!todo.reminder_at) return

    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.requestPermissions()
      await LocalNotifications.schedule({
        notifications: [
          {
            id: uuidToInt(todo.uuid),
            title: todo.title,
            body: todo.body.replaceAll(/<[^>]*>/g, '').slice(0, 100) || 'Reminder',
            schedule: { at: new Date(todo.reminder_at) },
          },
        ],
      })
    }
  }

  const cancel = async (todoUuid: string) => {
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.cancel({ notifications: [{ id: uuidToInt(todoUuid) }] })
    }
  }

  const syncAll = async (todos: Todo[]) => {
    if (!Capacitor.isNativePlatform()) return
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.requestPermissions()
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications })
    }
    const now = Date.now()
    const upcoming = todos.filter((t) => t.reminder_at && new Date(t.reminder_at).getTime() > now && !t.deleted)
    if (upcoming.length) {
      await LocalNotifications.schedule({
        notifications: upcoming.map((t) => ({
          id: uuidToInt(t.uuid),
          title: t.title,
          body: t.body.replaceAll(/<[^>]*>/g, '').slice(0, 100) || 'Reminder',
          schedule: { at: new Date(t.reminder_at!) },
        })),
      })
    }
  }

  return { schedule, cancel, syncAll }
}
