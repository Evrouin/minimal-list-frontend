<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Todo } from '@/types'
import { useTodoStore } from '~/stores/todos'
import { storeToRefs } from 'pinia'

const { tap } = useHaptics()

const todoStore = useTodoStore()
const { filteredTodos, pinnedTodos, unpinnedTodos, loading } =
  storeToRefs(todoStore)

const isTodoEmptyMessage = computed(() => {
  switch (todoStore.filterType) {
    case 'active':
      return 'no active notes available'
    case 'completed':
      return 'no completed notes available'
    case 'deleted':
      return 'no deleted notes available'
    default:
      return 'no notes available'
  }
})

const skeletonCount = computed(() => Math.max(filteredTodos.value.length, 6))

const showDeleteDialog = ref(false)
const todoToDelete = ref<Todo | null>(null)

// Dialog edit state (lg+ screens)
const dialogTodo = ref<Todo | null>(null)
const dialogTitle = ref('')
const dialogBody = ref('')
const dialogEditorRef = ref<{ focus: () => void } | null>(null)
const dialogPinned = ref(false)
const dialogColor = ref<import('~/types/todo').NoteColor>('default')
const dialogReminderAt = ref<string | null>(null)
const dialogExpanded = ref(false)
const inlineEditorRefs = ref(new Map<number, { focus: () => void }>())
const cardRefs = ref(new Map<number, Element>())

const isLg = ref(false)
let resizeTimer: ReturnType<typeof setTimeout> | null = null
const updateIsLg = () => {
  isLg.value = window.innerWidth >= 1024
}
const debouncedResize = () => {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(updateIsLg, 150)
}
onMounted(() => {
  updateIsLg()
  window.addEventListener('resize', debouncedResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', debouncedResize)
  if (resizeTimer) clearTimeout(resizeTimer)
  flushAll()
})

watch(isLg, (lg) => {
  if (lg && expandedEditId.value) {
    // Mobile expanded → desktop dialog
    const todo = expandedTodo.value
    if (todo) {
      todo.editing = false
      expandedEditId.value = null
      dialogTodo.value = todo
      dialogTitle.value = todo.title
      dialogBody.value = todo.body
      dialogPinned.value = todo.pinned
      dialogColor.value = todo.color
      dialogReminderAt.value = todo.reminder_at ?? null
      nextTick(() => dialogEditorRef.value?.focus())
    }
  } else if (lg && filteredTodos.value.some((t) => t.editing)) {
    const todo = filteredTodos.value.find((t) => t.editing)!
    todo.editing = false
    dialogTodo.value = todo
    dialogTitle.value = todo.title
    dialogBody.value = todo.body
    dialogPinned.value = todo.pinned
    dialogColor.value = todo.color
    dialogReminderAt.value = todo.reminder_at ?? null
    nextTick(() => dialogEditorRef.value?.focus())
  } else if (!lg && dialogTodo.value) {
    const todo = dialogTodo.value
    todo.title = dialogTitle.value
    todo.body = dialogBody.value
    dialogTodo.value = null
    dialogExpanded.value = false
    todo.editing = true
    nextTick(() => inlineEditorRefs.value.get(todo.id)?.focus())
  }
})

// Multi-select (arrays for reactivity)
const multiSelectMode = ref(false)
const selectedIds = ref<number[]>([])
const visibleCheckboxIds = ref<number[]>([])
const hoverTimers = new Map<number, ReturnType<typeof setTimeout>>()

const isSelected = (id: number) => selectedIds.value.includes(id)
const hasCheckbox = (id: number) => visibleCheckboxIds.value.includes(id)

const isTodoEditing = (id: number) => filteredTodos.value.find((t) => t.id === id)?.editing

const startHover = (id: number) => {
  if (multiSelectMode.value || isTodoEditing(id)) return
  hoverTimers.set(
    id,
    setTimeout(() => {
      if (!visibleCheckboxIds.value.includes(id))
        visibleCheckboxIds.value.push(id)
    }, 800)
  )
}

const endHover = (id: number) => {
  const t = hoverTimers.get(id)
  if (t) {
    clearTimeout(t)
    hoverTimers.delete(id)
  }
  if (!multiSelectMode.value) {
    visibleCheckboxIds.value = visibleCheckboxIds.value.filter((i) => i !== id)
  }
}

let longPressTimer: ReturnType<typeof setTimeout> | null = null
const startLongPress = (id: number) => {
  if (isTodoEditing(id)) return
  longPressTimer = setTimeout(() => {
    tap()
    if (!multiSelectMode.value && !visibleCheckboxIds.value.includes(id)) {
      visibleCheckboxIds.value.push(id)
    }
    toggleSelect(id)
  }, 500)
}
const endLongPress = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

const toggleSelect = (id: number) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
  multiSelectMode.value = selectedIds.value.length > 0
  if (!multiSelectMode.value) visibleCheckboxIds.value = []
}

