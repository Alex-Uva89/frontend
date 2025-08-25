<template>
  <div>
    <q-select
      v-model="selectedBusinessId"
      :options="businessOptions"
      label="Seleziona locale"
      outlined
      dense
      class="q-mb-md"
      emit-value
      map-options
    />

    <div class="q-gutter-md row q-mb-md items-center">
      <q-input
        v-model="startDate"
        label="Data inizio"
        type="date"
        outlined
        dense
        style="max-width: 180px"
      />
      <q-input
        v-model="endDate"
        label="Data fine"
        type="date"
        outlined
        dense
        style="max-width: 180px"
      />
    </div>

    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useBusinessStore } from 'src/stores/businessStore'

Chart.register(...registerables)

const businessStore = useBusinessStore()

const selectedBusinessId = ref(null)
const startDate = ref(null)
const endDate = ref(null)
const chartRef = ref(null)
let chartInstance = null

// Opzioni select locali da businessStore (id + nome)
const businessOptions = computed(() =>
  businessStore.businesses.map(b => ({
    label: b.name,
    value: b._id
  }))
)

// Genera dati fittizi spese per ogni mese tra start e end
function generateFakeExpensesInRange(start, end) {
  if (!start || !end) return []

  const expenses = []
  const startD = new Date(start)
  const endD = new Date(end)

  // Calcolo mesi totali tra start e end
  const monthsDiff =
    (endD.getFullYear() - startD.getFullYear()) * 12 +
    (endD.getMonth() - startD.getMonth()) +
    1

  for (let i = 0; i < monthsDiff; i++) {
    const year = startD.getFullYear() + Math.floor((startD.getMonth() + i) / 12)
    const month = (startD.getMonth() + i) % 12

    // Creo data a metà mese (15 del mese)
    const date = new Date(year, month, 15)

    // Genero spesa casuale basata su seed per variazioni fittizie
    // Puoi migliorare la randomizzazione con selectedBusinessId se vuoi
    const amount = Math.floor(Math.random() * 5000) + 1000

    expenses.push({
      date: date.toISOString().slice(0, 10),
      amount
    })
  }

  return expenses
}

function updateChartData() {
  if (!chartInstance) return
  if (!selectedBusinessId.value || !startDate.value || !endDate.value) {
    chartInstance.data.datasets[0].data = []
    chartInstance.data.labels = []
    chartInstance.options.plugins.title.text = 'Seleziona locale e intervallo date'
    chartInstance.update()
    return
  }

  // Genera dati fake nell’intervallo selezionato
  const allExpenses = generateFakeExpensesInRange(startDate.value, endDate.value)

  // Etichette mesi in italiano abbreviato (Gen, Feb, ...)
  const labels = allExpenses.map(e => {
    const d = new Date(e.date)
    return d.toLocaleString('it-IT', { month: 'short' })
  })
  const data = allExpenses.map(e => e.amount)

  chartInstance.data.labels = labels
  chartInstance.data.datasets[0].data = data
  chartInstance.options.plugins.title.text = `Spese da ${startDate.value} a ${endDate.value} per ${businessStore.businesses.find(b => b._id === selectedBusinessId.value)?.name || ''}`
  chartInstance.update()
}

onMounted(() => {
  const ctx = chartRef.value.getContext('2d')
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Spese (€)',
          data: [],
          backgroundColor: 'rgba(255, 99, 132, 0.7)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Seleziona locale e intervallo date per vedere le spese'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })

  if (businessOptions.value.length) {
    selectedBusinessId.value = businessOptions.value[0].value
  }

  // Set default date a 6 mesi fa e oggi
  const today = new Date()
  endDate.value = today.toISOString().slice(0, 10)
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)
  startDate.value = sixMonthsAgo.toISOString().slice(0, 10)

  updateChartData()
})

watch([selectedBusinessId, startDate, endDate], () => {
  updateChartData()
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>

<style scoped>
canvas {
  width: 100% !important;
  height: 350px !important;
}
</style>
