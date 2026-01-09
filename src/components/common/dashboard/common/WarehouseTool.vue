<template>
  <div class="column q-gutter-md">
    <!-- TOP BAR -->
    <q-card flat bordered>
      <q-card-section>
        <div class="row items-stretch q-col-gutter-sm">
          <div class="col-12 col-sm-auto">
            <q-btn
              color="primary"
              icon="add"
              :label="$q.screen.gt.xs ? 'Aggiungi referenza' : 'Referenza'"
              class="full-width"
              @click="showNewReference = true"
            />
          </div>

          <div class="col-12 col-sm-auto">
            <q-btn
              color="secondary"
              icon="add_business"
              :label="$q.screen.gt.xs ? 'Aggiungi fornitore' : 'Fornitore'"
              class="full-width"
              @click="showNewSupplier = true"
            />
          </div>

          <div class="col-12 col-sm-auto">
            <q-btn
              color="accent"
              icon="playlist_add"
              :label="$q.screen.gt.xs ? 'Aggiungi categoria' : 'Categoria'"
              class="full-width"
              @click="showNewCategory = true"
            />
          </div>

          <q-space />

          <!-- Search -->
          <div class="col-12 col-sm-4 col-md-3">
            <q-input
              v-model="q"
              dense
              outlined
              clearable
              debounce="250"
              label="Cerca referenza…"
              class="full-width"
            >
              <template #append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <!-- Select Ordina -->
          <div class="col-12 col-sm-auto">
            <q-select
              v-model="localSort"
              :options="sortOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              dense
              outlined
              label="Ordina"
              class="full-width"
            />
          </div>

          <div class="col-12 col-sm-auto">
            <q-btn
              outline
              color="primary"
              icon="refresh"
              :label="$q.screen.gt.xs ? 'Ricarica' : ''"
              class="full-width"
              :loading="referenceStore.loading || loadingMore"
              @click="refresh"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- LISTA -->
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div class="row items-center justify-between">
          <div class="text-subtitle1 q-mx-md">Referenze</div>
          <q-badge outline color="primary">
            {{ totalLabel }}
          </q-badge>
        </div>

        <!-- Toggle vista -->
        <div class="col-12 col-sm-auto">
          <q-btn-toggle
            v-model="viewMode"
            class="full-width"
            dense
            unelevated
            toggle-color="primary"
            :options="[
              { label: $q.screen.gt.xs ? 'Tabella' : '', value: 'table', slot: 'table' },
              { label: $q.screen.gt.xs ? 'Griglia' : '', value: 'grid',  slot: 'grid'  },
            ]"
          >
            <template #grid><q-icon name="view_module" /></template>
            <template #table><q-icon name="table_rows" /></template>
          </q-btn-toggle>
        </div>
      </q-card-section>

      <q-separator />

      <div class="text-caption text-grey-7 q-pa-xs">
        DEBUG: {{ referenceStore.references.length }} righe caricate
      </div>

      <q-table
        ref="tableRef"
        :key="tableKey"
        :rows="referenceStore.references"
        :columns="columns"
        :visible-columns="visibleColumns"
        row-key="_id"
        flat
        :loading="referenceStore.loading || loadingMore"
        :no-data-label="(referenceStore.loading || loadingMore) ? 'Caricamento…' : 'Nessuna referenza'"
        binary-state-sort
        wrap-cells
        :dense="isDense"
        :grid="isGrid"
        hide-pagination
        :pagination="{ rowsPerPage: 0 }"
        virtual-scroll
        :virtual-scroll-item-size="virtualItemSize"
        @virtual-scroll="onVirtualScroll"
      >
        <!-- ===== GRID ===== -->
        <template #item="it">
          <div class="q-pa-sm col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
            <q-card flat bordered>
              <q-item>
                <q-item-section>
                  <div class="text-subtitle2">{{ it.row.name }}</div>
                  <div v-if="it.row.notes" class="text-caption text-grey-7">
                    {{ it.row.notes }}
                  </div>
                </q-item-section>
                <q-item-section side top>
                  <q-badge :color="it.row.status === 'active' ? 'positive' : 'grey'">
                    {{ it.row.status === 'active' ? 'Attiva' : 'Archiviata' }}
                  </q-badge>
                </q-item-section>
              </q-item>

              <q-separator />
              <q-list dense>
                <q-item>
                  <q-item-section avatar><q-icon name="category" /></q-item-section>
                  <q-item-section>{{ getCategoryName(it.row.category) }}</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar><q-icon name="straighten" /></q-item-section>
                  <q-item-section>
                    <q-chip
                      v-for="u in (it.row.unit || [])"
                      :key="u"
                      size="sm"
                      outline
                      class="q-mr-xs q-mb-xs"
                    >
                      {{ u }}
                    </q-chip>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar><q-icon name="local_shipping" /></q-item-section>
                  <q-item-section>{{ getSupplierName(it.row.supplier) }}</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar><q-icon name="euro" /></q-item-section>
                  <q-item-section>{{ it.row.price != null ? formatPrice(it.row.price) : '-' }}</q-item-section>
                </q-item>
              </q-list>

              <q-separator />

              <q-card-actions align="right">
                <q-btn dense flat round color="primary" icon="edit" @click="openEdit(it.row)">
                  <q-tooltip>Modifica</q-tooltip>
                </q-btn>
                <q-btn dense flat round color="negative" icon="delete" @click="confirmDelete(it.row)">
                  <q-tooltip>Elimina</q-tooltip>
                </q-btn>
              </q-card-actions>
            </q-card>
          </div>
        </template>

        <!-- ===== TABLE ===== -->
        <template #body-cell-name="p">
          <q-td :props="p">
            <div class="text-weight-medium">{{ p.row.name }}</div>
            <div v-if="p.row.notes" class="text-caption text-grey-7">{{ p.row.notes }}</div>
          </q-td>
        </template>

        <template #body-cell-category="p">
          <q-td :props="p">{{ getCategoryName(p.row.category) }}</q-td>
        </template>

        <template #body-cell-unit="p">
          <q-td :props="p">
            <q-chip v-for="u in (p.row.unit || [])" :key="u" size="sm" outline class="q-mr-xs q-mb-xs">
              {{ u }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-supplier="p">
          <q-td :props="p">{{ getSupplierName(p.row.supplier) }}</q-td>
        </template>

        <template #body-cell-price="p">
          <q-td :props="p" class="text-right">
            {{ p.row.price != null ? formatPrice(p.row.price) : '-' }}
          </q-td>
        </template>

        <template #body-cell-status="p">
          <q-td :props="p">
            <q-badge :color="p.row.status === 'active' ? 'positive' : 'grey'">
              {{ p.row.status === 'active' ? 'Attiva' : 'Archiviata' }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-actions="p">
          <q-td :props="p" class="text-right">
            <q-btn dense flat round color="primary" icon="edit" @click="openEdit(p.row)">
              <q-tooltip>Modifica</q-tooltip>
            </q-btn>
            <q-btn dense flat round color="negative" icon="delete" @click="confirmDelete(p.row)">
              <q-tooltip>Elimina</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template #bottom>
          <div class="row items-center justify-center q-pa-sm full-width">
            <q-spinner v-if="loadingMore" />
            <div v-else-if="!hasMore && referenceStore.references.length" class="text-caption text-grey-7">
              Fine risultati
            </div>
          </div>
        </template>
      </q-table>
    </q-card>

    <!-- DIALOGS CREA -->
    <new-reference-dialog v-model="showNewReference" @created="handleReferenceCreated" />
    <new-category-dialog  v-model="showNewCategory"  @created="handleCategoryCreated" />
    <new-supplier-dialog  v-model="showNewSupplier"  @created="handleSupplierCreated" />

    <!-- DIALOG MODIFICA -->
    <q-dialog v-model="showEditDialog" persistent>
      <q-card style="min-width: 95vw; max-width: 720px">
        <q-card-section class="text-h6">Modifica referenza</q-card-section>
        <q-card-section>
          <q-form ref="editFormRef" @submit.prevent="submitEdit" class="q-gutter-md">
            <q-input
              v-model="editForm.name"
              label="Nome *"
              outlined
              :rules="[v => !!(v && v.trim()) || 'Il nome è obbligatorio']"
              lazy-rules
            />

            <q-select
              v-model="editForm.categoryId"
              :options="categoryStore.categories"
              option-label="name"
              option-value="_id"
              emit-value
              map-options
              outlined
              clearable
              label="Categoria merceologica"
              :loading="categoryStore.loading"
            />

            <q-select
              v-model="editForm.units"
              :options="unitOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              multiple
              use-chips
              outlined
              label="Unità di misura"
            />

            <q-select
              v-model="editForm.supplierId"
              :options="supplierStore.suppliers"
              option-label="name"
              option-value="_id"
              emit-value
              map-options
              outlined
              clearable
              label="Fornitore"
            />

            <q-input v-model.number="editForm.price" type="number" outlined label="Prezzo medio (opzionale)" :min="0" />
            <q-input v-model="editForm.notes" type="textarea" outlined label="Note" autogrow />
          </q-form>
        </q-card-section>

        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Annulla" :disable="savingEdit" v-close-popup />
          <q-btn color="primary" label="Salva" :loading="savingEdit" :disable="savingEdit" @click="submitEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { useReferenceStore } from 'src/stores/referenceStore'
import { useCategoryStore } from 'src/stores/categoryStore'
import { useSupplierStore } from 'src/stores/supplierStore'

import NewReferenceDialog from 'src/components/common/dashboard/references/NewReferenceDialog.vue'
import NewCategoryDialog  from 'src/components/common/dashboard/categories/NewCategoryDialog.vue'
import NewSupplierDialog  from 'src/components/common/dashboard/suppliers/NewSupplierDialog.vue'

const $q = useQuasar()
const referenceStore = useReferenceStore()
const categoryStore  = useCategoryStore()
const supplierStore  = useSupplierStore()

/* Dialogs create */
const showNewReference = ref(false)
const showNewCategory  = ref(false)
const showNewSupplier  = ref(false)

/* QTable ref + key (forza refresh virtual scroll) */
const tableRef = ref(null)
const tableKey = computed(() => `${referenceStore.criteria.q}__${localSort.value}__${viewMode.value}`)

/* Search (usa criteria.q) */
const q = computed({
  get: () => referenceStore.criteria.q,
  set: v => { referenceStore.criteria.q = v ?? '' }
})

watch(() => referenceStore.criteria.q, (val) => {
  console.log('[UI] q changed →', val)
  fetchPage({ reset: true })
})

/* Infinite state */
const hasMore = ref(true)
const loadingMore = ref(false)

/* Colonne */
const columns = [
  { name: 'name',     label: 'Nome',      field: 'name',     align: 'left',  sortable: true  },
  { name: 'category', label: 'Categoria', field: 'category', align: 'left',  sortable: true  },
  { name: 'unit',     label: 'Unità',     field: 'unit',     align: 'left' },
  { name: 'supplier', label: 'Fornitore', field: 'supplier', align: 'left',  sortable: true  },
  { name: 'price',    label: 'Prezzo',    field: 'price',    align: 'right', sortable: true  },
  { name: 'status',   label: 'Stato',     field: 'status',   align: 'left'  },
  { name: 'actions',  label: '',          field: 'actions',  align: 'right' }
]

/* Toggle vista */
const viewMode = ref($q.screen.lt.md ? 'grid' : 'table')
const isGrid  = computed(() => viewMode.value === 'grid')
const isDense = computed(() => isGrid.value || $q.screen.lt.md)

/* Colonne visibili */
const allCols = ['name','category','unit','supplier','price','status','actions']
const mobileCols = ['name','price','status','actions']
const visibleColumns = computed(() =>
  viewMode.value === 'table' && $q.screen.lt.md ? mobileCols : allCols
)

/* Virtual scroll size */
const virtualItemSize = computed(() => (isGrid.value ? 280 : (isDense.value ? 40 : 48)))

/* Sort */
const sortOptions = [
  { label: 'A → Z',              value: 'alpha_asc'  },
  { label: 'Z → A',              value: 'alpha_desc' },
  { label: 'Prezzo crescente',   value: 'price_asc'  },
  { label: 'Prezzo decrescente', value: 'price_desc' }
]
const localSort = ref('alpha_asc')

const totalLabel = computed(() => {
  const total = Number(referenceStore.criteria.total)
  if (Number.isFinite(total) && total > 0) return `${total} totali`
  return `${referenceStore.references.length} caricati`
})

/* Anti race: se digiti veloce, ignoriamo risposte vecchie */
let lastReqId = 0

async function fetchPage ({ reset = false } = {}) {
  console.log('[UI] fetchPage called', { reset, q: referenceStore.criteria.q, page: referenceStore.criteria.page })
  const reqId = ++lastReqId

  if (reset) {
    hasMore.value = true
    referenceStore.resetReferences()
    await nextTick()
    if (tableRef.value?.scrollTo) tableRef.value.scrollTo(0)
  }

  if (!hasMore.value) return

  loadingMore.value = true
  try {
    const { items, total } = await referenceStore.fetchReferences({
      sort: localSort.value,
      page: referenceStore.criteria.page,
      pageSize: referenceStore.criteria.pageSize,
      q: referenceStore.criteria.q
    })

    // se nel frattempo è partita una nuova ricerca/sort, scarta questa risposta
    if (reqId !== lastReqId) return

    const loaded = referenceStore.references.length
    const t = Number(total)

    if (Number.isFinite(t) && t > 0) {
      hasMore.value = loaded < t
    } else {
      hasMore.value = (items?.length || 0) === referenceStore.criteria.pageSize
    }

    if (hasMore.value) {
      referenceStore.criteria.page += 1
    }
  } catch (e) {
    // opzionale: notifica
    console.error(e)
  } finally {
    if (reqId === lastReqId) loadingMore.value = false
  }
}

function onVirtualScroll ({ to }) {
  const threshold = 20
  const loaded = referenceStore.references.length
  if (hasMore.value && !loadingMore.value && to >= loaded - threshold) {
    fetchPage({ reset: false })
  }
}

function refresh () {
  fetchPage({ reset: true })
}

/* Search */
watch(() => referenceStore.criteria.q, () => {
  fetchPage({ reset: true })
})

/* Sort */
watch(localSort, () => {
  fetchPage({ reset: true })
})

watch(
  () => referenceStore.references,
  (rows) => {
    console.log('[UI] rows updated →', rows.length, rows.map(r => r.name))
  },
  { deep: true }
)

/* Helpers */
function formatPrice (n) {
  try { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(n)) }
  catch { return n }
}

function getCategoryName (cat) {
  if (!cat) return '-'
  if (cat.name) return cat.name
  if (cat._ref) return cat._ref
  if (cat._id) return cat._id
  return String(cat)
}

function getSupplierName (sup) {
  if (!sup) return '-'
  if (sup.name) return sup.name
  if (sup._ref) return sup._ref
  if (sup._id) return sup._id
  return String(sup)
}

/* Delete */
function confirmDelete (row) {
  $q.dialog({
    title: 'Elimina referenza',
    message: `Confermi l'eliminazione di "<b>${row.name}</b>"?`,
    html: true,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      if (typeof referenceStore.deleteReference === 'function') {
        await referenceStore.deleteReference(row._id)
      } else {
        await api.delete(`references/${row._id}?cascade=1`)
      }
      $q.notify({ type: 'positive', message: 'Referenza eliminata' })
      await fetchPage({ reset: true })
    } catch (e) {
      console.error(e)
      $q.notify({ type: 'negative', message: 'Impossibile eliminare' })
    }
  })
}

