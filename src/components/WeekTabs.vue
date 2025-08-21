<template>
  <q-toolbar class="q-pa-xs" :class="toolbarClass">
    <!-- Mobile: Solo icona freccia -->
    <q-btn
      flat round dense
      :icon="isMobile ? 'chevron_left' : 'keyboard_arrow_left'"
      @click="moveCenter(-1)"
      :disable="isFirstDate"
      class="lt-sm"
      />

    <!-- Desktop: Icona + testo -->
    <q-btn
      flat round dense
      icon="chevron_left"
      @click="moveCenter(-1)"
      :disable="isFirstDate"
      class="gt-xs"
      />

      <div class="row items-center justify-center q-mx-sm" style="flex: 1; min-width: 0;">
      <div
        ref="tabsContainer"
        class="row no-wrap scroll-x-hidden"
        :style="{
          transform: `translateX(-${scrollOffset}px)`,
          transition: 'transform 0.3s ease'
        }"
      >
        <q-btn
          v-for="day in visibleDates"
          :key="day"
          :label="formatDate(day, isMobile)"
          :color="tab === day ? 'teal' : ''"
          unelevated
          no-caps
          class="q-mx-xs"
          :class="{
            'text-white': tab === day,
            'text-black': tab !== day,
            'q-px-sm': isMobile,
            'q-px-md': !isMobile
          }"
          @click="selectDay(day)"
          :style="{
            minWidth: isMobile ? '50px' : '60px',
            fontSize: isMobile ? '0.8rem' : '1rem'
          }"
        />
      </div>
    </div>

    <!-- Mobile: Solo icona freccia -->
    <q-btn
      flat round dense
      :icon="isMobile ? 'chevron_right' : 'keyboard_arrow_right'"
      @click="moveCenter(1)"
      :disable="isLastDate"
      class="lt-sm"
    />

    <!-- Desktop: Icona + testo -->
    <q-btn
      flat round dense
      icon="chevron_right"
      @click="moveCenter(1)"
      :disable="isLastDate"
      class="gt-xs"
    />
  </q-toolbar>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const isMobile = computed(() => $q.screen.lt.sm)

const toolbarClass = computed(() => $q.dark.isActive ? 'bg-grey-9' : 'bg-grey-2')

defineProps({
  modelValue: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])
const tabsContainer = ref(null)
const scrollOffset = ref(0)

const tab = ref('')
const startIndex = ref(0)
const tabWidth = computed(() => isMobile.value ? 50 : 72)

// Genera tutti i giorni dell'anno corrente
const dateTime = ref([])
const generateDates = () => {
  const dates = []
  const year = new Date().getFullYear()
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month, day).toISOString().split('T')[0])
    }
  }
  return dates
}

dateTime.value = generateDates()

const today = new Date().toISOString().split('T')[0]
const todayIndex = dateTime.value.indexOf(today)

// Inizializza con la data corrente al centro
startIndex.value = Math.max(0, todayIndex - (isMobile.value ? 2 : 3))
tab.value = today

const visibleDates = computed(() => {
  const count = isMobile.value ? 5 : 7
  return dateTime.value.slice(startIndex.value, startIndex.value + count)
})

const isFirstDate = computed(() => dateTime.value.indexOf(tab.value) === 0)
const isLastDate = computed(() => dateTime.value.indexOf(tab.value) === dateTime.value.length - 1)

function moveCenter(direction) {
  const currentIndex = dateTime.value.indexOf(tab.value)
  const newIndex = currentIndex + direction

  if (newIndex >= 0 && newIndex < dateTime.value.length) {
    tab.value = dateTime.value[newIndex]
    updateStartIndex(newIndex)
  }
}

function updateStartIndex(centerIndex) {
  const visibleCount = isMobile.value ? 5 : 7
  const newStart = Math.min(
    Math.max(centerIndex - Math.floor(visibleCount / 2), 0),
    dateTime.value.length - visibleCount
  )

  if (newStart !== startIndex.value) {
    startIndex.value = newStart
    centerSelectedTab()
  }
}

function selectDay(day) {
  tab.value = day
  updateStartIndex(dateTime.value.indexOf(day))
}

function centerSelectedTab() {
  nextTick(() => {
    if (tabsContainer.value) {
      const selectedIndex = visibleDates.value.indexOf(tab.value)
      if (selectedIndex >= 0) {
        const containerWidth = tabsContainer.value.clientWidth
        const newOffset = Math.max(0, selectedIndex * tabWidth.value - (containerWidth / 2 - tabWidth.value / 2))
        scrollOffset.value = newOffset
      }
    }
  })
}

function formatDate(dateString, shortFormat) {
  const date = new Date(dateString)
  if (shortFormat) {
    // Formato più compatto per mobile: GG/M
    return `${date.getDate()}/${date.getMonth() + 1}`
  }
  // Formato desktop: GG/MM
  return `${date.getDate()}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

watch(tab, (newVal) => {
  emit('update:modelValue', newVal)
})

const resizeObserver = new ResizeObserver(() => {
  centerSelectedTab()
})

onMounted(() => {
  if (tabsContainer.value) {
    resizeObserver.observe(tabsContainer.value)
  }
  centerSelectedTab()
})

onBeforeUnmount(() => {
  resizeObserver.disconnect()
})
</script>

<style scoped>
.scroll-x-hidden {
  overflow-x: hidden;
  white-space: nowrap;
}

/* Miglioramenti per touch su mobile */
.q-btn {
  touch-action: manipulation;
}

/* Effetto hover solo su desktop */
@media (hover: hover) {
  .q-btn:hover {
    transform: scale(1.05);
  }
}
</style>
