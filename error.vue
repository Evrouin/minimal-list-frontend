<script setup lang="ts">
const props = defineProps<{
  error: { statusCode?: number; message?: string }
}>()

const title = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'page not found'
    case 403:
      return 'access denied'
    case 500:
      return 'server error'
    default:
      return 'something went wrong'
  }
})

const handleRetry = () => clearError({ redirect: '/' })
</script>

<template>
  <div
    class="flex h-screen w-screen flex-col items-center justify-center bg-gray-800"
  >
    <div class="w-full max-w-lg px-4">
      <div
        class="flex flex-col gap-3 rounded-lg bg-gray-500 p-5 text-sm text-white shadow-md"
      >
        <span class="text-2xl font-bold lowercase">{{ title }}</span>
        <span class="text-white/60 lowercase">
          {{ props.error.message || 'an unexpected error occurred.' }}
        </span>
        <button
          class="mt-2 cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-white lowercase transition-all duration-200 hover:bg-gray-600"
          @click="handleRetry"
        >
          back to home
        </button>
      </div>
    </div>
  </div>
</template>
