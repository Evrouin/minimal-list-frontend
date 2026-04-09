const publicPaths = new Set(['/', '/faq', '/auth/login', '/auth/register', '/auth/forgot-password', '/maintenance'])

const isPublicPath = (path: string) =>
  publicPaths.has(path) ||
  path.startsWith('/auth/verify-email') ||
  path.startsWith('/auth/reset-password') ||
  path.startsWith('/auth/unlock-account')

const tryFetchProfile = async (authStore: ReturnType<typeof useAuthStore>) => {
  try {
    await authStore.fetchProfile()
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode
    if (status === 503) return navigateTo('/maintenance')
    if (status === 401 || status === 403) authStore.logout()
  }
}

const checkNativeRedirect = async () => {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) return navigateTo('/auth/login')
  } catch {
    // ignore: Capacitor not available in web context
  }
}

export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  if (config.public.maintenanceMode && to.path !== '/maintenance') {
    return navigateTo('/maintenance')
  }

  const authStore = useAuthStore()

  if (authStore.isAuthenticated && !authStore.user) {
    const redirect = await tryFetchProfile(authStore)
    if (redirect) return redirect
  }

  if (!isPublicPath(to.path) && !authStore.isAuthenticated) {
    return navigateTo('/auth/login')
  }

  if (to.path === '/' && !authStore.isAuthenticated) {
    return checkNativeRedirect()
  }

  if (to.path === '/auth/login' && authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
