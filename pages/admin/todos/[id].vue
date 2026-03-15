<script setup lang="ts">
import type { AdminTodo } from '~/composables/useAdminApi'

definePageMeta({ middleware: ['admin'] })

const route = useRoute()
const api = useAdminApi()
const todo = ref<AdminTodo | null>(null)
const showDeleteDialog = ref(false)

onMounted(async () => {
  todo.value = await api.getTodo(Number(route.params.id))
})

const confirmDelete = async () => {
  await api.deleteTodo(Number(route.params.id))
  navigateTo('/admin/todos')
}

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleString() : '—'
</script>

<template>
  <div
    class="flex min-h-screen w-screen flex-col items-center bg-gray-800 py-10"
  >
    <div class="w-full max-w-3xl px-4">
      <div class="flex items-center justify-between p-4">
        <h1 class="text-2xl font-bold text-white lowercase">todo detail</h1>
        <NuxtLink
          to="/admin/todos"
          class="text-sm text-white/60 lowercase hover:text-white"
          >back</NuxtLink
        >
      </div>

      <div v-if="!todo" class="p-4 text-sm text-white/40">loading...</div>

      <div
        v-if="todo"
        class="rounded-lg bg-gray-500 p-4 text-sm text-white shadow-md"
      >
        <p class="mb-2 text-lg font-bold lowercase">{{ todo.title }}</p>
        <div
          class="todo-body mb-3 text-white/80 lowercase"
          v-html="todo.body"
        />
        <div class="space-y-1 text-xs text-white/50">
          <p>
            user:
            <span class="text-white/70"
              >{{ todo.user_email }} ({{ todo.username }})</span
            >
          </p>
          <p>
            status:
            <span
              :class="
                todo.deleted
                  ? 'text-red-300'
                  : todo.completed
                    ? 'text-green-300'
                    : 'text-blue-300'
              "
            >
              {{
                todo.deleted
                  ? 'deleted'
                  : todo.completed
                    ? 'completed'
                    : 'active'
              }}
            </span>
          </p>
          <p>
            created:
            <span class="text-white/70">{{ formatDate(todo.created_at) }}</span>
          </p>
          <p>
            updated:
            <span class="text-white/70">{{ formatDate(todo.updated_at) }}</span>
          </p>
        </div>
      </div>

      <div v-if="todo" class="mt-4 flex justify-center">
        <button
          class="cursor-pointer text-sm text-red-400 lowercase hover:text-red-300"
          @click="showDeleteDialog = true"
        >
          delete todo
        </button>
      </div>
    </div>

    <ConfirmDialog
      v-model="showDeleteDialog"
      title="delete todo"
      :message="`permanently delete '${todo?.title}'? this cannot be undone.`"
      confirm-text="delete forever"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.todo-body :deep(ul) {
  list-style-type: disc;
  padding-left: 1.2rem;
}
.todo-body :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.2rem;
}
.todo-body :deep(li) {
  margin: 0.15rem 0;
}
.todo-body :deep(p) {
  margin: 0;
}
</style>
