<template>
  <div class="q-pa-md">

    <!-- Ricerca -->
    <div class="row q-col-gutter-sm items-center q-mb-md">
      <div class="col-12 col-sm-8">
        <q-input
          v-model="search"
          label="Cerca prodotto"
          filled
          debounce="350"
          clearable
          :disable="productStore.loading || loadingMore"
        >
          <template #append><q-icon name="search" /></template>
        </q-input>
      </div>

      <div class="col-12 col-sm-4 text-right">
        <q-btn
          outline
          color="primary"
          icon="refresh"
          label="Ricarica"
          :loading="productStore.loading || loadingMore"
          @click="refresh"
        />
      </div>
    </div>

    <q-card class="q-pa-md shadow-2">
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-h5 text-teal-8">Costi Prodotti</div>
        <q-badge outline color="primary">{{ totalLabel }}</q-badge>
      </div>

      <q-separator class="q-my-md" />

      <!-- LISTA (leggera) -->
      <q-virtual-scroll
        :items="productStore.products"
        :virtual-scroll-item-size="130"
        v-slot="{ item: p }"
        @virtual-scroll="onVirtualScroll"
      >
        <q-card flat bordered class="q-mb-sm">
          <q-card-section class="q-py-sm">
            <div class="row items-center q-col-gutter-sm">
              <div class="col-12 col-sm-7">
                <div class="text-subtitle1 text-weight-medium">{{ p.name }}</div>

                <div class="text-caption text-grey-7">
                  Ingredienti: {{ p.ingredientsCount ?? 0 }} · IVA: {{ vatLabel(p.vatRate) }}
                </div>

                <div class="text-body2">
                  <span class="text-grey-7">Costo netto:</span>
                  <span class="text-weight-bold q-ml-xs">
                    {{ formatCurrency(p.ingredientsCost) }}
                  </span>
                </div>

                <div class="text-body2 text-teal-8">
                  <span class="text-grey-7">Costo IVA incl.:</span>
                  <span class="text-weight-bold q-ml-xs">
                    {{ formatCurrency(p.ingredientsCostVat ?? (p.ingredientsCost * vatMultiplier(p.vatRate))) }}
                  </span>
                </div>
              </div>

              <div class="col-12 col-sm-5 text-right">
                <q-btn
                  color="primary"
                  outline
                  label="Apri ingredienti"
                  size="sm"
                  @click="openIngredients(p._id)"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-virtual-scroll>

      <div class="row items-center justify-center q-pa-sm">
        <q-spinner v-if="loadingMore" />
        <div v-else-if="!hasMore && productStore.products.length" class="text-caption text-grey-7">
          Fine risultati
        </div>
        <div v-else-if="!productStore.products.length && !productStore.loading" class="text-grey-7">
          Nessun prodotto trovato.
        </div>
      </div>
    </q-card>

    <!-- DIALOG INGREDIENTI -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 95vw; max-width: 1100px">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">
            Ingredienti — {{ currentProduct?.name || '...' }}
          </div>
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="dialogLoading" class="q-pa-md">
          <q-spinner />
        </q-card-section>

        <q-card-section v-else class="q-pa-md">

          <!-- IVA prodotto -->
          <div class="row items-center q-col-gutter-sm q-mb-md">
            <div class="col-12 col-sm-5">
              <q-select
                v-model="currentProduct.vatRate"
                :options="vatOptionsProduct"
                label="IVA prodotto"
                dense
                emit-value
                map-options
                standout="bg-grey-1"
              />
            </div>

            <div class="col-12 col-sm-7 text-right">
              <div class="text-body2">
                <span class="text-grey-7">Totale netto:</span>
                <span class="text-weight-bold q-ml-xs">
                  {{ formatCurrency(dialogTotals.net) }}
                </span>
              </div>
              <div class="text-body1 text-teal-8">
                <span class="text-grey-7">Totale IVA incl.:</span>
                <span class="text-weight-bold q-ml-xs">
                  {{ formatCurrency(dialogTotals.gross) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Lista ingredienti -->
          <q-list bordered separator v-if="currentProduct?.ingredients?.length">
            <q-item
              v-for="(ing, idx) in currentProduct.ingredients"
              :key="ing._key || ing.reference?._id || idx"
              class="q-py-sm"
            >
              <q-item-section>
                <div class="row q-col-gutter-sm items-center">

                  <div class="col-12 col-sm-4">
                    <div class="text-body2 text-weight-medium">
                      {{ ing.reference?.name || 'Ingrediente senza nome' }}
                    </div>
                    <div class="text-caption text-grey-7">
                      Prezzo unitario: {{ formatCurrency(ing.reference?.price) }}
                      / {{ normalizeUnit(ing.reference?.unit) }}
                    </div>
                    <div class="text-caption text-grey-7">
                      IVA applicata: <b>{{ vatLabel(effectiveIngredientVat(ing)) }}</b>
                      <span v-if="ing.vatRate" class="text-grey-6"> (override)</span>
                    </div>
                  </div>

                  <div class="col-6 col-sm-2">
                    <q-input
                      v-model.number="ing.quantity"
                      type="number"
                      label="Quantità"
                      dense
                      standout="bg-grey-1"
                      input-class="text-right"
                      :min="0"
                    />
                  </div>

                  <div class="col-6 col-sm-2">
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

                  <!-- ✅ IVA ingrediente override -->
                  <div class="col-12 col-sm-2">
                    <q-select
                      v-model="ing.vatRate"
                      :options="vatOptionsIngredient"
                      label="IVA ingrediente"
                      dense
                      emit-value
                      map-options
                      standout="bg-grey-1"
                    />
                  </div>

                  <div class="col-12 col-sm-2 text-right">
                    <div class="text-body2">
                      <span class="text-grey-7">Netto:</span>
                      <span class="text-weight-bold q-ml-xs">
                        {{ formatCurrency(calculateIngredientNet(ing)) }}
                      </span>
                    </div>
                    <div class="text-body2 text-teal-8">
                      <span class="text-grey-7">IVA incl.:</span>
                      <span class="text-weight-bold q-ml-xs">
                        {{ formatCurrency(calculateIngredientGross(ing)) }}
                      </span>
                    </div>

                    <q-btn
                      class="q-mt-xs"
                      flat
                      size="sm"
                      icon="delete"
                      color="negative"
                      round
                      @click="removeIngredient(idx)"
                    />
                  </div>

                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-else class="text-grey-7 q-mb-md">
            Nessun ingrediente associato
          </div>

          <!-- Aggiungi ingrediente -->
          <div class="q-mt-md">
            <div class="text-caption text-grey-7 q-mb-xs">Aggiungi ingrediente</div>

            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-5">
                <q-select
                  v-model="draft.reference"
                  :options="referenceOptions"
                  option-value="_id"
                  option-label="name"
                  label="Ingrediente"
                  dense
                  clearable
                  :loading="loadingReferences"
                />
              </div>

              <div class="col-6 col-sm-2">
                <q-input
                  v-model.number="draft.quantity"
                  type="number"
                  label="Quantità"
                  dense
                  :min="0"
                />
              </div>

              <div class="col-6 col-sm-2">
                <q-select
                  v-model="draft.unit"
                  :options="unitOptions"
                  label="Unità"
                  dense
                  emit-value
                  map-options
                />
              </div>

              <div class="col-12 col-sm-2">
                <q-select
                  v-model="draft.vatRate"
                  :options="vatOptionsIngredient"
                  label="IVA ingrediente"
                  dense
                  emit-value
                  map-options
                />
              </div>

              <div class="col-12 col-sm-1 text-right">
                <q-btn
                  color="primary"
                  icon="add"
                  round
                  :disable="!draft.reference || !draft.quantity"
                  @click="addIngredient()"
                />
              </div>
            </div>
          </div>

        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Chiudi" v-close-popup :disable="saving" />
          <q-btn
            color="primary"
            label="Salva"
            :loading="saving"
            :disable="saving || !currentProduct?._id"
            @click="saveIngredients()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { useProductStore } from 'src/stores/productStore'

const $q = useQuasar()
const productStore = useProductStore()

const search = ref('')
const loadingMore = ref(false)
const hasMore = ref(true)

const totalLabel = computed(() => {
  const t = Number(productStore.criteria.total)
  if (Number.isFinite(t) && t > 0) return `${t} totali`
  return `${productStore.products.length} caricati`
})

/* ============================
   VAT helpers
============================ */
function vatMultiplier (vatRate) {
  const v = String(vatRate || '22').trim()
  if (!v || v === 'exempt') return 1
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return 1
  return 1 + (n / 100)
}

function vatLabel (vatRate) {
  const v = String(vatRate || '22').trim()
  if (!v) return '—'
  if (v === 'exempt') return 'Esente'
  return `${v}%`
}

const vatOptionsProduct = [
  { label: 'Esente', value: 'exempt' },
  { label: '4%', value: '4' },
  { label: '5%', value: '5' },
  { label: '10%', value: '10' },
  { label: '22%', value: '22' }
]

// ingrediente: permette “vuoto = usa prodotto”
const vatOptionsIngredient = [
  { label: '— usa IVA prodotto', value: '' },
  { label: 'Esente', value: 'exempt' },
  { label: '4%', value: '4' },
  { label: '5%', value: '5' },
  { label: '10%', value: '10' },
  { label: '22%', value: '22' }
]

/* ============================
   REFERENCES (ingredienti base)
============================ */
const referenceOptions = ref([])
const loadingReferences = ref(false)
const referencesLoaded = ref(false)

async function ensureReferencesLoaded () {
  if (referencesLoaded.value || loadingReferences.value) return
  loadingReferences.value = true
  try {
    const { data } = await api.get('/references', {
      params: { status: 'active', sort: 'alpha_asc', page: 1, pageSize: 500 }
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

/* ============================
   PAGINAZIONE PRODOTTI (server)
============================ */
async function fetchPage ({ reset = false } = {}) {
  if (productStore.loading || loadingMore.value) return

  if (reset) {
    hasMore.value = true
    productStore.resetProducts()
    productStore.criteria.page = 1
  }

  if (!hasMore.value) return

  loadingMore.value = true
  try {
    const { items, total } = await productStore.fetchProducts({
      q: search.value.trim(),
      page: productStore.criteria.page,
      pageSize: productStore.criteria.pageSize
    })

    const loaded = productStore.products.length
    const t = Number(total)

    if (Number.isFinite(t) && t > 0) hasMore.value = loaded < t
    else hasMore.value = (items?.length || 0) === productStore.criteria.pageSize

    if (hasMore.value) productStore.criteria.page += 1
  } finally {
    loadingMore.value = false
  }
}

function onVirtualScroll ({ to }) {
  const threshold = 20
  const loaded = productStore.products.length
  if (hasMore.value && !loadingMore.value && to >= loaded - threshold) {
    fetchPage({ reset: false })
  }
}

function refresh () {
  fetchPage({ reset: true })
}

watch(search, () => {
  fetchPage({ reset: true })
})

onMounted(async () => {
  await ensureReferencesLoaded()
  await fetchPage({ reset: true })
})

/* ============================
   DIALOG INGREDIENTI
============================ */
const showDialog = ref(false)
const dialogLoading = ref(false)
const saving = ref(false)
const currentProduct = ref(null)

const unitOptions = [
  { label: 'kg', value: 'kg' },
  { label: 'g', value: 'g' },
  { label: 'mg', value: 'mg' },
  { label: 'l', value: 'l' },
  { label: 'ml', value: 'ml' },
  { label: 'pz', value: 'pz' }
]

const draft = ref({ reference: null, quantity: null, unit: 'g', vatRate: '' })

async function openIngredients (id) {
  showDialog.value = true
  dialogLoading.value = true
  try {
    const full = await productStore.fetchProduct(id)
    const copy = JSON.parse(JSON.stringify(full))

    // default iva prodotto se mancante
    if (!copy.vatRate) copy.vatRate = '22'

    // normalizza ingredienti: vatRate vuoto se undefined
    if (Array.isArray(copy.ingredients)) {
      copy.ingredients = copy.ingredients.map(i => ({
        ...i,
        vatRate: i?.vatRate ? String(i.vatRate) : ''
      }))
    }

    currentProduct.value = copy
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Impossibile caricare ingredienti' })
    showDialog.value = false
  } finally {
    dialogLoading.value = false
  }
}

function genKey () {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

function addIngredient () {
  const p = currentProduct.value
  if (!p) return
  if (!draft.value.reference || !draft.value.quantity) return

  if (!p.ingredients) p.ingredients = []
  p.ingredients.push({
    _key: genKey(),
    reference: draft.value.reference,
    quantity: draft.value.quantity,
    unit: draft.value.unit,
    vatRate: draft.value.vatRate || '' // override opzionale
  })

  draft.value = { reference: null, quantity: null, unit: 'g', vatRate: '' }
}

function removeIngredient (idx) {
  const p = currentProduct.value
  if (!p?.ingredients) return
  p.ingredients.splice(idx, 1)
}

/* ============================
   COSTI (dialog)
============================ */
function normalizeUnit (u) {
  if (Array.isArray(u)) return u[0]
  return String(u || 'kg').trim() || 'kg'
}

function effectiveIngredientVat (ing) {
  const iv = String(ing?.vatRate || '').trim()
  if (iv) return iv
  return String(currentProduct.value?.vatRate || '22').trim() || '22'
}

function calculateIngredientNet (ing) {
  const price = Number(ing?.reference?.price) || 0
  const qty = Number(ing?.quantity) || 0
  const unit = normalizeUnit(ing?.unit)

  if (!price || !qty) return 0

  if (unit === 'kg') return price * qty
  if (unit === 'g') return price * (qty / 1000)
  if (unit === 'mg') return price * (qty / 1_000_000)
  if (unit === 'l') return price * qty
  if (unit === 'ml') return price * (qty / 1000)
  if (unit === 'pz') return price * qty

  return price * qty
}

function calculateIngredientGross (ing) {
  const net = calculateIngredientNet(ing)
  const vr = effectiveIngredientVat(ing)
  return net * vatMultiplier(vr)
}

const dialogTotals = computed(() => {
  const p = currentProduct.value
  const list = Array.isArray(p?.ingredients) ? p.ingredients : []

  const net = list.reduce((sum, ing) => sum + calculateIngredientNet(ing), 0)
  const gross = list.reduce((sum, ing) => sum + calculateIngredientGross(ing), 0)

  return { net, gross }
})

function formatCurrency (value) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })
    .format(Number(value) || 0)
}

/* ============================
   SALVATAGGIO SU SANITY
============================ */
async function saveIngredients () {
  const p = currentProduct.value
  if (!p?._id) return

  saving.value = true
  try {
    const payloadIngredients = (p.ingredients || []).map(ing => ({
      _key: ing._key,
      referenceId: ing.reference?._id || ing.referenceId,
      quantity: ing.quantity,
      unit: ing.unit,
      vatRate: (String(ing.vatRate || '').trim()) || '' // '' => usa prodotto
    }))

    const payload = {
      vatRate: p.vatRate || '22',
      ingredients: payloadIngredients
    }

    const updatedFull = await productStore.updateProduct(p._id, payload)

    // riallinea il dialog col full aggiornato
    const copy = JSON.parse(JSON.stringify(updatedFull))
    if (!copy.vatRate) copy.vatRate = '22'
    if (Array.isArray(copy.ingredients)) {
      copy.ingredients = copy.ingredients.map(i => ({ ...i, vatRate: i?.vatRate ? String(i.vatRate) : '' }))
    }
    currentProduct.value = copy

    $q.notify({ type: 'positive', message: 'Ingredienti salvati' })
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Errore nel salvataggio' })
  } finally {
    saving.value = false
  }
}
</script>
