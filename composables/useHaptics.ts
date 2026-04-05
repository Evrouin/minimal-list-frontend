import { Capacitor } from '@capacitor/core'

export const useHaptics = () => {
  const tap = async () => {
    if (!Capacitor.isNativePlatform()) return
    if (localStorage.getItem('hapticsEnabled') === 'false') return
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Light })
  }

  return { tap }
}