const exitMultiSelect = () => {
  multiSelectMode.value = false
  selectedIds.value = []
  visibleCheckboxIds.value = []
}

const allSelectedPinned = computed(() => {
  const sel = filteredTodos.value.filter((t) =>
    selectedIds.value.includes(t.id)
  )
  return sel.length > 0 && sel.every((t) => t.pinned)
})
const allSelectedUnpinned = computed(() => {
  const sel = filteredTodos.value.filter((t) =>
    selectedIds.value.includes(t.id)
  )
  return sel.length > 0 && sel.every((t) => !t.pinned)
})
const allSelectedDeleted = computed(() => {
  const sel = filteredTodos.value.filter((t) =>
    selectedIds.value.includes(t.id)
  )
  return sel.length > 0 && sel.every((t) => t.deleted)
})

const { show: showToast, flushAll } = useUndoToast()

const showBulkDeleteDialog = ref(false)
const bulkDeleteIds = ref<number[]>([])

const requestBulkDelete = () => {
  bulkDeleteIds.value = [...selectedIds.value]
  showBulkDeleteDialog.value = true
}
const confirmBulkDelete = () => {
  showBulkDeleteDialog.value = false
  const ids = bulkDeleteIds.value
  const count = ids.length
  exitMultiSelect()
  tap()
  const snapshot = todoStore.bulkDelete(ids)
  bulkDeleteIds.value = []
  showToast(
    `${count} note${count > 1 ? 's' : ''} deleted`,
    () => todoStore.bulkDeleteCommit(ids),
    () => {
      todoStore.bulkDeleteRollback(snapshot)
    }
  )
}
const bulkRestoreSelected = () => {
  const ids = [...selectedIds.value]
  const count = ids.length
  exitMultiSelect()
  tap()
  const snapshot = todoStore.bulkRestore(ids)
  showToast(
    `${count} note${count > 1 ? 's' : ''} restored`,
    () => todoStore.bulkRestoreCommit(ids),
    () => { todoStore.bulkRestoreRollback(snapshot) }
  )
}

const bulkPinSelected = (pinned: boolean) => {
  const ids = [...selectedIds.value]
  const count = ids.length
  exitMultiSelect()
  tap()
  const snapshot = todoStore.bulkPin(ids, pinned)
  showToast(
    `${count} note${count > 1 ? 's' : ''} ${pinned ? 'pinned' : 'unpinned'}`,
    () => todoStore.bulkPinCommit(ids, pinned),
    () => {
      todoStore.bulkPinRollback(snapshot)
    }
  )
}

// Edit
const editOriginals = ref(new Map<number, { title: string; body: string }>())

const handleCardClick = (todo: Todo) => {
  if (todo.editing) return
  if (multiSelectMode.value) toggleSelect(todo.id)
  else editTodo(todo)
}

const cancelAllEdits = () => {
  const current = filteredTodos.value.find((t) => t.editing)
  if (current) {
    const orig = editOriginals.value.get(current.id)
    if (orig) { current.title = orig.title; current.body = orig.body }
    current.editing = false
    editOriginals.value.delete(current.id)
  }
}

const editTodo = (todo: Todo) => {
  endLongPress()
  endHover(todo.id)
  // cancel any other inline edit
  const current = filteredTodos.value.find((t) => t.editing && t.id !== todo.id)
  if (current) {
    const orig = editOriginals.value.get(current.id)
    if (orig) { current.title = orig.title; current.body = orig.body }
    current.editing = false
    editOriginals.value.delete(current.id)
  }
  if (isLg.value) {
    dialogTodo.value = todo
    dialogTitle.value = todo.title
    dialogBody.value = todo.body
    dialogPinned.value = todo.pinned
    dialogColor.value = todo.color
    dialogReminderAt.value = todo.reminder_at ?? null
    nextTick(() => dialogEditorRef.value?.focus())
  } else {
    editOriginals.value.set(todo.id, { title: todo.title, body: todo.body })
    todo.editing = true
    nextTick(() => {
      inlineEditorRefs.value.get(todo.id)?.focus()
      setTimeout(() => {
        cardRefs.value.get(todo.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 220)
    })
  }
}

const dialogImageFile = ref<File | null>(null)
const dialogImagePreview = ref('')
const dialogAudioFile = ref<File | null>(null)
const dialogAudioPreview = ref('')
const dialogAudioRecording = ref(false)

const onDialogImageSelect = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    const compressed = await compressImage(file)
    dialogImageFile.value = compressed
    dialogImagePreview.value = URL.createObjectURL(compressed)
  }
}

