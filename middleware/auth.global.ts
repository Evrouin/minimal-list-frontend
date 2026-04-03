export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  if (config.public.maintenanceMode && to.path !== '/maintenance') {
    return navigateTo('/maintenance')
  }

  const authStore = useAuthStore()
  const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/maintenance']
  const isPublic =
    publicPaths.includes(to.path) ||
    to.path.startsWith('/auth/verify-email') ||
    to.path.startsWith('/auth/reset-password') ||
    to.path.startsWith('/auth/unlock-account')

  // Validate token by fetching profile if we have tokens but no user yet
  if (authStore.isAuthenticated && !authStore.user) {
    try {
      await authStore.fetchProfile()
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 503) return navigateTo('/maintenance')
      if (status === 401 || status === 403) authStore.logout()
    }
  }

  if (!isPublic && !authStore.isAuthenticated) {
    return navigateTo('/auth/login')
  }

  // On native app, skip landing page — go straight to login
  if (to.path === '/' && !authStore.isAuthenticated) {
    try {
      const { Capacitor } = await import('@capacitor/core')
      if (Capacitor.isNativePlatform()) return navigateTo('/auth/login')
    } catch {}
  }

  if (to.path === '/auth/login' && authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
