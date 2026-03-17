<script setup lang="ts">
defineProps<{ src: string; removable?: boolean }>()
defineEmits<{ remove: [] }>()
</script>

<template>
  <div class="relative">
    <img :src="src" class="h-32 w-full rounded object-cover" />
    <button v-if="removable" type="button" class="absolute top-1 right-1 cursor-pointer text-xs text-white/60 hover:text-white" @click="$emit('remove')">
      <Icon name="uil:times" class="text-xs" />
    </button>
  </div>
</template>