const cancelDialogTodo = () => {
  dialogTodo.value = null
  dialogImageFile.value = null
  dialogImagePreview.value = ''
  dialogAudioFile.value = null
  dialogAudioPreview.value = ''
  dialogExpanded.value = false
}

const { fetchPreviews } = useLinkPreviews()

const saveDialogTodo = async () => {
  if (!dialogTodo.value || !dialogTitle.value.trim()) return
  dialogTodo.value.title = dialogTitle.value
  dialogTodo.value.body = dialogBody.value
  dialogTodo.value.pinned = dialogPinned.value
  dialogTodo.value.color = dialogColor.value
  dialogTodo.value.reminder_at = dialogReminderAt.value
  dialogTodo.value.link_previews = await fetchPreviews(dialogBody.value, dialogTodo.value.link_previews ?? [])
  dialogTodo.value.editing = false
  await todoStore.updateTodo({ ...dialogTodo.value }, dialogImageFile.value || undefined, dialogAudioFile.value || undefined)
  dialogTodo.value = null
  dialogImageFile.value = null
  dialogImagePreview.value = ''
  dialogAudioFile.value = null
  dialogAudioPreview.value = ''
  dialogExpanded.value = false
}

const editImageFiles = ref(new Map<number, File>())
const editImagePreviews = ref(new Map<number, string>())
const editAudioFiles = ref(new Map<number, File>())
const editAudioPreviews = ref(new Map<number, string>())
const expandedAudioRecording = ref(false)

const onEditImageSelect = async (todo: Todo, e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    const compressed = await compressImage(file)
    editImageFiles.value.set(todo.id, compressed)
    editImagePreviews.value.set(todo.id, URL.createObjectURL(compressed))
  }
}

const saveTodo = async (todo: Todo) => {
  if (!todo.title.trim()) return
  todo.editing = false
  todo.link_previews = await fetchPreviews(todo.body, todo.link_previews ?? [])
  const imageFile = editImageFiles.value.get(todo.id)
  const audioFile = editAudioFiles.value.get(todo.id)
  editOriginals.value.delete(todo.id)
  editImageFiles.value.delete(todo.id)
  editImagePreviews.value.delete(todo.id)
  editAudioFiles.value.delete(todo.id)
  editAudioPreviews.value.delete(todo.id)
  await todoStore.updateTodo({ ...todo }, imageFile, audioFile)
}

const cancelEdit = (todo: Todo) => {
  const orig = editOriginals.value.get(todo.id)
  if (orig) {
    todo.title = orig.title
    todo.body = orig.body
  }
  todo.editing = false
  expandedEditId.value = null
  editOriginals.value.delete(todo.id)
  editImageFiles.value.delete(todo.id)
  editImagePreviews.value.delete(todo.id)
  editAudioFiles.value.delete(todo.id)
  editAudioPreviews.value.delete(todo.id)
}

const expandedEditId = ref<number | null>(null)
const expandedTodo = computed(() => expandedEditId.value ? todoStore.todos.find((t) => t.id === expandedEditId.value) : null)

const expandEdit = (todo: Todo) => {
  expandedEditId.value = todo.id
}

const saveExpandedEdit = async () => {
  if (!expandedTodo.value) return
  const todo = expandedTodo.value
  expandedEditId.value = null
  await saveTodo(todo)
}

const cancelExpandedEdit = () => {
  if (!expandedTodo.value) return
  const todo = expandedTodo.value
  expandedEditId.value = null
  cancelEdit(todo)
}

const toggleCompletion = async (todo: Todo) => {
  endHover(todo.id)
  tap()
  await todoStore.toggleTodoCompletion(todo.id).catch(() => {})
}
const togglePin = async (todo: Todo) => {
  endHover(todo.id)
  tap()
  await todoStore.togglePin(todo.id).catch(() => {})
}

