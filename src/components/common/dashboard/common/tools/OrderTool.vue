<template>
  <div>

    <!-- HEADER: select locale + pulsante ordine -->
    <div class="row q-col-gutter-sm q-mb-md header-row">

      <!-- Select locale (solo Owner) -->
      <div
        v-if="isOwner && businessStore.businesses?.length"
        class="col-12 col-sm-6"
      >
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

      <!-- Bottone nuova lista / urgente -->
      <div
        class="col-12"
        :class="isOwner && businessStore.businesses?.length ? 'col-sm-6' : 'col-sm-12'"
      >
        <span class="full-width-on-mobile">
          <q-tooltip
            v-if="tooltipMessage"
            anchor="bottom middle"
            self="top middle"
            class="bg-orange text-white"
          >
            {{ tooltipMessage }}
          </q-tooltip>

          <q-btn
            class="order-main-btn"
            :unelevated="showUrgentButton"
            :outline="!showUrgentButton"
            :color="showUrgentButton ? 'negative' : 'primary'"
            :icon="showUrgentButton ? 'priority_high' : 'add'"
            :label="showUrgentButton ? 'Crea ordine urgente!' : 'Nuova lista ordine'"
            :disable="disableButton"
            @click="openNewOrderDialog"
          />
        </span>
      </div>
    </div>

    <!-- Titolo -->
    <div class="q-my-md">
      <div class="title-text text-bold q-my-sm">
        Lista ordini - {{ currentBusinessName }}
      </div>
      <div class="text-caption text-grey-7" v-if="isOwner">
        Stai gestendo il locale: {{ currentBusinessName }}
      </div>
    </div>

    <!-- Contenuto con loading overlay -->
    <div class="relative-position">
      <q-inner-loading :showing="loading || !ready" />

      <template v-if="ready && !loading">
        <OrderItemsList />
      </template>
    </div>

    <!-- Dialog nuovo ordine -->
    <NewOrderDialog
      v-model="showDialog"
      :business-id="currentBusinessId"
      @order-created="emit('order-created', $event)"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import OrderItemsList from '@tool/OrderItemsListCreate.vue'
import NewOrderDialog from 'src/components/common/dashboard/orders/NewOrderDialog.vue'
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
    try {
      return new Date(d).toISOString().startsWith(todayStr.value)
    } catch {
      return false
    }
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
  if (showUrgentButton.value) {
    return 'Hai già chiuso un ordine oggi. Puoi crearne uno urgente finché non sono le 20:00'
  }
  if (ordersToday.value.length > 0) return 'Esiste già un ordine per oggi'
  return ''
})

function openNewOrderDialog () {
  showDialog.value = true
}

onMounted(async () => {
  if (!businessStore.businesses?.length) {
    await businessStore.fetchBusinesses()
  }

  // Non Owner → segue SEMPRE il business dell'utente
  if (!isOwner.value) {
    const id = userBusinessId.value || props.businessId || businessStore.currentBusinessId
    if (id && id !== businessStore.currentBusinessId) {
      businessStore.setCurrentBusinessId(id)
      emit('business-changed', id)
    }
    return
  }

  // Owner
  let id =
    selectedBusinessId.value ||
    businessStore.currentBusinessId ||
    props.businessId ||
    userBusinessId.value ||
    businessStore.businesses?.[0]?._id ||
    null

  if (id && id !== businessStore.currentBusinessId) {
    businessStore.setCurrentBusinessId(id)
    emit('business-changed', id)
  }
})
</script>

<style scoped>
/* header: select + bottone affiancati su desktop, impilati su mobile */
.header-row {
  align-items: stretch;
}

/* Bottone principale: sempre ben cliccabile, full width su mobile */
.order-main-btn {
  width: 100%;
}

/* Titolo responsivo */
.title-text {
  line-height: 1.2;
}

@media (max-width: 599.98px) {
  .title-text {
    font-size: 1.4rem;
    text-align: center;
  }
}

@media (min-width: 600px) {
  .title-text {
    font-size: 1.8rem;
  }
}

/* wrapper per bottone che da mobile occupa tutta la riga */
.full-width-on-mobile {
  display: block;
}

/* q-inner-loading overlay sul blocco lista ordini */
.relative-position {
  position: relative;
  min-height: 80px;
}
</style>
