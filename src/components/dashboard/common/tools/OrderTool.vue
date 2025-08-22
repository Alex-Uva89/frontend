<template>
  <div>
    <!-- Select locale (solo Owner) -->
    <div v-if="isOwner && businessStore.businesses?.length" class="q-mb-md">
      <q-select
        v-model="selectedBusinessId"
        :options="businessOptions"
        label="Seleziona locale"
        outlined
        dense
        emit-value
        map-options
        @update:model-value="onSelectBusiness"
      />
    </div>

    <!-- Pulsante nuova lista / urgente -->
    <span>
      <q-tooltip
        v-if="tooltipMessage"
        anchor="bottom middle"
        self="top middle"
        class="bg-orange text-white"
      >
        {{ tooltipMessage }}
      </q-tooltip>

      <q-btn
        :unelevated="showUrgentButton"
        :outline="!showUrgentButton"
        :color="showUrgentButton ? 'negative' : 'primary'"
        :icon="showUrgentButton ? 'priority_high' : 'add'"
        :label="showUrgentButton ? 'Crea ordine urgente!' : 'Nuova lista ordine'"
        :disable="disableButton"
        @click="openNewOrderDialog"
      />
    </span>

    <!-- Titolo -->
    <div class="q-my-lg">
      <div class="text-h4 text-bold q-my-lg">
        Lista ordini - {{ currentBusinessName }}
      </div>
    </div>

    <q-inner-loading :showing="loading" />

    <template v-if="!loading">
      <OrderItemsList />
    </template>

    <!-- Dialog nuovo ordine -->
    <NewOrderDialog
      v-model="showDialog"
      :business-id="currentBusinessId"
      @order-created="emit('order-created', $event)"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import OrderItemsList from '@tool/OrderItemsListCreate.vue'
import NewOrderDialog from 'src/components/dashboard/orders/NewOrderDialog.vue'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'

const usersStore = useUsersStore()
const businessStore = useBusinessStore()

const props = defineProps({
  businessId: { type: String, required: true },
  businessName: { type: String, required: true },
  orders: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' }
})

const emit = defineEmits(['order-created', 'business-changed'])

const showDialog = ref(false)

/** ===== Ruolo e business corrente ===== */
const isOwner = computed(() =>
  (usersStore.currentUser?.role || '').toLowerCase() === 'owner'
)

// opzioni { label, value }
const businessOptions = computed(() =>
  (businessStore.businesses || []).map(b => ({
    label: b.name,
    value: b._id
  }))
)

// id selezionato nella select (se Owner)
const selectedBusinessId = ref(
  businessStore.currentBusinessId || props.businessId
)

// se il parent cambia businessId (es. cambio rotta), per i non Owner seguiamo il parent
watch(
  () => props.businessId,
  (val) => {
    if (!isOwner.value) selectedBusinessId.value = val
  },
  { immediate: true }
)

watch(() => businessStore.currentBusinessId, (id) => {
  emit('business-changed', id)
})

// id effettivo usato dal tool
const currentBusinessId = computed(() =>
  isOwner.value ? selectedBusinessId.value : props.businessId
)

// nome corrente per il titolo
const currentBusinessName = computed(() => {
  if (!isOwner.value) return props.businessName
  const byStore = businessStore.getNameById(currentBusinessId.value)
  return byStore || props.businessName
})

function onSelectBusiness (val) {
  selectedBusinessId.value = val
  businessStore.setCurrentBusinessId(val)
  console.log('[OrderTool] emit business-changed', val)
  emit('business-changed', val)
}

/** ===== Logica "ordini di oggi" ===== */
const todayStr = computed(() => new Date().toISOString().slice(0, 10))

const ordersToday = computed(() =>
  (props.orders || []).filter(o => {
    // se i record hanno businessId, filtra per quello corrente
    if (o?.businessId && o.businessId !== currentBusinessId.value) return false
    const d = o?.orderDate || o?._createdAt
    if (!d) return false
    try { return new Date(d).toISOString().startsWith(todayStr.value) } catch { return false }
  })
)

const hasPendingToday = computed(() =>
  ordersToday.value.some(o => o?.status === 'pending' && !o?.locked)
)
const hasClosedToday = computed(() =>
  ordersToday.value.some(o => o?.locked || o?.status === 'completed')
)
const isBeforeTwenty = computed(() => new Date().getHours() < 20)
const showUrgentButton = computed(() =>
  hasClosedToday.value && isBeforeTwenty.value && !hasPendingToday.value
)
const disableButton = computed(() => hasPendingToday.value)
const tooltipMessage = computed(() => {
  if (hasPendingToday.value) return 'Esiste già un ordine aperto per oggi'
  if (showUrgentButton.value) return 'Hai già chiuso un ordine oggi. Puoi crearne uno urgente finché non sono le 20:00'
  if (ordersToday.value.length > 0) return 'Esiste già un ordine per oggi'
  return ''
})

function openNewOrderDialog () {
  showDialog.value = true
}

onMounted(async () => {
  // carica i business se arrivo direttamente qui
  if (!businessStore.businesses?.length) {
    await businessStore.fetchBusinesses()
  }
  // se Owner e non ho un id selezionato, prendo quello dallo store (o il primo)
  if (isOwner.value && !selectedBusinessId.value) {
    selectedBusinessId.value =
      businessStore.currentBusinessId || businessStore.businesses?.[0]?._id || props.businessId
  }
})
</script>
