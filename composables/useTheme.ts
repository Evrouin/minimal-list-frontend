export type Theme = 'dark' | 'light'

const THEME_COLORS: Record<Theme, string> = { dark: '#1f2937', light: '#F1F3F4' }

const theme = ref<Theme>('dark')

export const useTheme = () => {
  const apply = (t: Theme) => {
    theme.value = t
    document.documentElement.setAttribute('data-theme', t)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[t])
    localStorage.setItem('theme', t)
  }

  const init = () => apply((localStorage.getItem('theme') as Theme) || 'dark')
  const toggle = () => apply(theme.value === 'dark' ? 'light' : 'dark')

  return { theme: readonly(theme), init, toggle, apply }
}
