const searchQuery = ref('')
const searchOpen = ref(false)
const isSearching = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

export const useSearch = () => {
  const todoStore = useTodoStore()

  const onInput = (query: string) => {
    searchQuery.value = query
    if (debounceTimer) clearTimeout(debounceTimer)
    if (query.length < 2) {
      if (isSearching.value) {
        isSearching.value = false
        todoStore.restoreFromSearch()
      }
      return
    }
    debounceTimer = setTimeout(() => {
      isSearching.value = true
      todoStore.searchTodos(query)
    }, 300)
  }

  const open = () => {
    searchOpen.value = true
  }

  const exitSearch = () => {
    searchQuery.value = ''
    searchOpen.value = false
    if (debounceTimer) clearTimeout(debounceTimer)
    if (isSearching.value) {
      isSearching.value = false
      todoStore.restoreFromSearch()
    }
  }

  return { searchQuery: readonly(searchQuery), searchOpen: readonly(searchOpen), isSearching: readonly(isSearching), onInput, open, exitSearch }
}
