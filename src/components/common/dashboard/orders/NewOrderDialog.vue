<template>
  <q-dialog v-model="modelValue" persistent>
    <q-card style="min-width: 90vw">
      <q-card-section class="text-h6">
        Crea ordine
      </q-card-section>

      <q-card-section>
        <!-- RIGHE DELL'ORDINE -->
        <div class="column q-gutter-md">
          <div
            v-for="(row, idx) in items"
            :key="row.id"
            class="order-grid"
            :class="{ 'row-dimmed': idx !== enabledIdx }"
            :aria-disabled="idx !== enabledIdx ? 'true' : 'false'"
          >
            <!-- Nome prodotto -->
            <div class="cell cell--name">
              <q-badge class="q-mb-md q-pa-sm">
                Prodotto n°{{ idx + 1 }}
              </q-badge>

              <q-select
                v-model="row.referenceId"
                :options="refOptions"
                use-input
                input-debounce="150"
                @filter="filterReferences"
                option-label="name"
                option-value="_id"
                label="Prodotto"
                emit-value
                map-options
                dense
                outlined
                @update:model-value="onReferenceChanged(idx)"
                :ref="el => setProdRef(idx, el)"
              />

            </div>

            <!-- Fornitore (per riga; non modifica DB, solo ordine) -->
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
            <div class="cell cell--unit flex justify-center">
              <q-select
                v-if="unitsFor(idx).length > 1"
                v-model="row.unit"
                :options="unitsFor(idx)"
                dense
                outlined
                label="Unità"
                :disable="!row.referenceId"
              />
              <q-chip v-else-if="unitsFor(idx).length === 1" outline>
                {{ unitsFor(idx)[0] }}
              </q-chip>
              <q-badge v-else dense outline class="q-pa-md text-teal">
                <div>unità della referenza</div>
              </q-badge>
            </div>

            <!-- Elimina riga -->
            <div class="cell cell--remove">
              <q-btn
                flat
                round
                color="negative"
                icon="delete"
                @click="removeRow(idx)"
                :disable="items.length === 1"
                aria-label="Rimuovi riga"
              >
                <q-tooltip class="bg-red-5" style="font-size: 1rem;">Rimuovi riga</q-tooltip>
              </q-btn>
            </div>

            <!-- Aggiungi riga -->
            <div class="cell cell--add">
              <q-btn
                color="primary"
                icon="add"
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
            <q-separator class="cell cell--hr q-my-sm" color="primary" style="height: 5px;" />
          </div>
        </div>

        <!-- Totale ordine -->
        <div class="row justify-end q-mt-md q-gutter-md text-weight-medium">
          <div class="col-auto">Prodotti: {{ items.length }}</div>
          <div class="col-auto">Totale ordine: {{ formatMoney(grandTotal) }} €</div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions class="flex justify-between">
        <div class="q-my-md">
          <q-btn
            outline
            color="primary"
            icon="add"
            @click="openNewReference(items.length - 1)"
            :class="{ 'full-width': $q.screen.lt.sm }"
            label="referenza al magazzino"
          />
        </div>

        <div>
          <q-btn flat label="Annulla" @click="closeDialog" />
          <q-btn color="primary" label="Crea ordine" @click="createOrder" />
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

