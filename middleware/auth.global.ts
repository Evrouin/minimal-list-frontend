export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  const publicPaths = ['/auth/login', '/auth/register', '/auth/forgot-password']
  const isPublic =
    publicPaths.includes(to.path) ||
    to.path.startsWith('/auth/verify-email') ||
    to.path.startsWith('/auth/reset-password')

  if (!isPublic && !authStore.isAuthenticated) {
    return navigateTo('/auth/login')
  }

  if (to.path === '/auth/login' && authStore.isAuthenticated) {
    return navigateTo('/')
  }
})
