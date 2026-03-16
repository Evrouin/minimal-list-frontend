<script setup lang="ts">
import { useTodoStore } from '~/stores/todos'
import { useAuthStore } from '~/stores/auth'

const todoStore = useTodoStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const { filterOptions } = todoStore

const handleFilter = (filter: (typeof filterOptions)[number]) => {
  todoStore.changeFilter(filter)
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

const hasCreateBody = computed(() =>
  createBody.value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length > 0
)

const createDialogSubmit = async () => {
  if (!createTitle.value.trim() || !hasCreateBody.value) return
  await todoStore.addTodo({ title: createTitle.value.toLowerCase(), body: createBody.value })
  createTitle.value = ''
  createBody.value = ''
  showCreateDialog.value = false
}

const onScroll = () => {
  const el = scrollContainer.value
  if (!el || !todoStore.hasMore || todoStore.loadingMore) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
    todoStore.loadMore()
  }
}
</script>

<template>
  <div
    class="flex h-screen w-screen flex-col items-center bg-gray-800 pt-10"
  >
    <div class="w-full max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-5xl px-4">
      <div class="flex items-center justify-between">
        <TodoHeader title="Minimalist Todo List" />
        <div class="flex shrink-0 items-center">
          <button
            class="hidden lg:block cursor-pointer p-2 text-white/60 hover:text-white"
            title="New todo"
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
                <li><span class="text-white">click text</span> — edit todo</li>
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
      </div>
      <!-- Inline form on mobile -->
      <div class="lg:hidden">
        <TodoAdd />
      </div>
    </div>
    <div class="my-4 flex w-full max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-5xl justify-center px-4">
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
      class="scrollbar-hidden w-full max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-5xl overflow-y-auto px-4"
      @scroll="onScroll"
    >
      <TodoList />
      <div v-if="todoStore.loadingMore" class="flex justify-center py-4">
        <span class="text-sm text-white/40">loading...</span>
      </div>
    </div>

    <!-- Create dialog (lg+ screens) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showCreateDialog"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          @keydown.esc="showCreateDialog = false; createTitle = ''; createBody = ''"
          tabindex="0"
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
              <TiptapEditor
                ref="createEditorRef"
                v-model="createBody"
                placeholder="body"
                @submit="createDialogSubmit"
              />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-white/60">⌘/ctrl + enter to add</span>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="cursor-pointer rounded-lg px-4 py-1.5 text-sm text-white/60 lowercase hover:text-white"
                  @click="showCreateDialog = false; createTitle = ''; createBody = ''"
                >
                  cancel
                </button>
                <button
                  type="submit"
                  class="cursor-pointer rounded-lg bg-gray-700 px-4 py-1.5 text-sm lowercase hover:bg-gray-600"
                  :class="createTitle.trim() && hasCreateBody ? 'text-white' : 'text-white/20'"
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
</style>
