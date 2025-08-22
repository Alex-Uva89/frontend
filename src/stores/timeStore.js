import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTimeStore = defineStore('timeStore', () => {
  const nowTs = ref(Date.now())
  let intervalId = null
  const running = ref(false)

  // fase: prima delle 20 => 'standard', altrimenti 'lastminute'
  const phase = computed(() => {
    const now = new Date(nowTs.value)
    return now.getHours() < 20 ? 'standard' : 'lastminute'
  })

  // deadline corrente: se standard -> 20:00 oggi; se lastminute -> 24:00 (mezzanotte successiva)
  const deadlineTs = computed(() => {
    const now = new Date(nowTs.value)
    const target = new Date(now)

    if (phase.value === 'standard') {
      target.setHours(20, 0, 0, 0)
    } else {
      // prossima mezzanotte
      target.setDate(target.getDate() + 1)
      target.setHours(0, 0, 0, 0)
    }
    return target.getTime()
  })

  const diffMs = computed(() => Math.max(0, deadlineTs.value - nowTs.value))
  const hours   = computed(() => String(Math.floor(diffMs.value / 3600000)).padStart(2, '0'))
  const minutes = computed(() => String(Math.floor((diffMs.value % 3600000) / 60000)).padStart(2, '0'))
  const seconds = computed(() => String(Math.floor((diffMs.value % 60000) / 1000)).padStart(2, '0'))

  function startDailyCountdown () {
    if (running.value) return
    running.value = true
    nowTs.value = Date.now()
    intervalId = setInterval(() => { nowTs.value = Date.now() }, 1000)
  }

  function stopDailyCountdown () {
    if (intervalId) clearInterval(intervalId)
    intervalId = null
    running.value = false
  }

  return {
    phase,
    hours, minutes, seconds,
    running,
    startDailyCountdown,
    stopDailyCountdown
  }
})