/* Edit dialog */
const showEditDialog = ref(false)
const editFormRef = ref(null)
const savingEdit = ref(false)
const editForm = reactive({
  _id: null,
  name: '',
  categoryId: null,
  supplierId: null,
  units: [],
  price: null,
  notes: ''
})

const unitOptions = [
  { label: 'mg (milligrammo)', value: 'mg' }, { label: 'g (grammo)', value: 'g' },
  { label: 'hg (etto)', value: 'hg' }, { label: 'kg (chilogrammo)', value: 'kg' },
  { label: 'q (quintale)', value: 'q' }, { label: 't (tonnellata)', value: 't' },
  { label: 'ml (millilitro)', value: 'ml' }, { label: 'cl (centilitro)', value: 'cl' },
  { label: 'dl (decilitro)', value: 'dl' }, { label: 'l (litro)', value: 'l' },
  { label: 'hl (ettolitro)', value: 'hl' }, { label: 'm³ (metro cubo)', value: 'm³' },
  { label: 'pz (pezzo)', value: 'pz' }, { label: 'cf (confezione)', value: 'cf' },
  { label: 'scat (scatola)', value: 'scat' }, { label: 'ct (cartone)', value: 'ct' },
  { label: 'colli (collo)', value: 'colli' }, { label: 'pallet (pallet)', value: 'pallet' },
  { label: 'bancale (bancale)', value: 'bancale' }, { label: 'rotolo (rotolo)', value: 'rotolo' },
  { label: 'fusto (fusto)', value: 'fusto' }, { label: 'bottiglia', value: 'bottiglia' },
  { label: 'lattina', value: 'lattina' }, { label: 'barattolo', value: 'barattolo' },
  { label: 'flacone', value: 'flacone' }, { label: 'tanica', value: 'tanica' },
  { label: 'sacco', value: 'sacco' }, { label: 'cassa', value: 'cassa' }, { label: 'latta', value: 'latta' }
]

