<template>
  <q-dialog
    v-model="modelValue"
    persistent
    :maximized="$q.screen.lt.sm"
  >
    <q-card class="order-dialog-card">

      <!-- HEADER -->
      <q-card-section class="row items-center justify-between q-pb-xs">
        <div class="text-h6">
          Crea ordine
        </div>
        <q-btn
          v-if="$q.screen.lt.sm"
          flat
          round
          dense
          icon="close"
          @click="closeDialog"
        />
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll-area">

        <!-- RIGHE DELL'ORDINE -->
        <div class="column q-gutter-md">
          <div
            v-for="(row, idx) in items"
            :key="row.id"
            class="order-grid"
            :class="{ 'row-dimmed': idx !== enabledIdx }"
            :aria-disabled="idx !== enabledIdx ? 'true' : 'false'"
          >
            <!-- Nome prodotto + Categoria -->
            <div class="cell cell--name">
              <q-badge class="q-mb-sm q-pa-sm">
                Prodotto n°{{ idx + 1 }}
              </q-badge>

              <!-- CATEGORIA -->
              <q-select
                v-model="row.categoryId"
                :options="categoryStore.categories"
                option-label="name"
                option-value="_id"
                label="Categoria merceologica"
                emit-value
                map-options
                dense
                outlined
                :loading="categoryStore.loading"
                clearable
                class="q-mb-sm"
                @update:model-value="onCategoryChanged(idx)"
              />

              <!-- PRODOTTO (filtrato per categoria) -->
              <q-select
                v-model="row.referenceId"
                :options="productOptions(idx)"
                use-input
                input-debounce="150"
                option-label="name"
                option-value="_id"
                label="Prodotto"
                emit-value
                map-options
                dense
                outlined
                :disable="!row.categoryId"
                @update:model-value="onReferenceChanged(idx)"
                :ref="el => setProdRef(idx, el)"
              />
            </div>

            <!-- Fornitore -->
            <div class="cell cell--supplier">
              <q-select
                v-model="row.supplierId"
                :options="supplierStore.suppliers"
                option-label="name"
                option-value="_id"
                label="Fornitore"
                emit-value
                map-options
                dense
                outlined
                :disable="!row.referenceId"
                clearable
              />
            </div>

            <!-- Quantità -->
            <div class="cell cell--qty">
              <q-input
                v-model.number="row.quantity"
                type="number"
                label="Quantità"
                :min="0"
                dense
                outlined
                input-class="no-spin"
              />
            </div>

            <!-- Unità -->
            <div class="cell cell--unit">
              <q-select
                v-if="unitsFor(idx).length > 1"
                v-model="row.unit"
                :options="unitsFor(idx)"
                dense
                outlined
                label="Unità"
                :disable="!row.referenceId"
              />
              <q-chip
                v-else-if="unitsFor(idx).length === 1"
                outline
                class="q-my-xs"
              >
                {{ unitsFor(idx)[0] }}
              </q-chip>
              <q-badge
                v-else
                dense
                outline
                class="q-pa-md text-teal q-mt-xs"
              >
                <div>Unità da referenza</div>
              </q-badge>
            </div>

            <!-- Azioni riga -->
            <div class="cell cell--actions">
              <q-btn
                flat
                round
                color="negative"
                icon="delete"
                @click="removeRow(idx)"
                :disable="items.length === 1"
                aria-label="Rimuovi riga"
              >
                <q-tooltip class="bg-red-5" style="font-size: 1rem;">
                  Rimuovi riga
                </q-tooltip>
              </q-btn>

              <q-btn
                color="primary"
                icon="add"
                round
                @click="addRow"
                aria-label="Aggiungi riga"
                :disable="!canAddRow"
              >
                <q-tooltip class="bg-teal-5" style="font-size: 1rem;">
                  Aggiungi nuova referenza all'ordine
                </q-tooltip>
              </q-btn>
            </div>

            <!-- Separatore riga -->
            <q-separator class="cell cell--hr q-my-sm" color="primary" style="height: 4px;" />
          </div>
        </div>

        <!-- Totale ordine -->
        <div class="row justify-end q-mt-md q-gutter-md text-weight-medium text-right">
          <div class="col-auto">Prodotti: {{ items.length }}</div>
          <div class="col-auto">
            Totale ordine:
            <span class="text-primary">
              {{ formatMoney(grandTotal) }} €
            </span>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- FOOTER -->
      <q-card-actions class="order-dialog-actions">
        <div class="left-actions">
          <q-btn
            outline
            color="primary"
            icon="add"
            @click="openNewReference(items.length - 1)"
            :class="{ 'full-width': $q.screen.lt.sm }"
            label="referenza al magazzino"
          />
        </div>

        <div class="right-actions">
          <q-btn
            flat
            label="Annulla"
            @click="closeDialog"
            :class="{ 'full-width': $q.screen.lt.sm }"
          />
          <q-btn
            color="primary"
            label="Crea ordine"
            @click="createOrder"
            :class="{ 'full-width': $q.screen.lt.sm }"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Dialog: nuova referenza -->
  <NewReferenceDialog
    v-model="showNewReferenceDialog"
    :business-id="props.businessId"
    :init-warehouse="true"
    @created="handleReferenceCreated"
  />
