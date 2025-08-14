<template>
  <q-toolbar class="bg-grey-2 q-pa-sm">
    <q-btn flat round dense icon="chevron_left" @click="moveCenter(-1)" :disable="isFirstDate" />

    <div class="row items-center justify-center q-mx-md" style="flex: 1; overflow: hidden;">
      <div ref="tabsContainer" class="row no-wrap scroll-x-hidden" style="transition: transform 0.3s ease;">
        <q-btn
          v-for="day in visibleDates"
          :key="day"
          :label="formatDate(day)"
          :color="tab === day ? 'teal' : ''"
          unelevated
          no-caps
          class="q-mx-xs"
          :class="tab === day ? 'text-white' : 'text-black'"
          @click="selectDay(day)"
          style="min-width: 60px; transition: all 0.3s ease;"
        />
      </div>
    </div>

    <q-btn flat round dense icon="chevron_right" @click="moveCenter(1)" :disable="isLastDate" />
  </q-toolbar>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'

defineProps({
  modelValue: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])
const tabsContainer = ref(null)

const tab = ref('')
const startIndex = ref(0)
const tabWidth = ref(72) // Larghezza approssimativa di ogni tab

// Genera tutti i giorni dell'anno corrente
const dateTime = []
const year = new Date().getFullYear()
for (let month = 0; month < 12; month++) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let day = 1; day <= daysInMonth; day++) {
    dateTime.push(new Date(year, month, day).toISOString().split('T')[0])
  }
}

const today = new Date().toISOString().split('T')[0]
const todayIndex = dateTime.indexOf(today)

// Inizializza con la data corrente al centro
startIndex.value = Math.max(0, todayIndex - 3)
tab.value = today

const visibleDates = computed(() => dateTime.slice(startIndex.value, startIndex.value + 7))

const isFirstDate = computed(() => dateTime.indexOf(tab.value) === 0)
const isLastDate = computed(() => dateTime.indexOf(tab.value) === dateTime.length - 1)

function moveCenter(direction) {
  const currentIndex = dateTime.indexOf(tab.value)
  const newIndex = currentIndex + direction

  // Verifica i limiti
  if (newIndex >= 0 && newIndex < dateTime.length) {
    tab.value = dateTime[newIndex]
    updateStartIndex(newIndex)
  }
}

function updateStartIndex(centerIndex) {
  const newStart = Math.min(Math.max(centerIndex - 3, 0), dateTime.length - 7)
  if (newStart !== startIndex.value) {
    startIndex.value = newStart
    nextTick(() => {
      centerSelectedTab()
    })
  }
}

function selectDay(day) {
  tab.value = day
  updateStartIndex(dateTime.indexOf(day))
}

function centerSelectedTab() {
  nextTick(() => {
    if (tabsContainer.value) {
      const container = tabsContainer.value
      const selectedIndex = visibleDates.value.indexOf(tab.value)

      if (selectedIndex >= 0) {
        const scrollPosition = selectedIndex * tabWidth.value - (container.clientWidth / 2 - tabWidth.value / 2)
        container.style.transform = `translateX(-${scrollPosition}px)`
      }
    }
  })
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return `${date.getDate()}/${date.getMonth() + 1}`
}

watch(tab, (newVal) => {
  emit('update:modelValue', newVal)
})

onMounted(() => {
  nextTick(() => {
    centerSelectedTab()
  })
})
</script>

<style scoped>
.scroll-x-hidden {
  overflow-x: hidden;
}
</style>
