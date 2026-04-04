import { ref, type Ref } from 'vue'
import { useTodoStore } from '~/stores/todos'

interface UseSortableReorderOptions {
  pinnedListRef: Ref<{ containerRef?: HTMLElement; initGrid?: () => void } | null>
  unpinnedListRef: Ref<{ containerRef?: HTMLElement; initGrid?: () => void } | null>
  isDragging: Ref<boolean>
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

  return { reorderKey, handleReorder }
}
