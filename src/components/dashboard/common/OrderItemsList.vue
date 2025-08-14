<template>
  <div>
    <!-- Aggiungi v-model al WeekTabs -->
    <WeekTabs v-model="selectedDate" />

    <!-- MESSAGGIO SE NON CI SONO ORDINI -->
    <div v-if="filteredItems.length === 0" class="text-center q-pa-xl">
      <q-icon name="sentiment_dissatisfied" size="xl" color="grey" class="q-mb-md"/>
      <div class="text-h5 text-grey-8 q-mb-xs">Nessun ordine trovato</div>
      <div class="text-grey-6">Non ci sono ordini per la data selezionata</div>
    </div>

    <!-- LISTA ORDINI FILTRATI -->
    <template v-else>
      <template v-for="(order) in filteredItems" :key="order._id">
        <div class="q-mb-xl" v-if="order.items && order.items.length > 0">
          <q-card flat bordered class="q-mb-md">
            <!-- LISTA FORNITORI -->
            <template v-for="(categories, supplierName) in groupBySupplierAndCategory(order.items)" :key="supplierName">
              <q-card-section>
                <q-toolbar class="bg-teal-1">
                  <q-toolbar-title>
                    <q-icon name="local_shipping" color="blue" class="q-mr-sm"/>
                    {{ supplierName }}
                  </q-toolbar-title>
                </q-toolbar>

                <!-- LISTA CATEGORIE -->
                <template v-for="(products, categoryName) in categories" :key="categoryName">
                  <div class="q-ml-sm q-mt-md">
                    <div class="text-subtitle1 text-weight-medium q-mb-sm">
                      <q-icon name="category" color="green" class="q-mr-sm"/>
                      {{ categoryName }}
                    </div>

                    <!-- QUI USIAMO OrderItemsRow PER OGNI PRODOTTO -->
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

            <div class="row justify-between">
              <q-btn
                color="teal-5"
                icon="add"
                label="Aggiungi referenza"
                class="q-ma-md"
                @click="openAddReferenceDialog(order._id)"
                />

                <q-btn
                flat
                color="red"
                icon="delete"
                label="Elimina Ordine"
                class="q-ma-md"
                @click="openDeleteOrder(order._id)"
              />
            </div>
          </q-card>
        </div>
      </template>
    </template>

    <div class="bg-grey-2 q-pa-sm">
      <div class="text-h6 text-weight-bold flex items-center justify-between">
        <span class="text-grey-7 q-mr-sm">
          Chiusura Ordine del giorno
          <strong>{{ new Date().toISOString().split('T')[0] }}</strong>
        </span>
        <CountdownTimer />
      </div>
    </div>

    <q-dialog v-model="addReferenceDialog.visible">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Aggiungi referenza</div>
        </q-card-section>

        <q-card-section>
          <q-select
            v-model="addReferenceDialog.selectedReference"
            :options="referenceOptions"
            option-label="name"
            option-value="_id"
            label="Seleziona referenza"
            emit-value
            map-options
          />
          <q-input
            v-model.number="addReferenceDialog.quantity"
            type="number"
            min="1"
            label="Quantità"
            class="q-mt-md"
          />
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

    <q-dialog v-model="deleteOrderDialog.visible">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Conferma eliminazione ordine</div>
          <div class="q-mt-sm">
            Per confermare, copia e incolla il codice di sicurezza:
            <q-chip outline color="red" class="q-mt-xs text-bold">
              {{ deleteOrderDialog.securityCode }}
            </q-chip>
          </div>
          <q-input
            v-model="deleteOrderDialog.enteredCode"
            label="Inserisci codice di sicurezza"
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annulla" v-close-popup @click="resetDeleteDialog" />
          <q-btn
            color="red"
            label="Elimina"
            :disable="deleteOrderDialog.enteredCode !== deleteOrderDialog.securityCode"
            @click="confirmDeleteOrder"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>




  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import WeekTabs from 'src/components/WeekTabs.vue'
