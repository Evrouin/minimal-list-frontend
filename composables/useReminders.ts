import { Capacitor } from '@capacitor/core'
import type { Todo } from '~/types'

const uuidToInt = (uuid: string) => {
  let hash = 0
  for (let i = 0; i < uuid.length; i++) {
    hash = Math.trunc((hash << 5) - hash + (uuid.codePointAt(i) ?? 0))
  }
  return Math.abs(hash)
}

const ACTION_TYPE_ID = 'REMINDER_ACTIONS'

export const useReminders = () => {
  const api = useTodoApi()

  const registerActionTypes = async () => {
    if (!Capacitor.isNativePlatform()) return
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: ACTION_TYPE_ID,
          actions: [
            { id: 'snooze', title: 'Snooze 15m' },
            { id: 'done', title: 'Done', destructive: false },
          ],
        },
      ],
    })
  }

  const listenActions = async () => {
    if (!Capacitor.isNativePlatform()) return
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const todoStore = useTodoStore()
    const router = useRouter()

    await LocalNotifications.addListener('localNotificationActionPerformed', async (event) => {
      const uuid = event.notification.extra?.uuid as string | undefined
      const todo = uuid
        ? todoStore.todos.find((t) => t.uuid === uuid)
        : todoStore.todos.find((t) => uuidToInt(t.uuid) === event.notification.id)
      if (!todo) return

      if (event.actionId === 'done') {
        await todoStore.toggleTodoCompletion(todo.uuid)
      } else if (event.actionId === 'snooze') {
        const snoozedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString()
        await api.snoozeNote(todo.uuid, snoozedUntil)
        await schedule({ ...todo, snoozed_until: snoozedUntil })
      } else {
        // Default tap — open the note
        await router.push({ path: '/', query: { folder: 'reminders', open: todo.uuid } })
      }
    })
  }

  const schedule = async (todo: Todo) => {
    if (!todo.reminder_at) return
    const fireAt =
      todo.snoozed_until && new Date(todo.snoozed_until).getTime() > Date.now() ? new Date(todo.snoozed_until) : new Date(todo.reminder_at)

    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.requestPermissions()
      await LocalNotifications.schedule({
        notifications: [
          {
            id: uuidToInt(todo.uuid),
            title: todo.title,
            body: todo.body.replaceAll(/<[^>]*>/g, '').slice(0, 100) || 'Reminder',
            schedule: { at: fireAt },
            actionTypeId: ACTION_TYPE_ID,
            extra: { uuid: todo.uuid },
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
    const upcoming = todos.filter((t) => t.reminder_at && !t.deleted && !t.completed)
    if (upcoming.length) {
      await LocalNotifications.schedule({
        notifications: upcoming.map((t) => {
          const fireAt = t.snoozed_until && new Date(t.snoozed_until).getTime() > now ? new Date(t.snoozed_until) : new Date(t.reminder_at!)
          return {
            id: uuidToInt(t.uuid),
            title: t.title,
            body: t.body.replaceAll(/<[^>]*>/g, '').slice(0, 100) || 'Reminder',
            schedule: { at: fireAt },
            actionTypeId: ACTION_TYPE_ID,
            extra: { uuid: t.uuid },
          }
        }),
      })
    }
  }

  return { schedule, cancel, syncAll, registerActionTypes, listenActions }
}
