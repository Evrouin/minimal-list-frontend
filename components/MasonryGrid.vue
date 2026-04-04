<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  items: any[]
  keyField?: string
}>()

const containerRef = ref<HTMLElement>()
const columnCount = ref(1)

const updateColumns = () => {
  const width = window.innerWidth
  if (width >= 1024) columnCount.value = 3
  else if (width >= 768) columnCount.value = 2
  else columnCount.value = 1
}

let resizeListener: (() => void) | null = null
onMounted(() => {
  updateColumns()
  resizeListener = updateColumns
  window.addEventListener('resize', resizeListener)
})
onUnmounted(() => {
  if (resizeListener) window.removeEventListener('resize', resizeListener)
})

// Distribute items row-by-row: left-to-right, top-to-bottom
const columns = computed(() => {
  const cols: number[][] = Array.from({ length: columnCount.value }, () => [])
  for (let i = 0; i < props.items.length; i++) {
    cols[i % columnCount.value].push(i)
  }
  return cols
})

defineExpose({ containerRef })
</script>

<template>
  <div ref="containerRef" class="flex gap-5">
    <div v-for="(col, colIdx) in columns" :key="colIdx" class="flex flex-1 flex-col gap-5">
      <div v-for="itemIdx in col" :key="(keyField && items[itemIdx]?.[keyField]) || itemIdx">
        <slot :item="items[itemIdx]" :index="itemIdx" />
      </div>
    </div>
  </div>
</template>
