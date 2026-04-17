<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useUiStore } from '~/stores/ui'
import { useFolderStore } from '~/stores/folders'
import { useFolders } from '~/composables/useFolders'
import { useBackHandler } from '~/composables/useBackHandler'
import type { Folder } from '~/types/folder'

const authStore = useAuthStore()
const ui = useUiStore()
const folderStore = useFolderStore()
const { createFolder, renameFolder, deleteFolder, reorderFolders, archiveFolder } = useFolders()
const route = useRoute()
const router = useRouter()
const { showNoteCount } = useSettings()

const close = () => ui.closeSidebar()
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
}

watch(
  () => ui.sidebarOpen,
  (val) => {
    if (val) {
      useBackHandler().push(close)
      document.addEventListener('keydown', onKeydown)
    } else {
      useBackHandler().pop()
      document.removeEventListener('keydown', onKeydown)
    }
  },
)

let swipeStartX = 0
let swipeStartY = 0
const onTouchStart = (e: TouchEvent) => {
  swipeStartX = e.touches[0]!.clientX
  swipeStartY = e.touches[0]!.clientY
}
const onTouchEnd = (e: TouchEvent) => {
  const dx = e.changedTouches[0]!.clientX - swipeStartX
  const dy = Math.abs(e.changedTouches[0]!.clientY - swipeStartY)
  if (dy > 60) return
  if (!ui.sidebarOpen && swipeStartX <= 20 && dx > 50) ui.openSidebar()
  else if (ui.sidebarOpen && dx < -50) close()
}
onMounted(() => {
  document.addEventListener('touchstart', onTouchStart, { passive: true })
  document.addEventListener('touchend', onTouchEnd, { passive: true })
})
onUnmounted(() => {
  document.removeEventListener('touchstart', onTouchStart)
  document.removeEventListener('touchend', onTouchEnd)
  document.removeEventListener('keydown', onKeydown)
})

const isFolderActive = (name: string) => route.path === '/' && route.query.folder === name
const isNotesActive = computed(() => route.path === '/' && !route.query.folder)
const linkClass = (active: boolean) =>
  `flex items-center justify-between rounded-lg px-3 py-2 text-xs lowercase transition-colors group ${
    active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
  }`

// --- Create folder ---
const newFolderName = ref('')
const createError = ref('')
const creating = ref(false)

watch(newFolderName, () => {
  createError.value = ''
})

const submitCreate = async () => {
  const name = newFolderName.value.trim()
  if (!name || creating.value) return
  creating.value = true
  createError.value = ''
  try {
    await createFolder(name)
    newFolderName.value = ''
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message?.toLowerCase() ?? ''
    if (msg.includes('duplicate') || msg.includes('already')) createError.value = 'name already exists'
    else if (msg.includes('limit') || msg.includes('20')) createError.value = 'folder limit reached (20)'
    else createError.value = 'failed to create'
  } finally {
    creating.value = false
  }
}

// --- Rename folder ---
const renamingUuid = ref<string | null>(null)
const renameValue = ref('')
const renameError = ref('')

const startRename = (folder: Folder) => {
  renamingUuid.value = folder.uuid
  renameValue.value = folder.name
  renameError.value = ''
  nextTick(() => {
    const el = document.getElementById(`rename-${folder.uuid}`)
    el?.focus()
    ;(el as HTMLInputElement)?.select()
  })
}

const submitRename = async (uuid: string) => {
  const name = renameValue.value.trim()
  if (!name) {
    renamingUuid.value = null
    return
  }
  renameError.value = ''
  try {
    await renameFolder(uuid, name)
    renamingUuid.value = null
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message?.toLowerCase() ?? ''
    renameError.value = msg.includes('duplicate') || msg.includes('already') ? 'name already exists' : 'failed to rename'
  }
}

const cancelRename = () => {
  renamingUuid.value = null
  renameError.value = ''
}

// --- Delete folder ---
const deletingFolder = ref<Folder | null>(null)

const confirmDelete = async () => {
  if (!deletingFolder.value) return
  const uuid = deletingFolder.value.uuid
  const wasActive = folderStore.activeFolder?.uuid === uuid
  deletingFolder.value = null
  await deleteFolder(uuid)
  if (wasActive) router.push('/')
}

// --- Archive folder ---
const archivingFolder = ref<Folder | null>(null)

const confirmArchive = async () => {
  if (!archivingFolder.value) return
  const uuid = archivingFolder.value.uuid
  const wasActive = folderStore.activeFolder?.uuid === uuid
  archivingFolder.value = null
  await archiveFolder(uuid)
  if (wasActive) router.push('/')
}

