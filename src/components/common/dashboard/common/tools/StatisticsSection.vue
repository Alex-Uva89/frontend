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
          class="q-mb-lg"
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
              <div class="row justify-between items-center q-col-gutter-sm">
                <div class="col-12 col-sm-4 q-mb-xs q-mb-sm-sm">
                  <q-skeleton type="text" class="q-mb-xs" />
                  <q-skeleton type="text" width="80%" />
                </div>
                <div class="col-6 col-sm-3">
                  <q-skeleton type="QInput" />
                </div>
                <div class="col-6 col-sm-3">
                  <q-skeleton type="QInput" />
                </div>
                <div class="col-12 col-sm-2 q-mt-xs q-mt-none-sm">
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
          :virtual-scroll-item-size="260"
          v-slot="{ item: p, index }"
        >
          <q-card
            :key="p._id || index"
            flat
            bordered
            class="q-mb-lg product-card"
          >
            <!-- HEADER PRODOTTO -->
            <q-card-section class="q-pb-sm">
              <div class="row q-col-gutter-sm items-start">

                <div class="col-12 col-sm-7">
                  <div class="text-subtitle1 text-weight-medium">
                    {{ p.name }}
                  </div>
                  <div class="text-caption text-grey-7 ellipsis">
                    ID: {{ p._id }}
                  </div>
                </div>

                <div class="col-12 col-sm-5 text-right">
                  <div class="text-body1 text-teal-8">
                    Totale ingredienti:
                    <span class="text-weight-bold">
                      {{ formatCurrency(calculateProductCost(p)) }}
                    </span>
                  </div>

                  <q-btn
                    class="q-mt-xs q-mt-sm-sm"
                    size="sm"
                    outline
                    color="primary"
                    label="Salva ingredienti"
                    :loading="savingId === p._id"
                    @click="saveIngredients(p)"
                  />
                </div>

              </div>
            </q-card-section>

            <q-separator />

            <!-- LISTA INGREDIENTI -->
            <q-card-section class="q-pt-sm">
              <q-list bordered separator v-if="p.ingredients?.length">
                <q-item
                  v-for="(ing, idx) in p.ingredients"
                  :key="ing._key || ing.reference?._id || idx"
                  class="q-py-sm"
                >
                  <q-item-section>
                    <div class="row q-col-gutter-sm">

                      <!-- Info ingrediente -->
                      <div class="col-12 col-sm-4">
                        <div class="text-body2 text-weight-medium">
                          {{ ing.reference?.name || 'Ingrediente senza nome' }}
                        </div>
                        <div class="text-caption text-grey-7">
                          Prezzo unitario:
                          {{ formatCurrency(ing.reference?.price) }}
                          / {{ ing.reference?.unit?.[0] || 'kg' }}
                        </div>
                      </div>

                      <!-- Quantità -->
                      <div class="col-6 col-sm-3">
                        <q-input
                          v-model.number="ing.quantity"
                          type="number"
                          label="Quantità"
                          dense
                          standout="bg-grey-1"
                          input-class="text-right"
                        />
                      </div>

                      <!-- Unità -->
                      <div class="col-6 col-sm-3">
                        <q-select
                          v-model="ing.unit"
                          :options="unitOptions"
                          label="Unità"
                          dense
                          emit-value
                          map-options
                          standout="bg-grey-1"
                        />
                      </div>

                      <!-- Costo + delete -->
                      <div class="col-12 col-sm-2 text-right">
                        <div class="text-body2 text-weight-bold text-teal-8">
                          {{ formatCurrency(calculateIngredientCost(ing)) }}
                        </div>

                        <q-btn
                          class="q-mt-xs"
                          flat
                          size="sm"
                          icon="delete"
                          color="negative"
                          round
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
              <div class="q-mt-md">
                <div class="text-caption text-grey-7 q-mb-xs">
                  Aggiungi ingrediente
                </div>

                <div class="row q-col-gutter-sm items-center">
                  <div class="col-12 col-sm-5">
                    <q-select
                      v-model="draftFor(p).reference"
                      :options="referenceOptions"
                      option-value="_id"
                      option-label="name"
                      label="Ingrediente"
                      dense
                      clearable
                      :loading="loadingReferences"
                    />
                  </div>

                  <div class="col-6 col-sm-3">
                    <q-input
                      v-model.number="draftFor(p).quantity"
                      type="number"
                      label="Quantità"
                      dense
                    />
                  </div>

                  <div class="col-6 col-sm-2">
                    <q-select
                      v-model="draftFor(p).unit"
                      :options="unitOptions"
                      label="Unità"
                      dense
                      emit-value
                      map-options
                    />
                  </div>

                  <div class="col-12 col-sm-2 text-right">
                    <q-btn
                      color="primary"
                      label="Aggiungi"
                      class="full-width-sm"
                      @click="addIngredientToProduct(p)"
                      :disable="!draftFor(p).reference || !draftFor(p).quantity"
                    />
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-virtual-scroll>

        <div v-if="!filteredProducts.length" class="text-grey-7">
          Nessun prodotto trovato.
        </div>
      </div>

    </q-card>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useProductStore } from 'src/stores/productStore'
import { api } from 'boot/axios'

const productStore = useProductStore()

const search = ref('')
const savingId = ref(null)

// lista ingredients base (referenceItem) da Sanity
const referenceOptions = ref([])
const loadingReferences = ref(false)
const referencesLoaded = ref(false)

// draft per-prodotto: { [productId]: { reference, quantity, unit } }
const draftsByProductId = reactive({})

function draftFor (product) {
  const id = product._id || product.id || product.slug || 'no-id'
  if (!draftsByProductId[id]) {
    draftsByProductId[id] = {
      reference: null,
      quantity: null,
      unit: 'g'
    }
  }
  return draftsByProductId[id]
}

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
   CARICA PRODOTTI + REFERENCES ALL'INIZIO
============================================= */
onMounted(async () => {
  await productStore.fetchProducts()
  await ensureReferencesLoaded()
})

/* ============================================
   CARICA REFERENCES UNA VOLTA SOLA
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

    referenceOptions.value = Array.isArray(data.items) ? data.items : []
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
  const q = (search.value ?? '')
    .toString()
    .trim()
    .toLowerCase()

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
function normalizeUnit (u) {
  if (Array.isArray(u)) return u[0]
  return u || 'kg'
}

/* ============================================
   CALCOLO COSTO INGREDIENTE
============================================= */
function calculateIngredientCost (ing) {
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
function calculateProductCost (product) {
  return (product.ingredients || [])
    .map(i => calculateIngredientCost(i))
    .reduce((a, b) => a + b, 0)
}

/* ============================================
   FORMATTATORE €
============================================= */
function formatCurrency (value) {
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

function addIngredientToProduct (product) {
  const draft = draftFor(product)

  if (!draft.reference || !draft.quantity) return

  if (!product.ingredients) {
    product.ingredients = []
  }

  product.ingredients.push({
    _key: genKey(),
    reference: draft.reference,
    quantity: draft.quantity,
    unit: draft.unit
  })

  // reset SOLO il draft di questo prodotto
  draftsByProductId[product._id] = {
    reference: null,
    quantity: null,
    unit: 'g'
  }
}

async function removeIngredient (product, index) {
  if (!product.ingredients) return
  product.ingredients.splice(index, 1)
  await saveIngredients(product)
}

/* ============================================
   SALVATAGGIO SU SANITY
============================================= */

async function saveIngredients (product) {
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
