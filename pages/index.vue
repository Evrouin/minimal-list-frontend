<script setup lang="ts">
import { useTodoStore } from '~/stores/todos'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const isLoggedIn = computed(() => authStore.isAuthenticated)

const todoStore = useTodoStore()
const route = useRoute()
const router = useRouter()
const { online } = useOnline()
const { flushAll } = useUndoToast()

const { filterOptions } = todoStore
const { filteredTodos } = storeToRefs(todoStore)
const mobileEditing = computed(() => filteredTodos.value.some((t) => t.editing))
const scrolledDown = ref(false)
let lastScrollTop = 0
let scrollLock = false
const mobileHidden = computed(() => mobileEditing.value || scrolledDown.value)

watch(scrolledDown, () => {
  scrollLock = true
  setTimeout(() => {
    scrollLock = false
  }, 300)
})

const handleFilter = async (filter: (typeof filterOptions)[number]) => {
  await flushAll()
  await todoStore.changeFilter(filter)
  window.scrollTo({ top: 0 })
  scrolledDown.value = false
  lastScrollTop = 0
  router.replace({ query: { filter } })
}

onMounted(() => {
  const saved = route.query.filter as string
  if (saved && filterOptions.includes(saved as (typeof filterOptions)[number])) {
    todoStore.changeFilter(saved as (typeof filterOptions)[number])
  }
  todoStore.loadTodos()
  window.addEventListener('scroll', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

const todoListRef = ref<{ cancelAllEdits: () => void; isEditing: boolean } | null>(null)
const todoAddRef = ref<{
  title: string
  body: string
  imageFile: File | null
  imagePreview: string
  color: import('~/types/todo').NoteColor
  reminderAt: string | null
  expanded: boolean
  clearImage: () => void
} | null>(null)
const showCreateDialog = ref(false)
const showMobileAdd = ref(false)
const mobileAddTitleRef = ref<HTMLInputElement>()
const mobileAddEditorRef = ref<{ focus: () => void } | null>(null)

watch(showMobileAdd, (val) => {
  if (val) nextTick(() => mobileAddTitleRef.value?.focus())
})
const createTitle = ref('')
const createBody = ref('')
const createEditorRef = ref<{ focus: () => void } | null>(null)

watch(showCreateDialog, (val) => {
  if (val) nextTick(() => createEditorRef.value?.focus())
})

const isLg = ref(false)
let lgQuery: MediaQueryList | null = null
onMounted(() => {
  lgQuery = window.matchMedia('(min-width: 1024px)')
  isLg.value = lgQuery.matches
  lgQuery.addEventListener('change', (e) => {
    isLg.value = e.matches
  })
})
watch(isLg, (lg) => {
  if (!lg && showCreateDialog.value) {
    if (todoAddRef.value) {
      todoAddRef.value.title = createTitle.value
      todoAddRef.value.body = createBody.value
      todoAddRef.value.color = createColor.value
      todoAddRef.value.reminderAt = createReminderAt.value
      if (createImageFile.value) {
        todoAddRef.value.imageFile = createImageFile.value
        todoAddRef.value.imagePreview = createImagePreview.value
      }
    }
    cancelCreate()
  } else if (lg && todoAddRef.value) {
    const { title, body, imageFile, imagePreview, color, reminderAt, expanded } = todoAddRef.value
    if (title || body || imageFile || expanded) {
      createTitle.value = title
      createBody.value = body
      createColor.value = color
      createReminderAt.value = reminderAt
      if (imageFile) {
        createImageFile.value = imageFile
        createImagePreview.value = imagePreview
      }
      todoAddRef.value.title = ''
      todoAddRef.value.body = ''
      todoAddRef.value.color = 'default'
      todoAddRef.value.reminderAt = null
      todoAddRef.value.expanded = false
      todoAddRef.value.clearImage()
      showCreateDialog.value = true
    }
  }
})

const hasCreateBody = computed(
  () =>
    createBody.value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, '')
      .trim().length > 0,
)

const createErrorMsg = ref('')
const createSubmitting = ref(false)
const createImageFile = ref<File | null>(null)
const createImagePreview = ref('')
const createColor = ref<import('~/types/todo').NoteColor>('default')
const createReminderAt = ref<string | null>(null)
const createExpanded = ref(false)
const createAudioFile = ref<File | null>(null)
const createAudioPreview = ref('')
const createAudioRecording = ref(false)

const clearCreateAudio = () => {
  createAudioFile.value = null
  createAudioPreview.value = ''
}

const onCreateImageSelect = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    const compressed = await compressImage(file)
    createImageFile.value = compressed
    createImagePreview.value = URL.createObjectURL(compressed)
  }
}

