<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useUiStore } from '~/stores/ui'
import { useFolderStore } from '~/stores/folders'
import { useBackHandler } from '~/composables/useBackHandler'

const authStore = useAuthStore()
const ui = useUiStore()
const folderStore = useFolderStore()
const route = useRoute()

const close = () => ui.closeSidebar()

const onKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }

watch(() => ui.sidebarOpen, (val) => {
  if (val) {
    useBackHandler().push(close)
    document.addEventListener('keydown', onKeydown)
  } else {
    useBackHandler().pop()
    document.removeEventListener('keydown', onKeydown)
  }
})

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
  if (!ui.sidebarOpen && swipeStartX <= 20 && dx > 50) {
    ui.openSidebar()
  } else if (ui.sidebarOpen && dx < -50) {
    close()
  }
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

const isFolderActive = (name: string) =>
  route.path === '/' && route.query.folder === name

const isNotesActive = computed(() =>
  route.path === '/' && !route.query.folder
)

const linkClass = (active: boolean) =>
  `block rounded-lg px-3 py-2 text-xs lowercase transition-colors ${
    active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
  }`
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="ui.sidebarOpen" class="fixed inset-0 z-40 bg-black/50" @click="close" />
    </Transition>

    <Transition name="slide-left">
      <div v-if="ui.sidebarOpen" class="fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-gray-900 py-6">
        <div class="mb-6 px-5">
          <span class="text-lg font-bold text-white lowercase">minimal list</span>
        </div>

        <nav class="flex-1 overflow-y-auto px-3">
          <div class="space-y-0.5">
            <!-- Default folders from API -->
            <template v-if="folderStore.defaultFolders.length">
              <NuxtLink
                v-for="folder in folderStore.defaultFolders"
                :key="folder.uuid"
                :to="folder.name === 'notes' ? '/' : `/?folder=${folder.name}`"
                :class="linkClass(folder.name === 'notes' ? isNotesActive : isFolderActive(folder.name))"
                @click="close"
              >
                {{ folder.name }}
              </NuxtLink>
            </template>
            <!-- Fallback while folders load -->
            <template v-else>
              <NuxtLink to="/" :class="linkClass(isNotesActive)" @click="close">notes</NuxtLink>
              <NuxtLink to="/?folder=tasks" :class="linkClass(isFolderActive('tasks'))" @click="close">tasks</NuxtLink>
              <NuxtLink to="/?folder=reminders" :class="linkClass(isFolderActive('reminders'))" @click="close">reminders</NuxtLink>
            </template>

            <!-- Custom folders -->
            <NuxtLink
              v-for="folder in folderStore.customFolders"
              :key="folder.uuid"
              :to="`/?folder=${folder.uuid}`"
              :class="linkClass(route.query.folder === folder.uuid)"
              @click="close"
            >
              {{ folder.name }}
            </NuxtLink>
          </div>

          <div class="my-3 border-t border-white/10" />

          <div class="space-y-0.5">
            <NuxtLink to="/trash" :class="linkClass(route.path === '/trash')" @click="close">trash</NuxtLink>
            <NuxtLink to="/archive" :class="linkClass(route.path === '/archive')" @click="close">archive</NuxtLink>
          </div>
        </nav>

        <div class="border-t border-white/10 px-3 pt-4 space-y-0.5">
          <NuxtLink to="/settings" :class="linkClass(route.path === '/settings')" @click="close">settings</NuxtLink>
          <NuxtLink to="/auth/profile" :class="linkClass(route.path === '/auth/profile')" @click="close">account</NuxtLink>
          <NuxtLink v-if="authStore.isAdmin" to="/admin" :class="linkClass(route.path.startsWith('/admin'))" @click="close">admin</NuxtLink>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-left-enter-active, .slide-left-leave-active { transition: transform 0.25s ease; }
.slide-left-enter-from, .slide-left-leave-to { transform: translateX(-100%); }
</style>
