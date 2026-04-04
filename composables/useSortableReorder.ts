import { ref, type Ref } from 'vue'
import { useTodoStore } from '~/stores/todos'

interface UseSortableReorderOptions {
  pinnedListRef: Ref<{ containerRef?: HTMLElement; refreshLayout?: () => void } | null>
  unpinnedListRef: Ref<{ containerRef?: HTMLElement; refreshLayout?: () => void } | null>
  isDragging: Ref<boolean>
  onDragStart?: () => void
  onChoose?: () => void
}

export function useSortableReorder(options: UseSortableReorderOptions) {
  const { isDragging } = options
  const todoStore = useTodoStore()
  const reorderKey = ref(0)

  const handleReorder = async (section: 'pinned' | 'unpinned', uuid: string, newIndex: number) => {
    const newPosition = newIndex + 1
    isDragging.value = false

    const snapshot = todoStore.reorderTodosBySection(section, [uuid])
    try {
      await todoStore.bulkReorderCommit(uuid, newPosition, section === 'pinned')
    } catch {
      todoStore.reorderRollback(snapshot)
      reorderKey.value++
    }
  }

  const createSortables = () => {}
  const destroySortables = () => {}

  return { reorderKey, handleReorder, createSortables, destroySortables }
}
