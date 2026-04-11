export const useFolders = () => {
  const api = useTodoApi()
  const folderStore = useFolderStore()

  const createFolder = async (name: string) => {
    const res = await api.createFolder(name)
    const folder = res.data ?? res
    folderStore.folders.push(folder)
    return folder
  }

  const renameFolder = async (uuid: string, name: string) => {
    const res = await api.updateFolder(uuid, { name })
    const folder = res.data ?? res
    const idx = folderStore.folders.findIndex((f) => f.uuid === uuid)
    if (idx !== -1) folderStore.folders[idx] = folder
    return folder
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
    const folder = folderStore.folders.find((f) => f.uuid === uuid)
    await api.archiveFolder(uuid)
    folderStore.folders = folderStore.folders.filter((f) => f.uuid !== uuid)
    if (folder) folderStore.archivedFolders.push(folder)
    if (folderStore.activeFolder?.uuid === uuid) folderStore.activeFolder = null
  }

  const unarchiveFolder = async (uuid: string) => {
    const res = await api.unarchiveFolder(uuid)
    const folder = res.data ?? res
    folderStore.archivedFolders = folderStore.archivedFolders.filter((f) => f.uuid !== uuid)
    if (folder?.uuid) folderStore.folders.push(folder)
    return folder
  }

  return { createFolder, renameFolder, deleteFolder, reorderFolders, archiveFolder, unarchiveFolder }
}
