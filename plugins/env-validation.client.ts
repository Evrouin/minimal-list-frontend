export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const required: Record<string, unknown> = {
    authApiBase: config.public.authApiBase,
    googleClientId: config.public.googleClientId,
  }

  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (missing.length) {
    console.warn(
      `[env] missing required config: ${missing.join(', ')}. Check your .env file.`
    )
  }
})
