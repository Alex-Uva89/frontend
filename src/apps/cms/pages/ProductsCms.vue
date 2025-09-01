<!-- /frontend/src/apps/cms/pages/ProductsCms.vue -->
<template>
  <q-page class="q-pa-md">
    <!-- ====== HERO ====== -->
    <div class="text-h5 q-mb-md">Prodotti</div>
    <q-card flat class="hero q-pa-md q-mb-md rounded-borders shadow-2">
      <div class="column q-gutter-sm">
        <div class="row items-center justify-between no-wrap">
          <q-chip v-if="businessName" color="white" text-color="primary" icon="storefront" class="q-ml-sm">
            {{ businessName }}
          </q-chip>

          <q-select
            v-if="canSeeAllBusinesses"
            dense filled behavior="menu" emit-value map-options class="hero-input"
            :options="(businessStore.businesses || []).map(b => ({ label: b.name, value: b._id }))"
            v-model="usersStore.selectedBusinessId"
            placeholder="Seleziona locale"
            style="width: fit-content"
          >
            <template #prepend><q-icon name="storefront" class="text-white" /></template>
          </q-select>
        </div>

        <div class="text-caption text-white opacity-80">Gestione per categoria & ordine</div>

        <q-banner v-if="!businessId" dense class="bg-amber-3 text-amber-10 q-mt-sm rounded-borders">
          <q-icon name="info" class="q-mr-sm" />Nessun locale attivo. Associa un <b>business</b> all'utente o seleziona un locale.
        </q-banner>

        <div class="row q-col-gutter-sm items-center q-mt-xs">
          <q-select
            v-model="selectedCategoryId"
            :options="categoryOptionsWithAll"
            option-label="label" option-value="id"
            emit-value map-options dense filled clearable
            class="col-12 col-md-4 hero-input"
            label="Categoria"
            :disable="!businessId || !categoriesTree.length"
          >
            <template #prepend><q-icon name="category" class="text-white" /></template>
          </q-select>

          <q-input
            v-model="search" dense filled clearable debounce="200"
            placeholder="Cerca prodotto…" class="col-12 col-md hero-input"
            input-class="text-white" :disable="!businessId"
          >
            <template #prepend><q-icon name="search" class="text-white" /></template>
          </q-input>

          <q-btn color="white" text-color="primary" icon="print" class="q-ml-sm"
                 label="Anteprima menù" :disable="!businessId" @click="menuPrintOpen = true" />
        </div>

        <div v-if="search" class="row items-center q-gutter-sm q-mt-xs">
          <q-chip dense color="amber-4" text-color="black" icon="info">Filtro attivo: drag & drop disabilitato</q-chip>
        </div>
      </div>
    </q-card>

    <!-- ====== STATI ====== -->
    <q-skeleton v-if="loading" type="rect" height="220px" class="rounded-borders" />
    <q-banner v-else-if="error" type="negative" dense class="q-mb-md">{{ error }}</q-banner>

    <!-- ====== CONTENUTO ====== -->
    <div v-else>
      <q-banner v-if="!canReadProducts" class="q-mb-md" type="warning" dense>
        Non hai i permessi per visualizzare i prodotti.
      </q-banner>

      <q-banner v-else-if="!businessId" class="q-mb-md" type="warning" dense>
        Seleziona/associa un locale per visualizzare categorie e prodotti.
      </q-banner>

      <q-banner v-else-if="!categoriesTree.length" class="q-mb-md" type="warning" dense>
        Nessuna categoria disponibile per questo locale.
      </q-banner>

      <div v-else>
        <q-expansion-item
          v-for="cat in visibleCategories" :key="cat._id"
          expand-separator class="rounded-borders q-mb-sm bg-white"
        >
          <template #header="props">
            <q-item clickable v-ripple :class="props.headerClass" @click="props.toggle" :title="cat.fullPath" style="width: 100%;">
              <q-item-section avatar><q-icon name="category" /></q-item-section>
              <q-item-section>
                <div class="row items-center no-wrap">
                  <div class="col ellipsis">{{ cat.title }}</div>
                  <q-chip dense color="primary" text-color="white" icon="inventory_2" class="q-ml-sm">
                    {{ (listsByCat[cat._id] || []).length }}
                  </q-chip>
                </div>
              </q-item-section>
            </q-item>
          </template>

          <div class="row items-center q-gutter-sm q-pa-sm">
            <q-space />
            <q-badge v-if="savingOrder" color="grey-6" outline>salvataggio…</q-badge>
          </div>
          <q-separator />

          <div class="q-pa-sm">
            <Draggable
              :list="listsByCat[cat._id]" item-key="_id" handle=".drag-handle"
              :disabled="disableDrag" @end="onDragEnd(cat._id)" class="comfy-list"
            >
              <template #item="{ element: prod }">
                <div v-show="matchesSearch(prod)" class="row items-center justify-between q-pa-sm q-mb-xs rounded-borders item-row">
                  <div class="row items-center col">
                    <q-icon name="drag_indicator" class="q-mr-sm drag-handle" v-if="!disableDrag" />
                    <q-avatar square size="64px" class="thumb q-mr-sm">
                      <img v-if="prod.imageUrl" :src="prod.imageUrl" :alt="prod.name" loading="lazy" />
                      <q-icon v-else name="image_not_supported" />
                    </q-avatar>
                    <div class="column col">
                      <div class="title text-body1 line-clamp-2">{{ prod.name }}</div>
                      <div class="row items-center no-wrap q-mt-2">
                        <div class="text-caption text-grey-7 caption-ellipsis">
                          <!-- SKU (senza segnaposto). Il separatore '·' appare solo se esiste almeno un prezzo -->
                          <template v-if="prod.sku">
                            {{ prod.sku }}
                            <span class="q-mx-xs" v-if="hasAnyPrice(prod)">·</span>
                          </template>

                          <!-- Prezzi: se esistono calice/bottiglia mostro SOLO loro; altrimenti SOLO price -->
                          <template v-if="hasWinePrices(prod)">
                            <span v-if="isNumber(getGlassPrice(prod))">
                              {{ formatMoney(getGlassPrice(prod)) }}
                            </span>
                            <span v-if="isNumber(getBottlePrice(prod))" class="q-ml-xs">
                              <span class="q-mx-xs" v-if="isNumber(getGlassPrice(prod)) && isNumber(getBottlePrice(prod))">·</span>
                              {{ formatMoney(getBottlePrice(prod)) }}
                            </span>
                          </template>
                          <template v-else>
                            <span v-if="isNumber(prod.price)">{{ formatMoney(prod.price) }}</span>
                            <span v-else>prezzo n/d</span>
                          </template>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="row items-center q-gutter-xs actions-col">
                    <q-toggle
                      dense :model-value="prod.active !== false"
                      :disable="!canUpdateProducts || busyToggle.has(prod._id)"
                      @update:model-value="val => onToggleActive(prod._id, val)"
                    />
                    <q-btn dense flat round icon="edit" :disable="!canUpdateProducts" @click="openEdit(prod._id)" />
                    <q-btn dense flat round icon="delete" color="negative" :disable="!canDeleteProducts" @click="confirmDelete(prod._id, prod.name)" />
                  </div>
                </div>
              </template>
            </Draggable>

            <div v-if="(listsByCat[cat._id] || []).filter(matchesSearch).length === 0" class="q-pa-sm text-grey-7">
              Nessun prodotto in questa categoria{{ search ? ' (con il filtro attivo)' : '' }}.
            </div>
          </div>
        </q-expansion-item>
      </div>
    </div>

    <!-- ====== DIALOG EDIT ====== -->
    <q-dialog v-model="editor.open" persistent :maximized="$q.screen.lt.md">
      <q-card style="width: 720px; max-width: 95vw">
        <q-toolbar>
          <q-btn flat round dense icon="arrow_back" v-close-popup />
          <q-toolbar-title>Modifica prodotto</q-toolbar-title>
          <q-btn flat dense icon="save" color="primary" :loading="editor.saving" :disable="!canUpdateProducts" @click="saveEdit" />
        </q-toolbar>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8">
              <q-input v-model="editor.form.name" label="Nome *" dense outlined :rules="[rRequired]" />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="editor.form.sku" label="SKU" dense outlined />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model.number="editor.form.price" type="number" step="0.01" label="Prezzo" dense outlined />
            </div>
            <div class="col-12 col-md-4 flex items-center">
              <q-toggle v-model="editor.form.active" label="Attivo" />
            </div>
          </div>
          <q-input v-model="editor.form.description" type="textarea" autogrow dense outlined label="Descrizione" class="q-mt-md" />
          <q-input v-model="editor.form.notes" type="textarea" autogrow dense outlined label="Note interne" class="q-mt-sm" />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Annulla" v-close-popup />
          <q-btn color="primary" label="Salva" :loading="editor.saving" :disable="!canUpdateProducts" @click="saveEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <MenuPrintDialog
      v-model="menuPrintOpen"
      :businessName="businessName"
      :categoriesTree="categoriesTree"
      :products="allProducts"
      :attributes="printAttributes"
      :language="menuLang"
      :usePathInHeaders="false"
      :coverCharge="null"
    />
  </q-page>
