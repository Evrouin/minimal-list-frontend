<script setup lang="ts">
import { useTodoStore } from '~/stores/todos'
import { useAuthStore } from '~/stores/auth'

const todoStore = useTodoStore()
const authStore = useAuthStore()

const { changeFilter, filterOptions } = todoStore

onMounted(() => todoStore.loadTodos())
</script>

<template>
  <div
    class="flex h-screen w-screen flex-col items-center justify-center bg-gray-800"
  >
    <div class="w-full max-w-lg px-4">
      <div class="flex items-center justify-between">
        <TodoHeader title="Minimalist Todo List" />
        <NuxtLink
          v-if="authStore.isAuthenticated"
          to="/auth/profile"
          class="cursor-pointer p-4 text-white/60 hover:text-white"
        >
          <Icon name="uil:user-circle" class="text-xl" />
        </NuxtLink>
      </div>
      <TodoAdd />
    </div>
    <div class="my-4 flex justify-center">
      <button
        v-for="(filter, index) in filterOptions"
        :key="index"
        class="mx-2 cursor-pointer rounded-lg px-4 py-2 text-white lowercase transition-all duration-200"
        :class="todoStore.filterType === filter ? 'bg-gray-700' : 'bg-gray-800'"
        @click="changeFilter(filter)"
      >
        {{ filter.charAt(0).toUpperCase() + filter.slice(1) }}
      </button>
    </div>
    <div class="scrollbar-hidden w-full max-w-lg overflow-y-auto px-4">
      <TodoList />
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}

.scrollbar-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
  scroll-behavior: smooth;
}
</style>
