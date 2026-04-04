<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Muuri from 'muuri'

const props = defineProps<{
  items: any[]
  keyField?: string
  dragEnabled?: boolean
}>()

const emit = defineEmits<{
  reorder: [uuid: string, newIndex: number]
  dragStart: []
  dragEnd: []
}>()

const wrapperRef = ref<HTMLElement>()
const containerRef = ref<HTMLElement>()
let grid: Muuri | null = null
let resizeObserver: ResizeObserver | null = null
let columnCount = 1

const getColumnCount = () => {
  const width = window.innerWidth
  if (width >= 1024) return 3
  if (width >= 768) return 2
  return 1
}

const gap = 20

const getItemWidth = () => {
  const w = wrapperRef.value?.offsetWidth ?? 300
  return Math.floor(w / columnCount - gap)
}

const applyItemWidths = () => {
  const w = getItemWidth()
  containerRef.value?.querySelectorAll<HTMLElement>('.muuri-item').forEach((el) => {
    el.style.width = w + 'px'
  })
}

const refreshLayout = () => {
  if (!grid) return
  grid.refreshItems()
  grid.layout()
}

const initGrid = () => {
  destroyGrid()
  if (!containerRef.value) return

  columnCount = getColumnCount()

  const items = containerRef.value.querySelectorAll<HTMLElement>('.muuri-item')
  if (items.length === 0) return

  applyItemWidths()
  resizeObserver = new ResizeObserver(() => refreshLayout())

  grid = new Muuri(containerRef.value, {
    items: '.muuri-item',
    dragEnabled: props.dragEnabled ?? false,
    dragSort: () => grid ? [grid] : [],
    dragStartPredicate: { delay: 0, distance: 10 },
    dragHandle: columnCount <= 2 ? '.drag-handle' : undefined,
    dragAutoScroll: {
      targets: [{ element: window, priority: 0 }],
      sortDuringScroll: true,
      smoothStop: true,
    },
    dragSortHeuristics: { sortInterval: 70 },
    layout: { fillGaps: false, horizontal: false, rounding: true },
    dragPlaceholder: {
      enabled: true,
      createElement: (item: any) => {
        const el = document.createElement('div')
        el.style.cssText = `width:100%;height:${item.getElement().offsetHeight}px;border-radius:0.5rem;background:rgba(255,255,255,0.05);`
        return el
      },
    },
  })

  grid.on('dragStart', () => emit('dragStart'))
  grid.on('dragEnd', (item: any) => {
    emit('dragEnd')
    const el = item.getElement() as HTMLElement
    const uuid = el.dataset.uuid
    if (!uuid || !grid) return
    const newIndex = grid.getItems().indexOf(item)
    if (newIndex >= 0) emit('reorder', uuid, newIndex)
  })

  containerRef.value.querySelectorAll('.muuri-item').forEach((el) => {
    const content = el.querySelector('.muuri-item-content')
    if (content) resizeObserver!.observe(content)
  })
}

const destroyGrid = () => {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (grid) {
    grid.destroy()
    grid = null
  }
  // Clear Muuri's inline styles so fresh init works cleanly
  containerRef.value?.querySelectorAll<HTMLElement>('.muuri-item').forEach((el) => {
    el.style.transform = ''
    el.style.position = ''
    el.style.left = ''
    el.style.top = ''
    el.style.display = ''
  })
  if (containerRef.value) {
    containerRef.value.style.height = ''
  }
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null
onMounted(() => {
  columnCount = getColumnCount()
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      const newCount = getColumnCount()
      columnCount = newCount
      applyItemWidths()
      if (grid) {
        refreshLayout()
      } else {
        initGrid()
      }
    }, 150)
  })
  nextTick(() => nextTick(() => initGrid()))
})

onUnmounted(() => {
  if (resizeTimer) clearTimeout(resizeTimer)
  destroyGrid()
})

watch(() => props.items.length, (len, oldLen) => {
  if (!len) return
  const prevLen = oldLen ?? 0

  if (prevLen === 0 || len < prevLen) {
    nextTick(() => nextTick(() => initGrid()))
    return
  }

  nextTick(() => {
    if (!grid || !containerRef.value) { initGrid(); return }

    const w = getItemWidth()
    const currentEls = new Set(grid.getItems().map((i: any) => i.getElement()))
    const domEls = Array.from(containerRef.value.querySelectorAll(':scope > .muuri-item')) as HTMLElement[]
    const newEls = domEls.filter((el) => !currentEls.has(el))

    if (newEls.length > 0) {
      newEls.forEach((el) => {
        el.style.width = w + 'px'
        el.style.transition = 'none'
      })
      grid.add(newEls, { layout: false })
      newEls.forEach((el) => {
        const content = el.querySelector('.muuri-item-content')
        if (content) resizeObserver?.observe(content)
      })
      requestAnimationFrame(() => {
        newEls.forEach((el) => { el.style.transition = '' })
        refreshLayout()
      })
    }
  })
}, { flush: 'post' })

defineExpose({ containerRef, refreshLayout })
</script>

<template>
  <div ref="wrapperRef">
    <div ref="containerRef" class="muuri-grid">
      <div
        v-for="(item, idx) in items"
        :key="(keyField && item?.[keyField]) || idx"
        :data-uuid="keyField ? item?.[keyField] : undefined"
        class="muuri-item"
      >
        <div class="muuri-item-content">
          <slot :item="item" :index="idx" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.muuri-grid {
  position: relative;
}
.muuri-item {
  position: absolute;
  margin: 10px;
  z-index: auto;
  transition: transform 0.3s ease;
}
.muuri-item.muuri-item-dragging {
  z-index: 3;
  transition: none;
}
.muuri-item.muuri-item-releasing {
  z-index: 2;
}
.muuri-item-content {
  position: relative;
}
</style>
