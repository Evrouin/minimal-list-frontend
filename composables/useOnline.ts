export function useOnline() {
  const online = ref(true)
  const config = useRuntimeConfig()

  const check = async () => {
    if (!navigator.onLine) {
      online.value = false
      return
    }
    try {
      await $fetch(`${config.public.authApiBase.replace('/api/auth', '')}/health/`, { method: 'HEAD', timeout: 3000 })
      online.value = true
    } catch {
      online.value = false
    }
  }

  let interval: ReturnType<typeof setInterval>

  onMounted(() => {
    check()
    globalThis.addEventListener('online', check)
    globalThis.addEventListener('offline', check)
    interval = setInterval(check, 30000)
  })
  onUnmounted(() => {
    globalThis.removeEventListener('online', check)
    globalThis.removeEventListener('offline', check)
    clearInterval(interval)
  })

  return { online }
}
