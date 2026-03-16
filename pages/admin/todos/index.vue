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

const fetchTodos = async (query?: string) => {
  searching.value = true
  const res = await api.getTodos(undefined, query)
  todos.value = res.data ?? res.results ?? []
  nextCursor.value = res.next ? parseCursor(res.next) : null
  loading.value = false
  searching.value = false
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
  } finally {
    loadingMore.value = false
  }
}

const onScroll = (e: Event) => {
  const el = e.target as HTMLElement
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
  t.deleted ? 'text-red-300' : t.completed ? 'text-green-300' : 'text-blue-300'

const requestDelete = (t: AdminTodo, e: Event) => {
  e.stopPropagation()
  todoToDelete.value = t
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!todoToDelete.value) return
  await api.deleteTodo(todoToDelete.value.id)
  todos.value = todos.value.filter((t) => t.id !== todoToDelete.value!.id)
  todoToDelete.value = null
}
</script>

<template>
  <div
    class="flex min-h-screen w-screen flex-col items-center bg-gray-800 py-10"
  >
    <div class="w-full max-w-3xl px-4">
      <div class="flex items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">all notes</h1>
        <div class="flex items-center gap-3">
          <input
            v-model="search"
            type="text"
            placeholder="search..."
            class="w-40 rounded-lg bg-gray-600 px-3 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none"
            @input="onSearch"
          />
          <NuxtLink
            to="/admin"
            class="text-sm text-white/60 lowercase hover:text-white"
            >back</NuxtLink
          >
        </div>
      </div>

      <div v-if="loading" class="p-4 text-sm text-white/40">loading...</div>

      <div
        v-else
        class="scrollbar-hidden overflow-y-auto rounded-lg shadow-md transition-opacity duration-200"
        :class="searching ? 'opacity-50' : 'opacity-100'"
        style="max-height: 70vh"
        @scroll="onScroll"
      >
        <table class="w-full text-left text-sm text-white">
          <thead
            class="sticky top-0 z-10 bg-gray-700 text-xs text-white/60 lowercase"
          >
            <tr>
              <th class="px-4 py-3">title</th>
              <th class="px-4 py-3">user</th>
              <th class="px-4 py-3">status</th>
              <th class="px-4 py-3">created</th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="todo in todos"
              :key="todo.id"
              class="cursor-pointer border-t border-white/5 bg-gray-600 transition-colors hover:bg-gray-500"
              @click="navigateTo(`/admin/todos/${todo.id}`)"
            >
              <td class="px-4 py-3 lowercase">{{ todo.title }}</td>
              <td class="px-4 py-3 text-white/70">{{ todo.user_email }}</td>
              <td class="px-4 py-3">
                <span class="text-xs" :class="statusClass(todo)">{{
                  statusLabel(todo)
                }}</span>
              </td>
              <td class="px-4 py-3 text-xs text-white/50">
                {{
                  todo.created_at
                    ? new Date(todo.created_at).toLocaleDateString()
                    : '—'
                }}
              </td>
              <td class="px-4 py-3">
                <button
                  class="cursor-pointer text-red-400 hover:text-red-300"
                  @click="requestDelete(todo, $event)"
                >
                  <Icon name="uil:trash" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="!loading && todos.length === 0"
          class="bg-gray-600 p-4 text-center text-sm text-white/40"
        >
          no notes
        </div>
        <div
          v-if="loadingMore"
          class="bg-gray-600 p-3 text-center text-sm text-white/40"
        >
          loading...
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="delete note"
      :message="`permanently delete '${todoToDelete?.title}'? this cannot be undone.`"
      confirm-text="delete forever"
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
