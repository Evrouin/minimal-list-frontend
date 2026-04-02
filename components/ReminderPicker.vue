<script setup lang="ts">
const model = defineModel<string | null>()

const open = ref(false)
const now = new Date()
const roundedMin = Math.round(now.getMinutes() / 30) * 30
const defaultHour = roundedMin === 60 ? (now.getHours() + 1) % 24 : now.getHours()
const defaultMinute = roundedMin === 60 ? 0 : roundedMin

const viewMonth = ref(now.getMonth())
const viewYear = ref(now.getFullYear())
const selectedHour = ref(defaultHour)
const selectedMinute = ref(defaultMinute)

if (model.value) {
  const d = new Date(model.value)
  viewMonth.value = d.getMonth()
  viewYear.value = d.getFullYear()
  selectedHour.value = d.getHours()
  selectedMinute.value = d.getMinutes()
}

const selectedDate = ref<string | null>(
  model.value
    ? new Date(model.value).toISOString().slice(0, 10)
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
)

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const days = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa']

const daysInMonth = computed(() => new Date(viewYear.value, viewMonth.value + 1, 0).getDate())
const firstDayOfWeek = computed(() => new Date(viewYear.value, viewMonth.value, 1).getDay())

const canGoPrev = computed(() => {
  const today = new Date()
  return viewYear.value > today.getFullYear() || (viewYear.value === today.getFullYear() && viewMonth.value > today.getMonth())
})

