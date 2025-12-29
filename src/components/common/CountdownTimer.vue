<template>
  <div
    class="countdown"
    :class="phase"
    role="status"
    aria-live="polite"
  >
    <span class="label">
      {{ phase === 'standard' ? 'Scadenza ordine standard' : 'Scadenza last minute' }}
    </span>

    <span class="sep" aria-hidden="true">·</span>

    <span class="time">
      {{ time.hours }}h {{ time.minutes }}m {{ time.seconds }}s
    </span>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useTimeStore } from 'src/stores/timeStore'

const time = useTimeStore()
const phase = computed(() => time.phase) // 'standard' | 'lastminute'

onMounted(() => {
  time.startDailyCountdown()
})
</script>

<style scoped>
.countdown {
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f3f4f6; /* gray-100 */
  color: #111827;      /* gray-900 */
  font-size: 0.9rem;
  line-height: 1.2;
  white-space: nowrap;
}

/* stato standard / lastminute */
.countdown.standard {
  border: 1px solid #a7f3d0;   /* green-200/tealish */
  box-shadow: inset 0 0 0 1px #99f6e4;
}
.countdown.lastminute {
  border: 1px solid #fed7aa;   /* orange-200 */
  box-shadow: inset 0 0 0 1px #fde68a;
}

.label {
  opacity: 0.9;
}
.sep {
  opacity: 0.4;
}
.time {
  letter-spacing: 0.3px;
}

/* 🔽 MOBILE: più grande, full-width, testo su 2 righe se serve */
@media (max-width: 599.98px) {
  .countdown {
    width: 100%;
    justify-content: center;
    white-space: normal;
    flex-wrap: wrap;
    text-align: center;
    padding: 10px 12px;
    font-size: 1rem;
  }

  /* nascondo il puntino e vado su due righe pulite */
  .sep {
    display: none;
  }

  .label,
  .time {
    width: 100%;
  }

  .label {
    margin-bottom: 2px;
  }
}
</style>
