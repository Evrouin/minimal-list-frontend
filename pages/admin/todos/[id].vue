<script setup lang="ts">
import type { AdminTodo } from '~/composables/useAdminApi'

definePageMeta({ middleware: ['admin'], layout: 'admin' })

const route = useRoute()
const api = useAdminApi()
const todo = ref<AdminTodo | null>(null)
const showDeleteDialog = ref(false)
const loadError = ref('')

onMounted(async () => {
  try {
    todo.value = await api.getTodo(Number(route.params.id))
  } catch {
    loadError.value = 'failed to load note'
  }
})

const deleting = ref(false)

const confirmDelete = async () => {
  deleting.value = true
  try {
    await api.deleteTodo(Number(route.params.id))
    navigateTo('/admin/todos')
  } catch {
    loadError.value = 'failed to delete note'
    deleting.value = false
  }
}

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleString() : '—'

const statusLabel = (t: AdminTodo) =>
  t.deleted ? 'deleted' : t.completed ? 'completed' : 'active'
const statusColor = (t: AdminTodo): 'green' | 'red' | 'blue' =>
  t.deleted ? 'red' : t.completed ? 'green' : 'blue'
</script>

<template>
  <div>
    <PageHeader title="note detail">
      <NuxtLink to="/admin/todos" class="text-xs text-white/60 lowercase hover:text-white">back</NuxtLink>
    </PageHeader>

      <div v-if="!todo && !loadError" class="p-4 text-xs text-white/40">loading...</div>
      <div v-if="loadError" class="p-4 text-xs text-red-400">{{ loadError }}</div>

      <template v-if="todo">
        <!-- note content -->
        <div class="mb-3 rounded-lg bg-gray-700 p-5">
          <div class="mb-3 flex items-start justify-between">
            <h2 class="text-sm font-bold text-white lowercase">{{ todo.title }}</h2>
            <PillBadge class="ml-3 shrink-0" :color="statusColor(todo)" :label="statusLabel(todo)" />
          </div>
          <div
            v-if="todo.body"
            class="todo-body text-xs text-white/80 lowercase"
            v-html="todo.body"
          />
          <p v-else class="text-xs text-white/30 italic">no content</p>
        </div>

        <!-- metadata -->
        <div class="mb-3 rounded-lg bg-gray-700 p-5">
          <p class="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">details</p>
          <div class="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div>
              <p class="text-xs text-white/40">user</p>
              <p class="text-white">{{ todo.user_email }}</p>
              <p class="text-xs text-white/50">{{ todo.username }}</p>
            </div>
            <div>
              <p class="text-xs text-white/40">pinned</p>
              <p :class="todo.pinned ? 'text-yellow-300' : 'text-white/50'">{{ todo.pinned ? 'yes' : 'no' }}</p>
            </div>
            <div>
              <p class="text-xs text-white/40">created</p>
              <p class="text-white">{{ formatDate(todo.created_at) }}</p>
            </div>
            <div>
              <p class="text-xs text-white/40">updated</p>
              <p class="text-white">{{ formatDate(todo.updated_at) }}</p>
            </div>
          </div>
        </div>

        <!-- danger zone -->
        <div class="rounded-lg border border-red-500/20 bg-gray-700 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-red-300">delete note</p>
              <p class="text-xs text-white/40">this action cannot be undone</p>
            </div>
            <button
              class="cursor-pointer rounded-lg bg-red-500/20 px-4 py-2 text-xs text-red-300 lowercase hover:bg-red-500/30"
              @click="showDeleteDialog = true"
            >
              delete
            </button>
          </div>
        </div>
      </template>

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="delete note"
      :message="`permanently delete '${todo?.title}'? this cannot be undone.`"
      confirm-text="delete forever"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.todo-body :deep(ul) { list-style-type: disc; padding-left: 1.2rem; }
.todo-body :deep(ol) { list-style-type: decimal; padding-left: 1.2rem; }
.todo-body :deep(li) { margin: 0.15rem 0; }
.todo-body :deep(p) { margin: 0; }
</style>
