import { computed, nextTick, ref, watch, type Ref } from 'vue'
import type { Todo } from '@/types'
import type { NoteColor } from '~/types/todo'
import { useTodoStore } from '~/stores/todos'
import { storeToRefs } from 'pinia'

interface UseTodoEditingOptions {
  isLg: Ref<boolean>
  cardRefs: Ref<Map<string, Element>>
  endLongPress: () => void
  endHover: (id: string) => void
  onEditEnd?: () => void
}

export function useTodoEditing(options: UseTodoEditingOptions) {
  const { isLg, cardRefs, endLongPress, endHover } = options
  const todoStore = useTodoStore()
  const { filteredTodos } = storeToRefs(todoStore)
  const { fetchPreviews } = useLinkPreviews()

  const dialogTodo = ref<Todo | null>(null)
  const dialogTitle = ref('')
  const dialogBody = ref('')
  const dialogEditorRef = ref<{ focus: () => void } | null>(null)
  const dialogPinned = ref(false)
  const dialogColor = ref<NoteColor>('default')
  const dialogReminderAt = ref<string | null>(null)
  const dialogExpanded = ref(false)
  const dialogImageFile = ref<File | null>(null)
  const dialogImagePreview = ref('')
  const dialogAudioFile = ref<File | null>(null)
  const dialogAudioPreview = ref('')
  const dialogAudioRecording = ref(false)
  const dialogOriginalAudio = ref<string | null | undefined>(null)

  const inlineEditorRefs = ref(new Map<string, { focus: () => void }>())
  const editOriginals = ref(new Map<string, { title: string; body: string; audio: string | null | undefined }>())
  const editImageFiles = ref(new Map<string, File>())
  const editImagePreviews = ref(new Map<string, string>())
  const editAudioFiles = ref(new Map<string, File>())
  const editAudioPreviews = ref(new Map<string, string>())
  const expandedAudioRecording = ref(false)
  const expandedEditId = ref<string | null>(null)
  const expandedTodo = computed(() => expandedEditId.value ? todoStore.todos.find((t) => t.uuid === expandedEditId.value) : null)
  const audioInteracting = ref(false)

  const isEditing = computed(() => filteredTodos.value.some((t) => t.editing))

  const openDialog = (todo: Todo) => {
    dialogTodo.value = todo
    dialogTitle.value = todo.title
    dialogBody.value = todo.body
    dialogPinned.value = todo.pinned
    dialogColor.value = todo.color
    dialogReminderAt.value = todo.reminder_at ?? null
    dialogOriginalAudio.value = todo.audio ?? null
    nextTick(() => dialogEditorRef.value?.focus())
  }

  const editTodo = (todo: Todo) => {
    endLongPress()
    endHover(todo.uuid)
    const current = filteredTodos.value.find((t) => t.editing && t.uuid !== todo.uuid)
    if (current) {
      const orig = editOriginals.value.get(current.uuid)
      if (orig) { current.title = orig.title; current.body = orig.body }
      current.editing = false
      editOriginals.value.delete(current.uuid)
    }
    if (isLg.value) {
      openDialog(todo)
    } else {
      editOriginals.value.set(todo.uuid, { title: todo.title, body: todo.body, audio: todo.audio ?? null })
      todo.editing = true
      nextTick(() => {
        inlineEditorRefs.value.get(todo.uuid)?.focus()
        setTimeout(() => {
          const el = cardRefs.value.get(todo.uuid)
          const dom = ((el as any)?.$el ?? el) as HTMLElement | undefined
          const muuriItem = dom?.closest('.muuri-item') ?? dom
          muuriItem?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 300)
      })
    }
  }

  const cancelAllEdits = () => {
    const current = filteredTodos.value.find((t) => t.editing)
    if (current) {
      const orig = editOriginals.value.get(current.uuid)
      if (orig) { current.title = orig.title; current.body = orig.body }
      current.editing = false
      editOriginals.value.delete(current.uuid)
    }
  }

  const saveTodo = async (todo: Todo) => {
    if (!todo.title.trim()) return
    todo.editing = false
    todo.link_previews = await fetchPreviews(todo.body, todo.link_previews ?? [])
    const imageFile = editImageFiles.value.get(todo.uuid)
    const audioFile = editAudioFiles.value.get(todo.uuid)
    editOriginals.value.delete(todo.uuid)
    editImageFiles.value.delete(todo.uuid)
    editImagePreviews.value.delete(todo.uuid)
    editAudioFiles.value.delete(todo.uuid)
    editAudioPreviews.value.delete(todo.uuid)
    await todoStore.updateTodo({ ...todo }, imageFile, audioFile)
    options.onEditEnd?.()
  }

  const cancelEdit = (todo: Todo) => {
    const orig = editOriginals.value.get(todo.uuid)
    if (orig) { todo.title = orig.title; todo.body = orig.body; todo.audio = orig.audio }
    todo.editing = false
    expandedEditId.value = null
    editOriginals.value.delete(todo.uuid)
    editImageFiles.value.delete(todo.uuid)
    editImagePreviews.value.delete(todo.uuid)
    editAudioFiles.value.delete(todo.uuid)
    editAudioPreviews.value.delete(todo.uuid)
    options.onEditEnd?.()
  }

  const onDialogImageSelect = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const compressed = await compressImage(file)
      dialogImageFile.value = compressed
      dialogImagePreview.value = URL.createObjectURL(compressed)
    }
  }

  const onEditImageSelect = async (todo: Todo, e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const compressed = await compressImage(file)
      editImageFiles.value.set(todo.uuid, compressed)
      editImagePreviews.value.set(todo.uuid, URL.createObjectURL(compressed))
    }
  }

  const cancelDialogTodo = () => {
    if (dialogTodo.value) dialogTodo.value.audio = dialogOriginalAudio.value
    dialogTodo.value = null
    dialogImageFile.value = null
    dialogImagePreview.value = ''
    dialogAudioFile.value = null
    dialogAudioPreview.value = ''
    dialogOriginalAudio.value = null
    dialogExpanded.value = false
  }

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

  const dialogToggleCompletion = async () => {
    if (!dialogTodo.value) return
    await todoStore.toggleTodoCompletion(dialogTodo.value.uuid)
    dialogTodo.value = null
  }

  const dialogTogglePin = () => { dialogPinned.value = !dialogPinned.value }

  const expandedTitleRef = ref<HTMLInputElement>()
  const expandedEditorRef = ref<{ focus: () => void } | null>(null)

  const expandEdit = (todo: Todo) => {
    expandedEditId.value = todo.uuid
    nextTick(() => expandedTitleRef.value?.focus())
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

  const setEditorRef = (id: string, el: { focus: () => void }) => {
    inlineEditorRefs.value.set(id, el)
  }

  // Transition between inline/dialog editing on breakpoint change
  watch(isLg, (lg) => {
    if (lg && expandedEditId.value) {
      const todo = expandedTodo.value
      if (todo) { todo.editing = false; expandedEditId.value = null; openDialog(todo) }
    } else if (lg && filteredTodos.value.some((t) => t.editing)) {
      const todo = filteredTodos.value.find((t) => t.editing)!
      todo.editing = false
      openDialog(todo)
    } else if (!lg && dialogTodo.value) {
      const todo = dialogTodo.value
      todo.title = dialogTitle.value
      todo.body = dialogBody.value
      dialogTodo.value = null
      dialogExpanded.value = false
      todo.editing = true
      nextTick(() => inlineEditorRefs.value.get(todo.uuid)?.focus())
    }
  })

  return {
    // Dialog
    dialogTodo, dialogTitle, dialogBody, dialogEditorRef, dialogPinned, dialogColor,
    dialogReminderAt, dialogExpanded, dialogImageFile, dialogImagePreview,
    dialogAudioFile, dialogAudioPreview, dialogAudioRecording, dialogOriginalAudio,
    onDialogImageSelect, cancelDialogTodo, saveDialogTodo, dialogToggleCompletion, dialogTogglePin,
    // Inline
    inlineEditorRefs, editImagePreviews, editAudioFiles, editAudioPreviews, expandedAudioRecording,
    expandedEditId, expandedTodo, expandedTitleRef, expandedEditorRef, audioInteracting,
    editTodo, saveTodo, cancelEdit, cancelAllEdits, onEditImageSelect,
    expandEdit, saveExpandedEdit, cancelExpandedEdit, setEditorRef,
    isEditing,
  }
}
