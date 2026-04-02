import { Capacitor } from '@capacitor/core'
import type { Todo } from '~/types'

export const useReminders = () => {
  const schedule = async (todo: Todo) => {
    if (!todo.reminder_at) return

    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.requestPermissions()
      await LocalNotifications.schedule({
        notifications: [
          {
            id: todo.id,
            title: todo.title,
            body: todo.body.replace(/<[^>]*>/g, '').slice(0, 100) || 'Reminder',
            schedule: { at: new Date(todo.reminder_at) },
          },
        ],
      })
    }
  }

  const cancel = async (todoId: number) => {
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.cancel({ notifications: [{ id: todoId }] })
    }
  }

  const syncAll = async (todos: Todo[]) => {
    if (!Capacitor.isNativePlatform()) return
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.requestPermissions()
    const pending = await LocalNotifications.getPending()
    // Cancel all existing
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications })
    }
    // Reschedule future reminders
    const now = Date.now()
    const upcoming = todos.filter((t) => t.reminder_at && new Date(t.reminder_at).getTime() > now && !t.deleted)
    if (upcoming.length) {
      await LocalNotifications.schedule({
        notifications: upcoming.map((t) => ({
          id: t.id,
          title: t.title,
          body: t.body.replace(/<[^>]*>/g, '').slice(0, 100) || 'Reminder',
          schedule: { at: new Date(t.reminder_at!) },
        })),
      })
    }
  }

  return { schedule, cancel, syncAll }
}
