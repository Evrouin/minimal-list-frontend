<script setup lang="ts">
import { useTodoStore } from '~/stores/todos'
import { useAuthStore } from '~/stores/auth'

const todoStore = useTodoStore()
const authStore = useAuthStore()
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
  scrollContainer.value?.scrollTo({ top: 0 })
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
})

const scrollContainer = ref<HTMLElement | null>(null)
const todoListRef = ref<{ cancelAllEdits: () => void; isEditing: boolean } | null>(null)
const todoAddRef = ref<{
  title: string
  body: string
  imageFile: File | null
  imagePreview: string
  color: import('~/types/todo').NoteColor
  clearImage: () => void
} | null>(null)
const showCreateDialog = ref(false)
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
    // Desktop → mobile: transfer dialog state to TodoAdd
    if (todoAddRef.value) {
      todoAddRef.value.title = createTitle.value
      todoAddRef.value.body = createBody.value
      todoAddRef.value.color = createColor.value
      if (createImageFile.value) {
        todoAddRef.value.imageFile = createImageFile.value
        todoAddRef.value.imagePreview = createImagePreview.value
      }
    }
    cancelCreate()
  } else if (lg && todoAddRef.value) {
    // Mobile → desktop: transfer TodoAdd state to dialog if has content
    const { title, body, imageFile, imagePreview, color } = todoAddRef.value
    if (title || body || imageFile) {
      createTitle.value = title
      createBody.value = body
      createColor.value = color
      if (imageFile) {
        createImageFile.value = imageFile
        createImagePreview.value = imagePreview
      }
      todoAddRef.value.title = ''
      todoAddRef.value.body = ''
      todoAddRef.value.color = 'default'
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

const createDialogSubmit = async () => {
  if (!createTitle.value.trim() || (!hasCreateBody.value && !createImageFile.value) || createSubmitting.value) return
  createSubmitting.value = true
  createErrorMsg.value = ''
  try {
    if (createImageFile.value) {
      const fd = new FormData()
      fd.append('title', createTitle.value.toLowerCase())
      fd.append('body', createBody.value)
      fd.append('color', createColor.value)
      if (createReminderAt.value) fd.append('reminder_at', createReminderAt.value)
      fd.append('image', createImageFile.value)
      await todoStore.addTodo(fd)
    } else {
      await todoStore.addTodo({
        title: createTitle.value.toLowerCase(),
        body: createBody.value,
        color: createColor.value,
        reminder_at: createReminderAt.value,
      })
    }
    createTitle.value = ''
    createBody.value = ''
    createColor.value = 'default'
    createReminderAt.value = null
    clearCreateImage()
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
  createTitle.value = ''
  createBody.value = ''
  createColor.value = 'default'
  createReminderAt.value = null
  createImageFile.value = null
  createImagePreview.value = ''
}
const showScrollTop = ref(false)
const onScroll = () => {
  const el = scrollContainer.value
  if (!el) return
  const top = el.scrollTop
  const scrollable = el.scrollHeight > el.clientHeight * 1.5
  if (!scrollLock && scrollable && Math.abs(top - lastScrollTop) > 30) {
    scrolledDown.value = top > lastScrollTop && top > 150
    lastScrollTop = top
  } else if (!scrollable) {
    scrolledDown.value = false
    lastScrollTop = 0
  }
  showScrollTop.value = top > 1000
  if (!todoStore.hasMore || todoStore.loadingMore) return
  if (el.scrollTop > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
    todoStore.loadMore()
  }
}
const scrollToTop = () => {
  scrollContainer.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const { toasts, undo: undoToast } = useUndoToast()
</script>

<template>
  <div class="flex h-screen w-screen flex-col items-center bg-gray-800 pt-10">
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
      <!-- Inline form on mobile -->
      <Transition name="slide-up">
        <div v-if="!mobileHidden" class="lg:hidden" @click="todoListRef?.cancelAllEdits()">
          <TodoAdd ref="todoAddRef" />
        </div>
      </Transition>
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
      ref="scrollContainer"
      class="scrollbar-hidden w-full max-w-lg overflow-y-auto px-4 md:max-w-2xl lg:max-w-3xl xl:max-w-5xl"
      @scroll="onScroll"
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

    <!-- Scroll to top -->
    <Transition name="fade">
      <button
        v-if="showScrollTop"
        class="fixed right-6 bottom-6 z-40 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-700 text-white/60 shadow-lg transition-colors hover:bg-gray-600 hover:text-white"
        title="Back to top"
        @click="scrollToTop"
      >
        <Icon name="uil:arrow-up" class="h-5 w-5" />
      </button>
    </Transition>

    <!-- Create dialog (lg+ screens) -->
    <ModalOverlay :show="showCreateDialog" tabindex="0" @keydown.esc="cancelCreate">
      <form
        class="mx-4 flex w-full max-w-xl flex-col gap-4 rounded-lg p-8 shadow-xl"
        :class="noteColors[createColor]?.bg || 'bg-gray-800'"
        @submit.prevent="createDialogSubmit"
      >
        <ImagePreview v-if="createImagePreview" :src="createImagePreview" :padding="8" removable @remove="clearCreateImage" />
        <input
          v-model="createTitle"
          type="text"
          placeholder="title"
          maxlength="100"
          class="w-full border-b border-white/20 bg-transparent pb-2 text-sm font-bold text-white lowercase placeholder-white/60 focus:outline-none"
        >
        <div class="min-h-[150px]">
          <LazyTiptapEditor ref="createEditorRef" v-model="createBody" placeholder="body" @submit="createDialogSubmit" />
        </div>
        <div class="flex items-center justify-between">
          <span v-if="createErrorMsg" class="text-xs text-red-400">{{ createErrorMsg }}</span>
          <ColorPicker v-else v-model="createColor" />
          <div class="flex items-center gap-2">
            <ReminderPicker v-model="createReminderAt" />
            <label class="cursor-pointer rounded p-1 text-white/30 transition-colors hover:text-white/60">
              <Icon name="uil:image" class="text-sm" />
              <input type="file" accept="image/*" class="hidden" @change="onCreateImageSelect" >
            </label>
            <button
              type="button"
              class="cursor-pointer rounded-lg px-4 py-1.5 text-sm text-white/60 lowercase hover:text-white"
              @click="cancelCreate"
            >
              cancel
            </button>
            <button
              type="submit"
              class="cursor-pointer rounded-lg bg-gray-700 px-4 py-1.5 text-xs lowercase hover:bg-gray-600"
              :class="createTitle.trim() && (hasCreateBody || createImageFile) ? 'text-white' : 'text-white/20'"
              :disabled="!createTitle.trim() || (!hasCreateBody && !createImageFile)"
            >
              add
            </button>
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
