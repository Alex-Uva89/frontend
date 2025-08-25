<template>
  <BusinessDashboardLayout
    :tabs="tabs"
    initial-tab="orders"
    :fetch-on-tabs="['orders']"
  />
</template>

<script setup>
import { computed } from 'vue'
import BusinessDashboardLayout from 'src/components/common/BusinessDashboardLayout.vue'
import OrderTool from '@tool/OrderTool.vue'
import TurnsInfo from '@common/tools/TurnsInfo.vue'

import { useOrderStore } from 'stores/orderStore'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'

const orderStore = useOrderStore()
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

const ordersTabProps = computed(() => {
  const cb = businessStore.currentBusiness
  return {
    businessId: cb?._id || '',
    businessName: cb?.name || '',
    orders: orderStore.orders,
    loading: orderStore.loading,
    errorMessage: orderStore.error,
    userRole: usersStore.currentUser?.role
  }
})

const tabs = computed(() => [
  { name: 'orders', label: 'Ordini', icon: 'list_alt', component: OrderTool, props: () => ordersTabProps.value },
  { name: 'turns',  label: 'Turni',  icon: 'calendar_month', component: TurnsInfo, props: () => ordersTabProps.value }
])
</script>
