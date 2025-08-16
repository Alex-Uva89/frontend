<template>
  <div>
    <!-- Statistiche Rapide -->
    <q-card class="shadow-2 q-mb-md">
      <q-card-section class="bg-teal-1">
        <div class="text-h6 text-teal-8">
          Statistiche Rapide
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div
            v-for="stat in quickStats"
            :key="stat.title"
            class="col-6 col-sm-4"
          >
            <q-card bordered flat class="text-center q-pa-sm">
              <q-icon :name="stat.icon" size="md" :color="stat.color" />
              <div class="text-h6 q-mt-xs">{{ stat.value }}</div>
              <div class="text-caption text-grey-7">{{ stat.title }}</div>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Grafico -->
    <q-card class="shadow-2">
      <q-card-section class="bg-teal-1">
        <div class="text-h6 text-teal-8">
          Andamento Mensile
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <MyChart />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import MyChart from 'src/components/MyChart.vue'
import { useBusinessStore } from 'src/stores/businessStore'
import { useUsersStore } from 'src/stores/usersStore'
import { computed } from 'vue'

const businessStore = useBusinessStore()
const usersStore = useUsersStore()

const quickStats = computed(() => [
  {
    title: 'Locali',
    icon: 'store',
    value: businessStore.businesses.length,
    color: 'teal'
  },
  {
    title: 'Dipendenti',
    icon: 'groups',
    value: usersStore.users.length - 1, // Esclude owner
    color: 'blue'
  },
  {
    title: 'Ordini Oggi',
    icon: 'receipt',
    value: '24', // Sostituire con dati reali
    color: 'green'
  },
  {
    title: 'Fatturato',
    icon: 'euro',
    value: '1.245€', // Sostituire con dati reali
    color: 'orange'
  }
])
</script>
