const showNoteCount = ref(false)

if (import.meta.client) {
  showNoteCount.value = localStorage.getItem('show_note_count') === 'true'
}

export const useSettings = () => {
  const toggleNoteCount = () => {
    showNoteCount.value = !showNoteCount.value
    localStorage.setItem('show_note_count', String(showNoteCount.value))
  }

  return { showNoteCount: readonly(showNoteCount), toggleNoteCount }
}
