<template>
  <div class="q-mx-lg">
    <q-tabs
      v-model="currentTab"
      align="left"
      class="bg-white text-teal shadow-2"
      active-color="teal"
      indicator-color="teal"
      narrow-indicator
    >
      <q-tab
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :icon="tab.icon"
        :label="tab.label"
      />
    </q-tabs>

    <q-tab-panels v-model="currentTab" animated class="bg-transparent">
      <q-tab-panel
        v-for="tab in tabs"
        :key="`panel-${tab.name}`"
        :name="tab.name"
        class="q-pa-none"
      >
        <component :is="tab.component" />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CompanyInfo from './tools/CompanyInfo.vue'
import OwnerBusinesses from './tools/OwnerBusiness.vue'
import StaffList from './tools/StaffList.vue'
import OrdersView from '../orders/OrdersView.vue'
import StatisticsSection from './tools/StatisticsSection.vue'

const currentTab = ref('company')

const tabs = [
  {
    name: 'company',
    label: 'Info Azienda',
    icon: 'business',
    component: CompanyInfo
  },
  {
    name: 'businesses',
    label: 'Locali',
    icon: 'store',
    component: OwnerBusinesses
  },
  {
    name: 'staff',
    label: 'Dipendenti',
    icon: 'people',
    component: StaffList
  },
  {
    name: 'orders',
    label: 'Ordini',
    icon: 'list_alt',
    component: OrdersView
  },
  {
    name: 'stats',
    label: 'Statistiche',
    icon: 'analytics',
    component: StatisticsSection
  }
]
</script>

<style scoped>
.q-tab {
  min-width: 120px;
}
</style>
