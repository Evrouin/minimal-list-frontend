export const useFolders = () => {
  const api = useTodoApi()
  const folderStore = useFolderStore()

  const createFolder = async (name: string) => {
    const folder = await api.createFolder(name)
    folderStore.folders.push(folder)
    return folder
  }

  const renameFolder = async (uuid: string, name: string) => {
    const updated = await api.updateFolder(uuid, { name })
    const idx = folderStore.folders.findIndex((f) => f.uuid === uuid)
    if (idx !== -1) folderStore.folders[idx] = updated
    return updated
  }

  const deleteFolder = async (uuid: string) => {
    await api.deleteFolder(uuid)
    folderStore.folders = folderStore.folders.filter((f) => f.uuid !== uuid)
    if (folderStore.activeFolder?.uuid === uuid) folderStore.activeFolder = null
  }

  const reorderFolders = async (ordered: { uuid: string; order: number }[]) => {
    await api.reorderFolders(ordered)
    ordered.forEach(({ uuid, order }) => {
      const f = folderStore.folders.find((f) => f.uuid === uuid)
      if (f) f.order = order
    })
  }

  const archiveFolder = async (uuid: string) => {
    await api.archiveFolder(uuid)
    folderStore.folders = folderStore.folders.filter((f) => f.uuid !== uuid)
    if (folderStore.activeFolder?.uuid === uuid) folderStore.activeFolder = null
  }

  const unarchiveFolder = async (uuid: string) => {
    const folder = await api.unarchiveFolder(uuid)
    folderStore.folders.push(folder)
    return folder
  }

  return { createFolder, renameFolder, deleteFolder, reorderFolders, archiveFolder, unarchiveFolder }
}
