<script setup lang="ts">
const props = defineProps<{ src: string; removable?: boolean; padding?: number }>()
defineEmits<{ remove: [] }>()

const pad = computed(() => `${(props.padding ?? 5) * 0.25}rem`)
</script>

<template>
  <div class="relative mb-1" :style="{ marginTop: `-${pad}`, marginLeft: `-${pad}`, marginRight: `-${pad}` }">
    <img :src="src" class="block h-32 w-full rounded-t object-cover" >
    <button v-if="removable" type="button" class="absolute top-1 right-1 cursor-pointer text-xs text-white/60 hover:text-white" @click="$emit('remove')">
      <Icon name="uil:times" class="text-xs" />
    </button>
  </div>
</template>
