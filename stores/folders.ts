import type { Folder } from '~/types/folder'

export const useFolderStore = defineStore('folders', () => {
  const folders = ref<Folder[]>([])
  const activeFolder = ref<Folder | null>(null)
  const loading = ref(false)

  const api = useTodoApi()

  const defaultFolders = computed(() => folders.value.filter((f) => f.is_default))
  const customFolders = computed(() => folders.value.filter((f) => !f.is_default))

  const fetchFolders = async () => {
    loading.value = true
    try {
      const response = await api.fetchFolders()
      folders.value = response.data
    } catch { /* silently fail — sidebar shows fallback */ } finally {
      loading.value = false
    }
  }

  const setActiveFolderBySlug = (slug: string | null) => {
    if (!slug) {
      activeFolder.value = folders.value.find((f) => f.is_default && f.name === 'notes') ?? null
      return
    }
    activeFolder.value = folders.value.find((f) => f.name === slug || f.uuid === slug) ?? null
  }

  return {
    folders,
    activeFolder,
    loading,
    defaultFolders,
    customFolders,
    fetchFolders,
    setActiveFolderBySlug,
  }
})
