import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin(() => {
  if (!Capacitor.isNativePlatform()) return

  const router = useRouter()

  const handleUrl = (url: string) => {
    try {
      const { pathname } = new URL(url)
      router.push(pathname)
    } catch {
      // ignore malformed urls
    }
  }

  // Handle deep link when app is already open
  App.addListener('appUrlOpen', ({ url }) => handleUrl(url))

  // Handle deep link that launched the app
  App.getLaunchUrl().then((result) => {
    if (result?.url) handleUrl(result.url)
  })
})