function openEdit (row) {
  editForm._id = row._id
  editForm.name = row.name || ''
  editForm.categoryId = row.category?._id || row.category?._ref || null
  editForm.supplierId = row.supplier?._id || row.supplier?._ref || null
  editForm.units = Array.isArray(row.unit) ? [...row.unit] : []
  editForm.price = row.price ?? null
  editForm.notes = row.notes || ''
  showEditDialog.value = true
}

async function submitEdit () {
  if (editFormRef.value) {
    const ok = await editFormRef.value.validate()
    if (!ok) return
  }

  savingEdit.value = true
  try {
    const payload = {
      name: editForm.name.trim(),
      ...(editForm.categoryId ? { category: { _type: 'reference', _ref: String(editForm.categoryId) } } : { category: null }),
      ...(editForm.units?.length ? { unit: [...new Set(editForm.units)] } : { unit: [] }),
      ...(editForm.supplierId ? { supplier: { _type: 'reference', _ref: String(editForm.supplierId) } } : { supplier: null }),
      ...(Number.isFinite(Number(editForm.price)) ? { price: Number(editForm.price) } : { price: null }),
      notes: editForm.notes?.trim() || ''
    }

    if (typeof referenceStore.updateReference === 'function') {
      await referenceStore.updateReference(editForm._id, payload)
    } else {
      await api.patch(`references/${editForm._id}`, payload)
    }

    $q.notify({ type: 'positive', message: 'Referenza aggiornata' })
    showEditDialog.value = false
    await fetchPage({ reset: true })
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Impossibile aggiornare' })
  } finally {
    savingEdit.value = false
  }
}

/* Create handlers */
async function handleReferenceCreated (doc) {
  try {
    const created = await referenceStore.createReference(doc)
    $q.notify({ type: 'positive', message: `Referenza "${created.name}" creata` })
    await fetchPage({ reset: true })
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Errore nella creazione della referenza' })
  }
}

async function handleCategoryCreated (doc) {
  try {
    const created = await categoryStore.createCategory(doc)
    $q.notify({ type: 'positive', message: `Categoria "${created.name}" creata` })
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Errore nella creazione della categoria' })
  }
}

async function handleSupplierCreated (doc) {
  try {
    const created = await supplierStore.createSupplier(doc)
    $q.notify({ type: 'positive', message: `Fornitore "${created.name}" creato` })
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Errore nella creazione del fornitore' })
  }
}

/* Bootstrap */
onMounted(async () => {
  categoryStore.fetchCategories()
  supplierStore.fetchSuppliers()
  await fetchPage({ reset: true })
})
</script>
