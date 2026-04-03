<script setup lang="ts">
import type { AdminTodo } from '~/composables/useAdminApi'

definePageMeta({ middleware: ['admin'], layout: 'admin' })

const api = useAdminApi()
const todos = ref<AdminTodo[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const searching = ref(false)
let searchTimer: ReturnType<typeof setTimeout>

const page = ref(1)
const totalCount = ref(0)
const pageSize = 15
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))

const showDeleteDialog = ref(false)
const todoToDelete = ref<AdminTodo | null>(null)
const deleting = ref(false)

const sortKey = ref<'title' | 'user_email' | 'status' | 'created_at'>('created_at')
const sortAsc = ref(false)

const fetchTodos = async () => {
  try {
    const res = await api.getTodos(page.value, search.value || undefined)
    todos.value = res.results
    totalCount.value = res.count
  } catch {
    error.value = 'failed to load notes'
  }
}

onMounted(async () => {
  await fetchTodos()
  loading.value = false
})

const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    searching.value = true
    page.value = 1
    await fetchTodos()
    searching.value = false
  }, 400)
}

const goToPage = async (p: number) => {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
  searching.value = true
  await fetchTodos()
  searching.value = false
}

const toggleSort = (key: typeof sortKey.value) => {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else {
    sortKey.value = key
    sortAsc.value = true
  }
}

const statusLabel = (t: AdminTodo) => (t.deleted ? 'deleted' : t.completed ? 'completed' : 'active')
const statusColor = (t: AdminTodo): 'green' | 'red' | 'blue' => (t.deleted ? 'red' : t.completed ? 'green' : 'blue')

const sortedTodos = computed(() => {
  const k = sortKey.value
  const dir = sortAsc.value ? 1 : -1
  return [...todos.value].sort((a, b) => {
    if (k === 'status') return statusLabel(a).localeCompare(statusLabel(b)) * dir
    return String(a[k] ?? '').localeCompare(String(b[k] ?? '')) * dir
  })
})

const requestDelete = (t: AdminTodo, e: Event) => {
  e.stopPropagation()
  todoToDelete.value = t
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!todoToDelete.value) return
  deleting.value = true
  try {
    await api.deleteTodo(todoToDelete.value.uuid)
    todos.value = todos.value.filter((t) => t.uuid !== todoToDelete.value!.uuid)
    totalCount.value--
    showDeleteDialog.value = false
  } catch {
    error.value = 'failed to delete note'
  }
  deleting.value = false
  todoToDelete.value = null
}
</script>

<template>
  <div>
    <PageHeader title="notes">
      <input
        v-model="search"
        type="text"
        placeholder="search..."
        class="w-40 rounded-lg bg-gray-700 px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none"
        @input="onSearch"
      />
      <NuxtLink to="/admin" class="text-sm text-white/60 lowercase hover:text-white">back</NuxtLink>
    </PageHeader>

    <div v-if="loading" class="p-4 text-sm text-white/40">loading...</div>
    <div v-else-if="error" class="p-4 text-sm text-red-400">{{ error }}</div>

    <div v-else :class="searching ? 'opacity-50' : ''">
      <!-- mobile: card layout -->
      <div class="flex min-h-[520px] flex-col gap-3 md:hidden">
        <div
          v-for="todo in sortedTodos"
          :key="todo.uuid"
          class="cursor-pointer rounded-lg bg-gray-700 p-4 transition-colors hover:bg-gray-600"
          @click="navigateTo(`/admin/todos/${todo.uuid}`)"
        >
          <div class="mb-2 flex items-start justify-between">
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-medium text-white lowercase">{{ todo.title }}</p>
              <p class="text-xs text-white/50">{{ todo.user_email }}</p>
            </div>
            <button class="ml-2 cursor-pointer text-red-400 hover:text-red-300" @click="requestDelete(todo, $event)">
              <Icon name="uil:trash" class="text-sm" />
            </button>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <PillBadge :color="statusColor(todo)" :label="statusLabel(todo)" />
            <span class="ml-auto text-white/40">
              {{ todo.created_at ? new Date(todo.created_at).toLocaleDateString() : '—' }}
            </span>
          </div>
        </div>
        <div v-if="todos.length === 0" class="p-4 text-center text-sm text-white/40">no notes</div>
      </div>

      <!-- desktop: table layout -->
      <div class="hidden min-h-[520px] overflow-hidden rounded-lg bg-gray-700 shadow-md md:block">
        <table class="w-full text-left text-xs text-white">
          <thead class="border-b border-white/10 text-xs text-white/50 lowercase">
            <tr>
              <th class="w-64 cursor-pointer px-4 py-3 select-none hover:text-white" @click="toggleSort('title')">
                title
                <span v-if="sortKey === 'title'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th class="w-48 cursor-pointer px-4 py-3 select-none hover:text-white" @click="toggleSort('user_email')">
                user
                <span v-if="sortKey === 'user_email'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th class="cursor-pointer px-4 py-3 text-center select-none hover:text-white" @click="toggleSort('status')">
                status
                <span v-if="sortKey === 'status'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th class="cursor-pointer px-4 py-3 text-center select-none hover:text-white" @click="toggleSort('created_at')">
                created
                <span v-if="sortKey === 'created_at'" class="text-white">{{ sortAsc ? '↑' : '↓' }}</span>
              </th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="todo in sortedTodos"
              :key="todo.uuid"
              class="cursor-pointer border-t border-white/5 transition-colors hover:bg-white/5"
              @click="navigateTo(`/admin/todos/${todo.uuid}`)"
            >
              <td class="max-w-64 truncate px-4 py-3 lowercase">{{ todo.title }}</td>
              <td class="max-w-48 truncate px-4 py-3 text-white/70">{{ todo.user_email }}</td>
              <td class="px-4 py-3 text-center">
                <PillBadge :color="statusColor(todo)" :label="statusLabel(todo)" />
              </td>
              <td class="px-4 py-3 text-center text-xs text-white/50">
                {{ todo.created_at ? new Date(todo.created_at).toLocaleDateString() : '—' }}
              </td>
              <td class="px-4 py-3">
                <button class="cursor-pointer text-red-400 hover:text-red-300" @click="requestDelete(todo, $event)">
                  <Icon name="uil:trash" />
                </button>
              </td>
            </tr>
            <tr v-for="n in sortedTodos.length > 0 ? pageSize - sortedTodos.length : 0" :key="'empty-' + n" class="border-t border-white/5">
              <td :colspan="5" class="px-4 py-3">&nbsp;</td>
            </tr>
          </tbody>
        </table>
        <div v-if="todos.length === 0" class="p-4 text-center text-sm text-white/40">no notes</div>
      </div>

      <!-- pagination -->
      <AdminPagination :page="page" :total-pages="totalPages" :total-count="totalCount" label="notes" @update:page="goToPage" />
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
