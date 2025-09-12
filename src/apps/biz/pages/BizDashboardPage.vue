<template>
  <BusinessDashboardLayout
    :tabs="tabs"
  />
</template>

<script setup>
import { computed } from 'vue'
import BusinessDashboardLayout from 'src/components/common/BusinessDashboardLayout.vue'
import FloorEditorTool from 'src/components/common/biz/FloorRooms.vue'

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
  { name: 'orders', label: 'Mappa Locale', icon: 'map', component: FloorEditorTool, props: () => ordersTabProps.value },
  // { name: 'turns',  label: 'Turni',  icon: 'calendar_month', component: TurnsInfo, props: () => ordersTabProps.value }
])
</script>