</template>

<script setup>
import { ref, watch, onMounted, computed, nextTick } from 'vue'
import { useQuasar } from 'quasar'

import { useReferenceStore } from 'src/stores/referenceStore'
import { useUsersStore } from 'src/stores/usersStore'
import { useOrderStore } from 'src/stores/orderStore'
import { useSupplierStore } from 'src/stores/supplierStore'
import { useCategoryStore } from 'src/stores/categoryStore'

import NewReferenceDialog from 'src/components/common/dashboard/references/NewReferenceDialog.vue'

/* Props & emits */
const props = defineProps({
  modelValue: Boolean,
  businessId: String
})
const emit = defineEmits(['update:modelValue', 'order-created'])

/* Dialog v-model */
const modelValue = ref(props.modelValue)
watch(() => props.modelValue, v => (modelValue.value = v))
watch(modelValue, v => emit('update:modelValue', v))

/* Quasar + Store */
const $q = useQuasar()
const referenceStore = useReferenceStore()
const usersStore = useUsersStore()
const orderStore = useOrderStore()
const supplierStore = useSupplierStore()
const categoryStore = useCategoryStore()

/* Righe ordine */
let nextId = 1
const items = ref([
  {
    id: nextId++,
    categoryId: null,
    referenceId: null,
    quantity: 1,
    unit: null,
    price: null,
    supplierId: null
  }
])

/* Solo l'ultima riga è abilitata */
const enabledIdx = computed(() => Math.max(0, items.value.length - 1))

/* Refs dei q-select Prodotto per focus automatico */
const prodRefs = ref({})
function setProdRef (idx, el) {
  if (el) prodRefs.value[idx] = el
}

/* Aggiungi riga */
function addRow () {
  if (!canAddRow.value) return

  items.value.push({
    id: nextId++,
    categoryId: null,
    referenceId: null,
    quantity: 1,
    unit: null,
    price: null,
    supplierId: null
  })

  nextTick(() => {
    const idx = enabledIdx.value
    const comp = prodRefs.value[idx]
    if (comp?.focus) comp.focus()
  })
}

/* Rimuovi riga */
function removeRow (idx) {
  items.value.splice(idx, 1)
  delete prodRefs.value[idx]
  nextTick(() => {
    const idx2 = enabledIdx.value
    const comp = prodRefs.value[idx2]
    if (comp?.focus) comp.focus()
  })
}

/* Helpers referenze/unità */
function refObjById (id) {
  return (referenceStore.references || []).find(r => r._id === id) || null
}

function unitsFor (idx) {
  const refId = items.value[idx]?.referenceId
  const obj = refObjById(refId)
  if (!obj?.unit) return []
  const arr = Array.isArray(obj.unit) ? obj.unit : [obj.unit]
  return arr
    .map(u => (typeof u === 'string' ? u.split(' ')[0] : u))
    .filter(Boolean)
}

/* Duplicati: set id selezionati e logica canAddRow */
const selectedRefIds = computed(
  () => new Set(items.value.map(r => r.referenceId).filter(Boolean))
)
const selectedCount = computed(() => selectedRefIds.value.size)
const canAddRow = computed(() => {
  const total = (referenceStore.references || []).length || 0
  return selectedCount.value < total
})