/* Righe ordine */
let nextId = 1
const items = ref([
  { id: nextId++, referenceId: null, quantity: 1, unit: null, price: null, supplierId: null }
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
    .map(u => typeof u === 'string' ? u.split(' ')[0] : u)
    .filter(Boolean)
}

/* Duplicati: set id selezionati e filtri opzioni */
const selectedRefIds = computed(() =>
  new Set(items.value.map(r => r.referenceId).filter(Boolean))
)
const selectedCount = computed(() => selectedRefIds.value.size)
const canAddRow = computed(() => {
  const total = (referenceStore.references || []).length || 0
  return selectedCount.value < total
})
const refOptions = ref([])

function filterReferences (val, update) {
  const all = referenceStore.references || []

  if (!val) {
    update(() => {
      refOptions.value = all
    })
    return
  }

  const needle = val.toLowerCase()

  update(() => {
    refOptions.value = all.filter(r =>
      r.name.toLowerCase().includes(needle)
    )
  })
}

/* Cambio prodotto su riga */
function onReferenceChanged (idx) {
  const row = items.value[idx]

  // blocca duplicati
  const dup = items.value.some((r, i) => i !== idx && r.referenceId && r.referenceId === row.referenceId)
  if (dup) {
    $q.notify({ type: 'warning', message: 'Prodotto già presente nell’ordine' })
    row.referenceId = null
    row.unit = null
    row.price = null
    row.supplierId = null
    return
  }

  // set unit/prezzo/fornitore di default
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

/**
 * Crea la referenza e selezionala nella riga:
 * - accetta ritorni {reference}, {data} o oggetto diretto
 * - poi refetch, poi ricerca per _id o per name/supplier/category
 */
async function handleReferenceCreated (created) {
  try {
    const createdRef = created?.reference || created || null
    if (!createdRef) {
      $q.notify({ type: 'negative', message: 'Errore: referenza non valida' })
      return
    }

    const createdId = createdRef._id || createdRef.id || null
    const createdName = (createdRef.name || '').trim().toLowerCase()

    // assicuro lista aggiornata (in teoria già ok, ma safe)
    await referenceStore.fetchReferences({ all: true, status: 'all', page: 1, pageSize: 5000 })

    const list = referenceStore.references || []
    let pick = null

    if (createdId) {
      pick = list.find(r => r._id === createdId)
    }
    if (!pick && createdName) {
      pick = list.find(r => (r.name || '').trim().toLowerCase() === createdName)
    }

    const idx = creatingForRowIdx.value ?? enabledIdx.value
    const row = items.value[idx]

    if (pick) {
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
    $q.notify({ type: 'negative', message: 'Errore durante la gestione della nuova referenza' })
    console.error(err)
  } finally {
    showNewReferenceDialog.value = false
    creatingForRowIdx.value = null
  }
}



function closeDialog() {
  modelValue.value = false
}

/* Submit ordine */
onMounted(() => {
  referenceStore.fetchReferences({
  all: true,
  status: 'all', // importantissimo
  page: 1,
  pageSize: 5000
})

  supplierStore.fetchSuppliers()
  console.log(referenceStore.references.length)
console.log(referenceStore.references.filter(r => r.status === 'active').length)
})

async function createOrder () {
  // normalizza righe
  const sanitized = items.value
    .map(r => ({
      quantity: Number(r.quantity) || 0,
      referenceId: r.referenceId || null,
      unit: r.unit || null,
      price: (r.price ?? null) !== null ? Number(r.price) : null,
      supplierId: r.supplierId || null
    }))
    .filter(r =>
      r.referenceId &&
      r.quantity > 0 &&
      (!unitsForByRef(r.referenceId).length || r.unit)
    )

  if (!sanitized.length) {
    $q.notify({ type: 'warning', message: 'Aggiungi almeno una riga valida' })
    return
  }

  // check duplicati
  const ids = sanitized.map(r => r.referenceId)
  const unique = new Set(ids)
  if (unique.size !== ids.length) {
    $q.notify({ type: 'warning', message: 'Ci sono prodotti duplicati: rimuovi i doppioni' })
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
  return arr.map(u => typeof u === 'string' ? u.split(' ')[0] : u).filter(Boolean)
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
.order-grid {
  display: grid;
  align-items: end;
  gap: 8px;
}

/* < 1280px: 2 righe + hr (6 colonne) */
@media (max-width: 1279.98px) {
  .order-grid {
    grid-template-columns: repeat(6, 1fr);
    grid-template-areas:
      "name name supplier supplier supplier add"
      "qty qty qty unit  unit remove"
      "hr   hr     hr       hr       hr       hr";
  }
  .cell--name     { grid-area: name; }
  .cell--supplier { grid-area: supplier; }
  .cell--qty      { grid-area: qty; }
  .cell--unit     { grid-area: unit; }
  .cell--price    { grid-area: price; }
  .cell--total    { grid-area: total; }
  .cell--remove   { grid-area: remove; display: flex; justify-content: center; }
  .cell--add      { grid-area: add; display: flex; justify-content: center; }
  .cell--hr       { grid-area: hr; }
}

/* ≥ 1280px: una riga + hr sotto */
@media (min-width: 1280px) {
  .order-grid {
    grid-template-columns: 3fr 2fr 1fr 1.5fr 1.5fr 1.5fr auto auto;
    grid-template-areas:
      "name name supplier supplier qty unit  remove add"
      "hr   hr       hr  hr   hr    hr    hr     hr";
  }
  .cell--name     { grid-area: name; }
  .cell--supplier { grid-area: supplier; }
  .cell--qty      { grid-area: qty; }
  .cell--unit     { grid-area: unit; }
  .cell--price    { grid-area: price; }
  .cell--total    { grid-area: total; }
  .cell--remove   { grid-area: remove; display: flex; justify-content: center; }
  .cell--add      { grid-area: add; display: flex; justify-content: center; }
  .cell--hr       { grid-area: hr; }
}

/* Migliora resa dei campi dentro grid */
.cell :deep(.q-field) { width: 100%; }

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
</style>
