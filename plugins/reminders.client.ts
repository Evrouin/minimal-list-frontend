import { Capacitor } from '@capacitor/core'

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
        !firedIds.has(todo.id) &&
        new Date(todo.reminder_at).getTime() <= now
      ) {
        firedIds.add(todo.id)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(todo.title, {
            body: todo.body.replace(/<[^>]*>/g, '').slice(0, 100) || 'Reminder',
          })
        }
      }
    })
  }

  const interval = setInterval(check, 60_000)
  check()

  const app = useNuxtApp()
  app.hook('app:beforeMount', () => {})
  window.addEventListener('beforeunload', () => clearInterval(interval))
})
