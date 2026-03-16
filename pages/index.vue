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

const handleFilter = async (filter: (typeof filterOptions)[number]) => {
  await flushAll()
  await todoStore.changeFilter(filter)
  router.replace({ query: { filter } })
}

onMounted(() => {
  const saved = route.query.filter as string
  if (
    saved &&
    filterOptions.includes(saved as (typeof filterOptions)[number])
  ) {
    todoStore.changeFilter(saved as (typeof filterOptions)[number])
  }
  todoStore.loadTodos()
})

const scrollContainer = ref<HTMLElement | null>(null)
const showCreateDialog = ref(false)
const createTitle = ref('')
const createBody = ref('')
const createEditorRef = ref<{ focus: () => void } | null>(null)

watch(showCreateDialog, (val) => {
  if (val) nextTick(() => createEditorRef.value?.focus())
})

const hasCreateBody = computed(
  () =>
    createBody.value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, '')
      .trim().length > 0
)

const createErrorMsg = ref('')

const createDialogSubmit = async () => {
  if (!createTitle.value.trim() || !hasCreateBody.value) return
  createErrorMsg.value = ''
  try {
    await todoStore.addTodo({
      title: createTitle.value.toLowerCase(),
      body: createBody.value,
    })
    createTitle.value = ''
    createBody.value = ''
    showCreateDialog.value = false
  } catch (e: unknown) {
    const msg = (e as Error)?.message || ''
    createErrorMsg.value = msg.includes('limit')
      ? 'note limit reached'
      : 'failed to add note'
  }
}

const cancelCreate = () => {
  showCreateDialog.value = false
  createTitle.value = ''
  createBody.value = ''
}
const showScrollTop = ref(false)
const onScroll = () => {
  const el = scrollContainer.value
  if (!el) return
  showScrollTop.value = el.scrollTop > 1000
  if (!todoStore.hasMore || todoStore.loadingMore) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
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
      <div
        v-if="!online"
        class="fixed top-0 z-50 w-full bg-gray-900 py-2 text-center text-xs text-white/60 lowercase"
      >
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
          <NuxtLink
            v-if="authStore.isAdmin"
            to="/admin"
            class="cursor-pointer p-2 text-white/60 hover:text-white"
          >
            <Icon name="uil:setting" class="text-xl" />
          </NuxtLink>
          <NuxtLink
            v-if="authStore.isAuthenticated"
            to="/auth/profile"
            class="cursor-pointer p-2 text-white/60 hover:text-white"
          >
            <Icon name="uil:user-circle" class="text-xl" />
          </NuxtLink>
          <div class="group relative">
            <button class="cursor-pointer p-2 text-white/60 hover:text-white">
              <Icon name="uil:question-circle" class="text-xl" />
            </button>
            <div
              v-once
              class="pointer-events-none absolute right-0 z-50 w-64 rounded-lg bg-gray-700 p-3 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
            >
              <p class="mb-2 font-bold lowercase">keyboard shortcuts</p>
              <ul class="mb-2 space-y-1 text-white/70">
                <li><span class="text-white">⌘/ctrl + enter</span> — save</li>
              </ul>
              <p class="mb-2 font-bold lowercase">formatting</p>
              <ul class="mb-2 space-y-1 text-white/70">
                <li><span class="text-white">⌘/ctrl + b</span> — bold</li>
                <li><span class="text-white">⌘/ctrl + i</span> — italic</li>
              </ul>
              <p class="mb-2 font-bold lowercase">actions</p>
              <ul class="space-y-1 text-white/70">
                <li><span class="text-white">click text</span> — edit note</li>
                <li>
                  <span class="text-white"><Icon name="uil:circle" /></span> —
                  toggle complete
                </li>
                <li>
                  <span class="text-white"><Icon name="uil:trash" /></span> —
                  delete
                </li>
                <li>
                  <span class="text-white"><Icon name="mdi:pin" /></span> —
                  pin/unpin
                </li>
              </ul>
            </div>
          </div>
        </div>
      </PageHeader>
      <!-- Inline form on mobile -->
      <div class="lg:hidden">
        <TodoAdd />
      </div>
    </div>
    <div
      class="my-4 flex w-full max-w-lg justify-center px-4 md:max-w-2xl lg:max-w-3xl xl:max-w-5xl"
    >
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
    <div
      ref="scrollContainer"
      class="scrollbar-hidden w-full max-w-lg overflow-y-auto px-4 md:max-w-2xl lg:max-w-3xl xl:max-w-5xl"
      @scroll="onScroll"
    >
      <TodoList />
      <div v-if="todoStore.loadingMore" class="flex justify-center py-4">
        <span class="text-sm text-white/40">loading...</span>
      </div>
    </div>

    <!-- Toasts -->
    <div
      class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg"
        >
          <span class="lowercase">{{ toast.message }}</span>
          <button
            class="cursor-pointer text-xs text-blue-400 lowercase hover:text-blue-300"
            @click="undoToast(toast.id)"
          >
            undo
          </button>
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
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showCreateDialog"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          tabindex="0"
          @keydown.esc="cancelCreate"
        >
          <form
            class="mx-4 flex w-full max-w-xl flex-col gap-4 rounded-lg bg-gray-800 p-8 shadow-xl"
            @submit.prevent="createDialogSubmit"
          >
            <input
              v-model="createTitle"
              type="text"
              placeholder="title"
              maxlength="100"
              class="w-full border-b border-white/20 bg-transparent pb-2 text-lg font-bold text-white lowercase placeholder-white/60 focus:outline-none"
            />
            <div class="min-h-[150px]">
              <LazyTiptapEditor
                ref="createEditorRef"
                v-model="createBody"
                placeholder="body"
                @submit="createDialogSubmit"
              />
            </div>
            <div class="flex items-center justify-between">
              <span
                class="text-xs"
                :class="createErrorMsg ? 'text-red-400' : 'text-white/60'"
              >
                {{ createErrorMsg || '⌘/ctrl + enter to add' }}
              </span>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="cursor-pointer rounded-lg px-4 py-1.5 text-sm text-white/60 lowercase hover:text-white"
                  @click="cancelCreate"
                >
                  cancel
                </button>
                <button
                  type="submit"
                  class="cursor-pointer rounded-lg bg-gray-700 px-4 py-1.5 text-sm lowercase hover:bg-gray-600"
                  :class="
                    createTitle.trim() && hasCreateBody
                      ? 'text-white'
                      : 'text-white/20'
                  "
                  :disabled="!createTitle.trim() || !hasCreateBody"
                >
                  add
                </button>
              </div>
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>
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
