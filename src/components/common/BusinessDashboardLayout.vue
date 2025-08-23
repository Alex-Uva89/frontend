<template>
  <q-page class="q-mx-lg">
    <!-- Skeleton fino a quando non abbiamo un business selezionato -->
    <div v-if="!businessReady" class="q-pa-md">
      <q-skeleton type="text" width="220px" class="q-mb-sm"/>
      <q-skeleton type="rect" height="220px"/>
    </div>

    <!-- Tabs -->
    <NavbarPages
      v-else
      v-model="activeTab"
      :tabs="tabs"
      @business-changed="onBusinessChanged"
      v-bind="$attrs"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import NavbarPages from '@common/NavbarPages.vue'

import { useOrderStore } from 'stores/orderStore'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'

defineOptions({ inheritAttrs: false })

/**
 * Props:
 * - tabs: le TUE tab (array) come già le passi a NavbarPages
 * - initialTab: nome della tab iniziale (es. "orders" o "company")
 * - fetchOnTabs: quali tab attivano fetchOrders (default: ['orders','orders_view'])
 * - preferUserBusiness: se true, priorità al business dell'utente nel bootstrap
 */
const props = defineProps({
  tabs: { type: Array, required: true },
  initialTab: { type: String, default: null },
  fetchOnTabs: { type: Array, default: () => ['orders', 'orders_view'] },
  preferUserBusiness: { type: Boolean, default: true }
})

const orderStore = useOrderStore()
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

/* Stato tab attiva: inizializza con initialTab o prima tab disponibile */
const activeTab = ref(props.initialTab || props.tabs?.[0]?.name || '')

/* Se cambiano le tabs o initialTab, riallinea la tab attiva in modo sicuro */
watch(
  () => [props.tabs, props.initialTab],
  () => {
    const names = (props.tabs || []).map(t => t.name)
    const target = props.initialTab && names.includes(props.initialTab)
      ? props.initialTab
      : (names[0] || '')
    if (!names.includes(activeTab.value)) activeTab.value = target
  },
  { immediate: true }
)

/* Ready quando ho un id selezionato */
const businessReady = computed(() => !!businessStore.currentBusinessId)

/* Helper: devo fare fetch in base alla tab attiva? */
const shouldFetch = computed(() =>
  businessReady.value && props.fetchOnTabs.includes(activeTab.value)
)

/* Bootstrap: businesses + selezione business + primo fetch condizionale */
onMounted(async () => {
  if (!businessStore.businesses?.length) {
    await businessStore.fetchBusinesses()
  }

  if (!businessStore.currentBusinessId) {
    const userBizId = props.preferUserBusiness
      ? (usersStore.currentUser?.business?._id || null)
      : null
    const fallback = userBizId || businessStore.businesses?.[0]?._id || null
    businessStore.setCurrentBusinessId(fallback)
  }

  orderStore.setBusinessId?.(businessStore.currentBusinessId) // usa il setter (vedi patch store)
  if (shouldFetch.value) {
    await orderStore.fetchOrders()
  }
})

/* Quando cambia il business selezionato → sync + fetch condizionale */
watch(
  () => businessStore.currentBusinessId,
  async (id, prev) => {
    if (!id || id === prev) return
    orderStore.setBusinessId?.(id)
    if (shouldFetch.value) {
      await orderStore.fetchOrders()
    }
  }
)

/* Quando cambia la tab attiva → fetch condizionale */
watch(
  () => activeTab.value,
  async () => {
    if (shouldFetch.value) {
      await orderStore.fetchOrders()
    }
  }
)

/* Evento emesso dai tool (via NavbarPages) per cambiare business */
async function onBusinessChanged (businessId) {
  if (!businessId || businessId === businessStore.currentBusinessId) return
  businessStore.setCurrentBusinessId(businessId)
  orderStore.setBusinessId?.(businessId)
  if (shouldFetch.value) {
    await orderStore.fetchOrders()
  }
}
</script>
