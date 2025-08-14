<template>
  <span class="countdown">
    {{ time.hours }}h {{ time.minutes }}m {{ time.seconds }}s
  </span>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTimeStore } from 'src/stores/timeStore'

const time = useTimeStore()

onMounted(() => {
  // avvia una sola volta; chiamate successive non creano doppi interval
  time.startDailyCountdown()
})
</script>

<style scoped>
.countdown {
  font-weight: bold;
  display: inline-flex;
  align-items: center;
}
</style>
