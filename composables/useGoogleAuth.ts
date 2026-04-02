import { Capacitor } from '@capacitor/core'
import { googleTokenLogin } from 'vue3-google-login'

export const useGoogleAuth = () => {
  const signIn = async (): Promise<string> => {
    if (Capacitor.isNativePlatform()) {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
      const result = await GoogleAuth.signIn()
      return result.authentication.accessToken
    }
    const response = await googleTokenLogin()
    return response.access_token
  }

  return { signIn }
}