const prevMonth = () => {
  if (!canGoPrev.value) return
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
const nextMonth = () => {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

const isToday = (day: number) => {
  const t = new Date()
  return day === t.getDate() && viewMonth.value === t.getMonth() && viewYear.value === t.getFullYear()
}

const isPast = (day: number) => {
  const d = new Date(viewYear.value, viewMonth.value, day, 23, 59, 59)
  return d < new Date(new Date().toDateString())
}

const isSelected = (day: number) => {
  if (!selectedDate.value) return false
  const d = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return d === selectedDate.value
}

const selectDay = (day: number) => {
  if (isPast(day)) return
  selectedDate.value = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const confirm = () => {
  if (!selectedDate.value) return
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const dt = new Date(y, m - 1, d, selectedHour.value, selectedMinute.value)
  model.value = dt.toISOString()
  open.value = false
}

const clear = () => {
  model.value = null
  selectedDate.value = null
  open.value = false
}

const hasReminder = computed(() => !!model.value)
const isOverdue = computed(() => model.value && new Date(model.value).getTime() <= Date.now())

// Time combo-box state
const showHourList = ref(false)
const showMinuteList = ref(false)
const ampm = ref(selectedHour.value >= 12 ? 'PM' : 'AM')
const displayHour = computed(() => {
  const h = selectedHour.value % 12
  return h === 0 ? 12 : h
})
const hourDisplay = ref(String(displayHour.value).padStart(2, '0'))
const minuteDisplay = ref(String(selectedMinute.value).padStart(2, '0'))

watch(selectedHour, (v) => {
  ampm.value = v >= 12 ? 'PM' : 'AM'
  if (!hourFocused.value) {
    const h = v % 12
    hourDisplay.value = String(h === 0 ? 12 : h).padStart(2, '0')
  }
})
watch(selectedMinute, (v) => { if (!minuteFocused.value) minuteDisplay.value = String(v).padStart(2, '0') })
watch(ampm, () => {
  const h12 = parseInt(hourDisplay.value) || 12
  selectedHour.value = to24(h12, ampm.value)
})

const to24 = (h12: number, period: string) => {
  if (period === 'AM') return h12 === 12 ? 0 : h12
  return h12 === 12 ? 12 : h12 + 12
}

const hourFocused = ref(false)
const minuteFocused = ref(false)

const selectHour = (h12: number) => {
  selectedHour.value = to24(h12, ampm.value)
  showHourList.value = false
  hourFocused.value = false
  hourDisplay.value = String(h12).padStart(2, '0')
}
const selectMinute = (m: number) => { selectedMinute.value = m; showMinuteList.value = false; minuteFocused.value = false; minuteDisplay.value = String(m).padStart(2, '0') }
const onHourInput = () => {
  const n = parseInt(hourDisplay.value)
  if (!isNaN(n) && n >= 1 && n <= 12) selectedHour.value = to24(n, ampm.value)
}
const onMinuteInput = () => { const n = parseInt(minuteDisplay.value); if (!isNaN(n) && n >= 0 && n <= 59) selectedMinute.value = n }
const onHourFocus = () => { hourFocused.value = true; showHourList.value = true }
const onMinuteFocus = () => { minuteFocused.value = true; showMinuteList.value = true }
const onHourBlur = () => {
  hourFocused.value = false
  showHourList.value = false
  let n = parseInt(hourDisplay.value) || 12
  n = Math.max(1, Math.min(12, n))
  selectedHour.value = to24(n, ampm.value)
  hourDisplay.value = String(n).padStart(2, '0')
}
const onMinuteBlur = () => {
  minuteFocused.value = false
  showMinuteList.value = false
  selectedMinute.value = Math.max(0, Math.min(59, parseInt(minuteDisplay.value) || 0))
  minuteDisplay.value = String(selectedMinute.value).padStart(2, '0')
}
</script>

<template>
  <div>
    <button
      type="button"
      class="cursor-pointer rounded p-1 transition-colors"
      :class="hasReminder ? (isOverdue ? 'text-red-400' : 'text-yellow-400') : 'text-white/30 hover:text-white/60'"
      @click.stop="open = !open"
    >
      <Icon name="uil:bell" class="text-xs" />
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        @click.self="open = false"
      >
        <div class="w-72 rounded-lg bg-gray-700 p-4 shadow-xl" @click.stop>
          <!-- Month nav -->
          <div class="mb-3 flex items-center justify-between">
            <button type="button" class="cursor-pointer p-1 hover:text-white" :class="canGoPrev ? 'text-white/40' : 'text-white/10 pointer-events-none'" @click="prevMonth">
              <Icon name="uil:angle-left" />
            </button>
            <span class="text-sm text-white/70">{{ months[viewMonth] }} {{ viewYear }}</span>
            <button type="button" class="cursor-pointer p-1 text-white/40 hover:text-white" @click="nextMonth">
              <Icon name="uil:angle-right" />
            </button>
          </div>

          <!-- Day headers -->
          <div class="mb-1 grid grid-cols-7 text-center text-xs text-white/30">
            <span v-for="d in days" :key="d">{{ d }}</span>
          </div>

          <!-- Days grid -->
          <div class="grid min-h-[210px] grid-cols-7 gap-1 text-center text-sm">
            <span v-for="_ in firstDayOfWeek" :key="'e' + _" />
            <button
              v-for="day in daysInMonth"
              :key="day"
              type="button"
              class="cursor-pointer rounded py-1.5 transition-colors"
              :class="[
                isSelected(day) ? 'bg-blue-500 text-white' :
                isToday(day) ? 'text-blue-400' :
                isPast(day) ? 'cursor-not-allowed text-white/15' :
                'text-white/60 hover:bg-gray-600',
              ]"
              :disabled="isPast(day)"
              @click="selectDay(day)"
            >
              {{ day }}
            </button>
          </div>

          <!-- Time picker -->
          <div class="mt-4 flex items-center justify-center gap-1">
            <div class="relative">
              <input
                v-model="hourDisplay"
                type="text"
                inputmode="numeric"
                maxlength="2"
                class="w-12 rounded bg-gray-600 px-2 py-1.5 text-center text-sm text-white focus:outline-none"
                @focus="onHourFocus"
                @blur="onHourBlur"
                @input="onHourInput"
              >
              <div v-if="showHourList" class="absolute left-0 z-10 mt-1 max-h-32 w-12 overflow-y-auto rounded bg-gray-600 py-1 shadow-lg">
                <button
                  v-for="h in 12"
                  :key="h"
                  type="button"
                  class="w-full px-2 py-1 text-center text-sm text-white/60 hover:bg-gray-500 hover:text-white"
                  :class="displayHour === h && 'text-white bg-gray-500'"
                  @mousedown.prevent="selectHour(h)"
                >
                  {{ String(h).padStart(2, '0') }}
                </button>
              </div>
            </div>
            <span class="text-white/40">:</span>
            <div class="relative">
              <input
                v-model="minuteDisplay"
                type="text"
                inputmode="numeric"
                maxlength="2"
                class="w-12 rounded bg-gray-600 px-2 py-1.5 text-center text-sm text-white focus:outline-none"
                @focus="onMinuteFocus"
                @blur="onMinuteBlur"
                @input="onMinuteInput"
              >
              <div v-if="showMinuteList" class="absolute left-0 z-10 mt-1 max-h-32 w-12 overflow-y-auto rounded bg-gray-600 py-1 shadow-lg">
                <button
                  v-for="m in [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]"
                  :key="m"
                  type="button"
                  class="w-full px-2 py-1 text-center text-sm text-white/60 hover:bg-gray-500 hover:text-white"
                  :class="selectedMinute === m && 'text-white bg-gray-500'"
                  @mousedown.prevent="selectMinute(m)"
                >
                  {{ String(m).padStart(2, '0') }}
                </button>
              </div>
            </div>
            <select
              v-model="ampm"
              class="cursor-pointer rounded bg-gray-600 px-2 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>

          <!-- Actions -->
          <div class="mt-4 flex justify-between">
            <button v-if="hasReminder" type="button" class="cursor-pointer text-xs text-red-400 hover:text-red-300" @click="clear">clear</button>
            <span v-else />
            <button
              type="button"
              class="cursor-pointer rounded bg-gray-600 px-4 py-1.5 text-xs text-white hover:bg-gray-500"
              :class="!selectedDate && 'opacity-30 pointer-events-none'"
              @click="confirm"
            >
              set
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
