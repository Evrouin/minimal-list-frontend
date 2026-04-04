import { computed, ref, type Ref } from 'vue'
import type { Todo } from '@/types'

interface UseTodoSelectionOptions {
  filteredTodos: Ref<Todo[]>
  isDragging: Ref<boolean>
  audioInteracting: Ref<boolean>
  isTodoEditing: (id: string) => boolean | undefined
  tap: () => void
}

export function useTodoSelection(options: UseTodoSelectionOptions) {
  const { filteredTodos, isDragging, audioInteracting, isTodoEditing, tap } = options

  const multiSelectMode = ref(false)
  const selectedIds = ref<string[]>([])
  const visibleCheckboxIds = ref<string[]>([])
  const hoverTimers = new Map<string, ReturnType<typeof setTimeout>>()
  let longPressTimer: ReturnType<typeof setTimeout> | null = null

  const MAX_SELECT = 50

  const isSelected = (id: string) => selectedIds.value.includes(id)
  const hasCheckbox = (id: string) => visibleCheckboxIds.value.includes(id)

  const hideHoverCheckboxes = () => { visibleCheckboxIds.value = [] }

  const clearHoverTimers = () => {
    for (const t of hoverTimers.values()) clearTimeout(t)
    hoverTimers.clear()
  }

  const cancelLongPress = () => {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
  }

  const startHover = (id: string) => {
    if (isDragging.value || multiSelectMode.value || isTodoEditing(id) || audioInteracting.value) return
    hoverTimers.set(id, setTimeout(() => {
      if (!visibleCheckboxIds.value.includes(id) && !audioInteracting.value && !isDragging.value) visibleCheckboxIds.value.push(id)
    }, 800))
  }

  const endHover = (id: string) => {
    const t = hoverTimers.get(id)
    if (t) { clearTimeout(t); hoverTimers.delete(id) }
    if (!multiSelectMode.value) {
      visibleCheckboxIds.value = visibleCheckboxIds.value.filter((i) => i !== id)
    }
  }

  const toggleSelect = (id: string) => {
    if (audioInteracting.value) return
    const idx = selectedIds.value.indexOf(id)
    if (idx >= 0) selectedIds.value.splice(idx, 1)
    else if (selectedIds.value.length < MAX_SELECT) selectedIds.value.push(id)
    multiSelectMode.value = selectedIds.value.length > 0
    if (!multiSelectMode.value) visibleCheckboxIds.value = []
  }

  const exitMultiSelect = () => {
    multiSelectMode.value = false
    selectedIds.value = []
    visibleCheckboxIds.value = []
  }

  const startLongPress = (id: string) => {
    if (isDragging.value || isTodoEditing(id) || audioInteracting.value) return
    longPressTimer = setTimeout(() => {
      if (audioInteracting.value || isDragging.value) return
      tap()
      if (!multiSelectMode.value && !visibleCheckboxIds.value.includes(id)) {
        visibleCheckboxIds.value.push(id)
      }
      toggleSelect(id)
    }, 500)
  }

  const endLongPress = () => {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
  }

  const allSelectedPinned = computed(() => {
    const sel = filteredTodos.value.filter((t) => selectedIds.value.includes(t.uuid))
    return sel.length > 0 && sel.every((t) => t.pinned)
  })
  const allSelectedUnpinned = computed(() => {
    const sel = filteredTodos.value.filter((t) => selectedIds.value.includes(t.uuid))
    return sel.length > 0 && sel.every((t) => !t.pinned)
  })
  const allSelectedDeleted = computed(() => {
    const sel = filteredTodos.value.filter((t) => selectedIds.value.includes(t.uuid))
    return sel.length > 0 && sel.every((t) => t.deleted)
  })

  return {
    multiSelectMode,
    selectedIds,
    visibleCheckboxIds,
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
  }
}
