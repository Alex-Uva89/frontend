<template>
  <div v-if="orderStore.loading" class="text-center q-pa-lg">
    <q-spinner color="primary" size="3em" />
    <div class="q-mt-sm">Caricamento ordini in corso...</div>
  </div>

  <q-list v-else separator>
    <OrderActions
      @add="aggiungiOrdine"
      @edit="modificaOrdine"
      @delete="eliminaOrdine"
      class="q-pa-md"
    />

    <q-toolbar class="text-h5 q-ma-md">Lista Ordini</q-toolbar>

    <q-item v-if="filteredOrders.length === 0" class="text-center">
      Nessun ordine presente
    </q-item>
    <q-item v-for="order in filteredOrders" :key="order._id" class="q-pa-md">
      <q-card flat bordered class="full-width">
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <div class="col">
              <div class="text-h6">Locale: <strong>{{ order.business?.name || 'N/D' }}</strong></div>
              <div class="text-subtitle2 text-grey">
                Data: {{ order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/D' }}
              </div>
            </div>
            <q-chip
              :color="getStatusColor(order.status)"
              text-color="white"
              class="q-ma-xs"
              label
            >
              {{ order.status || 'unknown' }}
            </q-chip>
          </div>

          <div class="q-mb-md">
            <div class="text-subtitle1 q-mb-xs">Prodotti ordinati:</div>
            <q-list dense bordered>
              <q-item
                v-for="(item, index) in order.items"
                :key="index"
                class="q-pa-sm"
                style="background-color: #f9f9f9; margin-bottom: 4px; border-radius: 4px;"
              >
                <q-item-section align="start">
                  {{ item.addedBy.firstName }} {{ item.addedBy.lastName }}
                </q-item-section>
                <q-item-section>
                  <q-item-label v-if="item.reference">
                    <strong>{{ item.quantity }} x {{ item.reference.name }}</strong>
                    <small v-if="item.name">{{ item.name }}</small>
                  </q-item-label>
                  <q-item-label v-else>
                    <strong>{{ item.quantity }} x Prodotto generico</strong>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center no-wrap">
                    <q-btn dense flat icon="edit" color="primary" class="q-mr-sm"
                      @click="openEditProduct(order, index)" />
                    <q-btn dense flat icon="delete" color="negative"
                      @click="deleteProduct(order, index)" />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <div v-if="order.notes" class="q-mb-md">
            <div class="text-subtitle2">Note:</div>
            <div class="text-body2 q-pl-sm">{{ order.notes }}</div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat dense icon="delete" label="Elimina Ordine" color="negative"
            @click="deleteOrder(order._id)" />
        </q-card-actions>
      </q-card>
    </q-item>

    <!-- Dialog modifica prodotto -->
    <q-dialog v-model="showEditProduct" persistent>
      <q-card style="min-width: 350px;">
        <q-card-section>
          <div class="text-h6 q-mb-md">Modifica Prodotto</div>

          <q-input
            v-model.number="editProductData.quantity"
            type="number"
            label="Quantità"
            min="1"
            dense
            autofocus
          />
          <q-input
            v-model="editProductData.name"
            label="Nome Prodotto"
            dense
            readonly
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annulla" v-close-popup />
          <q-btn label="Salva" color="primary" @click="saveProductEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-list>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useOrderStore } from 'src/stores/orderStore'
import OrderActions from 'src/components/OrderActions.vue'
import { useUsersStore } from 'src/stores/usersStore'

const orderStore = useOrderStore()
const usersStore = useUsersStore()

const currentBusinessId = ref('')
const showEditProduct = ref(false)
const editProductData = reactive({
  orderIndex: null,
  productIndex: null,
  quantity: 1,
  name: ''
})

const filteredOrders = computed(() => {
  return orderStore.orders.map(order => ({
    ...order,
    items: order.items?.map(item => ({
      ...item,
      item: item.item ? {
        ...item.item,
        // Ora referenceItem è già definito nella query
        referenceItem: item.item.referenceItem || null
      } : null
    })) || []
  }))
})

function getStatusColor(status) {
  switch(status) {
    case 'completed': return 'green'
    case 'pending': return 'orange'
    default: return 'grey'
  }
}

function openEditProduct(order, index) {
  const orderIndex = filteredOrders.value.findIndex(o => o._id === order._id)
  if (orderIndex === -1) return

  editProductData.orderIndex = orderIndex
  editProductData.productIndex = index
  editProductData.quantity = order.items[index]?.quantity || 1
  editProductData.name = order.items[index]?.item?.referenceItem?.name || 'Prodotto generico'
  showEditProduct.value = true
}

async function saveProductEdit() {
  try {
    const order = filteredOrders.value[editProductData.orderIndex]
    if (!order) return

    // Aggiorna localmente
    order.items[editProductData.productIndex].quantity = editProductData.quantity

    // Invia update all'API
    const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/${order._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    })

    if (res.ok) {
      await orderStore.fetchOrders()
      showEditProduct.value = false
    } else {
      throw new Error('Errore durante l\'aggiornamento')
    }
  } catch (error) {
    console.error('Errore:', error)
    alert('Si è verificato un errore durante il salvataggio')
  }
}

function aggiungiOrdine() {
  console.log('Aggiungi ordine chiamato')
  // Implementa la logica per aggiungere un ordine
}

function modificaOrdine(orderId) {
  console.log('Modifica ordine', orderId)
  // Implementa la logica per modificare l'ordine
}

function eliminaOrdine(orderId) {
  console.log('Elimina ordine', orderId)
  // Implementa la logica per eliminare l'ordine
}

async function deleteOrder(id) {
  if (!confirm('Sei sicuro di voler eliminare questo ordine?')) return
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      await orderStore.fetchOrders()
    } else {
      throw new Error('Errore durante l\'eliminazione')
    }
  } catch (error) {
    console.error('Errore:', error)
    alert('Si è verificato un errore durante l\'eliminazione')
  }
}

async function deleteProduct(order, productIndex) {
  if (!confirm('Eliminare questo prodotto dall\'ordine?')) return
  try {
    // Clona l'ordine per evitare mutazioni dirette
    const updatedOrder = JSON.parse(JSON.stringify(order))
    updatedOrder.items.splice(productIndex, 1)

    const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/${order._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedOrder)
    })

    if (res.ok) {
      await orderStore.fetchOrders()
    } else {
      throw new Error('Errore durante l\'eliminazione')
    }
  } catch (error) {
    console.error('Errore:', error)
    alert('Si è verificato un errore durante l\'eliminazione')
  }
}

onMounted(async () => {
  currentBusinessId.value = usersStore.currentUser?.business?._id || ''
  if (currentBusinessId.value) {
    orderStore.setBusinessId(currentBusinessId.value)
    await orderStore.fetchOrders()
  }
})
</script>
