<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Todo } from '@/types'
import { useTodoStore } from '~/stores/todos'
import { storeToRefs } from 'pinia'

const todoStore = useTodoStore()
const isTodoEmptyMessage = computed(() => {
  switch (todoStore.filterType) {
    case 'active': return 'no active todos available'
    case 'completed': return 'no completed todos available'
    case 'deleted': return 'no deleted todos available'
    default: return 'no todos available'
  }
})

const { filteredTodos, pinnedTodos, unpinnedTodos, loading } = storeToRefs(todoStore)

const skeletonCount = computed(() => Math.max(filteredTodos.value.length, 1))
const isInitialLoad = ref(true)

watch(loading, (val: boolean) => {
  if (!val) isInitialLoad.value = false
})

const showDeleteDialog = ref(false)
const todoToDelete = ref<Todo | null>(null)

// Dialog edit state (lg+ screens)
const dialogTodo = ref<Todo | null>(null)
const dialogTitle = ref('')
const dialogBody = ref('')
const dialogEditorRef = ref<{ focus: () => void } | null>(null)
const dialogPinned = ref(false)

const isLg = ref(false)
const updateIsLg = () => { isLg.value = window.innerWidth >= 1024 }
onMounted(() => { updateIsLg(); window.addEventListener('resize', updateIsLg) })
onUnmounted(() => window.removeEventListener('resize', updateIsLg))

// Multi-select
const multiSelectMode = ref(false)
const selectedIds = ref<Set<number>>(new Set())
const hoverTimers = new Map<number, ReturnType<typeof setTimeout>>()
const showCheckbox = ref<Set<number>>(new Set())

const startHover = (id: number) => {
  if (multiSelectMode.value) return
  hoverTimers.set(id, setTimeout(() => {
    showCheckbox.value.add(id)
    showCheckbox.value = new Set(showCheckbox.value)
  }, 1200))
}

const endHover = (id: number) => {
  const t = hoverTimers.get(id)
  if (t) { clearTimeout(t); hoverTimers.delete(id) }
  if (!multiSelectMode.value) {
    showCheckbox.value.delete(id)
    showCheckbox.value = new Set(showCheckbox.value)
  }
}

let longPressTimer: ReturnType<typeof setTimeout> | null = null
const startLongPress = (id: number) => {
  longPressTimer = setTimeout(() => {
    if (!multiSelectMode.value) {
      showCheckbox.value.add(id)
      showCheckbox.value = new Set(showCheckbox.value)
    }
    toggleSelect(id)
  }, 500)
}
const endLongPress = () => {
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
}

const toggleSelect = (id: number) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value)
  multiSelectMode.value = selectedIds.value.size > 0
  if (!multiSelectMode.value) showCheckbox.value = new Set()
}

const allSelectedPinned = computed(() => {
  const selected = filteredTodos.value.filter((t) => selectedIds.value.has(t.id))
  return selected.length > 0 && selected.every((t) => t.pinned)
})
const allSelectedUnpinned = computed(() => {
  const selected = filteredTodos.value.filter((t) => selectedIds.value.has(t.id))
  return selected.length > 0 && selected.every((t) => !t.pinned)
})

const showBulkDeleteDialog = ref(false)
const bulkDeleteIds = ref<number[]>([])

const allSelectedDeleted = computed(() => {
  const selected = filteredTodos.value.filter((t) => selectedIds.value.has(t.id))
  return selected.length > 0 && selected.every((t) => t.deleted)
})

const requestBulkDelete = () => {
  bulkDeleteIds.value = [...selectedIds.value]
  showBulkDeleteDialog.value = true
}

const confirmBulkDelete = async () => {
  const ids = bulkDeleteIds.value
  exitMultiSelect()
  await todoStore.bulkDelete(ids)
  bulkDeleteIds.value = []
}

const bulkPinSelected = async (pinned: boolean) => {
  const ids = [...selectedIds.value]
  exitMultiSelect()
  await todoStore.bulkPin(ids, pinned)
}

const exitMultiSelect = () => {
  multiSelectMode.value = false
  selectedIds.value = new Set()
  showCheckbox.value = new Set()
}

