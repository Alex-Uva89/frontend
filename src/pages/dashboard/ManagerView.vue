<template>
  <q-page class="q-mx-lg">
    <!-- Placeholder finché non abbiamo il business -->
    <div v-if="!businessReady" class="q-pa-md">
      <q-skeleton type="text" width="220px" class="q-mb-sm"/>
      <q-skeleton type="rect" height="220px"/>
    </div>

    <!-- Tabs -->
    <NavbarPages
      v-else
      v-model="activeTab"
      :tabs="tabs"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

import NavbarPages from '@common/NavbarPages.vue'
import OrderTool from '@tool/OrderTool.vue'
import TurnsInfo from '@common/tools/TurnsInfo.vue'

import { useOrderStore } from 'stores/orderStore'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'

const activeTab = ref('orders')

const orderStore = useOrderStore()
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

// pronto quando ho un id selezionato
const businessReady = computed(() => !!businessStore.currentBusinessId)

// props reattive per OrderTool / TurnsInfo
const ordersTabProps = computed(() => {
  const cb = businessStore.currentBusiness
  return {
    businessId: cb?._id || '',
    businessName: cb?.name || '',
    orders: orderStore.orders,
    loading: orderStore.loading,
    errorMessage: orderStore.error,
    // opzionale: se vuoi che OrderTool decida se mostrare la select in base al ruolo
    userRole: usersStore.currentUser?.role
  }
})

// tabs reattive (props come funzione!)
const tabs = computed(() => [
  {
    name: 'orders',
    label: 'Ordini',
    icon: 'list_alt',
    component: OrderTool,
    props: () => ordersTabProps.value
  },
  {
    name: 'turns',
    label: 'Turni',
    icon: 'calendar_month',
    component: TurnsInfo,
    props: () => ordersTabProps.value
  }
])

// 🔁 quando cambia il business selezionato, rifaccio il fetch
watch(
  () => businessStore.currentBusinessId,
  async (id, prev) => {
    if (!id || id === prev) return
    orderStore.currentBusinessId = id
    await orderStore.fetchOrders()
  }
)

onMounted(async () => {
  // Assicurati di avere i business (se non già caricati)
  if (!businessStore.businesses?.length) {
    await businessStore.fetchBusinesses()
  }

  // Manager: se l'utente ha un business associato, usalo
  const userBizId = usersStore.currentUser?.business?._id || null
  if (userBizId) {
    businessStore.setCurrentBusinessId(userBizId)
  } else if (!businessStore.currentBusinessId && businessStore.businesses?.length) {
    // fallback al primo disponibile (se serve)
    businessStore.setCurrentBusinessId(businessStore.businesses[0]._id)
  }

  // Primo fetch ordini per il business corrente
  if (businessStore.currentBusinessId) {
    orderStore.currentBusinessId = businessStore.currentBusinessId
    await orderStore.fetchOrders()
  }
})
</script>
