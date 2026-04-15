import { noteColorSets } from '~/utils/noteColors'

export const useNoteColors = () => {
  const { theme } = useTheme()
  return computed(() => noteColorSets[theme.value])
}
