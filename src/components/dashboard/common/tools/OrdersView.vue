<template>
  <div class="q-mt-lg">
    <WeekTabs v-model="selectedDate" />

    <!-----------------------------------------------------------------------------------------
                                        TOTALE GENERALE
    ----------------------------------------------------------------------------------------->
    <div class="text-h6 text-weight-bold q-pa-md bg-grey-2">
      Totale Ordine: {{ calculateGlobalTotal(filteredItems).toFixed(2) }} €
    </div>

    <!-----------------------------------------------------------------------------------------
                                  MESSAGGIO SE NON CI SONO ORDINI
     ----------------------------------------------------------------------------------------->
    <div v-if="filteredItems.length === 0" class="text-center q-pa-xl">
      <q-icon name="sentiment_dissatisfied" size="xl" color="grey" class="q-mb-md"/>
      <div class="text-h5 text-grey-8 q-mb-xs">Nessun ordine trovato</div>
      <div class="text-grey-6">Non ci sono ordini per la data selezionata</div>
    </div>

    <!-----------------------------------------------------------------------------------------
                                      LISTA ORDINI FILTRATI
    ----------------------------------------------------------------------------------------->
    <template v-else>
      <!-- ordini per locale -->
      <template v-for="(orders, businessName) in groupByBusiness(filteredItems)" :key="businessName">
        <q-expansion-item
          group="orders"
          header-class="text-h6 bg-teal text-white"
          expand-icon-class="text-white"
          class="q-mb-md"
        >
          <!-----------------------
             HEADER PERSONALIZZATO
          ------------------------>
          <template #header>
            <q-item-section>
              <q-item-label>{{ businessName }}</q-item-label>
              <q-item-label caption class="text-yellow-2">
                {{ `${orders.length} ordine/i - Subtotale: ${calculateBusinessTotal(orders).toFixed(2)} €` }}
              </q-item-label>
            </q-item-section>
          </template>

          <template v-for="(order) in orders" :key="order._id">
            <q-card flat bordered class="q-mb-md" v-if="order.items && order.items.length > 0">
              <!--------------------
                INTESTAZIONE ORDINE
              ---------------------->
              <q-card-section class="row justify-between items-center">
                <div class="text-caption text-grey-7">
                  {{ formatOrderDate(order.orderDate) }}
                </div>
                <div class="text-caption text-grey-7" v-if="order.addedBy">
                  Inserito da: {{ order.addedBy.name || 'Utente sconosciuto' }}
                </div>
              </q-card-section>

              <!--------------------------
                    LISTA FORNITORI
              --------------------------->
              <template v-for="(categories, supplierName) in groupBySupplierAndCategory(order.items)" :key="supplierName">
                <q-expansion-item
                  :group="`suppliers-${order._id}`"
                  expand-separator
                  dense
                  header-class="bg-teal-1"
                >
                  <template #header>
                    <q-item-section avatar>
                      <q-icon name="local_shipping" color="blue" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-subtitle1">{{ supplierName }}</q-item-label>
                      <q-item-label caption>
                        {{ supplierItemsCount(categories) }} prodotto/i ·
                        Subtotale: {{ calculateSupplierTotal(categories).toFixed(2) }} €
                      </q-item-label>
                    </q-item-section>
                  </template>

                  <!--------------------------
                     CATEGORIE DEL FORNITORE
                  ---------------------------->
                  <q-card-section>
                    <template v-for="(products, categoryName) in categories" :key="categoryName">
                      <div class="q-ml-sm q-mt-md">
                        <div class="text-subtitle1 text-weight-medium q-mb-sm">
                          <q-icon name="category" color="green" class="q-mr-sm"/>
                          {{ categoryName }}
                        </div>

                        <!---------------------------
                          PRODOTTI DELLA CATEGORIA
                        ---------------------------->
                        <div v-for="product in products" :key="product._key" class="q-pa-sm row items-center">
                          <div class="col-6">
                            {{ product.reference?.name || 'Referenza sconosciuta' }}
                            <span class="text-grey-7">
                             - aggiunto da {{ product.addedBy.firstName }} {{ product.addedBy.lastName }}
                            </span>
                            <div v-if="product.notes" class="text-caption text-grey-7">
                              {{ product.notes }}
                            </div>
                          </div>
                          <div class="col-3 text-right">
                            {{ product.quantity }}{{ product.unit || 'pz' }}
                          </div>
                          <div class="col-3 text-right text-weight-bold">
                            {{ (product.quantity * (product.reference?.price || 0)).toFixed(2) }} €
                          </div>
                        </div>
                      </div>
                    </template>
                  </q-card-section>
                  <q-separator size="5px" color="teal-4"/>
                </q-expansion-item>
              </template>

              <!---------------------------
                      TOTALE ORDINE
              ---------------------------->
              <q-card-section class="bg-grey-2 text-right">
                <div class="text-subtitle1 text-weight-bold">
                  Subtotale: {{ calculateOrderTotal(order.items).toFixed(2) }} €
                </div>
              </q-card-section>
            </q-card>
          </template>
        </q-expansion-item>
      </template>
    </template>

    <div class="flex justify-end" v-if="filteredItems.length > 0">
      <q-btn push class="bg-teal-1" @click="printOrder(filteredItems)">
        <q-icon name="print" class="q-mr-sm"></q-icon>
        <small>
          Stampa Ordine
        </small>
      </q-btn>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import WeekTabs from 'src/components/WeekTabs.vue'