</template>

<script setup>
// Vue & Quasar
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import MenuPrintDialog from 'src/components/print/MenuPrintDialog.vue'

// DnD
import Draggable from 'vuedraggable'

// App
import { api } from 'boot/axios'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'
import { PERM } from 'src/auth/perm'

const $q = useQuasar()
const API = import.meta.env.VITE_API_URL

const menuPrintOpen = ref(false)
const menuLang = ref('it')
const printAttributes = ref([]) // per la stampa

/* ================== STORE & PERMESSI ================== */
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

const canSeeAllBusinesses = computed(() => {
  const perm = usersStore.currentUser?.perm ?? 0
  return (perm & PERM.MANAGE_ALL_BUSINESSES) !== 0
})
const businessId = computed(() => {
  if (canSeeAllBusinesses.value) {
    return usersStore.selectedBusinessId || usersStore.currentUser?.primaryBusinessId || null
  }
  return usersStore.currentUser?.primaryBusinessId || usersStore.currentUser?.business?._id || null
})
const businessName = computed(() => {
  const id = businessId.value
  const found = (businessStore.businesses || []).find(b => b._id === id)
  return found?.name || usersStore.currentUser?.business?.name || (businessStore.currentBusiness?.name) || ''
})

const canReadProducts = computed(() => {
  const p = usersStore.currentUser?.perm ?? 0
  return !!(p & (PERM.PRODUCTS_READ | PERM.PRODUCTS_CREATE | PERM.PRODUCTS_UPDATE | PERM.PRODUCTS_DELETE | PERM.PRODUCTS_WRITE))
})
const canUpdateProducts = computed(() => {
  const p = usersStore.currentUser?.perm ?? 0
  return !!(p & (PERM.PRODUCTS_UPDATE | PERM.PRODUCTS_WRITE))
})
const canDeleteProducts = computed(() => {
  const p = usersStore.currentUser?.perm ?? 0
  return !!(p & (PERM.PRODUCTS_DELETE | PERM.PRODUCTS_WRITE))
})