const timeAgo = (date: string | undefined) => {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo`
  return `${Math.floor(days / 365)}y`
}

// refresh timeAgo every 30s
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval>
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 30000)
})
onUnmounted(() => clearInterval(timer))

const getTodoClasses = (todo: Todo) => [
  'p-5 border-0.5 rounded-lg shadow-md flex flex-col gap-2 w-full h-full',
  todo.completed || todo.deleted
    ? 'bg-gray-700 opacity-50 hover:px-6 hover:bg-gray-900 transition-all duration-200'
    : 'bg-gray-700 hover:px-6 hover:bg-gray-900 transition-all duration-200',
]

const handleCardClick = (todo: Todo) => {
  if (multiSelectMode.value) {
    toggleSelect(todo.id)
  } else {
    editTodo(todo)
  }
}

const editTodo = (todo: Todo) => {
  if (isLg.value) {
    dialogTodo.value = todo
    dialogTitle.value = todo.title
    dialogBody.value = todo.body
    dialogPinned.value = todo.pinned
    nextTick(() => dialogEditorRef.value?.focus())
  } else {
    todo.editing = true
  }
}

const saveDialogTodo = async () => {
  if (!dialogTodo.value || !dialogTitle.value.trim()) return
  dialogTodo.value.title = dialogTitle.value
  dialogTodo.value.body = dialogBody.value
  dialogTodo.value.pinned = dialogPinned.value
  dialogTodo.value.editing = false
  await todoStore.updateTodo({ ...dialogTodo.value })
  dialogTodo.value = null
}

const saveTodo = async (todo: Todo) => {
  if (!todo.title.trim()) return
  todo.editing = false
  await todoStore.updateTodo({ ...todo })
}

const toggleCompletion = async (todo: Todo) => {
  await todoStore.toggleTodoCompletion(todo.id)
}

const togglePin = async (todo: Todo) => {
  await todoStore.togglePin(todo.id)
}

const dialogToggleCompletion = async () => {
  if (!dialogTodo.value) return
  await todoStore.toggleTodoCompletion(dialogTodo.value.id)
  dialogTodo.value = null
}

const dialogTogglePin = () => {
  dialogPinned.value = !dialogPinned.value
}

const requestDelete = (todo: Todo) => {
  todoToDelete.value = todo
  showDeleteDialog.value = true
}

const dialogRequestDelete = () => {
  if (!dialogTodo.value) return
  todoToDelete.value = dialogTodo.value
  dialogTodo.value = null
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!todoToDelete.value) return
  await todoStore.deleteTodo(todoToDelete.value.id, todoToDelete.value.deleted)
  todoToDelete.value = null
}
</script>

<template>
  <TodoSkeleton v-if="loading && isInitialLoad" :count="skeletonCount" />

  <div
    v-else-if="filteredTodos.length === 0"
    class="flex items-center justify-center"
  >
    <div
      class="border-0.5 mb-5 flex w-full flex-col gap-2 rounded-lg border-slate-500 bg-gray-900 p-5 shadow-md"
    >
      <span
        class="text-center text-sm text-wrap break-words text-white lowercase"
      >
        {{ isTodoEmptyMessage }}
      </span>
    </div>
  </div>

  <div v-else>
    <!-- Multi-select bar -->
    <div v-if="multiSelectMode" class="mb-4 flex items-center justify-end gap-2">
      <button v-if="allSelectedUnpinned" class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 text-gray-400 hover:bg-gray-700 hover:text-blue-400" title="Pin selected" @click="bulkPinSelected(true)">
        <Icon name="mdi:pin" class="h-4 w-4" />
      </button>
      <button v-if="allSelectedPinned" class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 text-blue-400 hover:bg-gray-700 hover:text-gray-400" title="Unpin selected" @click="bulkPinSelected(false)">
        <Icon name="mdi:pin" class="h-4 w-4" />
      </button>
      <button class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 text-gray-400 hover:bg-gray-700 hover:text-red-400" title="Delete selected" @click="requestBulkDelete">
        <Icon name="uil:trash" class="h-4 w-4" />
      </button>
      <div class="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-1.5">
        <span class="text-sm leading-none text-white/70">{{ selectedIds.size }} selected</span>
        <button class="flex h-5 w-5 cursor-pointer items-center justify-center text-white/60 hover:text-white" @click="exitMultiSelect">
          <Icon name="uil:times" class="h-4 w-4" />
        </button>
      </div>
    </div>
    <!-- Pinned section -->
    <div v-if="pinnedTodos.length > 0" class="mb-6">
      <p class="mb-3 text-xs text-white/40 lowercase">pinned</p>
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <div v-for="todo in pinnedTodos" :key="todo.id">
          <div :class="[...getTodoClasses(todo), selectedIds.has(todo.id) && 'ring-2 ring-blue-400']" class="relative cursor-pointer" @click="handleCardClick(todo)" @mouseenter="startHover(todo.id)" @mouseleave="endHover(todo.id)" @touchstart.passive="startLongPress(todo.id)" @touchend="endLongPress()" @touchmove="endLongPress()">
            <button v-if="multiSelectMode || showCheckbox.has(todo.id)" class="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/60 bg-gray-800 text-xs" :class="selectedIds.has(todo.id) ? 'bg-blue-500 border-blue-500' : ''" @click.stop="toggleSelect(todo.id)">
              <Icon v-if="selectedIds.has(todo.id)" name="uil:check" class="text-white" />
            </button>
            <div class="flex w-full items-center justify-between">
              <span v-if="!todo.editing" class="text-sm flex-grow sm:text-base font-bold text-white lowercase">
                {{ todo.title }}
              </span>
              <input v-if="todo.editing" v-model="todo.title" class="text-sm flex-grow sm:text-base border-b border-white/20 bg-transparent font-bold text-white lowercase focus:outline-none" @keydown.enter="saveTodo(todo)" @click.stop />
              <div class="flex items-center space-x-2" @click.stop>
                <button class="cursor-pointer rounded p-1 text-sm text-blue-400 hover:text-blue-300" title="Unpin" @click="togglePin(todo)">
                  <Icon name="mdi:pin" />
                </button>
                <button class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200" :title="`Delete ${todo.title}`" @click="requestDelete(todo)">
                  <Icon name="uil:trash" />
                </button>
                <button class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200" :title="todo.completed ? 'Mark as incomplete' : 'Mark as complete'" @click="toggleCompletion(todo)">
                  <Icon :name="todo.completed ? 'uil:check-circle' : 'uil:circle'" />
                </button>
              </div>
            </div>
            <div v-if="!todo.editing" class="todo-body text-xs text-wrap break-words text-white lowercase sm:text-sm" v-html="todo.body" />
            <span v-if="!todo.editing && now" class="text-xs text-white/30">{{ timeAgo(todo.created_at) }}</span>
            <div v-if="todo.editing" @click.stop>
              <TiptapEditor v-model="todo.body" placeholder="body" @submit="saveTodo(todo)" />
              <div class="mt-1 flex items-center justify-between">
                <span class="text-xs text-white/60">⌘/ctrl + enter to save</span>
                <button type="button" class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/60 hover:text-white" @click="saveTodo(todo)">save</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Others section -->
    <div v-if="unpinnedTodos.length > 0">
      <p v-if="pinnedTodos.length > 0" class="mb-3 text-xs text-white/40 lowercase">others</p>
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <div v-for="todo in unpinnedTodos" :key="todo.id">
          <div :class="[...getTodoClasses(todo), selectedIds.has(todo.id) && 'ring-2 ring-blue-400']" class="relative cursor-pointer" @click="handleCardClick(todo)" @mouseenter="startHover(todo.id)" @mouseleave="endHover(todo.id)" @touchstart.passive="startLongPress(todo.id)" @touchend="endLongPress()" @touchmove="endLongPress()">
            <button v-if="multiSelectMode || showCheckbox.has(todo.id)" class="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/60 bg-gray-800 text-xs" :class="selectedIds.has(todo.id) ? 'bg-blue-500 border-blue-500' : ''" @click.stop="toggleSelect(todo.id)">
              <Icon v-if="selectedIds.has(todo.id)" name="uil:check" class="text-white" />
            </button>
            <div class="flex w-full items-center justify-between">
              <span v-if="!todo.editing" class="text-sm flex-grow sm:text-base font-bold text-white lowercase">
                {{ todo.title }}
              </span>
              <input v-if="todo.editing" v-model="todo.title" class="text-sm flex-grow sm:text-base border-b border-white/20 bg-transparent font-bold text-white lowercase focus:outline-none" @keydown.enter="saveTodo(todo)" @click.stop />
              <div class="flex items-center space-x-2" @click.stop>
                <button class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200" title="Pin" @click="togglePin(todo)">
                  <Icon name="mdi:pin" />
                </button>
                <button class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200" :title="`Delete ${todo.title}`" @click="requestDelete(todo)">
                  <Icon name="uil:trash" />
                </button>
                <button class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200" :title="todo.completed ? 'Mark as incomplete' : 'Mark as complete'" @click="toggleCompletion(todo)">
                  <Icon :name="todo.completed ? 'uil:check-circle' : 'uil:circle'" />
                </button>
              </div>
            </div>
            <div v-if="!todo.editing" class="todo-body text-xs text-wrap break-words text-white lowercase sm:text-sm" v-html="todo.body" />
            <span v-if="!todo.editing && now" class="text-xs text-white/30">{{ timeAgo(todo.created_at) }}</span>
            <div v-if="todo.editing" @click.stop>
              <TiptapEditor v-model="todo.body" placeholder="body" @submit="saveTodo(todo)" />
              <div class="mt-1 flex items-center justify-between">
                <span class="text-xs text-white/60">⌘/ctrl + enter to save</span>
                <button type="button" class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/60 hover:text-white" @click="saveTodo(todo)">save</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit dialog (lg+ screens) -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="dialogTodo"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        @keydown.esc="saveDialogTodo"
        tabindex="0"
      >
        <div class="mx-4 flex w-full max-w-xl flex-col gap-3 rounded-lg bg-gray-800 p-6 shadow-xl">
          <input
            v-model="dialogTitle"
            class="w-full border-b border-white/20 bg-transparent text-lg font-bold text-white lowercase focus:outline-none"
            @keydown.enter.prevent
          />
          <TiptapEditor
            ref="dialogEditorRef"
            v-model="dialogBody"
            placeholder="body"
            @submit="saveDialogTodo"
          />
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button
                class="cursor-pointer rounded p-1 text-sm hover:text-gray-200"
                :class="dialogPinned ? 'text-blue-400' : 'text-gray-400'"
                :title="dialogPinned ? 'Unpin' : 'Pin'"
                @click="dialogTogglePin"
              >
                <Icon name="mdi:pin" />
              </button>
              <button
                class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200"
                :title="dialogTodo.completed ? 'Mark as incomplete' : 'Mark as complete'"
                @click="dialogToggleCompletion"
              >
                <Icon :name="dialogTodo.completed ? 'uil:check-circle' : 'uil:circle'" />
              </button>
              <button
                class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200"
                title="Delete"
                @click="dialogRequestDelete"
              >
                <Icon name="uil:trash" />
              </button>
              <span v-if="now" class="text-xs text-white/30">{{ timeAgo(dialogTodo.created_at) }}</span>
            </div>
            <button
              class="cursor-pointer rounded-lg bg-gray-700 px-4 py-1.5 text-sm text-white lowercase hover:bg-gray-600"
              @click="saveDialogTodo"
            >
              save
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <ConfirmDialog
    v-model="showDeleteDialog"
    :title="todoToDelete?.deleted ? 'permanent delete' : 'delete todo'"
    :message="
      todoToDelete?.deleted
        ? 'this cannot be undone. delete forever?'
        : 'move this todo to deleted?'
    "
    :confirm-text="todoToDelete?.deleted ? 'delete forever' : 'delete'"
    @confirm="confirmDelete"
  />

  <ConfirmDialog
    v-model="showBulkDeleteDialog"
    :title="allSelectedDeleted ? 'permanent delete' : 'delete todos'"
    :message="
      allSelectedDeleted
        ? `permanently delete ${bulkDeleteIds.length} todos? this cannot be undone.`
        : `move ${bulkDeleteIds.length} todos to deleted?`
    "
    :confirm-text="allSelectedDeleted ? 'delete forever' : 'delete'"
    @confirm="confirmBulkDelete"
  />
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
