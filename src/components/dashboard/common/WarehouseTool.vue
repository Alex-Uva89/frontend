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

          <!-- Select Ordina (solo Nome/Prezzo) -->
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

        <!-- Toggle vista: Tabella / Griglia -->
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
        row-key="_id"
        flat
        :loading="referenceStore.loading"
        :pagination="pagination"
        :rows-per-page-options="[10,25,50,100]"
        :no-data-label="referenceStore.loading ? 'Caricamento…' : 'Nessuna referenza'"
        binary-state-sort
        @request="onRequest"
        :dense="isDense"
        :grid="isGrid"
      >
        <!-- ===== GRID (card) ===== -->
        <template #item="it">
          <div class="q-pa-sm col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
            <q-card flat bordered>
              <q-item>
                <q-item-section>
                  <div class="text-subtitle2">{{ it.row.name }}</div>
                  <div v-if="it.row.notes" class="text-caption text-grey-7">{{ it.row.notes }}</div>
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
      </q-table>
    </q-card>

    <!-- DIALOGS -->
    <new-reference-dialog v-model="showNewReference" @created="handleReferenceCreated" />
    <new-category-dialog  v-model="showNewCategory"  @created="handleCategoryCreated" />
    <new-supplier-dialog  v-model="showNewSupplier"  @created="handleSupplierCreated" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
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

// dialogs
const showNewReference = ref(false)
const showNewCategory  = ref(false)
const showNewSupplier  = ref(false)

// colonne (desktop) — abilito sort anche su categoria e fornitore
const columns = [
  { name: 'name',     label: 'Nome',      field: 'name',     align: 'left',  sortable: true  },
  { name: 'category', label: 'Categoria', field: 'category', align: 'left',  sortable: true  },
  { name: 'unit',     label: 'Unità',     field: 'unit',     align: 'left',  sortable: false },
  { name: 'supplier', label: 'Fornitore', field: 'supplier', align: 'left',  sortable: true  },
  { name: 'price',    label: 'Prezzo',    field: 'price',    align: 'right', sortable: true  },
  { name: 'status',   label: 'Stato',     field: 'status',   align: 'left',  sortable: false }
]

// select Ordina (solo nome/prezzo)
const sortOptions = [
  { label: 'A → Z',              value: 'alpha_asc'  },
  { label: 'Z → A',              value: 'alpha_desc' },
  { label: 'Prezzo crescente',   value: 'price_asc'  },
  { label: 'Prezzo decrescente', value: 'price_desc' }
]
const localSort = ref('alpha_asc')
const selectableSorts = new Set(['alpha_asc','alpha_desc','price_asc','price_desc'])

// toggle vista
const viewMode = ref($q.screen.lt.md ? 'grid' : 'table')
const isGrid  = computed(() => viewMode.value === 'grid')
const isDense = computed(() => isGrid.value || $q.screen.lt.md)

// paginazione + sort header
const pagination = reactive({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
  sortBy: 'name',
  descending: false
})

// helpers
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

// mapping sort header <-> API (aggiungo category/supplier)
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

// fetch (no filtri)
async function fetchPage ({ preservePage = false } = {}) {
  if (!preservePage) pagination.page = 1
  const sortForApi = headerToApiSort(pagination.sortBy, pagination.descending)

  await referenceStore.fetchReferences({
    sort: sortForApi,
    page: pagination.page,
    pageSize: pagination.rowsPerPage
  })

  pagination.rowsNumber = referenceStore.criteria.total || referenceStore.references.length || 0

  // riallinea la select SOLO se il sort è tra quelli gestiti dalla select (nome/prezzo)
  if (selectableSorts.has(sortForApi) && localSort.value !== sortForApi) {
    localSort.value = sortForApi
  }
}

// richiesta tabella (pagina/sort)
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

// refresh
function refresh () { fetchPage({ preservePage: false }) }

// cambio select “Ordina” (nome/prezzo)
watch(localSort, (val) => {
  const { sortBy, descending } = apiToHeaderSort(val)
  pagination.sortBy = sortBy
  pagination.descending = descending
  fetchPage({ preservePage: false })
})

// CREAZIONI
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

// bootstrap
onMounted(async () => {
  categoryStore.fetchCategories()
  supplierStore.fetchSuppliers()

  const { sortBy, descending } = apiToHeaderSort(localSort.value)
  pagination.sortBy = sortBy
  pagination.descending = descending

  await fetchPage({ preservePage: false })
})
</script>
