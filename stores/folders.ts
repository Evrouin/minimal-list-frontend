import type { Folder } from '~/types/folder'

export const useFolderStore = defineStore('folders', () => {
  const folders = ref<Folder[]>([])
  const activeFolder = ref<Folder | null>(null)
  const loading = ref(false)

  const api = useTodoApi()

  const defaultFolders = computed(() => folders.value.filter((f) => f?.is_default))
  const customFolders = computed(() => folders.value.filter((f) => f && !f.is_default).sort((a, b) => a.order - b.order))

  const archivedFolders = ref<Folder[]>([])
  const trashCount = ref(0)
  const archiveCount = ref(0)

  const fetchArchivedFolders = async () => {
    const res = await api.fetchFolders(true)
    archivedFolders.value = res.data ?? res ?? []
  }

  const fetchFolders = async () => {
    loading.value = true
    try {
      const response = await api.fetchFolders()
      const data = response.data ?? response
      if (data.folders) {
        folders.value = data.folders
        trashCount.value = data.trash_count ?? 0
        archiveCount.value = data.archive_count ?? 0
      } else {
        folders.value = Array.isArray(data) ? data : (data.results ?? [])
      }
    } catch {
      /* silently fail — sidebar shows fallback */
    } finally {
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
    archivedFolders,
    activeFolder,
    loading,
    defaultFolders,
    customFolders,
    trashCount,
    archiveCount,
    fetchFolders,
    fetchArchivedFolders,
    setActiveFolderBySlug,
  }
})