const clearCreateImage = () => {
  createImageFile.value = null
  createImagePreview.value = ''
}

const { fetchPreviews: fetchCreatePreviews } = useLinkPreviews()

const createDialogSubmit = async () => {
  if (!createTitle.value.trim() || (!hasCreateBody.value && !createImageFile.value && !createAudioFile.value) || createSubmitting.value)
    return
  createSubmitting.value = true
  createErrorMsg.value = ''
  try {
    const previews = await fetchCreatePreviews(createBody.value, [])
    if (createImageFile.value || createAudioFile.value) {
      const fd = new FormData()
      fd.append('title', createTitle.value.toLowerCase())
      fd.append('body', createBody.value)
      fd.append('color', createColor.value)
      if (createReminderAt.value) fd.append('reminder_at', createReminderAt.value)
      if (createImageFile.value) fd.append('image', createImageFile.value)
      if (createAudioFile.value) fd.append('audio', createAudioFile.value)
      if (previews.length) fd.append('link_previews', JSON.stringify(previews))
      await todoStore.addTodo(fd)
    } else {
      await todoStore.addTodo({
        title: createTitle.value.toLowerCase(),
        body: createBody.value,
        color: createColor.value,
        reminder_at: createReminderAt.value,
        link_previews: previews,
      })
    }
    createTitle.value = ''
    createBody.value = ''
    createColor.value = 'default'
    createReminderAt.value = null
    clearCreateImage()
    clearCreateAudio()
    createExpanded.value = false
    showCreateDialog.value = false
  } catch (e: unknown) {
    const msg = (e as Error)?.message || ''
    createErrorMsg.value = msg.includes('limit') ? 'note limit reached' : 'failed to add note'
  } finally {
    createSubmitting.value = false
  }
}

const cancelCreate = () => {
  showCreateDialog.value = false
  createExpanded.value = false
  createTitle.value = ''
  createBody.value = ''
  createColor.value = 'default'
  createReminderAt.value = null
  createImageFile.value = null
  createImagePreview.value = ''
  clearCreateAudio()
}

const mobileAddSubmit = () => createDialogSubmit().then(() => { showMobileAdd.value = false })

const cancelMobileAdd = () => {
  showMobileAdd.value = false
  createTitle.value = ''
  createBody.value = ''
  createColor.value = 'default'
  createReminderAt.value = null
  createImageFile.value = null
  createImagePreview.value = ''
  clearCreateAudio()
}

const showScrollTop = ref(false)
const onScroll = () => {
  const top = window.scrollY
  const scrollable = document.documentElement.scrollHeight > window.innerHeight * 1.5
  if (!scrollLock && scrollable && Math.abs(top - lastScrollTop) > 30) {
    scrolledDown.value = top > lastScrollTop && top > 150
    lastScrollTop = top
  } else if (!scrollable) {
    scrolledDown.value = false
    lastScrollTop = 0
  }
  showScrollTop.value = top > 1000
  if (!todoStore.hasMore || todoStore.loadingMore) return
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
    todoStore.loadMore()
  }
}
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const { toasts, undo: undoToast } = useUndoToast()
</script>

