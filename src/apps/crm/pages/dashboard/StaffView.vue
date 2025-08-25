<template>
  <BusinessDashboardLayout
    :tabs="tabs"
    initial-tab="company"
    :fetch-on-tabs="['orders','orders_view']"
  />
</template>

<script setup>
import { computed } from 'vue';
import BusinessDashboardLayout from 'src/components/common/BusinessDashboardLayout.vue'

import TurnsInfo from '@common/tools/TurnsInfo.vue';


const tabs = computed(() => [
  { name: 'turns',  label: 'Turni',  icon: 'calendar_month', component: TurnsInfo},
])
</script>
