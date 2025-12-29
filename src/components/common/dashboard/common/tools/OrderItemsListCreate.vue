<template>
  <div>

    <!-- Selettore giorno -->
    <WeekTabs v-model="selectedDate" />

    <!-- Nessun ordine -->
    <div v-if="filteredItems.length === 0" class="text-center q-pa-xl">
      <q-icon name="sentiment_dissatisfied" size="xl" color="grey" class="q-mb-md"/>
      <div class="text-h5 text-grey-8 q-mb-xs">Nessun ordine trovato</div>
      <div class="text-grey-6">Non ci sono ordini per la data selezionata</div>
    </div>

    <!-- Lista ordini -->
    <template v-else>
      <template v-for="order in filteredItems" :key="order._id">
        <div class="q-mb-xl" v-if="order.items && order.items.length > 0">
          <!-- Chips stato -->
          <div class="q-mb-sm q-gutter-sm">
            <q-chip v-if="order.status === 'completed'" color="positive" text-color="white" icon="check">Completato</q-chip>
            <q-chip v-else-if="order.status === 'pending' && !order.locked" color="yellow-7" text-color="black" icon="lock_open">Ordine modificabile</q-chip>
            <q-chip v-else-if="order.status === 'pending' && order.locked" color="grey-7" text-color="white" icon="lock">Bloccato</q-chip>
            <q-chip v-else-if="order.status === 'cancelled'" color="negative" text-color="white" icon="block">Annullato</q-chip>
            <q-chip v-if="order.kind === 'lastminute'" color="orange" text-color="black" icon="warning">Last minute</q-chip>
          </div>

          <q-card flat bordered class="q-mb-md">
            <!-- Fornitore → Categoria -->
            <template v-for="(categories, supplierName) in groupBySupplierAndCategory(order.items)" :key="supplierName">
              <q-card-section>
                <q-toolbar class="bg-teal-1">
                  <q-toolbar-title>
                    <q-icon name="local_shipping" color="blue" class="q-mr-sm"/>
                    {{ supplierName }}
                  </q-toolbar-title>
                </q-toolbar>

                <template v-for="(products, categoryName) in categories" :key="categoryName">
                  <div class="q-ml-sm q-mt-md">
                    <div class="text-subtitle1 text-weight-medium q-mb-sm">
                      <q-icon name="category" color="green" class="q-mr-sm"/>
                      {{ categoryName }}
                    </div>

                    <template v-for="product in products" :key="product._key">
                      <OrderItemsRow
                        :order-id="order._id"
                        :product="product"
                        @product-edited="reloadOrders"
                        class="q-mb-sm"
                      />
                    </template>
                  </div>
                </template>
              </q-card-section>
              <q-separator size="5px" color="teal-4"/>
            </template>

            <!-- Azioni -->
            <div class="q-pa-md">
              <div class="row items-center q-col-gutter-sm">
                <div class="col-12 col-sm-auto">
                  <q-chip outline icon="event" color="grey-7" class="full-width">
                    {{ formatDay(order.orderDate) }}
                  </q-chip>
                </div>

                <div class="col-12">
                  <div class="row q-col-gutter-sm items-stretch justify-between">
                    <div class="col-4">
                      <q-btn
                        :disable="isReadOnly(order)"
                        color="teal-5"
                        icon="add"
                        label="Aggiungi referenza"
                        class="full-width"
                        @click="openAddReferenceDialog(order._id)"
                      />
                    </div>

                    <div class="col-4">
                      <q-btn
                        flat color="red" icon="delete" label="Elimina Ordine"
                        class="full-width"
                        :disable="isReadOnly(order)"
                        @click="openDeleteOrder(order._id)"
                      />
                    </div>

                    <!-- altre azioni qui -->
                  </div>
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </template>
    </template>

    <!-- Countdown -->
    <div class="q-pa-sm">
      <div class="text-h6 text-weight-bold flex items-center justify-between">
        <span class="text-grey-7 q-mr-sm">
          Chiusura Ordine del giorno
          <strong>{{ today }}</strong>
        </span>
        <CountdownTimer />
      </div>
    </div>

    <!-- Dialog: Aggiungi referenza -->
    <q-dialog v-model="addReferenceDialog.visible">
      <q-card style="width: 90vw;">
        <q-card-section>
          palla
          <div class="text-h6">Aggiungi referenza</div>
        </q-card-section>

        <q-card-section>
          <div class="row items-end q-col-gutter-sm">
            <div class="col">
              <q-select
                v-model="addReferenceDialog.selectedReference"
                :options="referenceOptions"
                option-label="name"
                option-value="_id"
                label="Seleziona referenza"
                emit-value
                map-options
              />
            </div>
            <div class="col-auto">
              <q-btn unelevated square color="teal-5" icon="add_box" @click.stop="openNewReferenceDialog">
                <q-tooltip>Crea nuova referenza</q-tooltip>
              </q-btn>
            </div>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col">
              <q-input
                v-model.number="addReferenceDialog.quantity"
                type="number"
                min="1"
                label="Quantità"
                class="q-mt-md"
              />
            </div>
            <div class="col">
              <q-select
                v-model="addReferenceDialog.unit"
                :options="unitOptions"
                use-input
                fill-input
                hide-selected
                input-debounce="0"
                label="Unità (es. kg, g, L, confezione...)"
                class="q-mt-md"
                new-value-mode="add-unique"
              />
              <div v-if="suggestedUnit" class="text-caption text-grey-7 q-mt-xs">
                Unità suggerita: <span class="text-weight-medium">{{ suggestedUnit }}</span>
              </div>
            </div>
          </div>

          <q-input
            v-model="addReferenceDialog.notes"
            type="textarea"
            label="Note"
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annulla" v-close-popup />
          <q-btn color="primary" label="Aggiungi" @click="confirmAddReference" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog sicurezza -->
    <SecurityCodeConfirmDialog
      v-model="lockMailDialog.visible"
      title="Conferma chiusura ordine e invio email"
      :message="lockMailDialogMessage"
      confirm-label="Conferma chiusura e invio"
      color="red"
      :length="6"
      @confirmed="confirmLockAndSend"
    />

    <SecurityCodeConfirmDialog
      v-model="deleteOrderDialog.visible"
      title="Conferma eliminazione ordine"
      message="Questa azione è irreversibile. L'ordine verrà eliminato definitivamente."
      confirm-label="Elimina"
      color="red"
      :length="6"
      @confirmed="confirmDeleteOrder"
    />

    <!-- Dialog: nuova referenza -->
    <NewReferenceDialog
      v-model="newRefDialog.visible"
      :business-id="selectedBusinessId"
      :init-warehouse="true"
      @created="handleNewRefCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import WeekTabs from 'src/components/common/WeekTabs.vue'
