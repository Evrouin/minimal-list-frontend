<script setup lang="ts">
import { useTodoStore } from '~/stores/todos'
import { useUiStore } from '~/stores/ui'
import { useFolders } from '~/composables/useFolders'
import type { Folder } from '~/types/folder'

const todoStore = useTodoStore()
const ui = useUiStore()
const folderStore = useFolderStore()
const { unarchiveFolder } = useFolders()

onMounted(async () => {
  await todoStore.fetchArchived()
  await folderStore.fetchArchivedFolders()
})

onUnmounted(() => {
  todoStore.clearTodos()
  expandedFolder.value = null
  folderStore.archivedFolders = []
})

const handleUnarchiveFolder = async (uuid: string) => {
  await unarchiveFolder(uuid)
  if (expandedFolder.value?.uuid === uuid) expandedFolder.value = null
}

// --- Folder expand ---
const expandedFolder = ref<Folder | null>(null)

const toggleFolder = async (folder: Folder) => {
  if (expandedFolder.value?.uuid === folder.uuid) {
    expandedFolder.value = null
    await todoStore.fetchArchived()
    return
  }
  expandedFolder.value = folder
  await todoStore.fetchArchivedFolder(folder.uuid)
}
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col items-center bg-gray-800 pt-10">
    <AppSidebar />
    <div class="w-full max-w-lg px-4 sm:max-w-none md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl min-[1920px]:max-w-400">

      <template v-if="expandedFolder">
        <PageHeader class="mx-2.5" :title="expandedFolder.name">
          <template #prepend>
            <button class="cursor-pointer text-white/60 hover:text-white" @click="toggleFolder(expandedFolder)">
              <Icon name="uil:arrow-left" class="text-xl mt-2.5" />
            </button>
          </template>
        </PageHeader>
        <TodoList />
      </template>

      <!-- Default archive view -->
      <template v-else>
        <PageHeader class="mx-2.5" title="archive">
          <template #prepend>
            <button class="cursor-pointer text-white/60 hover:text-white" @click="ui.openSidebar()">
              <Icon name="uil:bars" class="text-xl mt-2.5" />
            </button>
          </template>
        </PageHeader>

        <div v-if="folderStore.archivedFolders.length" class="mx-2.5 mt-4 mb-2">
          <p class="mb-3 text-xs text-white/40 lowercase">folders</p>
          <div class="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 mb-6">
            <div
              v-for="folder in folderStore.archivedFolders"
              :key="folder.uuid"
              class="break-inside-avoid mb-3 flex items-center justify-between rounded-lg bg-gray-700 border-0.5 border-white/10 shadow-md px-5 py-4 cursor-pointer"
              @click="toggleFolder(folder)"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm text-white/80 lowercase font-bold">{{ folder.name }}</p>
                <p class="text-xs text-white/30 lowercase">{{ folder.note_count }} notes</p>
              </div>
              <button
                class="ml-3 cursor-pointer text-xs text-white/40 lowercase hover:text-white shrink-0"
                @click.stop="handleUnarchiveFolder(folder.uuid)"
              >
                unarchive
              </button>
            </div>
          </div>
        </div>

        <TodoList />
        <div v-if="todoStore.loadingMore" class="flex justify-center py-4">
          <span class="text-sm text-white/40">loading...</span>
        </div>
      </template>

    </div>
  </div>
</template>
