<template>
  <div class="column q-gutter-md">
    <!-- TOP BAR -->
    <q-card flat bordered>
      <q-card-section>
        <div class="row items-stretch q-col-gutter-sm">
          <div class="col-12 col-sm-auto">
            <q-btn color="primary" icon="add" :label="$q.screen.gt.xs ? 'Aggiungi referenza' : 'Referenza'"
                   class="full-width" @click="showNewReference = true" />
          </div>
          <div class="col-12 col-sm-auto">
            <q-btn color="secondary" icon="add_business" :label="$q.screen.gt.xs ? 'Aggiungi fornitore' : 'Fornitore'"
                   class="full-width" @click="showNewSupplier = true" />
          </div>
          <div class="col-12 col-sm-auto">
            <q-btn color="accent" icon="playlist_add" :label="$q.screen.gt.xs ? 'Aggiungi categoria' : 'Categoria'"
                   class="full-width" @click="showNewCategory = true" />
          </div>

          <q-space />

          <!-- Select Ordina (Nome/Prezzo) -->
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
            <q-btn outline color="primary" icon="refresh" :label="$q.screen.gt.xs ? 'Ricarica' : ''"
                   class="full-width" :loading="referenceStore.loading" @click="refresh" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- LISTA -->
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between">
        <div class="row items-center justify-between">
          <div class="text-subtitle1 q-mx-md">Referenze</div>
          <q-badge outline color="primary">{{ pagination.rowsNumber }} totali</q-badge>
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

      <q-table
        :rows="referenceStore.references"
        :columns="columns"
        :visible-columns="visibleColumns"
        row-key="_id"
        flat
        :loading="referenceStore.loading"
        :pagination="pagination"
        :rows-per-page-options="[10,25,50,100]"
        :no-data-label="referenceStore.loading ? 'Caricamento…' : 'Nessuna referenza'"
        binary-state-sort
        wrap-cells
        @request="onRequest"
        :dense="isDense"
        :grid="isGrid"
      >
        <!-- ===== GRID (card) ===== -->
        <template #item="it">
          <!-- responsive: 1/2/3/4/6 per riga -->
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
                    <q-chip v-for="u in (it.row.unit || [])" :key="u" size="sm" outline class="q-mr-xs q-mb-xs">{{ u }}</q-chip>
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

        <!-- ===== TABLE (desktop) ===== -->
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
            <q-chip v-for="u in (p.row.unit || [])" :key="u" size="sm" outline class="q-mr-xs q-mb-xs">{{ u }}</q-chip>
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

        <!-- Azioni per riga (tabella) -->
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
            <q-input v-model="editForm.name" label="Nome *" outlined
                     :rules="[v => !!(v && v.trim()) || 'Il nome è obbligatorio']" lazy-rules />

            <div class="row items-center">
              <div class="col">
                <q-select
                  v-model="editForm.categoryId"
                  :options="categoryStore.categories"
                  option-label="name" option-value="_id"
                  emit-value map-options outlined clearable
                  label="Categoria merceologica"
                  :loading="categoryStore.loading"
                />
              </div>
            </div>

            <q-select
              v-model="editForm.units"
              :options="unitOptions"
              option-label="label" option-value="value"
              emit-value map-options multiple use-chips
              outlined label="Unità di misura"
            />

            <div class="row items-center">
              <div class="col">
                <q-select
                  v-model="editForm.supplierId"
                  :options="supplierStore.suppliers"
                  option-label="name" option-value="_id"
                  emit-value map-options outlined clearable
                  label="Fornitore"
                />
              </div>
            </div>

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
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { useReferenceStore } from 'src/stores/referenceStore'
import { useCategoryStore } from 'src/stores/categoryStore'
import { useSupplierStore } from 'src/stores/supplierStore'

import NewReferenceDialog from 'src/components/dashboard/references/NewReferenceDialog.vue'
import NewCategoryDialog  from 'src/components/dashboard/categories/NewCategoryDialog.vue'
import NewSupplierDialog  from 'src/components/dashboard/suppliers/NewSupplierDialog.vue'

const $q = useQuasar()
const referenceStore = useReferenceStore()
const categoryStore  = useCategoryStore()
const supplierStore  = useSupplierStore()

/* Dialogs create */
const showNewReference = ref(false)
const showNewCategory  = ref(false)
const showNewSupplier  = ref(false)

/* Colonne tabella (abilito sort su category/supplier e colonna azioni) */
const columns = [
  { name: 'name',     label: 'Nome',      field: 'name',     align: 'left',  sortable: true  },
  { name: 'category', label: 'Categoria', field: 'category', align: 'left',  sortable: true  },
  { name: 'unit',     label: 'Unità',     field: 'unit',     align: 'left' },
  { name: 'supplier', label: 'Fornitore', field: 'supplier', align: 'left',  sortable: true  },
  { name: 'price',    label: 'Prezzo',    field: 'price',    align: 'right', sortable: true  },
  { name: 'status',   label: 'Stato',     field: 'status',   align: 'left'  },
  { name: 'actions',  label: '',          field: 'actions',  align: 'right' }
]

/* Colonne visibili per TABella (mobile-first) */
const allCols = ['name','category','unit','supplier','price','status','actions']
const mobileCols = ['name','price','status','actions']
const visibleColumns = computed(() =>
  viewMode.value === 'table' && $q.screen.lt.md ? mobileCols : allCols
)