/* ================== STATE ================== */
const loading = ref(false)
const error = ref(null)
const search = ref('')
const selectedCategoryId = ref(null)

const categoriesTree = ref([])
const allProducts = ref([])
const listsByCat = ref({})

const savingOrder = ref(false)
const busyToggle = ref(new Set())

/* ================== EDITOR ================== */
const editor = ref({
  open: false,
  saving: false,
  id: null,
  form: { name: '', sku: '', price: null, active: true, description: '', notes: '' }
})

/* ================== BOOTSTRAP ================== */
onMounted(async () => {
  if (!usersStore.currentUser && usersStore.token) {
    try { await usersStore.fetchCurrentUser() } catch (e) { console.log(e) }
  }
  if (!businessStore.businesses?.length) {
    try { await businessStore.fetchBusinesses() } catch (e) { console.log(e) }
  }
  await initialLoad()
})
watch(businessId, async () => {
  selectedCategoryId.value = null
  await initialLoad()
})
async function initialLoad () {
  if (!canReadProducts.value || !businessId.value) return
  loading.value = true; error.value = null
  try {
    await Promise.all([loadCategories(), loadProducts(), loadAttributes()])
    rebuildLists()
  } catch (e) {
    error.value = e?.message || 'Errore di caricamento'
  } finally {
    loading.value = false
  }
}

