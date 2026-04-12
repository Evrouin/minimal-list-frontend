<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Todo } from '@/types'
import type { CardRef } from '@/types/api'
import { useTodoStore } from '~/stores/todos'
import { useFolderStore } from '~/stores/folders'
import { useBackHandler } from '~/composables/useBackHandler'
import { storeToRefs } from 'pinia'

const { tap } = useHaptics()

const todoStore = useTodoStore()
const folderStore = useFolderStore()
const { filteredTodos, loading } = storeToRefs(todoStore)


const isRemindersFolder = computed(() => folderStore.activeFolder?.name === 'reminders')
const isTasksFolder = computed(() => folderStore.activeFolder?.name === 'tasks')

const isScrolledDown = ref(false)

watch(
  () => todoStore.filterType,
  () => {
    exitMultiSelect()
    const scrollY = window.scrollY
    gridKey.value++
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
      setTimeout(() => window.scrollTo(0, scrollY), 100)
      setTimeout(() => window.scrollTo(0, scrollY), 500)
    })
  },
)
const onScrollUpdate = () => {
  isScrolledDown.value = window.scrollY > 150
}
onMounted(() => window.addEventListener('scroll', onScrollUpdate, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScrollUpdate))

const isTodoEmptyMessage = computed(() => {
  switch (todoStore.filterType) {
    case 'active':
      return 'no active notes available'
    case 'completed':
      return 'no completed notes available'
    case 'deleted':
      return 'no deleted notes available'
    case 'archived':
      return 'no archived notes'
    default:
      return 'no notes available'
  }
})

const skeletonCount = computed(() => Math.max(filteredTodos.value.length, 6))

const deletedSections = computed(() => {
  if (todoStore.filterType !== 'deleted' && todoStore.filterType !== 'archived') return []
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msDay = 86400000
  const buckets: { label: string; todos: Todo[] }[] = [
    { label: 'today', todos: [] },
    { label: 'yesterday', todos: [] },
    { label: 'this week', todos: [] },
    { label: 'last week', todos: [] },
    { label: 'this month', todos: [] },
    { label: 'older', todos: [] },
  ]
  for (const t of filteredTodos.value) {
    const d = new Date(t.updated_at ?? 0).getTime()
    const diff = startOfToday.getTime() - d
    if (diff < 0) buckets[0]!.todos.push(t)
    else if (diff < msDay) buckets[1]!.todos.push(t)
    else if (diff < 6 * msDay) buckets[2]!.todos.push(t)
    else if (diff < 13 * msDay) buckets[3]!.todos.push(t)
    else if (diff < 29 * msDay) buckets[4]!.todos.push(t)
    else buckets[5]!.todos.push(t)
  }
  return buckets.filter((b) => b.todos.length > 0)
})

const cardRefs = ref(new Map<string, CardRef>())

const hideCompleted = ref(false)
const visibleTodos = computed(() =>
  hideCompleted.value ? filteredTodos.value.filter((t) => !t.completed) : filteredTodos.value
)
const visiblePinned = computed(() => visibleTodos.value.filter((t) => t.pinned).sort((a, b) => (b.order_id ?? 0) - (a.order_id ?? 0)))
const visibleUnpinned = computed(() => visibleTodos.value.filter((t) => !t.pinned).sort((a, b) => (b.order_id ?? 0) - (a.order_id ?? 0)))
const reminderSections = computed(() => {
  if (!isRemindersFolder.value) return []
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTomorrow = new Date(startOfToday.getTime() + 86400000)
  const startOfNextWeek = new Date(startOfToday.getTime() + 7 * 86400000)
  const buckets: { label: string; todos: Todo[] }[] = [
    { label: 'overdue', todos: [] },
    { label: 'today', todos: [] },
    { label: 'tomorrow', todos: [] },
    { label: 'this week', todos: [] },
    { label: 'later', todos: [] },
  ]
  const sorted = [...filteredTodos.value].sort((a, b) =>
    new Date(a.reminder_at ?? 0).getTime() - new Date(b.reminder_at ?? 0).getTime()
  )
  for (const t of sorted) {
    const r = new Date(t.reminder_at ?? 0).getTime()
    const isSnoozed = !!t.snoozed_until && new Date(t.snoozed_until).getTime() > now.getTime()
    if (r < now.getTime() && !t.completed && !isSnoozed) buckets[0]!.todos.push(t)
    else if (r < startOfTomorrow.getTime()) buckets[1]!.todos.push(t)
    else if (r < startOfTomorrow.getTime() + 86400000) buckets[2]!.todos.push(t)
    else if (r < startOfNextWeek.getTime()) buckets[3]!.todos.push(t)
    else buckets[4]!.todos.push(t)
  }
  return buckets.filter((b) => b.todos.length > 0)
})
const pinnedListRef = ref<{ containerRef?: HTMLElement; initGrid?: () => void; ready?: boolean } | null>(null)
const unpinnedListRef = ref<{ containerRef?: HTMLElement; initGrid?: () => void; ready?: boolean } | null>(null)
const isDragging = ref(false)
const gridKey = ref(0)
const showDeleteDialog = ref(false)
const todoToDelete = ref<Todo | null>(null)

