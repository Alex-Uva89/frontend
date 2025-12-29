<template>
  <div class="q-pa-md">

    <!-- Ricerca -->
    <q-input
      v-model="search"
      label="Cerca prodotto"
      filled
      debounce="300"
      class="q-mb-md"
      clearable
      :disable="loadingPage"
    />

    <q-card class="q-pa-md shadow-2">

      <div class="text-h5 text-teal-8 q-mb-sm">
        Costi Prodotti
      </div>

      <q-separator class="q-my-md" />

      <!-- SKELETON -->
      <div v-if="loadingPage">
        <div
          v-for="n in 3"
          :key="n"
          class="q-mb-xl"
        >
          <div class="row items-center justify-between q-mb-sm">
            <div>
              <q-skeleton type="text" width="200px" class="q-mb-xs" />
              <q-skeleton type="text" width="120px" />
            </div>
            <q-skeleton type="text" width="180px" />
          </div>

          <q-separator class="q-my-md" />

          <q-card flat bordered class="q-pa-sm">
            <div
              v-for="i in 2"
              :key="i"
              class="q-mb-md"
            >
              <div class="row justify-between items-center q-col-gutter-md">
                <div class="col-4">
                  <q-skeleton type="text" class="q-mb-xs" />
                  <q-skeleton type="text" width="80%" />
                </div>
                <div class="col-3">
                  <q-skeleton type="QInput" />
                </div>
                <div class="col-3">
                  <q-skeleton type="QInput" />
                </div>
                <div class="col-2">
                  <q-skeleton type="text" />
                </div>
              </div>
            </div>
          </q-card>
        </div>
      </div>

      <!-- CONTENUTO REALE -->
      <div v-else>

        <!-- VIRTUAL SCROLL SUI PRODOTTI -->
        <q-virtual-scroll
          :items="filteredProducts"
          :virtual-scroll-item-size="220"
          v-slot="{ item: p, index }"
        >
          <div
            :key="p._id || index"
            class="q-mb-xl"
          >

            <!-- Header prodotto -->
            <div class="row items-center justify-between q-mb-sm">
              <div>
                <div class="text-h6">{{ p.name }}</div>
                <div class="text-caption text-grey-7">ID: {{ p._id }}</div>
              </div>

              <div class="column items-end">
                <div class="text-h6 text-teal-8">
                  Totale costo ingredienti:
                  {{ formatCurrency(calculateProductCost(p)) }}
                </div>

                <q-btn
                  size="sm"
                  flat
                  color="primary"
                  label="Salva ingredienti"
                  :loading="savingId === p._id"
                  @click="saveIngredients(p)"
                />
              </div>
            </div>

            <q-separator class="q-my-md" />

            <!-- Lista ingredienti esistenti -->
            <q-list bordered separator v-if="p.ingredients?.length">

              <q-item
                v-for="(ing, idx) in p.ingredients"
                :key="ing._key || ing.reference?._id || idx"
              >
                <q-item-section>

                  <div class="row justify-between items-center q-col-gutter-md">

                    <!-- Info ingrediente -->
                    <div class="col-4">
                      <div class="text-body1">
                        {{ ing.reference?.name || 'Ingrediente senza nome' }}
                      </div>

                      <div class="text-caption text-grey-7">
                        Prezzo unitario:
                        {{ formatCurrency(ing.reference?.price) }}
                        / {{ ing.reference?.unit?.[0] || 'kg' }}
                      </div>
                    </div>

                    <!-- Quantità -->
                    <div class="col-3">
                      <q-input
                        v-model.number="ing.quantity"
                        type="number"
                        label="Quantità"
                        dense
                      />
                    </div>

                    <!-- Unità -->
                    <div class="col-3">
                      <q-select
                        v-model="ing.unit"
                        :options="unitOptions"
                        label="Unità"
                        dense
                        emit-value
                        map-options
                      />
                    </div>

                    <!-- Costo calcolato + rimozione -->
                    <div class="col-2 text-right">
                      <div class="text-body1 text-weight-bold text-teal-8">
                        {{ formatCurrency(calculateIngredientCost(ing)) }}
                      </div>

                      <q-btn
                        flat
                        round
                        size="sm"
                        icon="delete"
                        color="negative"
                        @click="removeIngredient(p, idx)"
                      />
                    </div>

                  </div>

                </q-item-section>
              </q-item>

            </q-list>

            <!-- Nessun ingrediente -->
            <div v-else class="text-negative q-mb-md">
              Nessun ingrediente associato
            </div>

            <!-- Aggiungi nuovo ingrediente -->
            <div class="row items-center q-mt-md q-col-gutter-md">
              <div class="col-5">
                <q-select
                  v-model="newIngredient.reference"
                  :options="referenceOptions"
                  option-value="_id"
                  option-label="name"
                  label="Aggiungi ingrediente"
                  dense
                  clearable
                  :loading="loadingReferences"
                  @popup-show="ensureReferencesLoaded"
                />
              </div>

              <div class="col-3">
                <q-input
                  v-model.number="newIngredient.quantity"
                  type="number"
                  label="Quantità"
                  dense
                />
              </div>

              <div class="col-2">
                <q-select
                  v-model="newIngredient.unit"
                  :options="unitOptions"
                  label="Unità"
                  dense
                  emit-value
                  map-options
                />
              </div>

              <div class="col-2">
                <q-btn
                  color="primary"
                  label="Aggiungi"
                  @click="addIngredientToProduct(p)"
                  :disable="!newIngredient.reference || !newIngredient.quantity"
                />
              </div>
            </div>

            <q-separator class="q-my-lg" />
          </div>
        </q-virtual-scroll>

        <div v-if="!filteredProducts.length" class="text-grey-7">
          Nessun prodotto trovato.
        </div>
      </div>

    </q-card>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from 'src/stores/productStore'