/* ================== API LOAD ================== */
async function loadCategories () {
  const { data: json } = await api.get(`${API}/cms/categories`, {
    params: { includeHidden: 1, businessId: businessId.value }
  })
  if (!json?.ok) throw new Error(json?.error || 'Errore categorie')
  categoriesTree.value = json.data || []
}

// coercizione a numero monetario positivo: 0 o valori non validi -> null
function toMoney (v) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

async function loadProducts () {
  const { data: json } = await api.get(`${API}/cms/products`, {
    params: { businessId: businessId.value }
  })
  if (!json?.ok) throw new Error(json?.error || 'Errore prodotti')
  // Normalizzo per la UI: per i vini 0 viene considerato "assenza"
  const rows = (json.data || []).map(p => {
    const glass  = (typeof p.priceGlass  !== 'undefined') ? p.priceGlass  : (p?.prices?.glass  ?? null)
    const bottle = (typeof p.priceBottle !== 'undefined') ? p.priceBottle : (p?.prices?.bottle ?? null)
    return {
      ...p,
      _priceGlass: toMoney(glass),
      _priceBottle: toMoney(bottle),
      price: toMoney(p.price)
    }
  })
  allProducts.value = rows
}
async function loadAttributes () {
  const { data: json } = await api.get(`${API}/cms/attributes`)
  if (!json?.ok) throw new Error(json?.error || 'Errore attributi')
  printAttributes.value = json.data || []
}

/* ================== CATEGORIE: util & visibilità ================== */
function cmpOrderTitle(a, b) {
  const ao = (a?.order ?? 0)
  const bo = (b?.order ?? 0)
  if (ao !== bo) return ao - bo
  return (a?.title || '').localeCompare(b?.title || '')
}
function sortKids(arr) { return [...(arr || [])].sort(cmpOrderTitle) }

function buildParentMap (tree) {
  const map = new Map()
  const walk = (n) => { sortKids(n.children).forEach(c => { map.set(c._id, n._id); walk(c) }) }
  ;(tree || []).forEach(walk)
  return map
}
const parentOf = computed(() => buildParentMap(categoriesTree.value))

const catById = computed(() => {
  const m = new Map()
  const walk = (n) => { m.set(n._id, n); sortKids(n.children).forEach(walk) }
  ;(categoriesTree.value || []).forEach(walk)
  return m
})
function categoryPathLabel (id) {
  const parts = []; let cur = id
  while (cur) { const n = catById.value.get(cur); if (!n) break; parts.push(n.title); cur = parentOf.value.get(cur) }
  return parts.reverse().join(' / ')
}

const categoryOptions = computed(() => {
  const out = []
  const walk = (n, path) => {
    const label = path ? `${path} / ${n.title}` : n.title
    out.push({ id: n._id, label, order: n.order ?? 0 })
    sortKids(n.children).forEach(c => walk(c, label))
  }
  ;(categoriesTree.value || []).forEach(r => walk(r, ''))
  out.sort(cmpOrderTitle)
  return out
})
const categoryOptionsWithAll = computed(() => [{ id: null, label: '— Tutte le categorie —' }, ...categoryOptions.value])

function leafIdsUnder (rootId = null) {
  const ids = []
  const startNodes = rootId ? [catById.value.get(rootId)].filter(Boolean) : (categoriesTree.value || [])
  const walk = (n) => {
    if (!n) return
    const children = sortKids(n.children)
    if (children.length === 0) ids.push(n._id); else children.forEach(walk)
  }
  startNodes.forEach(walk)
  return ids
}

const visibleCategories = computed(() => {
  const targetId = selectedCategoryId.value
  const leafIds = targetId ? leafIdsUnder(targetId) : leafIdsUnder(null)
  return leafIds.map(id => ({
    _id: id,
    title: catById.value.get(id)?.title || '',
    fullPath: categoryPathLabel(id)
  }))
})

