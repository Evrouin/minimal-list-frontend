import { nextTick, ref, watch, type Ref } from 'vue'
import Sortable from 'sortablejs'
import type { Todo } from '@/types'
import { useTodoStore } from '~/stores/todos'
import { storeToRefs } from 'pinia'

interface UseSortableReorderOptions {
  pinnedListRef: Ref<{ containerRef?: HTMLElement } | null>
  unpinnedListRef: Ref<{ containerRef?: HTMLElement } | null>
  isDragging: Ref<boolean>
  onDragStart?: () => void
  onChoose?: () => void
}

export function useSortableReorder(options: UseSortableReorderOptions) {
  const { pinnedListRef, unpinnedListRef, isDragging, onDragStart, onChoose } = options
  const todoStore = useTodoStore()
  const { pinnedTodos, unpinnedTodos } = storeToRefs(todoStore)
  const reorderKey = ref(0)

  const pinnedSorters: Sortable[] = []
  const unpinnedSorters: Sortable[] = []

  const getMovedNoteUuid = (event: any): string | null => {
    const item = event.item as HTMLElement
    return item.dataset.uuid || item.querySelector('[data-uuid]')?.getAttribute('data-uuid') || null
  }

  const computeNewPosition = (
    movedUuid: string,
    sectionTodos: Todo[],
    container: HTMLElement,
  ): number | null => {
    const colEls = Array.from(container.children) as HTMLElement[]
    const colUuids = colEls.map((col) =>
      Array.from(col.querySelectorAll<HTMLElement>('[data-uuid]')).map((el) => el.dataset.uuid!),
    )

    let movedCol = -1
    let movedRow = -1
    for (let c = 0; c < colUuids.length; c++) {
      const r = colUuids[c].indexOf(movedUuid)
      if (r >= 0) { movedCol = c; movedRow = r; break }
    }
    if (movedCol < 0) return null

    const remaining = sectionTodos.filter((t) => t.uuid !== movedUuid)

    let newPosition: number
    if (movedRow > 0) {
      const aboveUuid = colUuids[movedCol][movedRow - 1]
      const aboveIdx = remaining.findIndex((t) => t.uuid === aboveUuid)
      newPosition = aboveIdx >= 0 ? aboveIdx + 2 : 1
    } else {
      if (movedRow + 1 < colUuids[movedCol].length) {
        const belowUuid = colUuids[movedCol][movedRow + 1]
        const belowIdx = remaining.findIndex((t) => t.uuid === belowUuid)
        newPosition = belowIdx >= 0 ? belowIdx + 1 : 1
      } else {
        newPosition = 1
      }
    }

    return Math.max(1, Math.min(newPosition, sectionTodos.length))
  }

  const handleSortEnd = async (section: 'pinned' | 'unpinned', event: any) => {
    const movedUuid = getMovedNoteUuid(event)
    if (!movedUuid) return

    const sectionTodos = section === 'pinned' ? pinnedTodos.value : unpinnedTodos.value
    const container = (section === 'pinned' ? pinnedListRef : unpinnedListRef).value?.containerRef as HTMLElement | undefined
    if (!container) return

    const newPosition = computeNewPosition(movedUuid, sectionTodos, container)
    if (!newPosition) return

    const snapshot = todoStore.reorderTodosBySection(section, [movedUuid])
    try {
      await todoStore.bulkReorderCommit(movedUuid, newPosition, section === 'pinned')
      reorderKey.value++
    } catch {
      todoStore.reorderRollback(snapshot)
    }
  }

  const sortableOptions = (section: 'pinned' | 'unpinned'): Sortable.Options => ({
    animation: 150,
    ghostClass: 'opacity-50',
    group: `notes-${section}`,
    scroll: true,
    scrollSensitivity: 100,
    bubbleScroll: true,
    delay: 200,
    delayOnTouchOnly: true,
    touchStartThreshold: 5,
    filter: 'input, textarea, button, select, a, .no-drag, .audio-player',
    preventOnFilter: false,
    onChoose: () => onChoose?.(),
    onStart: () => {
      isDragging.value = true
      onDragStart?.()
    },
    onEnd: (evt) => {
      isDragging.value = false
      if (evt.from === evt.to) {
        const movedUuid = getMovedNoteUuid(evt)
        if (movedUuid) handleSortEnd(section, evt)
      }
    },
    onAdd: (evt) => {
      isDragging.value = false
      const movedUuid = getMovedNoteUuid(evt)
      if (movedUuid) handleSortEnd(section, evt)
    },
  })

  const createSortables = () => {
    destroySortables()
    for (const [listRef, sorters, section] of [
      [pinnedListRef, pinnedSorters, 'pinned'],
      [unpinnedListRef, unpinnedSorters, 'unpinned'],
    ] as const) {
      const el = listRef.value?.containerRef as HTMLElement | undefined
      if (!el) continue
      const cols = el.querySelectorAll<HTMLElement>(':scope > div')
      if (cols.length > 0) {
        cols.forEach((col) => sorters.push(Sortable.create(col, sortableOptions(section))))
      } else {
        sorters.push(Sortable.create(el, sortableOptions(section)))
      }
    }
  }

  const destroySortables = () => {
    for (const sorters of [pinnedSorters, unpinnedSorters]) {
      sorters.forEach((s) => s.destroy())
      sorters.length = 0
    }
  }

  watch([pinnedListRef, unpinnedListRef], () => {
    destroySortables()
    nextTick(() => createSortables())
  })

  watch([pinnedTodos, unpinnedTodos], () => {
    nextTick(() => {
      destroySortables()
      createSortables()
    })
  }, { deep: false })

  return { reorderKey, createSortables, destroySortables }
}
