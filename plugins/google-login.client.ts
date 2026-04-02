import vue3GoogleLogin from 'vue3-google-login'
import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig()
  const clientId = config.public.googleClientId as string

  nuxtApp.vueApp.use(vue3GoogleLogin, { clientId })

  if (Capacitor.isNativePlatform()) {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
    GoogleAuth.initialize({ clientId, scopes: ['profile', 'email'] })
  }
})
