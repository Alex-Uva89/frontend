<template>
  <div class="full-width">
    <!-- Mobile Tabs -->
    <q-tabs
      v-model="currentTab"
      inline-label
      outside-arrows
      mobile-arrows
      class="lt-md bg-white text-teal shadow-2"
      active-color="teal"
      indicator-color="teal"
    >
      <q-tab
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :icon="tab.icon"
        class="q-px-sm"
      >
        <q-tooltip anchor="top middle" self="bottom middle">
          {{ tab.label }}
        </q-tooltip>
      </q-tab>
    </q-tabs>

    <!-- Desktop Tabs -->
    <q-tabs
      v-model="currentTab"
      align="left"
      class="gt-sm bg-white text-teal shadow-2"
      active-color="teal"
      indicator-color="teal"
    >
      <q-tab
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :icon="tab.icon"
        :label="tab.label"
        class="q-px-md"
      />
    </q-tabs>

    <q-separator />

    <q-tab-panels
      v-model="currentTab"
      animated
      class="bg-transparent q-mt-none"
    >
      <q-tab-panel
        v-for="tab in tabs"
        :key="`panel-${tab.name}`"
        :name="tab.name"
        class="q-pa-sm"
      >
        <component
          :is="tab.component"
          :class="{'mobile-view': $q.screen.lt.md, 'desktop-view': $q.screen.gt.sm}"
        />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CompanyInfo from './tools/CompanyInfo.vue';
import OwnerBusiness from './tools/OwnerBusiness.vue';
import StaffList from './tools/StaffList.vue';
import OrdersView from '../orders/OrdersView.vue';
import StatisticsSection from './tools/StatisticsSection.vue';


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
    component: OwnerBusiness
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
/* Mobile ottimizations */
.mobile-view {
  padding: 6px;
}

/* Desktop ottimizations */
.desktop-view {
  padding: 12px;
}

/* Tabs responsive */
.q-tab {
  min-height: 48px;
}

.q-tab__icon {
  font-size: 1.4rem;
}

@media (max-width: 600px) {
  .q-tab {
    min-width: 60px;
    padding: 0 4px;
  }
}

@media (min-width: 601px) {
  .q-tab {
    min-width: 120px;
    padding: 0 12px;
  }
}
</style>


