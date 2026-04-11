import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useBackHandler } from '~/composables/useBackHandler'

const HOME = '/'

const homeRoutes = new Set([
  '/auth/profile',
  '/auth/verify-email',
  '/auth/reset-password',
  '/auth/unlock-account',
  '/faq',
])

const shouldGoHome = (path: string) =>
  homeRoutes.has(path) || [...homeRoutes].some((r) => path.startsWith(r))

export default defineNuxtPlugin(() => {
  if (!Capacitor.isNativePlatform()) return

  const router = useRouter()

  App.addListener('backButton', ({ canGoBack }) => {
    const path = router.currentRoute.value.path
    if (ui.sidebarOpen) {
      ui.closeSidebar()
      return
    }
    const { handle } = useBackHandler()
    if (handle()) return
    if (path === HOME) {
      App.minimizeApp()
    } else if (canGoBack) {
      router.back()
    } else if (shouldGoHome(path)) {
      router.replace(HOME)
    } else {
      App.minimizeApp()
    }
  })
})
