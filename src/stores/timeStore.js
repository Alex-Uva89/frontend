import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTimeStore = defineStore('timeStore', () => {
  // timestamp corrente aggiornato ogni secondo
  const nowTs = ref(Date.now())
  let intervalId = null
  const running = ref(false)

  // calcola la prossima scadenza alle 20:00 locali (oggi o domani)
  const deadlineTs = computed(() => {
    const now = new Date(nowTs.value)
    const target = new Date(now)
    target.setHours(20, 0, 0, 0) // oggi 20:00
    if (now.getTime() >= target.getTime()) {
      target.setDate(target.getDate() + 1) // se già oltre, domani 20:00
    }
    return target.getTime()
  })

  // differenza in ms (mai negativa)
  const diffMs = computed(() => Math.max(0, deadlineTs.value - nowTs.value))

  // parti formattate
  const hours = computed(() => String(Math.floor(diffMs.value / 3600000)).padStart(2, '0'))
  const minutes = computed(() => String(Math.floor((diffMs.value % 3600000) / 60000)).padStart(2, '0'))
  const seconds = computed(() => String(Math.floor((diffMs.value % 60000) / 1000)).padStart(2, '0'))

  function startDailyCountdown () {
    if (running.value) return
    running.value = true
    nowTs.value = Date.now()
    intervalId = setInterval(() => {
      nowTs.value = Date.now()
    }, 1000)
  }

  function stopDailyCountdown () {
    if (intervalId) clearInterval(intervalId)
    intervalId = null
    running.value = false
  }

  return {
    hours,
    minutes,
    seconds,
    running,
    startDailyCountdown,
    stopDailyCountdown
  }
})
