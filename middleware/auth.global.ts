export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  if (config.public.maintenanceMode && to.path !== '/maintenance') {
    return navigateTo('/maintenance')
  }

  const authStore = useAuthStore()
  const publicPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/maintenance']
  const isPublic =
    publicPaths.includes(to.path) ||
    to.path.startsWith('/auth/verify-email') ||
    to.path.startsWith('/auth/reset-password')

  // Validate token by fetching profile if we have tokens but no user yet
  if (authStore.isAuthenticated && !authStore.user) {
    try {
      await authStore.fetchProfile()
    } catch (e) {
      if ((e as { statusCode?: number }).statusCode === 503) return navigateTo('/maintenance')
      authStore.logout()
    }
  }

  if (!isPublic && !authStore.isAuthenticated) {
    return navigateTo('/auth/login')
  }

  if (to.path === '/auth/login' && authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
