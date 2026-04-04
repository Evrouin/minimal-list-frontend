import { ref, onMounted, onUnmounted } from 'vue'

export function usePullToRefresh(triggerEl: Ref<HTMLElement | undefined>, onRefresh: () => Promise<void>) {
  const pulling = ref(false)
  const pullDistance = ref(0)
  const refreshing = ref(false)
  const threshold = 80

  let startY = 0
  let active = false

  const onTouchStart = (e: TouchEvent) => {
    if (window.scrollY > 0) return
    const rect = triggerEl.value?.getBoundingClientRect()
    if (!rect) return
    if (e.touches[0].clientY > rect.bottom) return
    startY = e.touches[0].clientY
    active = true
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!active || refreshing.value) return
    const dy = e.touches[0].clientY - startY
    if (dy > 0) {
      pulling.value = true
      pullDistance.value = Math.min(dy * 0.5, 120)
    }
  }

  const onTouchEnd = async () => {
    if (!active) return
    active = false
    if (pullDistance.value >= threshold) {
      refreshing.value = true
      await onRefresh()
      refreshing.value = false
    }
    pulling.value = false
    pullDistance.value = 0
  }

  onMounted(() => {
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
  })

  onUnmounted(() => {
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
  })

  return { pulling, pullDistance, refreshing, threshold }
}
