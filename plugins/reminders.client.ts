import { Capacitor } from '@capacitor/core'
import { watch } from 'vue'

export default defineNuxtPlugin(() => {
  // Android: register action types and listen for actions on app init
  if (Capacitor.isNativePlatform()) {
    const { registerActionTypes, listenActions } = useReminders()
    registerActionTypes()
    listenActions()
    return
  }

  if ('Notification' in globalThis && Notification.permission === 'default') {
    Notification.requestPermission()
  }

  const todoStore = useTodoStore()
  const api = useTodoApi()
  const firedIds = new Set<string>()

  const snoozePrompt = ref<{ uuid: string; title: string } | null>(null)

  const snoozeOptions = [
    { label: '15 min', ms: 15 * 60 * 1000 },
    { label: '1 hour', ms: 60 * 60 * 1000 },
    { label: 'tomorrow', ms: null },
  ]

  const snoozeIndex = ref(0)

  const handleSnooze = async (uuid: string, ms: number | null) => {
    const todo = todoStore.todos.find((t) => t.uuid === uuid)
    if (!todo?.reminder_at) return
    const base = new Date(todo.reminder_at)
    const snoozedUntil = ms === null
      ? new Date(base.getTime() + 86400000).toISOString()
      : new Date(Date.now() + ms).toISOString()
    await api.snoozeNote(uuid, snoozedUntil)
    snoozePrompt.value = null
    snoozeIndex.value = 0
  }

  const cycleSnooze = (uuid: string) => {
    const next = (snoozeIndex.value + 1) % snoozeOptions.length
    snoozeIndex.value = next
    const opt = snoozeOptions[next]!
    handleSnooze(uuid, opt.ms ?? null)
  }

  const handleDone = async (uuid: string) => {
    await todoStore.toggleTodoCompletion(uuid)
    snoozePrompt.value = null
    snoozeIndex.value = 0
  }

  const check = () => {
    if (localStorage.getItem('notificationsEnabled') === 'false') return
    const now = Date.now()
    todoStore.todos.forEach((todo) => {
      const snoozedAt = todo.snoozed_until ? new Date(todo.snoozed_until).getTime() : null
      const reminderAt = todo.reminder_at ? new Date(todo.reminder_at).getTime() : null
      const fireAt = snoozedAt && snoozedAt > now ? snoozedAt : reminderAt

      if (firedIds.has(todo.uuid) && fireAt && fireAt > now) {
        firedIds.delete(todo.uuid)
        if (snoozePrompt.value?.uuid === todo.uuid) snoozePrompt.value = null
      }

      if (
        fireAt &&
        !todo.completed &&
        !todo.deleted &&
        !firedIds.has(todo.uuid) &&
        fireAt <= now
      ) {
        firedIds.add(todo.uuid)
        if ('Notification' in globalThis && Notification.permission === 'granted') {
          new Notification(todo.title, {
            body: todo.body.replaceAll(/<[^>]*>/g, '').slice(0, 100) || 'Reminder',
          })
        }
        snoozePrompt.value = { uuid: todo.uuid, title: todo.title }
      }
    })
  }

  watch(() => todoStore.todos, check, { deep: true })
  const interval = setInterval(check, 30_000)
  globalThis.addEventListener('beforeunload', () => clearInterval(interval))

  const nuxtApp = useNuxtApp()
  nuxtApp.provide('snoozePrompt', snoozePrompt)
  nuxtApp.provide('snoozeOptions', snoozeOptions)
  nuxtApp.provide('snoozeIndex', snoozeIndex)
  nuxtApp.provide('handleSnooze', handleSnooze)
  nuxtApp.provide('cycleSnooze', cycleSnooze)
  nuxtApp.provide('handleDone', handleDone)
})