const isLg = ref(false)
let resizeTimer: ReturnType<typeof setTimeout> | null = null
const updateIsLg = () => {
  isLg.value = window.innerWidth >= 768
}
const debouncedResize = () => {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(updateIsLg, 150)
}

// --- Composables ---

const {
  dialogTodo,
  dialogTitle,
  dialogBody,
  dialogEditorRef,
  dialogPinned,
  dialogColor,
  dialogReminderAt,
  dialogExpanded,
  dialogImageFile: _dialogImageFile,
  dialogImagePreview,
  dialogAudioFile,
  dialogAudioPreview,
  dialogAudioRecording,
  dialogOriginalAudio: _dialogOriginalAudio,
  onDialogImageSelect,
  cancelDialogTodo,
  saveDialogTodo,
  dialogToggleCompletion,
  dialogTogglePin,
  inlineEditorRefs: _inlineEditorRefs,
  editImagePreviews,
  editAudioFiles,
  editAudioPreviews,
  expandedAudioRecording,
  expandedEditId,
  expandedTodo,
  expandedTitleRef,
  expandedEditorRef,
  audioInteracting,
  editTodo,
  saveTodo,
  cancelEdit,
  cancelAllEdits,
  onEditImageSelect,
  expandEdit,
  saveExpandedEdit,
  cancelExpandedEdit,
  setEditorRef,
  isEditing,
} = useTodoEditing({
  isLg,
  cardRefs,
  endLongPress: () => endLongPress(),
  endHover: (id: string) => endHover(id),
  onEditEnd: () => {
    const scrollY = window.scrollY
    gridKey.value++
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
      setTimeout(() => window.scrollTo(0, scrollY), 100)
      setTimeout(() => window.scrollTo(0, scrollY), 500)
    })
  },
})

const {
  multiSelectMode,
  selectedIds,
  isSelected,
  hasCheckbox,
  hideHoverCheckboxes,
  clearHoverTimers,
  cancelLongPress,
  startHover,
  endHover,
  toggleSelect,
  exitMultiSelect,
  startLongPress,
  endLongPress,
  allSelectedPinned,
  allSelectedUnpinned,
  allSelectedDeleted,
} = useTodoSelection({
  filteredTodos,
  isDragging,
  audioInteracting,
  isTodoEditing: (id) => filteredTodos.value.find((t) => t.uuid === id)?.editing,
  tap,
})

const { handleReorder } = useSortableReorder({
  pinnedListRef,
  unpinnedListRef,
  isDragging,
})

watch(expandedEditId, (val) => {
  if (val) useBackHandler().push(() => { expandedEditId.value = null })
  else useBackHandler().pop()
})

const onPinnedReorder = (uuid: string, newIndex: number) => handleReorder('pinned', uuid, newIndex)
const onUnpinnedReorder = (uuid: string, newIndex: number) => handleReorder('unpinned', uuid, newIndex)

const { show: showToast, flushAll } = useUndoToast()

const { showBulkDeleteDialog, bulkDeleteIds, requestBulkDelete, confirmBulkDelete, bulkRestoreSelected, bulkPinSelected } = useBulkActions({
  exitMultiSelect,
  tap,
  showToast,
})

const bulkUnarchiveSelected = async (ids: string[]) => {
  tap()
  await Promise.all(ids.map((id) => todoStore.unarchiveNote(id)))
  exitMultiSelect()
}