/* ================== LISTE PER CATEGORIA ================== */
function rebuildLists () {
  const map = {}
  for (const c of categoryOptions.value) map[c.id] = []
  for (const p of (allProducts.value || [])) {
    const cats = (p.categories || []).map(c => c?._id).filter(Boolean)
    for (const cid of cats) {
      if (!map[cid]) map[cid] = []
      map[cid].push(p)
    }
  }
  listsByCat.value = map
}

function matchesSearch (p) {
  const term = String(search.value || '').trim().toLowerCase()
  if (!term) return true
  return (p.name || '').toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term)
}

/* ================== PREZZI (vino / standard) ================== */
// numero valido?
function isNumber (v) { return typeof v === 'number' && Number.isFinite(v) }
// numero monetario positivo
function isPositive (v) { return typeof v === 'number' && Number.isFinite(v) && v > 0 }

// getter normalizzati per calice/bottiglia
function getGlassPrice (p) {
  if (isPositive(p._priceGlass)) return p._priceGlass
  if (isPositive(p?.prices?.glass)) return p.prices.glass
  if (isPositive(p?.priceGlass)) return p.priceGlass
  return null
}
function getBottlePrice (p) {
  if (isPositive(p._priceBottle)) return p._priceBottle
  if (isPositive(p?.prices?.bottle)) return p.prices.bottle
  if (isPositive(p?.priceBottle)) return p.priceBottle
  return null
}

/**
 * Mostro i prezzi "vino" SOLO se esistono **entrambi** (calice e bottiglia) e sono > 0.
 */
function hasWinePrices (p) {
  const g = getGlassPrice(p)
  const b = getBottlePrice(p)
  return isPositive(g) && isPositive(b)
}

/**
 * C'è almeno un prezzo da mostrare? (coppia vino **oppure** price singolo > 0)
 * Serve anche per decidere se mostrare il separatore "·" dopo lo SKU.
 */
function hasAnyPrice (p) {
  return hasWinePrices(p) || isPositive(p.price)
}

function formatMoney (n) { return isNumber(n) ? n.toFixed(2) : '' } // nessun simbolo di valuta

/* ================== DnD & SALVATAGGIO ================== */
const disableDrag = computed(() => !canUpdateProducts.value || !!search.value || savingOrder.value)
async function saveGlobalOrderFromGroup (groupList) {
  if (savingOrder.value) return
  savingOrder.value = true
  try {
    const global = (allProducts.value || []).slice()
    const setIds = new Set((groupList || []).map(p => p._id))
    const slots = []
    for (let i = 0; i < global.length; i++) { if (setIds.has(global[i]._id)) slots.push(i) }
    if (!slots.length) { savingOrder.value = false; return }
    ;(groupList || []).forEach((p, idx) => { global[slots[idx]] = p })
    const productIds = global.map(p => p._id)
    const { data: json } = await api.put(`${API}/cms/products/order`, { productIds })
    if (!json?.ok) throw new Error(json?.error || 'save order failed')
    allProducts.value = global
    rebuildLists()
    $q.notify({ type: 'positive', message: 'Ordine salvato' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'Impossibile salvare ordine' })
    rebuildLists()
  } finally {
    savingOrder.value = false
  }
}
function onDragEnd (catId) {
  const list = listsByCat.value[catId] || []
  saveGlobalOrderFromGroup(list)
}