// --- Drag-to-reorder custom folders ---
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const folderItemRefs = ref<HTMLElement[]>([])

const isDraggingFolder = ref(false)

const onPointerDown = (e: PointerEvent, index: number) => {
  if ((e.target as HTMLElement).closest('button, input')) return
  e.preventDefault()
  let moved = false
  const startY = e.clientY

  const onMove = (me: PointerEvent) => {
    if (!moved && Math.abs(me.clientY - startY) > 6) {
      moved = true
      isDraggingFolder.value = true
      dragIndex.value = index
    }
    if (!moved) return
    folderItemRefs.value.forEach((el, i) => {
      const rect = el.getBoundingClientRect()
      if (me.clientY >= rect.top && me.clientY <= rect.bottom) dragOverIndex.value = i
    })
  }

  const onUp = async () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    isDraggingFolder.value = false
    if (!moved || dragIndex.value === null || dragOverIndex.value === null || dragIndex.value === dragOverIndex.value) {
      dragIndex.value = null
      dragOverIndex.value = null
      return
    }
    await onDrop(dragOverIndex.value)
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}

const onDrop = async (targetIndex: number) => {
  if (dragIndex.value === null || dragIndex.value === targetIndex) {
    dragIndex.value = null
    dragOverIndex.value = null
    return
  }
  const folders = [...folderStore.customFolders]
  const [moved] = folders.splice(dragIndex.value, 1)
  folders.splice(targetIndex, 0, moved!)
  dragIndex.value = null
  dragOverIndex.value = null
  const reordered = folders.map((f, i) => ({ ...f, order: i + 1 }))
  reordered.forEach(({ uuid, order }) => {
    const f = folderStore.folders.find((x) => x.uuid === uuid)
    if (f) f.order = order
  })
  await reorderFolders(reordered.map(({ uuid, order }) => ({ uuid, order })))
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="ui.sidebarOpen" class="fixed inset-0 z-40 bg-black/50" @click="close" />
    </Transition>

    <Transition name="slide-left">
      <div v-if="ui.sidebarOpen" class="fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-gray-800 py-6">
        <div class="mb-6 px-5">
          <span class="text-lg font-bold text-white lowercase">minimal list</span>
        </div>

        <nav class="flex-1 overflow-y-auto px-3">
          <!-- Default folders -->
          <div class="space-y-0.5">
            <template v-if="folderStore.defaultFolders.length">
              <NuxtLink
                v-for="folder in folderStore.defaultFolders"
                :key="folder.uuid"
                :to="folder.name === 'notes' ? '/' : `/?folder=${folder.name}`"
                :class="linkClass(folder.name === 'notes' ? isNotesActive : isFolderActive(folder.name))"
                @click="close"
              >
                <span class="truncate">{{ folder.name }}</span>
                <span v-if="showNoteCount && folder.note_count" class="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/40">{{ folder.note_count }}</span>
              </NuxtLink>
            </template>
            <template v-else>
              <NuxtLink to="/" :class="linkClass(isNotesActive)" @click="close"><span>notes</span></NuxtLink>
              <NuxtLink to="/?folder=tasks" :class="linkClass(isFolderActive('tasks'))" @click="close"><span>tasks</span></NuxtLink>
              <NuxtLink to="/?folder=reminders" :class="linkClass(isFolderActive('reminders'))" @click="close">
                <span>reminders</span>
              </NuxtLink>
            </template>
          </div>

          <!-- Custom folders -->
          <div v-if="folderStore.customFolders.length" class="mt-0.5 space-y-0.5">
            <div
              v-for="(folder, index) in folderStore.customFolders"
              :key="folder.uuid"
              :ref="
                (el) => {
                  if (el) folderItemRefs[index] = el as HTMLElement
                }
              "
              class="relative touch-none rounded-lg transition-colors select-none"
              :class="[dragIndex === index ? 'opacity-40' : '', isDraggingFolder ? 'cursor-grabbing' : 'cursor-grab']"
              @pointerdown="onPointerDown($event, index)"
            >
              <div
                v-if="dragOverIndex === index && dragIndex !== null && dragIndex !== index"
                class="absolute inset-x-0 h-0.5 rounded bg-white/40"
                :class="dragIndex > index ? '-top-px' : '-bottom-px'"
              />
              <!-- Rename mode -->
              <div v-if="renamingUuid === folder.uuid" class="px-3 py-1.5">
                <input
                  :id="`rename-${folder.uuid}`"
                  v-model="renameValue"
                  class="w-full rounded bg-white/10 px-2 py-1 text-xs text-white focus:outline-none"
                  maxlength="50"
                  @keydown.enter="submitRename(folder.uuid)"
                  @keydown.esc="cancelRename"
                  @blur="submitRename(folder.uuid)"
                >
                <p v-if="renameError" class="mt-1 text-xs text-red-400 lowercase">{{ renameError }}</p>
              </div>

              <!-- Normal mode -->
              <div v-else :class="linkClass(route.query.folder === folder.uuid)">
                <NuxtLink
                  :to="`/?folder=${folder.uuid}`"
                  draggable="false"
                  class="min-w-0 flex-1 truncate"
                  @click="isDraggingFolder ? $event.preventDefault() : close()"
                >
                  {{ folder.name }}
                </NuxtLink>
                <span v-if="showNoteCount && folder.note_count && !isDraggingFolder" class="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/40 group-hover:hidden">{{ folder.note_count }}</span>
                <div class="ml-1 hidden shrink-0 items-center gap-0.5 group-hover:flex" @click.prevent>
                  <button class="cursor-pointer rounded p-0.5 hover:text-white" title="Rename" @click="startRename(folder)">
                    <Icon name="uil:pen" class="text-xs" />
                  </button>
                  <button class="cursor-pointer rounded p-0.5 hover:text-white" title="Archive" @click="archivingFolder = folder">
                    <Icon name="uil:archive" class="text-xs" />
                  </button>
                  <button class="cursor-pointer rounded p-0.5 hover:text-red-400" title="Delete" @click="deletingFolder = folder">
                    <Icon name="uil:trash" class="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Create folder input -->
          <div class="mt-2 px-1">
            <form class="flex items-center gap-1" @submit.prevent="submitCreate">
              <input
                v-model="newFolderName"
                placeholder="new folder"
                maxlength="50"
                class="min-w-0 flex-1 rounded bg-white/5 px-2 py-1.5 text-xs text-white/60 placeholder-white/20 focus:text-white focus:outline-none"
              >
              <button
                type="submit"
                class="cursor-pointer rounded px-2 py-1.5 text-xs text-white/30 hover:text-white"
                :disabled="!newFolderName.trim() || creating"
              >
                <Icon name="uil:plus" />
              </button>
            </form>
            <p v-if="createError" class="mt-1 px-1 text-xs text-red-400 lowercase">{{ createError }}</p>
          </div>

          <div class="my-3 border-t border-white/10" />

          <div class="space-y-0.5">
            <NuxtLink to="/trash" :class="linkClass(route.path === '/trash')" @click="close">
              <span>trash</span>
              <span v-if="showNoteCount && folderStore.trashCount" class="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/40">{{ folderStore.trashCount }}</span>
            </NuxtLink>
            <NuxtLink to="/archive" :class="linkClass(route.path === '/archive')" @click="close">
              <span>archive</span>
              <span v-if="showNoteCount && folderStore.archiveCount" class="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/40">{{ folderStore.archiveCount }}</span>
            </NuxtLink>
          </div>
        </nav>

        <div class="space-y-0.5 border-t border-white/10 px-3 pt-4">
          <NuxtLink to="/auth/profile" :class="linkClass(route.path === '/auth/profile')" @click="close"><span>account</span></NuxtLink>
          <NuxtLink v-if="authStore.isAdmin" to="/admin" :class="linkClass(route.path.startsWith('/admin'))" @click="close">
            <span>admin</span>
          </NuxtLink>
        </div>
      </div>
    </Transition>

    <!-- Delete folder confirmation -->
    <ConfirmDialog
      v-if="deletingFolder"
      :model-value="!!deletingFolder"
      title="delete folder"
      :message="`move ${deletingFolder.note_count} note${deletingFolder.note_count !== 1 ? 's' : ''} to default folder?`"
      confirm-text="delete"
      @update:model-value="deletingFolder = null"
      @confirm="confirmDelete"
    />

    <!-- Archive folder confirmation -->
    <ConfirmDialog
      v-if="archivingFolder"
      :model-value="!!archivingFolder"
      title="archive folder"
      :message="`archive this folder and its ${archivingFolder.note_count} note${archivingFolder.note_count !== 1 ? 's' : ''}?`"
      confirm-text="archive"
      @update:model-value="archivingFolder = null"
      @confirm="confirmArchive"
    />
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.25s ease;
}
.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}
</style>
