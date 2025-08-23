<template>
  <BusinessDashboardLayout
    :tabs="tabs"
    initial-tab="company"
    :fetch-on-tabs="['orders','orders_view']"
  />
</template>

<script setup>
import { computed } from 'vue'
import BusinessDashboardLayout from 'src/components/common/BusinessDashboardLayout.vue'

// -----------------------TOOLS-----------------------------------------
import CompanyInfo from '@tool/CompanyInfo.vue'
import OwnerBusiness from '@tool/OwnerBusiness.vue'
import StaffList from '@tool/StaffList.vue'
import OrdersView from '@tool/OrdersView.vue'
import StatisticsSection from '@tool/StatisticsSection.vue'
import OrderTool from '@common/tools/OrderTool.vue'
import ListReference from '@common/WarehouseTool.vue'

import { useOrderStore } from 'src/stores/orderStore'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'

const orderStore = useOrderStore()
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

const orderToolProps = computed(() => ({
  businessId: usersStore.currentUser?.business?._id || businessStore.currentBusinessId || '',
  businessName: usersStore.currentUser?.business?.name || businessStore.getNameById(businessStore.currentBusinessId) || '—',
  orders: orderStore.orders,
  loading: orderStore.loading,
  errorMessage: orderStore.error,
  userRole: usersStore.currentUser?.role
}))

const tabs = [
  { name: 'company',     label: 'Info Azienda',     icon: 'business',              component: CompanyInfo },
  { name: 'businesses',  label: 'Locali',           icon: 'store',                 component: OwnerBusiness },
  { name: 'staff',       label: 'Dipendenti',       icon: 'people',                component: StaffList },
  { name: 'orders',      label: 'crea ordini',      icon: 'add_shopping_cart',     component: OrderTool,    props: () => orderToolProps.value },
  { name: 'orders_view', label: 'Lista della spesa',icon: 'local_grocery_store',   component: OrdersView,   props: { orders: orderStore.orders } },
  { name: 'warehouse',   label: 'Magazzino',        icon: 'warehouse',             component: ListReference },
  { name: 'stats',       label: 'Statistiche',      icon: 'analytics',             component: StatisticsSection }
]
</script>