/* ================== AZIONI PRODOTTO ================== */
async function onToggleActive (id, nextVal) {
  if (!canUpdateProducts.value || !id) return
  busyToggle.value.add(id)
  try {
    const { data: json } = await api.put(`${API}/cms/products/${encodeURIComponent(id)}`, { active: !!nextVal })
    if (!json?.ok) throw new Error(json?.error || 'update failed')
    const idx = (allProducts.value || []).findIndex(p => p._id === id)
    if (idx >= 0) allProducts.value[idx] = { ...allProducts.value[idx], active: !!nextVal }
    for (const arr of Object.values(listsByCat.value)) {
      const i = (arr || []).findIndex(p => p._id === id)
      if (i >= 0) arr[i] = { ...arr[i], active: !!nextVal }
    }
    $q.notify({ type: 'positive', message: nextVal ? 'Prodotto attivato' : 'Prodotto disattivato' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'Impossibile aggiornare' })
  } finally {
    busyToggle.value.delete(id)
  }
}
function openEdit (id) {
  editor.value = { open: true, saving: false, id, form: { name: '', sku: '', price: null, active: true, description: '', notes: '' } }
  loadOneForEdit(id)
}
async function loadOneForEdit (id) {
  try {
    const { data: json } = await api.get(`${API}/cms/products/${encodeURIComponent(id)}`)
    if (!json?.ok || !json?.data) throw new Error('fetch failed')
    const p = json.data
    editor.value.form = {
      name: p.name || '', sku: p.sku || '', price: toMoney(p.price),
      active: p.active !== false, description: p.description || '', notes: p.notes || ''
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'Impossibile caricare il prodotto' })
    editor.value.open = false
  }
}
async function saveEdit () {
  if (!canUpdateProducts.value) return
  if (!editor.value.id || !editor.value.form.name) {
    $q.notify({ type: 'warning', message: 'Nome obbligatorio' }); return
  }
  editor.value.saving = true
  try {
    const payload = {
      name: editor.value.form.name,
      sku: editor.value.form.sku || '',
      price: editor.value.form.price ?? null,
      active: !!editor.value.form.active,
      description: editor.value.form.description || '',
      notes: editor.value.form.notes || ''
    }
    const { data: json } = await api.put(`${API}/cms/products/${encodeURIComponent(editor.value.id)}`, payload)
    if (!json?.ok) throw new Error(json?.error || 'update failed')
    const id = editor.value.id
    const idx = (allProducts.value || []).findIndex(p => p._id === id)
    if (idx >= 0) allProducts.value[idx] = { ...allProducts.value[idx], ...payload }
    for (const arr of Object.values(listsByCat.value)) {
      const i = (arr || []).findIndex(p => p._id === id)
      if (i >= 0) arr[i] = { ...arr[i], ...payload }
    }
    $q.notify({ type: 'positive', message: 'Prodotto aggiornato' })
    editor.value.open = false
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'Salvataggio fallito' })
  } finally {
    editor.value.saving = false
  }
}
function confirmDelete (id, name = '') {
  if (!canDeleteProducts.value) return
  $q.dialog({
    title: 'Elimina prodotto',
    message: `Confermi l'eliminazione definitiva di <b>${name || 'prodotto'}</b>?`,
    html: true, cancel: true, persistent: true,
    ok: { label: 'Elimina', color: 'negative' }
  }).onOk(() => doDelete(id))
}
async function doDelete (id) {
  try {
    const { data: json } = await api.delete(`${API}/cms/products/${encodeURIComponent(id)}`)
    if (!json?.ok) throw new Error(json?.error || 'delete failed')
    allProducts.value = (allProducts.value || []).filter(p => p._id !== id)
    for (const key of Object.keys(listsByCat.value)) {
      listsByCat.value[key] = (listsByCat.value[key] || []).filter(p => p._id !== id)
    }
    $q.notify({ type: 'positive', message: 'Prodotto eliminato' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'Eliminazione fallita' })
  }
}

/* ================== VALIDAZIONI ================== */
const rRequired = v => (v && String(v).trim().length > 0) || 'Obbligatorio'
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #6a5acd, #7b68ee, #00bcd4);
}
.hero-input :deep(.q-field__native),
.hero-input :deep(.q-field__prefix),
.hero-input :deep(.q-field__suffix),
.hero-input :deep(.q-field__input) { color: #fff !important; }
.hero-input :deep(.q-field__control) {
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(6px);
  border-radius: 12px;
}

.item-row { background: var(--q-surface, #fff); border: 1px solid rgba(0,0,0,0.06); }
.body--dark .item-row { background: rgba(255,255,255,0.04); border-color: rgba(0,0,0,0.08); }

.thumb { background: #f5f5f5; border-radius: 10px; overflow: hidden; }
.item-row :deep(.q-avatar img) { width: 100%; height: 100%; object-fit: cover; }

.line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.caption-ellipsis { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.actions-col { flex: 0 0 auto; }

.comfy-list :deep(.q-item) { min-height: 64px; }

.drag-handle { cursor: grab; }
.drag-handle:active { cursor: grabbing; }
</style>