import { api } from 'boot/axios'

const productStore = useProductStore()

const search = ref('')
const savingId = ref(null)

// lista ingredients base (referenceItem) da Sanity
const referenceOptions = ref([])
const loadingReferences = ref(false)
const referencesLoaded = ref(false) // per evitare richieste duplicate

// bozza nuovo ingrediente (condivisa, ma ok per uso interno tool)
const newIngredient = ref({
  reference: null,
  quantity: null,
  unit: 'g'
})

const unitOptions = [
  { label: 'kg', value: 'kg' },
  { label: 'g', value: 'g' },
  { label: 'mg', value: 'mg' },
  { label: 'l', value: 'l' },
  { label: 'ml', value: 'ml' },
  { label: 'pz', value: 'pz' }
]

// loading combinato
const loadingPage = computed(() => productStore.loading || loadingReferences.value)

/* ============================================
   CARICA SOLO I PRODOTTI ALL'INIZIO
============================================= */
onMounted(async () => {
  await productStore.fetchProducts()
})

/* ============================================
   LAZY LOAD DELLE REFERENCES
============================================= */
async function ensureReferencesLoaded () {
  if (referencesLoaded.value || loadingReferences.value) return

  loadingReferences.value = true
  try {
    const { data } = await api.get('/references', {
      params: {
        status: 'active',
        sort: 'alpha_asc',
        page: 1,
        pageSize: 500
      }
    })

    referenceOptions.value = data.items || []
    referencesLoaded.value = true
  } catch (e) {
    console.error('Errore caricamento references:', e)
    referenceOptions.value = []
  } finally {
    loadingReferences.value = false
  }
}

/* ============================================
   FILTRO DI RICERCA
============================================= */
const filteredProducts = computed(() => {
  // normalizzo sempre a stringa, tolgo spazi e porto in lowercase
  const q = (search.value ?? '')
    .toString()
    .trim()
    .toLowerCase()

  // se vuota → ritorno tutti i prodotti
  if (!q) {
    return productStore.products
  }

  return productStore.products.filter(p =>
    (p.name || '').toLowerCase().includes(q)
  )
})


/* ============================================
   NORMALIZZAZIONE UNITÀ
============================================= */
function normalizeUnit(u) {
  if (Array.isArray(u)) return u[0]
  return u || 'kg'
}

/* ============================================
   CALCOLO COSTO INGREDIENTE
============================================= */
function calculateIngredientCost(ing) {
  if (!ing.reference?.price) return 0

  const pricePerKg = ing.reference.price
  const qty = ing.quantity || 0
  const unit = normalizeUnit(ing.unit)

  if (unit === 'kg') return pricePerKg * qty
  if (unit === 'g') return pricePerKg * (qty / 1000)
  if (unit === 'mg') return pricePerKg * (qty / 1_000_000)
  if (unit === 'l') return pricePerKg * qty
  if (unit === 'ml') return pricePerKg * (qty / 1000)
  if (unit === 'pz') return pricePerKg * qty

  return pricePerKg * qty
}

/* ============================================
   COSTO TOTALE PRODOTTO
============================================= */
function calculateProductCost(product) {
  return (product.ingredients || [])
    .map(i => calculateIngredientCost(i))
    .reduce((a, b) => a + b, 0)
}

/* ============================================
   FORMATTATORE €
============================================= */
function formatCurrency(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value || 0)
}

/* ============================================
   GESTIONE LISTA INGREDIENTI (FE)
============================================= */

function genKey () {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

function addIngredientToProduct(product) {
  if (!newIngredient.value.reference || !newIngredient.value.quantity) return

  if (!product.ingredients) {
    product.ingredients = []
  }

  product.ingredients.push({
    _key: genKey(),
    reference: newIngredient.value.reference,
    quantity: newIngredient.value.quantity,
    unit: newIngredient.value.unit
  })

  newIngredient.value = {
    reference: null,
    quantity: null,
    unit: 'g'
  }
}

async function removeIngredient(product, index) {
  if (!product.ingredients) return
  product.ingredients.splice(index, 1)
  await saveIngredients(product)
}

/* ============================================
   SALVATAGGIO SU SANITY
============================================= */

async function saveIngredients(product) {
  savingId.value = product._id
  try {
    const payloadIngredients = (product.ingredients || []).map(ing => ({
      _key: ing._key,
      referenceId: ing.reference?._id || ing.referenceId,
      quantity: ing.quantity,
      unit: ing.unit
    }))

    await productStore.updateProduct(product._id, {
      ingredients: payloadIngredients
    })
  } catch (e) {
    console.error('Errore salvataggio ingredienti:', e)
  } finally {
    savingId.value = null
  }
}
</script>