// --- Event handlers ---

const wasDragging = ref(false)

const onDragStart = () => {
  isDragging.value = true
  wasDragging.value = true
  hideHoverCheckboxes()
  clearHoverTimers()
  cancelLongPress()
}

const onDragEnd = () => {
  isDragging.value = false
}

const viewTodo = ref<Todo | null>(null)

const handleCardClick = (todo: Todo) => {
  if (todo.editing) return
  if (wasDragging.value) {
    wasDragging.value = false
    return
  }
  if (multiSelectMode.value) toggleSelect(todo.uuid)
  else if (todo.deleted || todo.is_archived) viewTodo.value = todo
  else editTodo(todo)
}

const toggleCompletion = async (todo: Todo) => {
  endHover(todo.uuid)
  tap()
  await todoStore.toggleTodoCompletion(todo.uuid).catch(() => {})
}

const togglePin = async (todo: Todo) => {
  endHover(todo.uuid)
  tap()
  await todoStore.togglePin(todo.uuid).catch(() => {})
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
  const snapshot = todoStore.deleteTodo(todo.uuid, isPermanent)
  todoToDelete.value = null
  showToast(
    isPermanent ? 'note permanently deleted' : 'note deleted',
    () => todoStore.deleteTodoCommit(todo.uuid),
    () => todoStore.deleteTodoRollback(snapshot),
  )
}

const restoreTodo = (todo: Todo) => {
  if (todoStore.filterType === 'archived') {
    tap()
    todoStore.unarchiveNote(todo.uuid)
    return
  }
  tap()
  const snapshot = todoStore.restoreTodo(todo.uuid)
  showToast(
    'note restored',
    () => todoStore.restoreTodoCommit(todo.uuid),
    () => todoStore.restoreTodoRollback(snapshot),
  )
}

const archiveNote = async (todo: Todo) => {
  tap()
  const removed = await todoStore.archiveNote(todo.uuid)
  showToast(
    'note archived',
    () => Promise.resolve(),
    () => todoStore.unarchiveNote(todo.uuid, removed ?? undefined),
  )
}

// --- Lifecycle ---

const api = useTodoApi()
const showEmptyTrashDialog = ref(false)
const emptyingTrash = ref(false)

