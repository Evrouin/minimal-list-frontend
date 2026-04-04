import { ref } from 'vue'
import { useTodoStore } from '~/stores/todos'

interface UseBulkActionsOptions {
  exitMultiSelect: () => void
  tap: () => void
  showToast: (msg: string, onCommit: () => void, onUndo: () => void) => void
}

export function useBulkActions(options: UseBulkActionsOptions) {
  const { exitMultiSelect, tap, showToast } = options
  const todoStore = useTodoStore()

  const showBulkDeleteDialog = ref(false)
  const bulkDeleteIds = ref<string[]>([])

  const requestBulkDelete = (selectedIds: string[]) => {
    bulkDeleteIds.value = [...selectedIds]
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
      () => todoStore.bulkDeleteRollback(snapshot),
    )
  }

  const bulkRestoreSelected = (selectedIds: string[]) => {
    const ids = [...selectedIds]
    const count = ids.length
    exitMultiSelect()
    tap()
    const snapshot = todoStore.bulkRestore(ids)
    showToast(
      `${count} note${count > 1 ? 's' : ''} restored`,
      () => todoStore.bulkRestoreCommit(ids),
      () => todoStore.bulkRestoreRollback(snapshot),
    )
  }

  const bulkPinSelected = (selectedIds: string[], pinned: boolean) => {
    const ids = [...selectedIds]
    const count = ids.length
    exitMultiSelect()
    tap()
    const snapshot = todoStore.bulkPin(ids, pinned)
    showToast(
      `${count} note${count > 1 ? 's' : ''} ${pinned ? 'pinned' : 'unpinned'}`,
      () => todoStore.bulkPinCommit(ids, pinned),
      () => todoStore.bulkPinRollback(snapshot),
    )
  }

  return {
    showBulkDeleteDialog,
    bulkDeleteIds,
    requestBulkDelete,
    confirmBulkDelete,
    bulkRestoreSelected,
    bulkPinSelected,
  }
}
