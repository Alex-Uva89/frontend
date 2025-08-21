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
import { ref, computed, onMounted } from 'vue'

import NavbarPages from '@common/NavbarPages.vue'
import TurnsInfo from '@common/tools/TurnsInfo.vue'

import { useOrderStore } from 'stores/orderStore'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'

const activeTab = ref('orders')

const orderStore = useOrderStore()
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

// true quando ho un business pronto
const businessReady = computed(() => !!businessStore.currentBusiness && !!businessStore.currentBusiness._id)

// props reattivi per OrderTool (evita warning props undefined)
const ordersTabProps = computed(() => ({
  businessId: businessStore.currentBusiness?._id || '',
  businessName: businessStore.currentBusiness?.name || '',
  orders: orderStore.orders,
  loading: orderStore.loading,
  errorMessage: orderStore.error
}))

// un solo tab per ora
const tabs = computed(() => [
  {
    name: 'turns',
    label: 'Turni',
    icon: 'calendar_month',
    component: TurnsInfo,
    props: ordersTabProps.value,
  }
])


onMounted(async () => {
  // Inizializza business per lo staff dall’utente corrente
  const user = usersStore.currentUser
  if (user?.business) {
    businessStore.currentBusiness = user.business
    orderStore.currentBusinessId = user.business._id
    await orderStore.fetchOrders()
  }
})
</script>