const confirmEmptyTrash = async () => {
  emptyingTrash.value = true
  try {
    await api.emptyTrash()
    todoStore.todos = todoStore.todos.filter((t) => !t.deleted)
  } catch { /* silently fail */ } finally {
    emptyingTrash.value = false
    showEmptyTrashDialog.value = false
  }
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

defineExpose({ cancelAllEdits, isEditing, openEmptyTrash: () => { showEmptyTrashDialog.value = true }, openNote: (uuid: string, onClose?: () => void) => { const todo = filteredTodos.value.find((t) => t.uuid === uuid); if (todo) { viewTodo.value = todo; if (onClose) { const stop = watch(viewTodo, (v) => { if (!v) { onClose(); stop() } }) } } } })
</script>

<template>
  <TodoSkeleton v-if="loading && todoStore.initialLoad" :count="skeletonCount" />

  <div v-else-if="!loading && filteredTodos.length === 0" class="flex items-center justify-center py-20">
    <span class="text-sm text-white/30 lowercase">{{ isTodoEmptyMessage }}</span>
  </div>

  <div v-else class="pt-2 transition-opacity duration-200" :class="loading ? 'pointer-events-none animate-pulse' : ''">
    <!-- Multi-select bar -->
    <div
      v-if="multiSelectMode"
      class="sticky top-0 z-20 mb-4 flex items-center justify-end gap-1.5 bg-gray-800 pr-2.5 transition-[padding]"
      :class="isScrolledDown ? 'py-3' : 'py-1.5'"
    >
      <button
        v-if="allSelectedUnpinned && todoStore.filterType !== 'deleted' && todoStore.filterType !== 'archived' && !isRemindersFolder"
        class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white/20 text-gray-400 hover:bg-gray-700 hover:text-blue-400"
        title="Pin selected"
        @click="bulkPinSelected(selectedIds, true)"
      >
        <Icon name="mdi:pin" class="h-3 w-3" />
      </button>
      <button
        v-if="allSelectedPinned && todoStore.filterType !== 'deleted' && todoStore.filterType !== 'archived' && !isRemindersFolder"
        class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white/20 text-blue-400 hover:bg-gray-700 hover:text-gray-400"
        title="Unpin selected"
        @click="bulkPinSelected(selectedIds, false)"
      >
        <Icon name="mdi:pin" class="h-3 w-3" />
      </button>
      <button
        v-if="todoStore.filterType === 'deleted'"
        class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white/20 text-gray-400 hover:bg-gray-700 hover:text-white"
        title="Restore selected"
        @click="bulkRestoreSelected(selectedIds)"
      >
        <Icon name="uil:redo" class="h-3 w-3" />
      </button>
      <button
        v-if="todoStore.filterType === 'archived'"
        class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white/20 text-gray-400 hover:bg-gray-700 hover:text-white"
        title="Unarchive selected"
        @click="bulkUnarchiveSelected(selectedIds)"
      >
        <Icon name="uil:archive-alt" class="h-3 w-3" />
      </button>
      <button
        class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white/20 text-gray-400 hover:bg-gray-700 hover:text-red-400"
        title="Delete selected"
        @click="requestBulkDelete(selectedIds)"
      >
        <Icon name="uil:trash" class="h-3 w-3" />
      </button>
      <div class="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1">
        <span class="text-xs leading-none text-white/70">{{ selectedIds.length }} selected</span>
        <button class="flex h-4 w-4 cursor-pointer items-center justify-center text-white/60 hover:text-white" @click="exitMultiSelect">
          <Icon name="uil:times" class="h-3 w-3" />
        </button>
      </div>
    </div>

    <!-- Deleted/Archived sections (grouped by date) -->
    <template v-if="todoStore.filterType === 'deleted' || todoStore.filterType === 'archived'">
      <div v-for="section in deletedSections" :key="section.label" class="mb-6">
        <p class="mb-3 ml-2.5 text-xs text-white/40 lowercase">{{ section.label }}</p>
        <MasonryGrid :key="section.label + '-' + gridKey" :items="section.todos" key-field="uuid" :drag-enabled="false">
          <template #default="{ item: todo }">
            <TodoCard
              :ref="
                (el) => {
                  if (el) cardRefs.set(todo.uuid, el as CardRef)
                }
              "
              :todo="todo"
              :pinned="false"
              :selected="isSelected(todo.uuid)"
              :show-checkbox="hasCheckbox(todo.uuid)"
              :multi-select-mode="multiSelectMode"
              :is-task-folder="isTasksFolder"
              :edit-image-preview="editImagePreviews.get(todo.uuid)"
              @click="handleCardClick(todo)"
              @toggle-pin="togglePin(todo)"
              @request-delete="requestDelete(todo)"
              @request-archive="archiveNote(todo)"
              @toggle-completion="toggleCompletion(todo)"
              @restore="restoreTodo(todo)"
              @save="saveTodo(todo)"
              @cancel="cancelEdit(todo)"
              @expand="expandEdit(todo)"
              @remove-audio="todo.audio = null"
              @audio-interact="(v: boolean) => (audioInteracting = v)"
              @toggle-select="toggleSelect(todo.uuid)"
              @start-hover="startHover(todo.uuid)"
              @end-hover="endHover(todo.uuid)"
              @start-long-press="startLongPress(todo.uuid)"
              @end-long-press="endLongPress()"
              @set-editor-ref="(el) => setEditorRef(todo.uuid, el)"
              @image-select="(e: Event) => onEditImageSelect(todo, e)"
            />
          </template>
        </MasonryGrid>
      </div>
    </template>

    <!-- Reminders timeline -->
    <template v-else-if="isRemindersFolder">
      <div v-for="section in reminderSections" :key="section.label" class="mb-6">
        <p class="mb-3 ml-2.5 text-xs text-white/40 lowercase">{{ section.label }}</p>
        <MasonryGrid :key="section.label + '-' + gridKey" :items="section.todos" key-field="uuid" :drag-enabled="false">
          <template #default="{ item: todo }">
            <TodoCard
              :ref="(el) => { if (el) cardRefs.set(todo.uuid, el as CardRef) }"
              :todo="todo"
              :pinned="todo.pinned"
              :selected="isSelected(todo.uuid)"
              :show-checkbox="hasCheckbox(todo.uuid)"
              :multi-select-mode="multiSelectMode"
              :is-task-folder="isTasksFolder"
              :edit-image-preview="editImagePreviews.get(todo.uuid)"
              @click="handleCardClick(todo)"
              @toggle-pin="togglePin(todo)"
              @request-delete="requestDelete(todo)"
              @request-archive="archiveNote(todo)"
              @toggle-completion="toggleCompletion(todo)"
              @restore="restoreTodo(todo)"
              @save="saveTodo(todo)"
              @cancel="cancelEdit(todo)"
              @expand="expandEdit(todo)"
              @remove-audio="todo.audio = null"
              @audio-interact="(v: boolean) => (audioInteracting = v)"
              @toggle-select="toggleSelect(todo.uuid)"
              @start-hover="startHover(todo.uuid)"
              @end-hover="endHover(todo.uuid)"
              @start-long-press="startLongPress(todo.uuid)"
              @end-long-press="endLongPress()"
              @set-editor-ref="(el) => setEditorRef(todo.uuid, el)"
              @image-select="(e: Event) => onEditImageSelect(todo, e)"
            />
          </template>
        </MasonryGrid>
      </div>
    </template>

    <!-- Pinned section (normal + tasks) -->
    <template v-else>
      <div v-if="isTasksFolder" class="mb-4 flex justify-end pr-2.5">
        <button
          class="text-xs lowercase transition-colors"
          :class="hideCompleted ? 'text-white/60' : 'text-white/30 hover:text-white/60'"
          @click="hideCompleted = !hideCompleted"
        >
          {{ hideCompleted ? 'show completed' : 'hide completed' }}
        </button>
      </div>
      <div v-if="visiblePinned.length > 0" class="mb-6">
        <p v-if="pinnedListRef?.ready" class="mb-3 ml-2.5 text-xs text-white/40 lowercase">pinned</p>
        <MasonryGrid
          :key="'pinned-' + gridKey"
          ref="pinnedListRef"
          :items="visiblePinned"
          key-field="uuid"
          :drag-enabled="true"
          @reorder="onPinnedReorder"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
        >
          <template #default="{ item: todo }">
            <TodoCard
              :ref="
                (el) => {
                  if (el) cardRefs.set(todo.uuid, el as CardRef)
                }
              "
              :todo="todo"
              :pinned="true"
              :selected="isSelected(todo.uuid)"
              :show-checkbox="hasCheckbox(todo.uuid)"
              :multi-select-mode="multiSelectMode"
              :is-task-folder="isTasksFolder"
              :edit-image-preview="editImagePreviews.get(todo.uuid)"
              @click="handleCardClick(todo)"
              @toggle-pin="togglePin(todo)"
              @request-delete="requestDelete(todo)"
              @request-archive="archiveNote(todo)"
              @toggle-completion="toggleCompletion(todo)"
              @restore="restoreTodo(todo)"
              @save="saveTodo(todo)"
              @cancel="cancelEdit(todo)"
              @expand="expandEdit(todo)"
              @remove-audio="todo.audio = null"
              @audio-interact="(v: boolean) => (audioInteracting = v)"
              @toggle-select="toggleSelect(todo.uuid)"
              @start-hover="startHover(todo.uuid)"
              @end-hover="endHover(todo.uuid)"
              @start-long-press="startLongPress(todo.uuid)"
              @end-long-press="endLongPress()"
              @set-editor-ref="(el) => setEditorRef(todo.uuid, el)"
              @image-select="(e: Event) => onEditImageSelect(todo, e)"
            />
          </template>
        </MasonryGrid>
      </div>

      <!-- Others section -->
      <div v-if="visibleUnpinned.length > 0">
        <p
          v-if="visiblePinned.length > 0 && unpinnedListRef?.ready"
          class="mb-3 ml-2.5 text-xs text-white/40 lowercase"
        >
          others
        </p>
        <MasonryGrid
          :key="'unpinned-' + gridKey"
          ref="unpinnedListRef"
          :items="visibleUnpinned"
          key-field="uuid"
          :drag-enabled="true"
          @reorder="onUnpinnedReorder"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
        >
          <template #default="{ item: todo }">
            <TodoCard
              :ref="
                (el) => {
                  if (el) cardRefs.set(todo.uuid, el as CardRef)
                }
              "
              :todo="todo"
              :pinned="false"
              :selected="isSelected(todo.uuid)"
              :show-checkbox="hasCheckbox(todo.uuid)"
              :multi-select-mode="multiSelectMode"
              :is-task-folder="isTasksFolder"
              :edit-image-preview="editImagePreviews.get(todo.uuid)"
              @click="handleCardClick(todo)"
              @toggle-pin="togglePin(todo)"
              @request-delete="requestDelete(todo)"
              @request-archive="archiveNote(todo)"
              @toggle-completion="toggleCompletion(todo)"
              @restore="restoreTodo(todo)"
              @save="saveTodo(todo)"
              @cancel="cancelEdit(todo)"
              @expand="expandEdit(todo)"
              @remove-audio="todo.audio = null"
              @audio-interact="(v: boolean) => (audioInteracting = v)"
              @toggle-select="toggleSelect(todo.uuid)"
              @start-hover="startHover(todo.uuid)"
              @end-hover="endHover(todo.uuid)"
              @start-long-press="startLongPress(todo.uuid)"
              @end-long-press="endLongPress()"
              @set-editor-ref="(el) => setEditorRef(todo.uuid, el)"
              @image-select="(e: Event) => onEditImageSelect(todo, e)"
            />
          </template>
        </MasonryGrid>
      </div>
    </template>
  </div>

  <!-- Edit dialog (lg+ screens) -->
  <ModalOverlay :show="!!dialogTodo" tabindex="0" @keydown.esc="cancelDialogTodo">
    <div
      v-if="dialogTodo"
      class="mx-4 flex w-full flex-col gap-3 rounded-lg p-6 shadow-xl transition-all duration-200"
      :class="[noteColors[dialogColor]?.bg || 'bg-gray-800', dialogExpanded ? 'max-h-[85vh] max-w-4xl' : 'max-w-xl']"
    >
      <ImagePreview
        v-if="dialogImagePreview || dialogTodo.thumbnail || dialogTodo.image"
        :src="dialogImagePreview || dialogTodo.thumbnail || dialogTodo.image!"
        :padding="6"
      />
      <div class="flex w-full items-center justify-between">
        <input
          v-model="dialogTitle"
          class="grow border-b border-white/20 bg-transparent text-sm font-bold text-white lowercase focus:outline-none"
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
          <button class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200" title="Delete" @click="dialogRequestDelete">
            <Icon name="uil:trash" />
          </button>
          <button
            class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200"
            :title="dialogTodo.completed ? 'Mark as incomplete' : 'Mark as complete'"
            @click="tap(); dialogToggleCompletion()"
          >
            <Icon :name="dialogTodo.completed ? 'uil:check-circle' : 'uil:circle'" />
          </button>
        </div>
      </div>
      <div :class="dialogExpanded ? 'min-h-100 flex-1 overflow-y-auto' : ''">
        <LazyTiptapEditor ref="dialogEditorRef" v-model="dialogBody" placeholder="body" @submit="saveDialogTodo" />
      </div>
      <AudioPlayer
        v-if="dialogAudioPreview || dialogTodo?.audio"
        :src="dialogAudioPreview || dialogTodo?.audio!"
        removable
        @remove="dialogAudioFile = null; dialogAudioPreview = ''; if (dialogTodo) dialogTodo.audio = null"
      />
      <div class="flex items-center justify-between">
        <ColorPicker v-model="dialogColor" />
        <div class="flex items-center gap-1">
          <ReminderPicker v-if="!dialogAudioRecording" v-model="dialogReminderAt" sm />
          <AudioRecorder
            @recorded="
              (f, u) => {
                dialogAudioFile = f
                dialogAudioPreview = u
              }
            "
            @update:recording="(v) => (dialogAudioRecording = v)"
          />
          <template v-if="!dialogAudioRecording">
            <label class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60" aria-label="Upload image">
              <Icon name="uil:image" class="text-xs" aria-hidden="true" />
              <input type="file" accept="image/*" class="hidden" @change="onDialogImageSelect" >
            </label>
            <button
              type="button"
              class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60"
              @click="dialogExpanded = !dialogExpanded"
            >
              <Icon :name="dialogExpanded ? 'uil:compress-arrows' : 'uil:expand-arrows-alt'" class="text-xs" />
            </button>
            <button class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/40 lowercase hover:text-white" @click="cancelDialogTodo">
              cancel
            </button>
            <button class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/60 lowercase hover:text-white" @click="saveDialogTodo">
              save
            </button>
          </template>
        </div>
      </div>
    </div>
  </ModalOverlay>

  <!-- View-only dialog (deleted notes + reminder view) -->
  <ModalOverlay :show="!!viewTodo" tabindex="0" @keydown.esc="viewTodo = null">
    <div
      v-if="viewTodo"
      class="mx-4 flex w-full max-w-xl flex-col gap-3 rounded-lg p-6 shadow-xl"
      :class="noteColors[viewTodo.color]?.bg || 'bg-gray-800'"
    >
      <div class="flex items-start justify-between gap-2">
        <p class="text-sm font-bold text-white lowercase">{{ viewTodo.title }}</p>
        <div v-if="!viewTodo.deleted && !viewTodo.is_archived" class="flex shrink-0 items-center gap-1">
          <button
            class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-gray-200"
            :title="viewTodo.completed ? 'Mark as incomplete' : 'Mark as complete'"
            @click="toggleCompletion(viewTodo); viewTodo = null"
          >
            <Icon :name="viewTodo.completed ? 'uil:check-circle' : 'uil:circle'" />
          </button>
          <button class="cursor-pointer rounded p-1 text-sm text-gray-400 hover:text-red-400" title="Delete" @click="requestDelete(viewTodo); viewTodo = null">
            <Icon name="uil:trash" />
          </button>
        </div>
      </div>
      <ImagePreview v-if="viewTodo.thumbnail || viewTodo.image" :src="viewTodo.thumbnail || viewTodo.image!" :padding="6" />
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="viewTodo.body" class="view-body text-xs text-wrap wrap-break-word text-white lowercase" v-html="viewTodo.body" />
      <div v-if="viewTodo.link_previews?.length" class="flex flex-col gap-1">
        <LinkPreviewCard v-for="lp in viewTodo.link_previews" :key="lp.url" :preview="lp" />
      </div>
      <AudioPlayer v-if="viewTodo.audio" :src="viewTodo.audio" />
      <div class="flex justify-end">
        <button class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/40 lowercase hover:text-white" @click="viewTodo = null">
          exit
        </button>
      </div>
    </div>
  </ModalOverlay>

  <!-- Expanded inline edit (mobile) -->
  <Teleport to="body">
    <div v-if="expandedTodo" class="fixed inset-x-0 top-0 z-50 flex flex-col bg-gray-800 p-3" style="height: 100dvh">
      <div class="mb-3 flex items-center justify-between px-2">
        <span class="text-lg font-bold text-white lowercase">minimal list</span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="cursor-pointer rounded p-1.5 text-sm transition-colors"
            :class="expandedTodo.pinned ? 'text-blue-400 hover:text-blue-300' : 'text-white/30 hover:text-white/60'"
            :title="expandedTodo.pinned ? 'Unpin' : 'Pin'"
            @click="togglePin(expandedTodo)"
          >
            <Icon name="mdi:pin" />
          </button>
          <button
            v-if="!expandedTodo.deleted"
            type="button"
            class="cursor-pointer rounded p-1.5 text-sm text-white/30 transition-colors hover:text-white/60"
            :title="expandedTodo.completed ? 'Mark as incomplete' : 'Mark as complete'"
            @click="toggleCompletion(expandedTodo)"
          >
            <Icon :name="expandedTodo.completed ? 'uil:check-circle' : 'uil:circle'" />
          </button>
          <button
            v-if="expandedTodo.deleted"
            type="button"
            class="cursor-pointer rounded p-1.5 text-sm text-white/30 transition-colors hover:text-white/60"
            title="Restore"
            @click="restoreTodo(expandedTodo); expandedEditId = null"
          >
            <Icon name="uil:redo" />
          </button>
          <button
            type="button"
            class="cursor-pointer rounded p-1.5 text-sm text-white/30 transition-colors hover:text-red-400"
            title="Delete"
            @click="requestDelete(expandedTodo); expandedEditId = null"
          >
            <Icon name="uil:trash" />
          </button>
        </div>
      </div>
      <div
        class="flex flex-1 flex-col gap-3 rounded-lg p-5 text-xs text-white"
        :class="noteColors[expandedTodo.color]?.bg || 'bg-gray-700'"
        @click.self="expandedEditorRef?.focus()"
      >
        <!-- eslint-disable vue/no-mutating-props -->
        <ImagePreview
          v-if="editImagePreviews.get(expandedTodo.uuid) || expandedTodo.thumbnail || expandedTodo.image"
          :src="editImagePreviews.get(expandedTodo.uuid) || expandedTodo.thumbnail || expandedTodo.image!"
          :padding="5"
        />
        <input
          ref="expandedTitleRef"
          v-model="expandedTodo.title"
          class="border-b border-white/20 bg-transparent text-sm font-bold text-white lowercase focus:outline-none"
        >
        <div class="flex-1 overflow-y-auto" @click="expandedEditorRef?.focus()">
          <LazyTiptapEditor ref="expandedEditorRef" v-model="expandedTodo.body" placeholder="body" />
        </div>
        <AudioPlayer v-if="expandedTodo.audio" :src="expandedTodo.audio" removable @remove="expandedTodo.audio = null" />
        <div class="flex items-center justify-between">
          <ColorPicker v-model="expandedTodo.color" />
          <div class="flex items-center gap-1">
            <ReminderPicker v-if="!expandedAudioRecording" v-model="expandedTodo.reminder_at" />
            <AudioRecorder
              @recorded="
                (f, u) => {
                  if (expandedTodo) {
                    editAudioFiles.set(expandedTodo.uuid, f)
                    editAudioPreviews.set(expandedTodo.uuid, u)
                  }
                }
              "
              @update:recording="(v) => (expandedAudioRecording = v)"
            />
            <template v-if="!expandedAudioRecording">
              <label class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60" aria-label="Upload image">
                <Icon name="uil:image" class="text-xs" aria-hidden="true" />
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="(e: Event) => expandedTodo && onEditImageSelect(expandedTodo, e)"
                >
              </label>
              <button
                type="button"
                class="cursor-pointer rounded px-2 py-0.5 text-white/30 transition-colors hover:text-white/60"
                @mousedown.prevent
                @click="expandedEditId = null"
              >
                <Icon name="uil:compress-arrows" class="text-xs" />
              </button>
              <button
                type="button"
                class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/40 hover:text-white"
                @mousedown.prevent
                @click="cancelExpandedEdit"
              >
                cancel
              </button>
              <button
                type="button"
                class="cursor-pointer rounded px-2 py-0.5 text-xs text-white/60 hover:text-white"
                @mousedown.prevent
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
    :message="todoToDelete?.deleted ? 'this cannot be undone. delete forever?' : 'move this note to deleted?'"
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

  <ConfirmDialog
    v-model="showEmptyTrashDialog"
    title="empty trash"
    message="permanently delete all notes in trash? this cannot be undone."
    confirm-text="empty trash"
    :loading="emptyingTrash"
    @confirm="confirmEmptyTrash"
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

<style>
.view-body ul {
  list-style-type: disc;
  padding-left: 1.2rem;
}
.view-body ol {
  list-style-type: decimal;
  padding-left: 1.2rem;
}
.view-body li {
  margin: 0.15rem 0;
  overflow-wrap: break-word;
  word-break: break-word;
  min-width: 0;
}
.view-body p {
  margin: 0;
}
.view-body ul[data-type='taskList'] {
  list-style: none;
  padding-left: 0;
}
.view-body ul[data-type='taskList'] li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  overflow-wrap: break-word;
  word-break: break-word;
  min-width: 0;
}
.view-body ul[data-type='taskList'] li > div {
  min-width: 0;
  flex: 1;
}
.view-body ul[data-type='taskList'] li label {
  pointer-events: none;
  flex-shrink: 0;
}
.view-body ul[data-type='taskList'] li label input[type='checkbox'] {
  appearance: none;
  width: 0.9rem;
  height: 0.9rem;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 3px;
  background: transparent;
}
.view-body ul[data-type='taskList'] li label input[type='checkbox']:checked {
  background: #60a5fa;
  border-color: #60a5fa;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E");
  background-size: 100%;
}
</style>
