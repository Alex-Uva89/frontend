<script setup>
import { onMounted, ref, watch } from 'vue'
import NavbarPages from '@common/NavbarPages.vue'
import { useOrderStore } from 'src/stores/orderStore'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'

import CompanyInfo from '@tool/CompanyInfo.vue'
import OwnerBusiness from '@tool/OwnerBusiness.vue'
import StaffList from '@tool/StaffList.vue'
import OrdersView from '@tool/OrdersView.vue'
import StatisticsSection from '@tool/StatisticsSection.vue'
import OrderTool from '@common/tools/OrderTool.vue'
import ListReference from '@common/WarehouseTool.vue'

const orderStore = useOrderStore()
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

const activeTab = ref('company')

const tabs = [
  { name: 'company',   label: 'Info Azienda', icon: 'business',  component: CompanyInfo },
  { name: 'businesses',label: 'Locali',       icon: 'store',     component: OwnerBusiness },
  { name: 'staff',     label: 'Dipendenti',   icon: 'people',    component: StaffList },
  {
    name: 'orders',
    label: 'crea ordini',
    icon: 'add_shopping_cart',
    component: OrderTool,
    props: () => ({
      // default “di rotta”: se l’utente ha un business associato
      businessId: usersStore.currentUser?.business?._id || businessStore.currentBusinessId || '',
      businessName: usersStore.currentUser?.business?.name || businessStore.getNameById(businessStore.currentBusinessId) || '—',
      orders: orderStore.orders,
      loading: orderStore.loading,
      errorMessage: orderStore.error,
      userRole: usersStore.currentUser?.role
    })
  },
  { name: 'orders_view', label: 'Lista della spesa', icon: 'local_grocery_store', component: OrdersView, props: { orders: orderStore.orders } },
  { name: 'warehouse', label: 'Magazzino', icon: 'warehouse', component: ListReference },
  { name: 'stats', label: 'Statistiche', icon: 'analytics', component: StatisticsSection }
]

async function initSelectionAndData () {
  await businessStore.fetchBusinesses()

  // se non c'è selezione nello store, prova con il business dell'utente, altrimenti primo _id
  if (!businessStore.currentBusinessId) {
    const fallback =
      usersStore.currentUser?.business?._id ||
      businessStore.businesses?.[0]?._id ||
      null
    businessStore.setCurrentBusinessId(fallback)
  }

  // imposta l'id nel orderStore e fai il fetch
  orderStore.currentBusinessId = businessStore.currentBusinessId
  await orderStore.fetchOrders()
}

async function onBusinessChanged (businessId) {
  console.log('[OwnerPage] received business-changed', businessId)
  orderStore.currentBusinessId = businessId
  await orderStore.fetchOrders()
}

onMounted(async () => {
  await initSelectionAndData()
})

watch(
  () => businessStore.currentBusinessId,
  async (id, prev) => {
    if (!id || id === prev) return
    console.log('[OwnerPage] business changed ->', id)
    orderStore.currentBusinessId = id
    await orderStore.fetchOrders()
  },
  { immediate: false }
)
</script>

<template>
  <q-page class="q-mx-lg">
    <NavbarPages
      v-model="activeTab"
      :tabs="tabs"
      @business-changed="onBusinessChanged"
    />
  </q-page>
</template>