const dialogToggleCompletion = async () => {
  if (!dialogTodo.value) return
  tap()
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
const confirmDelete = () => {
  if (!todoToDelete.value) return
  showDeleteDialog.value = false
  const todo = todoToDelete.value
  const isPermanent = todo.deleted
  tap()
  const snapshot = todoStore.deleteTodo(todo.id, isPermanent)
  todoToDelete.value = null
  showToast(
    isPermanent ? 'note permanently deleted' : 'note deleted',
    () => todoStore.deleteTodoCommit(todo.id),
    () => {
      todoStore.deleteTodoRollback(snapshot)
    }
  )
}

const restoreTodo = (todo: Todo) => {
  tap()
  const snapshot = todoStore.restoreTodo(todo.id)
  showToast(
    'note restored',
    () => todoStore.restoreTodoCommit(todo.id),
    () => { todoStore.restoreTodoRollback(snapshot) }
  )
}

const setEditorRef = (id: number, el: { focus: () => void }) => {
  inlineEditorRefs.value.set(id, el)
}
const isEditing = computed(() => filteredTodos.value.some((t) => t.editing))

defineExpose({ cancelAllEdits, isEditing })
</script>

<template>
  <TodoSkeleton v-if="loading && todoStore.initialLoad" :count="skeletonCount" />

  <div
    v-else-if="!loading && filteredTodos.length === 0"
    class="flex items-center justify-center py-20"
  >
    <span class="text-sm text-white/30 lowercase">{{ isTodoEmptyMessage }}</span>
  </div>

  <div v-else class="pt-2 transition-opacity duration-200" :class="loading ? 'animate-pulse pointer-events-none' : ''">
    <!-- Multi-select bar -->
    <div
      v-if="multiSelectMode"
      class="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-end gap-2 bg-gray-800 px-4 py-2"
    >
      <button
        v-if="allSelectedUnpinned"
        class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 text-gray-400 hover:bg-gray-700 hover:text-blue-400"
        title="Pin selected"
        @click="bulkPinSelected(true)"
      >
        <Icon name="mdi:pin" class="h-4 w-4" />
      </button>
      <button
        v-if="allSelectedPinned"
        class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 text-blue-400 hover:bg-gray-700 hover:text-gray-400"
        title="Unpin selected"
        @click="bulkPinSelected(false)"
      >
        <Icon name="mdi:pin" class="h-4 w-4" />
      </button>
      <button
        v-if="todoStore.filterType === 'deleted'"
        class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 text-gray-400 hover:bg-gray-700 hover:text-white"
        title="Restore selected"
        @click="bulkRestoreSelected"
      >
        <Icon name="uil:redo" class="h-4 w-4" />
      </button>
      <button
        class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 text-gray-400 hover:bg-gray-700 hover:text-red-400"
        title="Delete selected"
        @click="requestBulkDelete"
      >
        <Icon name="uil:trash" class="h-4 w-4" />
      </button>
      <div
        class="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-1.5"
      >
        <span class="text-sm leading-none text-white/70"
          >{{ selectedIds.length }} selected</span
        >
        <button
          class="flex h-5 w-5 cursor-pointer items-center justify-center text-white/60 hover:text-white"
          @click="exitMultiSelect"
        >
          <Icon name="uil:times" class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Pinned section -->
    <div v-if="pinnedTodos.length > 0" class="mb-6">
      <p class="mb-3 text-xs text-white/40 lowercase">pinned</p>
      <div class="columns-1 gap-5 lg:columns-2 xl:columns-3">
        <div v-for="todo in pinnedTodos" :key="todo.id" :ref="(el) => { if (el) cardRefs.set(todo.id, el as Element) }" class="mb-5 inline-block w-full break-inside-avoid">
          <TodoCard
            :todo="todo"
            :pinned="true"
            :selected="isSelected(todo.id)"
            :show-checkbox="hasCheckbox(todo.id)"
            :multi-select-mode="multiSelectMode"
            :edit-image-preview="editImagePreviews.get(todo.id)"
            @click="handleCardClick(todo)"
            @toggle-pin="togglePin(todo)"
            @request-delete="requestDelete(todo)"
            @toggle-completion="toggleCompletion(todo)"
            @restore="restoreTodo(todo)"
            @save="saveTodo(todo)"
            @cancel="cancelEdit(todo)"
            @expand="expandEdit(todo)"
            @toggle-select="toggleSelect(todo.id)"
            @start-hover="startHover(todo.id)"
            @end-hover="endHover(todo.id)"
            @start-long-press="startLongPress(todo.id)"
            @end-long-press="endLongPress()"
            @set-editor-ref="(el) => setEditorRef(todo.id, el)"
            @image-select="(e: Event) => onEditImageSelect(todo, e)"
          />
        </div>
      </div>
    </div>

    <!-- Others section -->
    <div v-if="unpinnedTodos.length > 0">
      <p
        v-if="pinnedTodos.length > 0"
        class="mb-3 text-xs text-white/40 lowercase"
      >
        others
      </p>
      <div class="columns-1 gap-5 lg:columns-2 xl:columns-3">
        <div v-for="todo in unpinnedTodos" :key="todo.id" :ref="(el) => { if (el) cardRefs.set(todo.id, el as Element) }" class="mb-5 inline-block w-full break-inside-avoid">
          <TodoCard
            :todo="todo"
            :pinned="false"
            :selected="isSelected(todo.id)"
            :show-checkbox="hasCheckbox(todo.id)"
            :multi-select-mode="multiSelectMode"
            :edit-image-preview="editImagePreviews.get(todo.id)"
            @click="handleCardClick(todo)"
            @toggle-pin="togglePin(todo)"
            @request-delete="requestDelete(todo)"
            @toggle-completion="toggleCompletion(todo)"
            @restore="restoreTodo(todo)"
            @save="saveTodo(todo)"
            @cancel="cancelEdit(todo)"
            @expand="expandEdit(todo)"
            @toggle-select="toggleSelect(todo.id)"
            @start-hover="startHover(todo.id)"
            @end-hover="endHover(todo.id)"
            @start-long-press="startLongPress(todo.id)"
            @end-long-press="endLongPress()"
            @set-editor-ref="(el) => setEditorRef(todo.id, el)"
            @image-select="(e: Event) => onEditImageSelect(todo, e)"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Edit dialog (lg+ screens) -->
  <ModalOverlay :show="!!dialogTodo" tabindex="0" @keydown.esc="cancelDialogTodo">
        <div
          class="mx-4 flex w-full flex-col gap-3 rounded-lg p-6 shadow-xl transition-all duration-200"
          :class="[noteColors[dialogColor]?.bg || 'bg-gray-800', dialogExpanded ? 'max-w-4xl max-h-[85vh]' : 'max-w-xl']"
        >
          <ImagePreview v-if="dialogImagePreview || dialogTodo.thumbnail || dialogTodo.image" :src="dialogImagePreview || dialogTodo.thumbnail || dialogTodo.image!" :padding="6" />
          <div class="flex w-full items-center justify-between">
            <input
              v-model="dialogTitle"
              class="flex-grow border-b border-white/20 bg-transparent text-sm font-bold text-white lowercase focus:outline-none"
              @keydown.enter.prevent
            >
            <div class="flex shrink-0 items-center space-x-2">
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
                title="Delete"
                @click="dialogRequestDelete"
              >
                <Icon name="uil:trash" />
              </button>
              <button
                class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200"
                :title="
                  dialogTodo.completed
                    ? 'Mark as incomplete'
                    : 'Mark as complete'
                "
                @click="dialogToggleCompletion"
              >
                <Icon
                  :name="
                    dialogTodo.completed ? 'uil:check-circle' : 'uil:circle'
                  "
                />
              </button>
            </div>
          </div>
          <div :class="dialogExpanded ? 'min-h-[400px] flex-1 overflow-y-auto' : ''">
            <LazyTiptapEditor
              ref="dialogEditorRef"
              v-model="dialogBody"
              placeholder="body"
              @submit="saveDialogTodo"
            />
          </div>
          <AudioPlayer v-if="dialogAudioPreview || dialogTodo?.audio" :src="dialogAudioPreview || dialogTodo?.audio!" removable @remove="dialogAudioFile = null; dialogAudioPreview = ''" />
          <div class="flex items-center justify-between">
            <ColorPicker v-model="dialogColor" />
            <div class="flex items-center gap-1">
              <ReminderPicker v-if="!dialogAudioRecording" v-model="dialogReminderAt" />
              <AudioRecorder @recorded="(f, u) => { dialogAudioFile = f; dialogAudioPreview = u }" @update:recording="v => dialogAudioRecording = v" />
              <template v-if="!dialogAudioRecording">
                <label class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60">
                  <Icon name="uil:image" class="text-xs" />
                  <input type="file" accept="image/*" class="hidden" @change="onDialogImageSelect" >
                </label>
                <button
                  type="button"
                  class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60"
                  @click="dialogExpanded = !dialogExpanded"
                >
                  <Icon :name="dialogExpanded ? 'uil:compress-arrows' : 'uil:expand-arrows-alt'" class="text-xs" />
                </button>
                <button
                  class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/40 lowercase hover:text-white"
                  @click="cancelDialogTodo"
                >
                cancel
              </button>
              <button
                class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/60 lowercase hover:text-white"
                @click="saveDialogTodo"
              >
                save
              </button>
              </template>
            </div>
          </div>
        </div>
  </ModalOverlay>

  <!-- Expanded inline edit (mobile) -->
  <Teleport to="body">
    <div v-if="expandedTodo" class="fixed inset-0 z-50 flex flex-col p-3 bg-gray-800">
      <div
        class="flex flex-1 flex-col gap-3 rounded-lg p-5 text-xs text-white"
        :class="noteColors[expandedTodo.color]?.bg || 'bg-gray-700'"
      >
        <!-- eslint-disable vue/no-mutating-props -->
        <ImagePreview
          v-if="editImagePreviews.get(expandedTodo.id) || expandedTodo.thumbnail || expandedTodo.image"
          :src="editImagePreviews.get(expandedTodo.id) || expandedTodo.thumbnail || expandedTodo.image!"
          :padding="5"
        />
        <input
          v-model="expandedTodo.title"
          class="border-b border-white/20 bg-transparent text-sm font-bold text-white lowercase focus:outline-none"
        >
        <div class="flex-1 overflow-y-auto">
          <LazyTiptapEditor v-model="expandedTodo.body" placeholder="body" />
        </div>
        <AudioPlayer v-if="expandedTodo.audio" :src="expandedTodo.audio" removable @remove="expandedTodo.audio = null" />
        <div class="flex items-center justify-between">
          <ColorPicker v-model="expandedTodo.color" />
          <div class="flex items-center gap-1">
            <ReminderPicker v-if="!expandedAudioRecording" v-model="expandedTodo.reminder_at" />
            <AudioRecorder @recorded="(f, u) => { if (expandedTodo) { editAudioFiles.set(expandedTodo.id, f); editAudioPreviews.set(expandedTodo.id, u) } }" @update:recording="v => expandedAudioRecording = v" />
            <template v-if="!expandedAudioRecording">
              <label class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60">
                <Icon name="uil:image" class="text-xs" />
                <input type="file" accept="image/*" class="hidden" @change="(e: Event) => expandedTodo && onEditImageSelect(expandedTodo, e)" >
              </label>
              <button
                type="button"
                class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60"
                @click="expandedEditId = null"
              >
                <Icon name="uil:compress-arrows" class="text-xs" />
              </button>
              <button
                type="button"
                class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/40 hover:text-white"
                @click="cancelExpandedEdit"
              >
                cancel
              </button>
              <button
                type="button"
                class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/60 hover:text-white"
                @click="saveExpandedEdit"
              >
                save
              </button>
            </template>
          </div>
        </div>
        <!-- eslint-enable vue/no-mutating-props -->
      </div>
    </div>
  </Teleport>

  <ConfirmDialog
    v-model="showDeleteDialog"
    :title="todoToDelete?.deleted ? 'permanent delete' : 'delete note'"
    :message="
      todoToDelete?.deleted
        ? 'this cannot be undone. delete forever?'
        : 'move this note to deleted?'
    "
    :confirm-text="todoToDelete?.deleted ? 'delete forever' : 'delete'"
    @confirm="confirmDelete"
  />

  <ConfirmDialog
    v-model="showBulkDeleteDialog"
    :title="allSelectedDeleted ? 'permanent delete' : 'delete notes'"
    :message="
      allSelectedDeleted
        ? `permanently delete ${bulkDeleteIds.length} notes? this cannot be undone.`
        : `move ${bulkDeleteIds.length} notes to deleted?`
    "
    :confirm-text="allSelectedDeleted ? 'delete forever' : 'delete'"
    @confirm="confirmBulkDelete"
  />
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