import OrderItemsRow from 'src/components/dashboard/common/OrderItemRow.vue'
import CountdownTimer from 'src/components/CountdownTimer.vue'
import { useOrderStore } from 'stores/orderStore'
import { useReferenceStore } from 'src/stores/referenceStore'
import { useUsersStore } from 'src/stores/usersStore'

const orderStore = useOrderStore()
const referenceStore = useReferenceStore()
const usersStore = useUsersStore()

const selectedDate = ref(new Date().toISOString().split('T')[0])

const addReferenceDialog = ref({
  visible: false,
  orderId: null,
  selectedReference: null,
  quantity: 1,
  notes: ''
})
const referenceOptions = ref([])

function openAddReferenceDialog(orderId) {
  const order = orderStore.orders.find(o => o._id === orderId)

  // Filtra le referenze già presenti nell'ordine
  const usedReferenceIds = order.items.map(item => item.reference?._id)

  referenceOptions.value = referenceStore.references.filter(
    ref => !usedReferenceIds.includes(ref._id)
  )

  addReferenceDialog.value.orderId = orderId
  addReferenceDialog.value.visible = true
  addReferenceDialog.value.selectedReference = null
  addReferenceDialog.value.quantity = 1
  addReferenceDialog.value.notes = ''
}


const filteredItems = computed(() => {
  return orderStore.orders.filter(order => {
    try {
      if (!order.orderDate) return false

      const dateObj = new Date(order.orderDate)
      if (isNaN(dateObj.getTime())) return false

      const orderDate = dateObj.toISOString().split('T')[0]
      return orderDate === selectedDate.value
    } catch (e) {
      console.log(e)
      console.error('Invalid date format:', order.orderDate)
      return false
    }
  })
})

function groupBySupplierAndCategory(products) {
  const grouped = {}
  products.forEach(product => {
    const supplierName = product.reference?.suppliers?.[0]?.name || 'Senza fornitore'
    const categoryName = product.reference?.category?.name || 'Senza categoria'

    if (!grouped[supplierName]) {
      grouped[supplierName] = {}
    }
    if (!grouped[supplierName][categoryName]) {
      grouped[supplierName][categoryName] = []
    }
    grouped[supplierName][categoryName].push(product)
  })
  return grouped
}

async function reloadOrders() {
  await orderStore.fetchOrders()
}

async function confirmAddReference() {
  if (!addReferenceDialog.value.selectedReference) return

  await referenceStore.addReferenceToOrder(
  addReferenceDialog.value.orderId,
  {
    referenceId: addReferenceDialog.value.selectedReference,
    quantity: addReferenceDialog.value.quantity,
    addedById: usersStore.currentUser._id
  }
)

  addReferenceDialog.value.visible = false
  await orderStore.fetchOrders()
}

const deleteOrderDialog = ref({
  visible: false,
  orderId: null
})

function generateSecurityCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function openDeleteOrder(orderId) {
  deleteOrderDialog.value.orderId = orderId
  deleteOrderDialog.value.securityCode = generateSecurityCode()
  deleteOrderDialog.value.enteredCode = ''
  deleteOrderDialog.value.visible = true
}

function resetDeleteDialog() {
  deleteOrderDialog.value.orderId = null
  deleteOrderDialog.value.securityCode = ''
  deleteOrderDialog.value.enteredCode = ''
  deleteOrderDialog.value.visible = false
}

async function confirmDeleteOrder() {
  if (deleteOrderDialog.value.enteredCode !== deleteOrderDialog.value.securityCode) return
  await orderStore.deleteOrder(deleteOrderDialog.value.orderId)
  resetDeleteDialog()
  await orderStore.fetchOrders()
}

onMounted(async () => {
  await referenceStore.fetchReferences()
})

</script>

<style scoped>
.q-card {
  border-radius: 8px;
}
</style>