import { useOrderStore } from 'stores/orderStore'

const orderStore = useOrderStore()
const selectedDate = ref(new Date().toISOString().split('T')[0])

onMounted(async () => {
  await orderStore.fetchAllOrder()
})

const filteredItems = computed(() => {
  return orderStore.orders.filter(order => {
    try {
      if (!order.orderDate) return false

      const dateObj = new Date(order.orderDate)
      if (isNaN(dateObj.getTime())) return false

      const orderDate = dateObj.toISOString().split('T')[0]
      return orderDate === selectedDate.value
    } catch (e) {
      console.error('Invalid date format:', order.orderDate, e)
      return false
    }
  })
})

function supplierItemsCount(categories) {
  return Object.values(categories).reduce((acc, arr) => acc + arr.length, 0)
}

function groupByBusiness(orders) {
  const grouped = {}
  orders.forEach(order => {
    const businessName = order.business?.name || 'Locale sconosciuto'
    if (!grouped[businessName]) {
      grouped[businessName] = []
    }
    grouped[businessName].push(order)
  })
  return grouped
}

function groupBySupplierAndCategory(products) {
  const grouped = {}
  products.forEach(product => {
    // console.log(product)
    const supplierName = product.reference?.supplier?.name || 'Senza fornitore'
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

function formatOrderDate(dateString) {
  if (!dateString) return ''
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('it-IT', options)
}

////////////////////////////////////////////////////////////////////////////////////////
//                                      TOTALI                                        //
////////////////////////////////////////////////////////////////////////////////////////

// totale di un singolo prodotto
function calculateProductTotal(product) {
  return (product.quantity * (product.reference?.price || 0))
}

// totale di un ordine
function calculateOrderTotal(items) {
  return items.reduce((total, product) => total + calculateProductTotal(product), 0)
}

// totale di un fornitore
function calculateSupplierTotal(categories) {
  let total = 0
  for (const category in categories) {
    total += categories[category].reduce((sum, product) => sum + calculateProductTotal(product), 0)
  }
  return total
}

// totale per un locale (business)
function calculateBusinessTotal(orders) {
  return orders.reduce((total, order) => total + calculateOrderTotal(order.items), 0)
}

// totale globale
function calculateGlobalTotal(orders) {
  return orders.reduce((total, order) => total + calculateOrderTotal(order.items), 0)
}

function printOrder(order){
  console.log(order.value)
}
</script>

<style scoped>
.q-expansion-item {
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.q-expansion-item__container {
  border: 1px solid rgba(0,0,0,0.12);
  border-top: none;
}

.q-card {
  border-radius: 0;
  box-shadow: none;
  border: none;
}
</style>
