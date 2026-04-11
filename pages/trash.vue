<script setup lang="ts">
import { useTodoStore } from '~/stores/todos'
import { useUiStore } from '~/stores/ui'

const todoStore = useTodoStore()
const ui = useUiStore()
const todoListRef = ref<{ openEmptyTrash: () => void } | null>(null)

onMounted(() => {
  todoStore.changeFilter('deleted')
  todoStore.fetchTrash()
})

onUnmounted(() => {
  todoStore.changeFilter('all')
  todoStore.clearTodos()
})
</script>

<template>
  <div class="flex min-h-screen w-screen flex-col items-center bg-gray-800 pt-10">
    <AppSidebar />
    <div class="w-full max-w-lg px-4 sm:max-w-none md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl min-[1920px]:max-w-400">
      <PageHeader class="mx-2.5" title="trash">
        <template #prepend>
          <button
            class="cursor-pointer text-white/60 hover:text-white"
            @click="ui.openSidebar()"
          >
            <Icon name="uil:bars" class="text-xl mt-2.5" />
          </button>
        </template>
        <button
          class="cursor-pointer mt-2.5 text-xs text-white/30 lowercase hover:text-red-400"
          @click="todoListRef?.openEmptyTrash()"
        >
          empty trash
        </button>
      </PageHeader>
      <TodoList ref="todoListRef" />
      <div v-if="todoStore.loadingMore" class="flex justify-center py-4">
        <span class="text-sm text-white/40">loading...</span>
      </div>
    </div>
  </div>
</template>