import OrderItemsRow from 'src/components/common/dashboard/common/OrderItemRow.vue'
import CountdownTimer from 'src/components/common/CountdownTimer.vue'
import NewReferenceDialog from 'src/components/common/dashboard/references/NewReferenceDialog.vue'
import SecurityCodeConfirmDialog from 'src/components/common/SecurityCodeConfirmDialog.vue'

import { useOrderStore } from 'stores/orderStore'
import { useReferenceStore } from 'src/stores/referenceStore'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'

const orderStore = useOrderStore()
const referenceStore = useReferenceStore()
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

/* ✅ Business dell'utente e selezione */
const userBusinessId = computed(() => usersStore.currentUser?.business?._id || null)
const selectedBusinessId = computed(() => businessStore.currentBusinessId || userBusinessId.value)

/* Data selezionata */
const selectedDate = ref(new Date().toISOString().split('T')[0])
const today = computed(() => new Date().toISOString().split('T')[0])

/* read-only se non è pending o è locked */
const isReadOnly = (o) => !!(o?.locked || o?.status !== 'pending')

/* Nuova referenza (dialog) */
const newRefDialog = ref({ visible: false })
function openNewReferenceDialog () { newRefDialog.value.visible = true }

async function handleNewRefCreated (createdRef) {
  const order = orderStore.orders.find(o => o._id === addReferenceDialog.value.orderId)
  const usedIds = (order?.items || [])
    .map(i => (i.reference?._id || i.item?._id))
    .filter(Boolean)

  // lista aggiornata (createReference ha già aggiornato lo store)
  referenceOptions.value = (referenceStore.references || []).filter(r => !usedIds.includes(r._id))

  if (createdRef && createdRef._id && !usedIds.includes(createdRef._id)) {
    addReferenceDialog.value.selectedReference = createdRef._id
  } else {
    addReferenceDialog.value.selectedReference = null
  }
}


/* Aggiungi referenza all'ordine */
const addReferenceDialog = ref({
  visible: false,
  orderId: null,
  selectedReference: null,
  quantity: 1,
  unit: null,
  notes: ''
})
const referenceOptions = ref([])

const suggestedUnit = ref(null)
watch(
  () => addReferenceDialog.value.selectedReference,
  (refId) => {
    const refItem = referenceStore.references.find(r => r._id === refId)
    suggestedUnit.value = Array.isArray(refItem?.unit) ? refItem.unit[0] : (refItem?.unit || null)
    addReferenceDialog.value.unit = suggestedUnit.value
  }
)

const unitOptions = ['kg','g','hg','L','ml','confezione','cassa','cartone','busta','vaschetta']