/* Opzioni prodotto per riga (filtrate per categoria + niente duplicati) */
function productOptions (idx) {
  const row = items.value[idx]
  const categoryId = row?.categoryId
  if (!categoryId) return []

  const all = referenceStore.references || []
  const selectedIds = selectedRefIds.value

  return all.filter(r => {
    const catId = r?.category?._id || r?.category?._ref || null
    if (!catId || catId !== categoryId) return false

    if (selectedIds.has(r._id) && r._id !== row.referenceId) return false
    return true
  })
}

/* Cambio categoria su riga */
function onCategoryChanged (idx) {
  const row = items.value[idx]
  row.referenceId = null
  row.unit = null
  row.price = null
  row.supplierId = null
}

/* Cambio prodotto su riga */
function onReferenceChanged (idx) {
  const row = items.value[idx]

  const dup = items.value.some(
    (r, i) => i !== idx && r.referenceId && r.referenceId === row.referenceId
  )
  if (dup) {
    $q.notify({ type: 'warning', message: 'Prodotto già presente nell’ordine' })
    row.referenceId = null
    row.unit = null
    row.price = null
    row.supplierId = null
    return
  }

  const list = unitsFor(idx)
  row.unit = list[0] || null

  const refObj = refObjById(row.referenceId)
  row.price = refObj?.price ?? null
  row.supplierId = refObj?.supplier?._id || null
}

/* Nuova referenza al volo */
const showNewReferenceDialog = ref(false)
const creatingForRowIdx = ref(null)

function openNewReference (idx) {
  creatingForRowIdx.value = Math.max(0, idx ?? 0)
  showNewReferenceDialog.value = true
}

/* Gestione referenza creata dal dialog */
async function handleReferenceCreated (created) {
  try {
    const createdRef = created?.reference || created || null
    if (!createdRef) {
      $q.notify({ type: 'negative', message: 'Errore: referenza non valida' })
      return
    }

    const createdId = createdRef._id || createdRef.id || null
    const createdName = (createdRef.name || '').trim().toLowerCase()

    await referenceStore.fetchReferences({
      all: true,
      status: 'all',
      page: 1,
      pageSize: 5000
    })

    const list = referenceStore.references || []
    let pick = null

    if (createdId) {
      pick = list.find(r => r._id === createdId)
    }
    if (!pick && createdName) {
      pick = list.find(
        r => (r.name || '').trim().toLowerCase() === createdName
      )
    }

    const idx = creatingForRowIdx.value ?? enabledIdx.value
    const row = items.value[idx]

    if (pick) {
      const catId = pick.category?._id || pick.category?._ref || null
      row.categoryId = catId
      row.referenceId = pick._id
      onReferenceChanged(idx)

      $q.notify({
        type: 'positive',
        message: `Referenza "${pick.name}" pronta nell'ordine`
      })
    } else {
      row.referenceId = null
      $q.notify({
        type: 'warning',
        message: 'Referenza creata ma non trovata nella lista'
      })
    }
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Errore durante la gestione della nuova referenza'
    })
    console.error(err)
  } finally {
    showNewReferenceDialog.value = false
    creatingForRowIdx.value = null
  }
}

function closeDialog () {
  modelValue.value = false
}

/* Init */
onMounted(() => {
  referenceStore.fetchReferences({
    all: true,
    status: 'all',
    page: 1,
    pageSize: 5000
  })

  categoryStore.fetchCategories()
  supplierStore.fetchSuppliers()
})

/* Submit ordine */
async function createOrder () {
  const sanitized = items.value
    .map(r => ({
      quantity: Number(r.quantity) || 0,
      referenceId: r.referenceId || null,
      unit: r.unit || null,
      price: (r.price ?? null) !== null ? Number(r.price) : null,
      supplierId: r.supplierId || null
    }))
    .filter(
      r =>
        r.referenceId &&
        r.quantity > 0 &&
        (!unitsForByRef(r.referenceId).length || r.unit)
    )

  if (!sanitized.length) {
    $q.notify({ type: 'warning', message: 'Aggiungi almeno una riga valida' })
    return
  }

  const ids = sanitized.map(r => r.referenceId)
  const unique = new Set(ids)
  if (unique.size !== ids.length) {
    $q.notify({
      type: 'warning',
      message: 'Ci sono prodotti duplicati: rimuovi i doppioni'
    })
    return
  }

  const currentUser = usersStore.currentUser
  const payloadItems = sanitized.map(r => ({
    quantity: r.quantity,
    referenceId: r.referenceId,
    unit: r.unit,
    price: r.price,
    supplierId: r.supplierId,
    addedById: currentUser._id
  }))

  const newOrder = await orderStore.createOrder(props.businessId, payloadItems)
  if (newOrder) {
    emit('order-created', newOrder)
    modelValue.value = false
  }
}

