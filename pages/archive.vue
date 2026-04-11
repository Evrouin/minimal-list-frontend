<script setup lang="ts">
import { useTodoStore } from '~/stores/todos'
import { useUiStore } from '~/stores/ui'
import { useFolders } from '~/composables/useFolders'
import type { Folder } from '~/types/folder'

const todoStore = useTodoStore()
const ui = useUiStore()
const { unarchiveFolder } = useFolders()
const api = useTodoApi()

const archivedFolders = ref<Folder[]>([])

onMounted(async () => {
  todoStore.changeFilter('archived')
  todoStore.fetchArchived()
  archivedFolders.value = (await api.fetchFolders(true)).data
})

onUnmounted(() => {
  todoStore.changeFilter('all')
  todoStore.clearTodos()
})

const handleUnarchiveFolder = async (uuid: string) => {
  await unarchiveFolder(uuid)
  archivedFolders.value = archivedFolders.value.filter((f) => f.uuid !== uuid)
}
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col items-center bg-gray-800 pt-10">
    <AppSidebar />
    <div class="w-full max-w-lg px-4 sm:max-w-none md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl min-[1920px]:max-w-400">
      <PageHeader class="mx-2.5" title="archive">
        <template #prepend>
          <button class="cursor-pointer text-white/60 hover:text-white" @click="ui.openSidebar()">
            <Icon name="uil:bars" class="text-xl mt-2.5" />
          </button>
        </template>
      </PageHeader>

      <!-- Archived folders -->
      <div v-if="archivedFolders.length" class="mx-2.5 mt-4 mb-2">
        <p class="mb-3 text-xs text-white/40 lowercase">folders</p>
        <div class="space-y-2 mb-6">
          <div
            v-for="folder in archivedFolders"
            :key="folder.uuid"
            class="flex items-center justify-between rounded-lg border border-white/10 bg-gray-700/30 px-4 py-3"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm text-white/80 lowercase">{{ folder.name }}</p>
              <p class="text-xs text-white/30 lowercase">{{ folder.note_count }} notes</p>
            </div>
            <button
              class="ml-3 cursor-pointer text-xs text-white/40 lowercase hover:text-white"
              @click="handleUnarchiveFolder(folder.uuid)"
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
    </div>
  </div>
</template>
