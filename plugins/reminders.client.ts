import { Capacitor } from '@capacitor/core'
import { watch } from 'vue'

export default defineNuxtPlugin(() => {
  if (Capacitor.isNativePlatform()) return

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }

  const todoStore = useTodoStore()
  const firedIds = new Set<number>()

  const check = () => {
    const now = Date.now()
    todoStore.todos.forEach((todo) => {
      if (
        todo.reminder_at &&
        !todo.deleted &&
        !firedIds.has(todo.uuid) &&
        new Date(todo.reminder_at).getTime() <= now
      ) {
        firedIds.add(todo.uuid)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(todo.title, {
            body: todo.body.replace(/<[^>]*>/g, '').slice(0, 100) || 'Reminder',
          })
        }
      }
    })
  }

  watch(() => todoStore.todos, check, { deep: true })

  const interval = setInterval(check, 30_000)
  window.addEventListener('beforeunload', () => clearInterval(interval))
})