function openAddReferenceDialog(orderId) {
  const order = orderStore.orders.find(o => o._id === orderId)
  const usedIds = (order?.items || [])
    .map(item => (item.reference?._id || item.item?._id))
    .filter(Boolean)

  referenceOptions.value = (referenceStore.references || []).filter(ref => !usedIds.includes(ref._id))

  addReferenceDialog.value.orderId = orderId
  addReferenceDialog.value.visible = true
  addReferenceDialog.value.selectedReference = null
  addReferenceDialog.value.quantity = 1
  addReferenceDialog.value.unit = null
  addReferenceDialog.value.notes = ''
}

async function confirmAddReference() {
  if (!addReferenceDialog.value.selectedReference) return
  await orderStore.addReferenceToOrder(
    addReferenceDialog.value.orderId,
    {
      referenceId: addReferenceDialog.value.selectedReference,
      quantity: addReferenceDialog.value.quantity,
      unit: addReferenceDialog.value.unit,
      addedById: usersStore.currentUser._id,
      notes: addReferenceDialog.value.notes || ''
    }
  )
  addReferenceDialog.value.visible = false
  await orderStore.fetchOrders()
}

/* Filtro ordini */
const filteredItems = computed(() => {
  const selected = selectedDate.value
  const uBizId = userBusinessId.value
  const selBizId = selectedBusinessId.value

  return (orderStore.orders || []).filter(order => {
    try {
      const orderBizId = order?.businessId || order?.business?._id || null

      if (order?.kind === 'lastminute') {
        // ✅ SEMPRE locale dell'utente
        if (uBizId && orderBizId && orderBizId !== uBizId) return false
      } else {
        // standard: locale selezionato (se assente, fallback utente)
        if (selBizId && orderBizId && orderBizId !== selBizId) return false
      }

      if (!order?.orderDate) return false
      const d = new Date(order.orderDate)
      if (isNaN(d.getTime())) return false
      const orderDate = d.toISOString().split('T')[0]
      return orderDate === selected
    } catch {
      return false
    }
  })
})

function groupBySupplierAndCategory(products) {
  const grouped = {}
  ;(products || []).forEach(product => {
    const ref = product?.reference || product?.item || null
    const supplierName = ref?.supplier?.name || 'Senza fornitore'
    const categoryName = ref?.category?.name || 'Senza categoria'
    if (!grouped[supplierName]) grouped[supplierName] = {}
    if (!grouped[supplierName][categoryName]) grouped[supplierName][categoryName] = []
    grouped[supplierName][categoryName].push(product)
  })
  return grouped
}

function formatDay(dt) {
  try {
    const d = new Date(dt)
    return d.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

async function reloadOrders() { await orderStore.fetchOrders() }

/* Patch ottimistico */
function patchLocalOrder (orderId, patch) {
  const i = orderStore.orders.findIndex(o => o._id === orderId)
  if (i !== -1) {
    orderStore.orders[i] = { ...orderStore.orders[i], ...patch }
  }
}

/* Lock + Email */
const lockMailDialog = ref({ visible: false, orderId: null })
const lockMailDialogMessage =
  'Attenzione: questa azione chiude definitivamente l’ordine e invia l’email di riepilogo. <br>' +
  '<strong>Non sarà più possibile riaprire l’ordine</strong> e sarà possibile creare un nuovo ordine solo <strong>dopo le ore 20:00</strong>.<br>' +
  'Per confermare, copia il codice di sicurezza qui sotto.';

async function confirmLockAndSend() {
  const orderId = lockMailDialog.value.orderId
  lockMailDialog.value.visible = false

  const current = orderStore.orders.find(o => o._id === orderId)
  const prev = current
    ? {
        locked: current.locked,
        lockedAt: current.lockedAt,
        status: current.status,
        emailSent: current.emailSent,
        emailSentAt: current.emailSentAt
      }
    : {}

  const now = new Date().toISOString()
  patchLocalOrder(orderId, { locked: true, lockedAt: now, status: 'completed', emailSent: true, emailSentAt: now })

  const okApi = await orderStore.lockOrder(orderId, { sendEmail: true, finalize: true })
  if (!okApi) {
    patchLocalOrder(orderId, prev)
  }

  await orderStore.fetchOrders()
}

/* Elimina ordine */
const deleteOrderDialog = ref({ visible: false, orderId: null })
function openDeleteOrder(orderId) {
  deleteOrderDialog.value.orderId = orderId
  deleteOrderDialog.value.visible = true
}
async function confirmDeleteOrder() {
  const orderId = deleteOrderDialog.value.orderId
  deleteOrderDialog.value.visible = false
  await orderStore.deleteOrder(orderId)
  await orderStore.fetchOrders()
}

onMounted(async () => {
  await referenceStore.fetchReferences()
})


</script>

<style scoped>
.q-card { border-radius: 8px; }
</style>
