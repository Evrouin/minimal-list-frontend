<script setup lang="ts">
import type { AdminTodo } from '~/composables/useAdminApi'

definePageMeta({ middleware: ['admin'] })

const api = useAdminApi()
const todos = ref<AdminTodo[]>([])
const nextCursor = ref<string | null>(null)
const loadingMore = ref(false)
const loading = ref(true)
const showDeleteDialog = ref(false)
const todoToDelete = ref<AdminTodo | null>(null)
const search = ref('')
let searchTimer: ReturnType<typeof setTimeout>

const hasMore = computed(() => !!nextCursor.value)
const parseCursor = (url: string) => new URL(url).pathname + new URL(url).search

const searching = ref(false)
const error = ref('')
const scrollContainer = ref<HTMLElement>()
const showScrollTop = ref(false)

const fetchTodos = async (query?: string) => {
  searching.value = true
  try {
    const res = await api.getTodos(undefined, query)
    todos.value = res.data ?? res.results ?? []
    nextCursor.value = res.next ? parseCursor(res.next) : null
  } catch {
    error.value = 'failed to load notes'
  } finally {
    loading.value = false
    searching.value = false
  }
}

onMounted(() => fetchTodos())

const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchTodos(search.value || undefined), 800)
}

const loadMore = async () => {
  if (!nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  try {
    const res = await api.getTodos(nextCursor.value)
    todos.value.push(...(res.data ?? res.results ?? []))
    nextCursor.value = res.next ? parseCursor(res.next) : null
  } catch {
    error.value = 'failed to load more'
  } finally {
    loadingMore.value = false
  }
}

const onScroll = (e: Event) => {
  const el = e.target as HTMLElement
  showScrollTop.value = el.scrollTop > 300
  if (
    hasMore.value &&
    !loadingMore.value &&
    el.scrollTop + el.clientHeight >= el.scrollHeight - 100
  ) {
    loadMore()
  }
}

const statusLabel = (t: AdminTodo) =>
  t.deleted ? 'deleted' : t.completed ? 'completed' : 'active'
const statusClass = (t: AdminTodo) =>
  t.deleted ? 'bg-red-500/20 text-red-300' : t.completed ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'

const requestDelete = (t: AdminTodo, e: Event) => {
  e.stopPropagation()
  e.preventDefault()
  todoToDelete.value = t
  showDeleteDialog.value = true
}

const sortKey = ref<'title' | 'user_email' | 'status' | 'created_at'>('created_at')
const sortAsc = ref(false)

const toggleSort = (key: typeof sortKey.value) => {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else { sortKey.value = key; sortAsc.value = true }
}

const sortedTodos = computed(() => {
  const k = sortKey.value
  const dir = sortAsc.value ? 1 : -1
  return [...todos.value].sort((a, b) => {
    if (k === 'status') return statusLabel(a).localeCompare(statusLabel(b)) * dir
    return String(a[k] ?? '').localeCompare(String(b[k] ?? '')) * dir
  })
})

const deleting = ref(false)

const confirmDelete = async () => {
  if (!todoToDelete.value) return
  deleting.value = true
  try {
    await api.deleteTodo(todoToDelete.value.id)
    todos.value = todos.value.filter((t) => t.id !== todoToDelete.value!.id)
    showDeleteDialog.value = false
  } catch {
    error.value = 'failed to delete note'
  }
  deleting.value = false
  todoToDelete.value = null
}
</script>

<template>
  <div
    class="flex min-h-screen w-screen flex-col items-center bg-gray-800 py-10"
  >
    <div class="w-full max-w-lg px-4 md:max-w-2xl lg:max-w-3xl xl:max-w-5xl">
      <PageHeader title="notes">
        <input
          v-model="search"
          type="text"
          placeholder="search..."
          class="w-40 rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none"
          @input="onSearch"
        />
        <NuxtLink
          to="/admin"
          class="text-sm text-white/60 lowercase hover:text-white"
          >back</NuxtLink
        >
      </PageHeader>

      <div v-if="loading" class="p-4 text-sm text-white/40">loading...</div>
      <div v-else-if="error" class="p-4 text-sm text-red-400">{{ error }}</div>

      <div
        v-else
        ref="scrollContainer"
        class="scrollbar-hidden relative overflow-y-auto transition-opacity duration-200"
        :class="searching ? 'opacity-50' : 'opacity-100'"
        style="max-height: 70vh"
        @scroll="onScroll"
      >
        <!-- mobile: card layout -->
        <div class="flex flex-col gap-3 md:hidden">
          <div
            v-for="todo in sortedTodos"
            :key="todo.id"
            class="cursor-pointer rounded-lg bg-gray-700 p-4 transition-colors hover:bg-gray-600"
            @click="navigateTo(`/admin/todos/${todo.id}`)"
          >
            <div class="mb-2 flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-white lowercase">{{ todo.title }}</p>
                <p class="text-xs text-white/50">{{ todo.user_email }}</p>
              </div>
              <button
                class="ml-2 cursor-pointer text-red-400 hover:text-red-300"
                @click="requestDelete(todo, $event)"
              >
                <Icon name="uil:trash" class="text-sm" />
              </button>
            </div>
            <div class="flex items-center gap-3 text-xs">
              <span class="rounded-full px-2 py-0.5" :class="statusClass(todo)">{{ statusLabel(todo) }}</span>
              <span class="ml-auto text-white/40">
                {{ todo.created_at ? new Date(todo.created_at).toLocaleDateString() : '—' }}
              </span>
            </div>
          </div>
          <div v-if="!loading && todos.length === 0" class="p-4 text-center text-sm text-white/40">no notes</div>
        </div>

        <!-- desktop: table layout -->
        <div class="hidden overflow-hidden rounded-lg bg-gray-700 shadow-md md:block">
          <table class="w-full text-left text-sm text-white">
            <thead class="border-b border-white/10 text-xs text-white/50 lowercase">
              <tr>
                <th class="cursor-pointer select-none px-4 py-3 hover:text-white" @click="toggleSort('title')">
                  title <span v-if="sortKey === 'title'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th class="cursor-pointer select-none px-4 py-3 hover:text-white" @click="toggleSort('user_email')">
                  user <span v-if="sortKey === 'user_email'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th class="cursor-pointer select-none px-4 py-3 hover:text-white" @click="toggleSort('status')">
                  status <span v-if="sortKey === 'status'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th class="cursor-pointer select-none px-4 py-3 hover:text-white" @click="toggleSort('created_at')">
                  created <span v-if="sortKey === 'created_at'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th class="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="todo in sortedTodos"
                :key="todo.id"
                class="cursor-pointer border-t border-white/5 transition-colors hover:bg-white/5"
                @click="navigateTo(`/admin/todos/${todo.id}`)"
              >
                <td class="px-4 py-3 lowercase">{{ todo.title }}</td>
                <td class="px-4 py-3 text-white/70">{{ todo.user_email }}</td>
                <td class="px-4 py-3">
                  <span class="rounded-full px-2 py-0.5 text-xs" :class="statusClass(todo)">{{ statusLabel(todo) }}</span>
                </td>
                <td class="px-4 py-3 text-xs text-white/50">
                  {{ todo.created_at ? new Date(todo.created_at).toLocaleDateString() : '—' }}
                </td>
                <td class="px-4 py-3">
                  <button class="cursor-pointer text-red-400 hover:text-red-300" @click="requestDelete(todo, $event)">
                    <Icon name="uil:trash" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="!loading && todos.length === 0" class="p-4 text-center text-sm text-white/40">no notes</div>
        </div>

        <div v-if="loadingMore" class="p-3 text-center text-sm text-white/40">loading...</div>

        <button
          v-show="showScrollTop"
          class="sticky bottom-2 left-full mr-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gray-600 text-white/60 shadow-lg transition-colors hover:text-white"
          @click="scrollContainer?.scrollTo({ top: 0, behavior: 'smooth' })"
        >
          <Icon name="uil:arrow-up" />
        </button>
      </div>
    </div>

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="delete note"
      :message="`permanently delete '${todoToDelete?.title}'? this cannot be undone.`"
      confirm-text="delete forever"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}
.scrollbar-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