/* Select Ordina (Nome/Prezzo) */
const sortOptions = [
  { label: 'A → Z',              value: 'alpha_asc'  },
  { label: 'Z → A',              value: 'alpha_desc' },
  { label: 'Prezzo crescente',   value: 'price_asc'  },
  { label: 'Prezzo decrescente', value: 'price_desc' }
]
const localSort = ref('alpha_asc')
const selectableSorts = new Set(['alpha_asc','alpha_desc','price_asc','price_desc'])

/* Toggle vista */
const viewMode = ref($q.screen.lt.md ? 'grid' : 'table')
const isGrid  = computed(() => viewMode.value === 'grid')
const isDense = computed(() => isGrid.value || $q.screen.lt.md)

/* Paginazione + sort header */
const pagination = reactive({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
  sortBy: 'name',
  descending: false
})

/* Helpers visuali */
function formatPrice (n) {
  try { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(n)) }
  catch { return n }
}
function getCategoryName (cat) {
  if (!cat) return '-'
  if (cat.name) return cat.name
  if (cat._ref) {
    const c = categoryStore.categories.find(x => x._id === cat._ref)
    return c?.name || cat._ref
  }
  return String(cat)
}
function getSupplierName (sup) {
  if (!sup) return '-'
  if (sup.name) return sup.name
  if (sup._ref) {
    const s = supplierStore.suppliers.find(x => x._id === sup._ref)
    return s?.name || sup._ref
  }
  return String(sup)
}

/* Mapping sort header <-> API (nome/prezzo/categoria/fornitore) */
function headerToApiSort (sortBy, descending) {
  if (sortBy === 'name')     return descending ? 'alpha_desc'    : 'alpha_asc'
  if (sortBy === 'price')    return descending ? 'price_desc'    : 'price_asc'
  if (sortBy === 'category') return descending ? 'category_desc' : 'category_asc'
  if (sortBy === 'supplier') return descending ? 'supplier_desc' : 'supplier_asc'
  return 'alpha_asc'
}
function apiToHeaderSort (apiSort) {
  switch (apiSort) {
    case 'alpha_asc':     return { sortBy: 'name',     descending: false }
    case 'alpha_desc':    return { sortBy: 'name',     descending: true  }
    case 'price_asc':     return { sortBy: 'price',    descending: false }
    case 'price_desc':    return { sortBy: 'price',    descending: true  }
    case 'category_asc':  return { sortBy: 'category', descending: false }
    case 'category_desc': return { sortBy: 'category', descending: true  }
    case 'supplier_asc':  return { sortBy: 'supplier', descending: false }
    case 'supplier_desc': return { sortBy: 'supplier', descending: true  }
    default:              return { sortBy: 'name',     descending: false }
  }
}

/* FETCH (no filtri) */
async function fetchPage ({ preservePage = false } = {}) {
  if (!preservePage) pagination.page = 1
  const sortForApi = headerToApiSort(pagination.sortBy, pagination.descending)

  await referenceStore.fetchReferences({
    sort: sortForApi,
    page: pagination.page,
    pageSize: pagination.rowsPerPage
  })

  pagination.rowsNumber = referenceStore.criteria.total || referenceStore.references.length || 0

  if (selectableSorts.has(sortForApi) && localSort.value !== sortForApi) {
    localSort.value = sortForApi
  }
}

/* QTable request */
async function onRequest (req) {
  const { page, rowsPerPage, sortBy, descending } = req.pagination
  pagination.page = page
  pagination.rowsPerPage = rowsPerPage
  if (sortBy) {
    pagination.sortBy = sortBy
    pagination.descending = !!descending
  }
  await fetchPage({ preservePage: true })
}

/* Refresh manuale */
function refresh () { fetchPage({ preservePage: false }) }

/* Cambia select Ordina */
watch(localSort, (val) => {
  const { sortBy, descending } = apiToHeaderSort(val)
  pagination.sortBy = sortBy
  pagination.descending = descending
  fetchPage({ preservePage: false })
})

/* === Azioni riga === */
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
        await api.delete(`references/${row._id}`)
      }
      $q.notify({ type: 'positive', message: 'Referenza eliminata' })
      await fetchPage({ preservePage: true })
    } catch (e) {
      console.error(e)
      $q.notify({
        type: 'negative',
        message: 'Impossibile eliminare. Verifica che esista DELETE /references/:id'
      })
    }
  })
}

/* Dialog Modifica (integrata) */
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

/* stesse opzioni unità del dialog Nuovo */
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
  // Precarica dati
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
    await fetchPage({ preservePage: true })
  } catch (e) {
    console.error(e)
    $q.notify({
      type: 'negative',
      message: 'Impossibile aggiornare. Verifica che esista PATCH /references/:id'
    })
  } finally {
    savingEdit.value = false
  }
}

/* CREA handlers */
async function handleReferenceCreated (doc) {
  try {
    const created = await referenceStore.createReference(doc)
    $q.notify({ type: 'positive', message: `Referenza "${created.name}" creata` })
    await fetchPage({ preservePage: true })
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

  const { sortBy, descending } = apiToHeaderSort(localSort.value)
  pagination.sortBy = sortBy
  pagination.descending = descending

  await fetchPage({ preservePage: false })
})
</script>