<template>
  <!-- Landing page for unauthenticated users -->
  <div v-if="!isLoggedIn" class="flex min-h-screen flex-col bg-gray-800">
    <nav class="flex items-center justify-between px-6 py-4">
      <div class="flex items-center gap-2">
        <img src="~/assets/logo.png" alt="minimal list" class="h-7 w-7" >
        <span class="text-lg font-bold text-white lowercase">minimal list</span>
      </div>
    </nav>
    <div class="flex flex-1 flex-col items-center justify-center px-6 pt-10 text-center sm:pt-0">
      <h1 class="mb-4 text-2xl font-bold text-white lowercase sm:text-4xl">notes, simplified.</h1>
      <p class="mb-8 max-w-xs text-xs leading-relaxed text-white/40 sm:max-w-md sm:text-sm">a minimalist space for your notes and recordings. built to keep you focused.</p>
      <p class="mb-6 text-xs tracking-widest text-white/20">write. record. remember.</p>
      <div class="flex gap-3">
        <NuxtLink to="/auth/register" class="rounded-lg bg-gray-600 px-6 py-2.5 text-xs font-medium text-white lowercase transition-colors hover:bg-gray-500">get started</NuxtLink>
        <NuxtLink to="/auth/login" class="rounded-lg border border-white/10 px-6 py-2.5 text-xs text-white/60 lowercase transition-colors hover:border-white/20 hover:text-white">login</NuxtLink>
      </div>
    </div>
    <div class="px-6 pb-20 pt-8">
      <div class="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-lg bg-gray-700 p-5">
          <Icon name="uil:edit" class="mb-2 text-lg text-white/40" />
          <p class="text-xs font-medium text-white">rich text editing</p>
          <p class="mt-1 text-xs text-white/30">bold, lists, task lists, and more with a full editor.</p>
        </div>
        <div class="rounded-lg bg-gray-700 p-5">
          <Icon name="uil:microphone" class="mb-2 text-lg text-white/40" />
          <p class="text-xs font-medium text-white">voice notes</p>
          <p class="mt-1 text-xs text-white/30">record audio directly in your notes with playback.</p>
        </div>
        <div class="rounded-lg bg-gray-700 p-5">
          <Icon name="uil:bell" class="mb-2 text-lg text-white/40" />
          <p class="text-xs font-medium text-white">reminders</p>
          <p class="mt-1 text-xs text-white/30">set date and time reminders with notifications.</p>
        </div>
        <div class="rounded-lg bg-gray-700 p-5">
          <Icon name="uil:link" class="mb-2 text-lg text-white/40" />
          <p class="text-xs font-medium text-white">link previews</p>
          <p class="mt-1 text-xs text-white/30">paste a url and see a preview card automatically.</p>
        </div>
        <div class="rounded-lg bg-gray-700 p-5">
          <Icon name="uil:image" class="mb-2 text-lg text-white/40" />
          <p class="text-xs font-medium text-white">images & colors</p>
          <p class="mt-1 text-xs text-white/30">attach images and color-code your notes.</p>
        </div>
        <div class="rounded-lg bg-gray-700 p-5">
          <Icon name="uil:mobile-android" class="mb-2 text-lg text-white/40" />
          <p class="text-xs font-medium text-white">android app</p>
          <p class="mt-1 text-xs text-white/30">native android app with haptics and notifications.</p>
        </div>
      </div>
    </div>
    <div class="px-6 pb-6 text-center">
      <p class="text-xs text-white/20">built by evrouin</p>
    </div>
  </div>

  <!-- Notes app for authenticated users -->
  <div v-else class="flex min-h-screen w-screen flex-col items-center bg-gray-800 pt-10">
    <Transition name="slide">
      <div v-if="!online" class="fixed top-0 z-50 w-full bg-gray-900 py-2 text-center text-xs text-white/60 lowercase">
        you're offline — changes won't sync
      </div>
    </Transition>
    <div class="w-full max-w-lg px-4 md:max-w-2xl lg:max-w-3xl xl:max-w-5xl">
      <PageHeader title="minimal list">
        <div class="flex shrink-0 items-center">
          <button
            class="hidden cursor-pointer p-2 text-white/60 hover:text-white lg:block"
            title="New note"
            @click="showCreateDialog = true"
          >
            <Icon name="uil:plus" class="text-xl" />
          </button>
          <NuxtLink v-if="authStore.isAdmin" to="/admin" class="cursor-pointer p-2 text-white/60 hover:text-white">
            <Icon name="uil:setting" class="text-xl" />
          </NuxtLink>
          <NuxtLink v-if="authStore.isAuthenticated" to="/auth/profile" class="cursor-pointer p-2 text-white/60 hover:text-white">
            <Icon name="uil:user-circle" class="text-xl" />
          </NuxtLink>
        </div>
      </PageHeader>
      <!-- Mobile add button is now a FAB -->
    </div>
    <Transition name="slide-up">
      <div v-if="!mobileHidden" class="my-4 flex w-full max-w-lg justify-center px-4 md:max-w-2xl lg:max-w-3xl xl:max-w-5xl">
        <button
          v-for="(filter, index) in filterOptions"
          :key="index"
          class="mx-1 cursor-pointer rounded-lg px-3 py-2 text-xs text-white lowercase transition-all duration-200 sm:text-sm"
          :class="todoStore.filterType === filter ? 'bg-gray-700' : 'bg-gray-800'"
          @click="handleFilter(filter)"
        >
          {{ filter.charAt(0).toUpperCase() + filter.slice(1) }}
        </button>
      </div>
    </Transition>
    <div
      class="w-full max-w-lg px-4 pb-10 md:max-w-2xl lg:max-w-3xl xl:max-w-5xl"
    >
      <TodoList ref="todoListRef" />
      <div v-if="todoStore.loadingMore" class="flex justify-center py-4">
        <span class="text-sm text-white/40">loading...</span>
      </div>
    </div>

    <!-- Toasts -->
    <div class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-2.5 text-xs whitespace-nowrap text-white shadow-lg sm:text-sm"
        >
          <span class="lowercase">{{ toast.message }}</span>
          <button class="cursor-pointer text-xs text-blue-400 lowercase hover:text-blue-300" @click="undoToast(toast.id)">undo</button>
        </div>
      </TransitionGroup>
    </div>

    <div class="fixed right-6 bottom-6 z-40 flex flex-col gap-3 lg:hidden">
      <button
        class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-900 text-white/60 shadow-lg transition-colors hover:bg-gray-800 hover:text-white"
        @click="showMobileAdd = true"
      >
        <Icon name="uil:plus" class="h-5 w-5" />
      </button>
      <Transition name="fade">
        <button
          v-if="showScrollTop"
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-900 text-white/60 shadow-lg transition-colors hover:bg-gray-800 hover:text-white"
          @click="scrollToTop"
        >
          <Icon name="uil:arrow-up" class="h-5 w-5" />
        </button>
      </Transition>
    </div>

    <!-- Scroll to top (desktop) -->
    <Transition name="fade">
      <button
        v-if="showScrollTop"
        class="fixed right-6 bottom-6 z-40 hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-700 text-white/60 shadow-lg transition-colors hover:bg-gray-600 hover:text-white lg:flex"
        @click="scrollToTop"
      >
        <Icon name="uil:arrow-up" class="h-5 w-5" />
      </button>
    </Transition>

    <!-- Mobile add dialog -->
    <Teleport to="body">
      <div v-if="showMobileAdd" class="fixed inset-0 z-50 flex flex-col bg-gray-800 p-3">
        <div class="mb-3 px-2">
          <span class="text-lg font-bold text-white lowercase">minimal list</span>
        </div>
        <form
          class="flex flex-1 flex-col gap-3 rounded-lg p-5 text-xs text-white"
          :class="noteColors[createColor]?.bg || 'bg-gray-700'"
          @submit.prevent="mobileAddSubmit"
          @click.self="mobileAddEditorRef?.focus()"
        >
          <input
            ref="mobileAddTitleRef"
            v-model="createTitle"
            type="text"
            placeholder="title"
            maxlength="100"
            class="border-b border-white/20 bg-transparent text-sm placeholder-white/60 focus:outline-none"
            @input="(e) => { (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.toLowerCase(); createTitle = (e.target as HTMLInputElement).value }"
          >
          <div class="flex-1 overflow-y-auto" @click="mobileAddEditorRef?.focus()">
            <LazyTiptapEditor ref="mobileAddEditorRef" v-model="createBody" placeholder="body" />
          </div>
          <AudioPlayer v-if="createAudioPreview" :src="createAudioPreview" removable @remove="clearCreateAudio" />
          <div class="flex items-center justify-between">
            <span v-if="createErrorMsg" class="text-xs text-red-400">{{ createErrorMsg }}</span>
            <ColorPicker v-else v-model="createColor" />
            <div class="flex items-center gap-1">
              <ReminderPicker v-model="createReminderAt" />
              <AudioRecorder @recorded="(f, u) => { createAudioFile = f; createAudioPreview = u }" @update:recording="(v) => (createAudioRecording = v)" />
              <template v-if="!createAudioRecording">
                <label class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60">
                  <Icon name="uil:image" class="text-xs" />
                  <input type="file" accept="image/*" class="hidden" @change="onCreateImageSelect" >
                </label>
                <button
                  type="button"
                  class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/40 hover:text-white"
                  @mousedown.prevent
                  @click="cancelMobileAdd"
                >
                  cancel
                </button>
                <button
                  type="submit"
                  class="cursor-pointer rounded px-2 py-0.5 text-xs"
                  :class="createTitle.trim() && (hasCreateBody || createImageFile || createAudioFile) ? 'text-white/60 hover:text-white' : 'text-white/20'"
                  :disabled="!createTitle.trim() || (!hasCreateBody && !createImageFile && !createAudioFile)"
                  @mousedown.prevent
                >
                  add
                </button>
              </template>
            </div>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- Create dialog (lg+ screens) -->
    <ModalOverlay :show="showCreateDialog" tabindex="0" @keydown.esc="cancelCreate">
      <form
        class="mx-4 flex w-full flex-col gap-4 rounded-lg p-8 shadow-xl transition-all duration-200"
        :class="[noteColors[createColor]?.bg || 'bg-gray-800', createExpanded ? 'max-h-[85vh] max-w-4xl' : 'max-w-xl']"
        @submit.prevent="createDialogSubmit"
      >
        <ImagePreview v-if="createImagePreview" :src="createImagePreview" :padding="8" removable @remove="clearCreateImage" />
        <input
          v-model="createTitle"
          type="text"
          placeholder="title"
          maxlength="100"
          class="w-full border-b border-white/20 bg-transparent pb-2 text-sm font-bold text-white lowercase placeholder-white/60 focus:outline-none"
        />
        <div :class="createExpanded ? 'min-h-[400px] flex-1 overflow-y-auto' : 'min-h-[150px]'">
          <LazyTiptapEditor ref="createEditorRef" v-model="createBody" placeholder="body" @submit="createDialogSubmit" />
        </div>
        <AudioPlayer v-if="createAudioPreview" :src="createAudioPreview" removable @remove="clearCreateAudio" />
        <div class="flex items-center justify-between">
          <span v-if="createErrorMsg" class="text-xs text-red-400">{{ createErrorMsg }}</span>
          <ColorPicker v-else v-model="createColor" />
          <div class="flex items-center gap-1">
            <ReminderPicker v-if="!createAudioRecording" v-model="createReminderAt" />
            <AudioRecorder
              @recorded="
                (f, u) => {
                  createAudioFile = f
                  createAudioPreview = u
                }
              "
              @update:recording="(v) => (createAudioRecording = v)"
            />
            <template v-if="!createAudioRecording">
              <label class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60">
                <Icon name="uil:image" class="text-xs" />
                <input type="file" accept="image/*" class="hidden" @change="onCreateImageSelect" />
              </label>
              <button
                type="button"
                class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60"
                @click="createExpanded = !createExpanded"
              >
                <Icon :name="createExpanded ? 'uil:compress-arrows' : 'uil:expand-arrows-alt'" class="text-xs" />
              </button>
              <button
                type="button"
                class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/60 lowercase hover:text-white"
                @click="cancelCreate"
              >
                cancel
              </button>
              <button
                type="submit"
                class="cursor-pointer rounded px-2 py-0.5 text-xs lowercase"
                :class="
                  createTitle.trim() && (hasCreateBody || createImageFile || createAudioFile)
                    ? 'text-white/60 hover:text-white'
                    : 'text-white/20'
                "
                :disabled="!createTitle.trim() || (!hasCreateBody && !createImageFile && !createAudioFile)"
              >
                add
              </button>
            </template>
          </div>
        </div>
      </form>
    </ModalOverlay>
  </div>
</template>

<style scoped>
.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}

.scrollbar-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
  scroll-behavior: smooth;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  transform: translateY(1rem);
  opacity: 0;
}
</style>