/* helper per validazione unit */
function unitsForByRef (refId) {
  const obj = refObjById(refId)
  if (!obj?.unit) return []
  const arr = Array.isArray(obj.unit) ? obj.unit : [obj.unit]
  return arr
    .map(u => (typeof u === 'string' ? u.split(' ')[0] : u))
    .filter(Boolean)
}

/* Totali + formattazione */
const grandTotal = computed(() =>
  items.value.reduce((sum, r) => {
    const qty = Number(r?.quantity) || 0
    const price = Number(r?.price) || 0
    return sum + qty * price
  }, 0)
)
function formatMoney (val) {
  const n = Number(val) || 0
  return n.toFixed(2)
}
</script>

<style scoped>
.order-dialog-card {
  width: 90vw;
  max-width: 1100px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

/* full-screen mobile: già gestito da :maximized, qui solo padding/scroll */
@media (max-width: 767.98px) {
  .order-dialog-card {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
}

.scroll-area {
  flex: 1 1 auto;
  overflow-y: auto;
}

/* GRID RIGA ORDINE */

/* MOBILE: layout colonna, super leggibile */
@media (max-width: 767.98px) {
  .order-grid {
    display: grid;
    gap: 8px;
    grid-template-columns: 1fr;
    grid-template-areas:
      "name"
      "supplier"
      "qty"
      "unit"
      "actions"
      "hr";
    padding: 8px 4px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.02);
  }
  .cell--name     { grid-area: name; }
  .cell--supplier { grid-area: supplier; }
  .cell--qty      { grid-area: qty; }
  .cell--unit     { grid-area: unit; }
  .cell--actions  {
    grid-area: actions;
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .cell--hr       { grid-area: hr; }

  .cell :deep(.q-field) {
    width: 100%;
  }
}

/* TABLET / DESKTOP: griglia più densa */
@media (min-width: 768px) and (max-width: 1279.98px) {
  .order-grid {
    display: grid;
    align-items: end;
    gap: 8px;
    grid-template-columns: repeat(6, 1fr);
    grid-template-areas:
      "name name supplier supplier qty actions"
      "hr   hr   hr       hr       hr  hr";
  }
  .cell--name     { grid-area: name; }
  .cell--supplier { grid-area: supplier; }
  .cell--qty      { grid-area: qty; }
  .cell--unit     { grid-area: qty; } /* unit vicino a qty: possono condividere area o stare sotto */
  .cell--actions  {
    grid-area: actions;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .cell--hr       { grid-area: hr; }
}

/* ≥ 1280px: layout orizzontale completo */
@media (min-width: 1280px) {
  .order-grid {
    display: grid;
    align-items: end;
    gap: 8px;
    grid-template-columns: 3fr 2fr 1fr 1.5fr auto;
    grid-template-areas:
      "name supplier qty unit actions"
      "hr   hr       hr  hr   hr";
  }
  .cell--name     { grid-area: name; }
  .cell--supplier { grid-area: supplier; }
  .cell--qty      { grid-area: qty; }
  .cell--unit     { grid-area: unit; }
  .cell--actions  {
    grid-area: actions;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .cell--hr       { grid-area: hr; }
}

/* Effetto: tutte le righe NON ultime sono disabilitate */
.row-dimmed {
  opacity: 0.6;
  filter: grayscale(0.7);
  cursor: not-allowed;
}
.row-dimmed .cell :deep(*) { pointer-events: none; }
.row-dimmed :deep(.q-tooltip) { display: none !important; }

/* Rimuovi spinner dai number input */
:deep(input[type="number"].no-spin) {
  -moz-appearance: textfield;
  appearance: textfield;
}
:deep(input[type="number"].no-spin::-webkit-outer-spin-button),
:deep(input[type="number"].no-spin::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

/* FOOTER layout */
.order-dialog-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.order-dialog-actions .left-actions,
.order-dialog-actions .right-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 767.98px) {
  .order-dialog-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .order-dialog-actions .left-actions,
  .order-dialog-actions .right-actions {
    width: 100%;
    justify-content: stretch;
  }
  .order-dialog-actions .full-width {
    width: 100%;
  }
}
</style>
