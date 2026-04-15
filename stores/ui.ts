export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)

  const openSidebar = () => {
    sidebarOpen.value = true
  }
  const closeSidebar = () => {
    sidebarOpen.value = false
  }

  return { sidebarOpen, openSidebar, closeSidebar }
})
