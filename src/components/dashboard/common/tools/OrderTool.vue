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

    <q-inner-loading :showing="loading || !ready" />

    <template v-if="ready && !loading">
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

/* ===== Ruolo e business corrente ===== */
const isOwner = computed(() =>
  (usersStore.currentUser?.role || '').toLowerCase() === 'owner'
)

const userBusinessId = computed(() => usersStore.currentUser?.business?._id || null)

/* Opzioni select {label, value} */
const businessOptions = computed(() =>
  (businessStore.businesses || []).map(b => ({
    label: b.name,
    value: b._id
  }))
)

/* ID selezionato nella select (se Owner) */
const selectedBusinessId = ref(
  businessStore.currentBusinessId || props.businessId || userBusinessId.value
)

/* ID effettivo usato dal tool */
const currentBusinessId = computed(() =>
  isOwner.value ? selectedBusinessId.value : (userBusinessId.value || props.businessId)
)

/* Nome corrente per il titolo */
const currentBusinessName = computed(() => {
  const id = currentBusinessId.value
  if (!id) return props.businessName
  return businessStore.getNameById(id) || props.businessName
})

/* Pronto a renderizzare i figli solo quando ho un business deciso */
const ready = computed(() => !!currentBusinessId.value)

/* Reazioni:
   - se il parent cambia businessId e NON sei Owner, segui il parent
   - quando usersStore carica l’utente, forza lo store al suo business (non Owner)
   - mantieni allineato businessStore.currentBusinessId
*/
watch(
  () => props.businessId,
  (val) => {
    if (!isOwner.value && val) {
      // non Owner segue il parent
      businessStore.setCurrentBusinessId(val)
    }
  },
  { immediate: true }
)

watch(
  () => userBusinessId.value,
  (uid) => {
    if (!isOwner.value && uid) {
      // forza lo store al business dell’utente
      businessStore.setCurrentBusinessId(uid)
    }
  },
  { immediate: true }
)

watch(
  () => currentBusinessId.value,
  (id) => {
    if (id && businessStore.currentBusinessId !== id) {
      businessStore.setCurrentBusinessId(id)
      emit('business-changed', id)
    }
  },
  { immediate: true }
)

function onSelectBusiness (val) {
  selectedBusinessId.value = val
  businessStore.setCurrentBusinessId(val)
  emit('business-changed', val)
}

/** ===== Logica "ordini di oggi" (solo per tooltip/bottoni) ===== */
const todayStr = computed(() => new Date().toISOString().slice(0, 10))

const ordersToday = computed(() =>
  (props.orders || []).filter(o => {
    const ob = o?.businessId || o?.business?._id || null
    if (ob && currentBusinessId.value && ob !== currentBusinessId.value) return false
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
  // Inizializzazione coerente:
  if (isOwner.value) {
    // Owner → se non selezionato, prova store → primo → prop → user
    if (!selectedBusinessId.value) {
      selectedBusinessId.value =
        businessStore.currentBusinessId ||
        businessStore.businesses?.[0]?._id ||
        props.businessId ||
        userBusinessId.value ||
        null
    }
    if (selectedBusinessId.value) {
      businessStore.setCurrentBusinessId(selectedBusinessId.value)
      emit('business-changed', selectedBusinessId.value)
    }
  } else {
    // Non Owner → imposta sempre al business dell’utente (fallback: prop)
    const id = userBusinessId.value || props.businessId || null
    if (id) {
      businessStore.setCurrentBusinessId(id)
      emit('business-changed', id)
    }
  }
})
</script>
