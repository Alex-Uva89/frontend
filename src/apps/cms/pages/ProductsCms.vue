<!-- src/apps/cms/pages/ProductsCms.vue -->
<template>
  <q-page class="q-pa-md">
    <!-- HERO (mobile-first) -->
    <q-card flat class="hero q-pa-md q-mb-md rounded-borders shadow-2">
      <div class="column q-gutter-sm">
        <div class="text-h5 text-white">Prodotti</div>
        <div class="text-caption text-white opacity-80">Gestione per categoria & ordine</div>

        <div class="row q-col-gutter-sm items-center">
          <!-- Categoria -->
          <q-select
            v-model="selectedCategoryId"
            :options="categoryOptionsWithAll"
            option-label="label"
            option-value="id"
            emit-value
            map-options
            dense
            filled
            clearable
            class="col-12 col-md-4 hero-input"
            label="Categoria"
            @update:model-value="onCategoryChange"
          >
            <template #prepend><q-icon name="category" class="text-white" /></template>
          </q-select>

          <!-- Ricerca -->
          <q-input
            v-model="search"
            dense
            filled
            clearable
            debounce="200"
            placeholder="Cerca prodotto…"
            class="col-12 col-md hero-input"
            input-class="text-white"
          >
            <template #prepend><q-icon name="search" class="text-white" /></template>
            <template #append>
              <q-btn v-if="search" flat round dense icon="close" class="text-white" @click="search=''" />
            </template>
          </q-input>

          <!-- Nuovo prodotto -->
          <div class="col-12 col-md-auto">
            <q-btn
              color="white"
              text-color="primary"
              icon="add_circle"
              label="Nuovo prodotto"
              class="full-width"
              @click="openCreateProduct"
            />
          </div>
        </div>

        <!-- Toggle “solo diretti” (solo se c’è una categoria selezionata) -->
        <div v-if="selectedCategoryId" class="row items-center q-gutter-sm q-mt-xs">
          <q-toggle
            v-model="onlyDirect"
            color="white"
            keep-color
            :disable="!!search"
            :label="onlyDirect ? 'Solo diretti (ordinabili)' : 'Tutto il subalbero (solo lettura)'"
          />
          <q-chip v-if="search" dense color="amber-4" text-color="black" icon="info">
            Filtra attivo: riordino disabilitato
          </q-chip>
        </div>
      </div>
    </q-card>

    <!-- Stati -->
    <q-skeleton v-if="loading" type="rect" height="220px" class="rounded-borders" />
    <q-banner v-else-if="error" type="negative" dense class="q-mb-md">{{ error }}</q-banner>

    <!-- CONTENUTO -->
    <div v-else>
      <!-- Nessuna categoria selezionata: tutte le referenze divise per root -->
      <div v-if="!selectedCategoryId">
        <q-expansion-item
          v-for="root in rootCategoryGroups"
          :key="root.id"
          expand-separator
          icon="category"
          :label="root.label"
          default-opened
          class="rounded-borders q-mb-sm bg-white"
        >
          <div class="row items-center q-gutter-sm q-pa-sm">
            <q-chip color="primary" text-color="white" icon="inventory_2">
              {{ filteredFlatByRoot[root.id]?.length || 0 }} prodotti
            </q-chip>
          </div>

          <q-separator />

          <div class="q-pa-sm">
            <!-- read-only: uso modelValue + draggable=false -->
            <Draggable
              :modelValue="filteredFlatByRoot[root.id]"
              :indent="0"
              class="comfy-list dnd-disabled"
              :draggable="false"
            >
              <template #default="{ node }">
                <div class="row items-center justify-between q-pa-sm q-mb-xs rounded-borders item-row">
                  <div class="row items-center col">
                    <q-icon name="inventory_2" class="q-mr-sm" />
                    <div class="column">
                      <div class="text-body1">{{ node.label }}</div>
                      <div class="text-caption text-grey-7">
                        {{ node.sku || '' }}
                        <span v-if="node.sku" class="q-mx-sm">|</span>
                        <span v-if="typeof node.price === 'number'">€ {{ node.price.toFixed(2) }}</span>
                        <span v-else>prezzo n/d</span>
                      </div>
                    </div>
                  </div>
                  <div class="row items-center q-gutter-xs">
                    <q-chip v-if="node.path" dense outline color="primary">{{ node.path }}</q-chip>
                    <q-chip v-if="!node.active" dense color="grey-4" text-color="grey-9">non attivo</q-chip>
                    <q-btn dense flat round icon="edit" @click="openEditFromItem(node.id)" />
                    <q-btn dense flat round icon="delete" color="negative" @click="askDeleteProduct(node.id)" />
                  </div>
                </div>
              </template>
            </Draggable>

            <div v-if="!filteredFlatByRoot[root.id]?.length" class="q-pa-md text-grey-7">
              Nessun prodotto in questa categoria.
            </div>
          </div>
        </q-expansion-item>
      </div>

      <!-- Categoria selezionata -->
      <q-card v-else flat bordered class="rounded-borders shadow-1">
        <div class="q-pa-sm">
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-chip v-if="currentCategory?.title" color="primary" text-color="white" icon="category">
              {{ currentCategory.title }}
            </q-chip>
            <q-space />
            <q-chip v-if="search" dense color="amber-4" text-color="black" icon="info">
              Filtra attivo: riordino disabilitato
            </q-chip>
          </div>

          <!-- SUBALBERO (read-only, flatten) -->
          <Draggable
            v-if="!onlyDirect"
            :modelValue="filteredFlattenList"
            :indent="0"
            class="comfy-list dnd-disabled"
            :draggable="false"
          >
            <template #default="{ node }">
              <div class="row items-center justify-between q-pa-sm q-mb-xs rounded-borders item-row">
                <div class="row items-center col">
                  <q-icon name="inventory_2" class="q-mr-sm" />
                  <div class="column">
                    <div class="text-body1">{{ node.label }}</div>
                    <div class="text-caption text-grey-7">
                      {{ node.sku || '—' }} ·
                      <span v-if="typeof node.price === 'number'">€ {{ node.price.toFixed(2) }}</span>
                      <span v-else>prezzo n/d</span>
                    </div>
                  </div>
                </div>
                <div class="row items-center q-gutter-xs">
                  <q-chip v-if="node.path" dense outline color="primary">{{ node.path }}</q-chip>
                  <q-chip v-if="!node.active" dense color="grey-4" text-color="grey-9">non attivo</q-chip>
                  <q-btn dense flat round icon="edit" @click="openEditFromItem(node.id)" />
                  <q-btn dense flat round icon="delete" color="negative" @click="askDeleteProduct(node.id)" />
                </div>
              </div>
            </template>
          </Draggable>

          <!-- SOLO DIRETTI (ordinabile) -->
          <Draggable
            v-else
            v-model="directList"
            :indent="0"
            class="comfy-list"
            @change="onOrderChange"
          >
            <template #default="{ node }">
              <div class="row items-center justify-between q-pa-sm q-mb-xs rounded-borders item-row">
                <div class="row items-center col">
                  <q-icon name="drag_indicator" class="q-mr-sm" />
                  <div class="column">
                    <div class="text-body1">{{ node.label }}</div>
                    <div class="text-caption text-grey-7">
                      {{ node.sku || '—' }} ·
                      <span v-if="typeof node.price === 'number'">€ {{ node.price.toFixed(2) }}</span>
                      <span v-else>prezzo n/d</span>
                    </div>
                  </div>
                </div>
                <div class="row items-center q-gutter-xs">
                  <q-chip v-if="!node.active" dense color="grey-4" text-color="grey-9">non attivo</q-chip>
                  <q-btn dense flat round icon="edit" @click="openEditFromItem(node.id)" />
                  <q-btn dense flat round icon="delete" color="negative" @click="askDeleteProduct(node.id)" />
                </div>
              </div>
            </template>
          </Draggable>

          <div v-if="onlyDirect && !directList.length" class="q-pa-md text-grey-7">
            Nessun prodotto direttamente in questa categoria.
          </div>
          <div v-if="!onlyDirect && !filteredFlattenList.length" class="q-pa-md text-grey-7">
            Nessun prodotto nel subalbero di questa categoria.
          </div>
        </div>
      </q-card>
    </div>

    <!-- DIALOG EDITOR (create/edit) -->
    <q-dialog
      v-model="editor.show"
      :maximized="$q.screen.lt.md"
      transition-show="slide-up"
      transition-hide="slide-down"
      persistent
    >
      <q-card style="width: 90vw; height: fit-content;" class="q-pa-md">
        <q-toolbar>
          <q-btn flat round dense icon="arrow_back" v-close-popup />
          <q-toolbar-title>{{ editor.mode === 'create' ? 'Nuovo prodotto' : 'Modifica prodotto' }}</q-toolbar-title>
          <q-btn flat dense icon="save" color="primary" :loading="saving" @click="submitEditor" />
        </q-toolbar>
        <q-separator />

        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="form.name" label="Nome *" dense outlined :rules="[rRequired]" @update:model-value="autoSlug()" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.slug" label="Slug *" dense outlined :rules="[rRequired]" />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input v-model="form.sku" label="SKU" dense outlined />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model.number="form.price" type="number" step="0.01" label="Prezzo" dense outlined />
            </div>
            <div class="col-12 col-md-4 flex items-center">
              <q-toggle v-model="form.active" label="Attivo" />
            </div>
          </div>

          <q-input v-model="form.description" type="textarea" autogrow label="Descrizione" dense outlined />
          <q-input v-model="form.notes" type="textarea" autogrow label="Note interne" dense outlined />

          <q-select
            v-model="form.categories"
            :options="categoryOptions"
            option-label="label"
            option-value="id"
            multiple
            use-chips
            dense
            outlined
            emit-value
            map-options
            label="Categorie *"
            :rules="[v => (v && v.length) || 'Seleziona almeno una categoria']"
          />

          <!-- ⬇️ Attributi del prodotto raggruppati per 'kind' -->
          <div class="column q-gutter-sm q-mt-sm">
            <div class="text-subtitle2">Attributi</div>

            <q-banner v-if="!attributeGroupsUi.length" dense class="bg-grey-2 text-grey-8 rounded-borders">
              Nessun attributo disponibile.
            </q-banner>

            <q-select
              v-for="g in attributeGroupsUi"
              :key="g.kind"
              :label="g.label"
              v-model="groupModelValue[g.kind]"
              :options="g.options"
              option-label="label"
              option-value="id"
              multiple
              use-chips
              dense
              outlined
              emit-value
              map-options
              :hint="g.hint"
              @update:model-value="(val) => setGroupSelection(g.kind, val)"
            >
              <!-- opzioni nel menu -->
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon :name="scope.opt.icon || 'label'" :style="chipStyle(scope.opt, true)" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>{{ kindPretty(scope.opt.kind) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>

              <!-- chips selezionate -->
              <template #selected-item="scope">
                <q-chip
                  removable
                  @remove="scope.removeAtIndex(scope.index)"
                  :style="chipStyle(scope.opt)"
                  class="q-mr-xs q-mb-xs"
                >
                  <q-icon :name="scope.opt.icon || 'label'" class="q-mr-xs" />
                  {{ scope.opt.label }}
                </q-chip>
              </template>
            </q-select>
          </div>

          <q-banner dense class="bg-grey-2 text-grey-8 rounded-borders" v-if="form.isAvailableForSale !== undefined">
            Disponibile alla vendita: <b>{{ form.isAvailableForSale ? 'Sì' : 'No' }}</b> (sola lettura)
          </q-banner>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Annulla" v-close-popup />
          <q-btn color="primary" label="Salva" :loading="saving" @click="submitEditor" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: conferma eliminazione con codice -->
    <SecurityCodeConfirmDialog
      v-model="showDeleteConfirm"
      :title="`Elimina “${deleteTarget?.label || ''}”`"
      :message="deleteWarningHtml"
      confirm-label="Elimina definitivamente"
      color="red"
      :length="6"
      @confirmed="doDelete(deleteTarget.id)"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { Draggable } from '@he-tree/vue'
import '@he-tree/vue/style/default.css'
import SecurityCodeConfirmDialog from 'src/components/common/SecurityCodeConfirmDialog.vue'

const $q = useQuasar()
const API = import.meta.env.VITE_API_URL

/* ---------- state ---------- */
const loading = ref(false)
const error = ref(null)
const search = ref('')

const categoriesTree = ref([])      // albero categorie
const allProducts = ref([])         // tutti i prodotti (con categories)
const selectedCategoryId = ref(null)
const currentCategory = ref(null)

const onlyDirect = ref(false)       // toggle: subalbero vs diretti (DnD)
const directList = ref([])          // lista ordinabile dei diretti

// attributi (productAttribute)
const attributes = ref([])

/* ---------- editor ---------- */
const saving = ref(false)
const editor = ref({ show: false, mode: 'create', id: null })
const form = ref({
  name: '', slug: '', sku: '',
  price: null,
  active: true,
  description: '', notes: '',
  categories: [],
  attributes: [],
  isAvailableForSale: undefined
})

/* ---------- load ---------- */
onMounted(async () => {
  await Promise.all([loadCategories(), loadAllProducts(), loadAttributes()])
})

async function loadCategories () {
  loading.value = true
  error.value = null
  try {
    const res = await fetch(`${API}/cms/categories?includeHidden=1`)
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Errore categorie')
    categoriesTree.value = json.data || []
  } catch (e) {
    error.value = e.message
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    loading.value = false
  }
}

async function loadAllProducts () {
  loading.value = true
  error.value = null
  try {
    const res = await fetch(`${API}/cms/products`)
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Errore prodotti')
    allProducts.value = json.data || []
  } catch (e) {
    error.value = e.message
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    loading.value = false
  }
}

async function loadAttributes () {
  try {
    const res = await fetch(`${API}/cms/attributes`)
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Errore attributi')
    attributes.value = json.data || []
  } catch (e) {
    // non blocco la pagina, solo banner/notify
    $q.notify({ type: 'warning', message: e.message })
  }
}

/* ---------- util categorie ---------- */
function buildParentMap (tree) {
  const parent = new Map()
  const walk = (n) => {
    ;(n.children || []).forEach(c => { parent.set(c._id, n._id); walk(c) })
  }
  ;(tree || []).forEach(walk)
  return parent
}
const parentOf = computed(() => buildParentMap(categoriesTree.value))

function idToNodeMap (tree) {
  const m = new Map()
  const walk = (n) => { m.set(n._id, n); (n.children || []).forEach(walk) }
  ;(tree || []).forEach(walk)
  return m
}
const catById = computed(() => idToNodeMap(categoriesTree.value))

function categoryPathLabel (id) {
  const parts = []
  let cur = id
  while (cur) {
    const n = catById.value.get(cur)
    if (!n) break
    parts.push(n.title)
    cur = parentOf.value.get(cur)
  }
  return parts.reverse().join(' / ')
}

function descendantsOf (rootId) {
  const out = new Set([rootId])
  const n = catById.value.get(rootId)
  const walk = (x) => { (x.children || []).forEach(c => { out.add(c._id); walk(c) }) }
  if (n) walk(n)
  return out
}

/* ---------- select options ---------- */
const categoryOptions = computed(() => {
  const out = []
  const walk = (n, path) => {
    const label = path ? `${path} / ${n.title}` : n.title
    out.push({ id: n._id, label })
    ;(n.children || []).forEach(c => walk(c, label))
  }
  ;(categoriesTree.value || []).forEach(r => walk(r, ''))
  return out
})
const categoryOptionsWithAll = computed(() => [{ id: null, label: '— Tutte le categorie —' }, ...categoryOptions.value])

/* ---------- filtro testo ---------- */
function matchProduct (p, term) {
  const t = term.toLowerCase()
  return (
    (p.name || '').toLowerCase().includes(t) ||
    (p.sku || '').toLowerCase().includes(t)
  )
}

/* ---------- nessuna categoria selezionata: gruppi per root ---------- */
const rootCategoryGroups = computed(() => {
  return (categoriesTree.value || []).map(r => ({ id: r._id, label: r.title }))
})

const filteredFlatByRoot = computed(() => {
  const term = (search.value || '').trim()
  const map = {}
  for (const root of rootCategoryGroups.value) {
    const ids = descendantsOf(root.id)
    const items = (allProducts.value || [])
      .filter(p => (p.categories || []).some(c => ids.has(c._id)))
      .filter(p => !term || matchProduct(p, term))
      .map(p => {
        // categoria più profonda del sottoalbero per il chip path
        const matched = (p.categories || []).filter(c => ids.has(c._id))
        const primary = matched.sort((a, b) =>
          categoryPathLabel(a._id).length - categoryPathLabel(b._id).length
        ).at(-1) || matched[0] || null
        return toRowNode(p, primary ? categoryPathLabel(primary._id) : '')
      })
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''))
    map[root.id] = items
  }
  return map
})

/* ---------- categoria selezionata ---------- */
async function onCategoryChange () {
  if (!selectedCategoryId.value) {
    currentCategory.value = null
    onlyDirect.value = false
    return
  }
  const n = catById.value.get(selectedCategoryId.value)
  currentCategory.value = n ? { _id: n._id, title: n.title } : null

  if (onlyDirect.value) {
    await loadDirectList(selectedCategoryId.value)
  }
}

async function loadDirectList (categoryId) {
  // prova endpoint “by-category”; se manca, fallback locale (no ordine persistito)
  try {
    const res = await fetch(`${API}/cms/products/by-category?categoryId=${encodeURIComponent(categoryId)}`)
    if (!res.ok) throw new Error('by-category not available')
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Errore caricamento diretti')
    directList.value = (json.data || []).map(p => toRowNode(p, null))
  } catch {
    // fallback: prendi prodotti con categories che includono categoryId (ordine alfabetico)
    directList.value = (allProducts.value || [])
      .filter(p => (p.categories || []).some(c => c._id === categoryId))
      .map(p => toRowNode(p, null))
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''))
  }
}

// lista flatten del subalbero (read-only)
const filteredFlattenList = computed(() => {
  if (!selectedCategoryId.value) return []
  const ids = descendantsOf(selectedCategoryId.value)
  const term = (search.value || '').trim()
  const seen = new Set()
  const out = []
  for (const p of (allProducts.value || [])) {
    const matched = (p.categories || []).filter(c => ids.has(c._id))
    if (!matched.length) continue
    if (term && !matchProduct(p, term)) continue
    if (seen.has(p._id)) continue
    seen.add(p._id)
    const primary = matched.sort((a, b) =>
      categoryPathLabel(a._id).length - categoryPathLabel(b._id).length
    ).at(-1) || matched[0] || null
    out.push(toRowNode(p, primary ? categoryPathLabel(primary._id) : ''))
  }
  return out.sort((a, b) => (a.label || '').localeCompare(b.label || ''))
})

/* ---------- helper riga ---------- */
function toRowNode (p, pathLabel) {
  return {
    id: p._id,
    label: p.name,
    sku: p.sku,
    price: p.price,
    active: p.active !== false,
    path: pathLabel || null
  }
}

/* ---------- switch tra viste ---------- */
watch(onlyDirect, async (val) => {
  if (!selectedCategoryId.value) return
  if (val) await loadDirectList(selectedCategoryId.value)
})

/* ---------- salvataggio ordine (diretti) ---------- */
async function onOrderChange () {
  if (!selectedCategoryId.value) return
  if (!onlyDirect.value) return
  if (search.value) return
  const ids = directList.value.map(p => p.id)
  try {
    const res = await fetch(`${API}/cms/products/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: selectedCategoryId.value, productIds: ids })
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.ok === false) {
      throw new Error(json?.error || 'Endpoint ordine non disponibile')
    }
    $q.notify({ type: 'positive', message: 'Ordine salvato' })
  } catch (e) {
    $q.notify({ type: 'warning', message: e.message || 'Impossibile salvare ordine (endpoint mancante?)' })
  }
}

/* ====================== ATTRIBUTI (UI) ====================== */
const KIND_LABELS = {
  allergen: 'Allergeni',
  season: 'Stagioni',
  promo: 'Promozioni',
  tag: 'Tag'
}
function kindPretty (k) { return KIND_LABELS[k] || (String(k || '').charAt(0).toUpperCase() + String(k || '').slice(1)) }

const attributeGroupsUi = computed(() => {
  const byKind = new Map()
  for (const a of (attributes.value || [])) {
    if (!byKind.has(a.kind)) byKind.set(a.kind, [])
    byKind.get(a.kind).push({
      id: a._id,
      label: a.name,
      icon: a.icon || 'label',
      kind: a.kind,
      color: a.color || null
    })
  }
  const out = []
  for (const [kind, options] of byKind.entries()) {
    out.push({
      kind,
      label: kindPretty(kind),
      hint: kind === 'allergen' ? 'Seleziona gli allergeni presenti' : undefined,
      options: options.sort((a, b) => (a.label || '').localeCompare(b.label || ''))
    })
  }
  // ordinamento gruppi per leggibilità
  const order = ['allergen', 'season', 'promo', 'tag']
  out.sort((a, b) => (order.indexOf(a.kind) - order.indexOf(b.kind)))
  return out
})

// modello “per gruppo” (kind -> array di id selezionati)
const groupModelValue = ref({})

// sync da form.attributes -> groupModelValue quando cambia prodotto o set attributi
watch([attributes, () => form.value.attributes], () => {
  const map = {}
  for (const g of attributeGroupsUi.value) {
    const ids = new Set((form.value.attributes || []))
    map[g.kind] = g.options.map(o => o.id).filter(id => ids.has(id))
  }
  groupModelValue.value = map
}, { immediate: true })

// applica selezione di un gruppo al form.attributes globale (unione di tutti i gruppi)
function setGroupSelection (kind, selectedIds) {
  const clone = { ...(groupModelValue.value || {}) }
  clone[kind] = selectedIds || []
  groupModelValue.value = clone

  const union = new Set()
  for (const ids of Object.values(clone)) (ids || []).forEach(id => union.add(id))
  form.value.attributes = Array.from(union)
}

function chipStyle (opt, muted = false) {
  const c = opt?.color
  if (!c) return muted ? 'opacity:.9' : ''
  return muted
    ? `background:${c}20;border:1px solid ${c}40;border-radius:12px;padding:2px`
    : `background:${c}33;border:1px solid ${c}66;border-radius:12px`
}

/* ====================== EDITOR: CREATE / EDIT ====================== */
function openCreateProduct () {
  editor.value = { show: true, mode: 'create', id: null }
  form.value = {
    name: '', slug: '', sku: '',
    price: null, active: true,
    description: '', notes: '',
    categories: [],
    attributes: [],
    isAvailableForSale: undefined
  }
  // reset gruppi attributi
  groupModelValue.value = {}
}

async function openEditFromItem (id) {
  // prova a leggere dal dataset locale
  let p = (allProducts.value || []).find(x => x._id === id)
  // se manca qualche campo (es. attributes), prova endpoint dettaglio (se esiste)
  try {
    const res = await fetch(`${API}/cms/products/${encodeURIComponent(id)}`)
    if (res.ok) {
      const json = await res.json()
      if (json?.ok && json?.data) p = json.data
    }
  } catch { /* opzionale: ignora se endpoint non esiste */ }

  if (!p) return

  editor.value = { show: true, mode: 'edit', id }
  form.value = {
    name: p.name || '',
    slug: p.slug?.current || p.slug || slugify(p.name || ''),
    sku: p.sku || '',
    price: p.price ?? null,
    active: p.active !== false,
    description: p.description || '',
    notes: p.notes || '',
    categories: (p.categories || []).map(c => c._id || c),       // accetta id o oggetto
    attributes: (p.attributes || []).map(a => a._id || a),       // se presenti
    isAvailableForSale: p.isAvailableForSale
  }
}

/* ---------- validazioni + slug ---------- */
const rRequired = v => (v && String(v).trim().length > 0) || 'Obbligatorio'
function slugify (s='') {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,'')
}
function autoSlug () {
  if (!form.value.slug || form.value.slug.length < 2) form.value.slug = slugify(form.value.name)
}

/* ---------- submit ---------- */
async function submitEditor () {
  if (!form.value.name || !form.value.slug || !(form.value.categories || []).length) {
    $q.notify({ type: 'warning', message: 'Nome, slug e almeno una categoria sono obbligatori' })
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      slug: form.value.slug,
      sku: form.value.sku || '',
      price: form.value.price ?? null,
      active: !!form.value.active,
      description: form.value.description || '',
      notes: form.value.notes || '',
      categories: form.value.categories || [],
      attributes: form.value.attributes || [] // richiede supporto nel backend
    }

    if (editor.value.mode === 'create') {
      const res = await fetch(`${API}/cms/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Creazione fallita')
      $q.notify({ type: 'positive', message: 'Prodotto creato' })
    } else {
      const res = await fetch(`${API}/cms/products/${encodeURIComponent(editor.value.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Salvataggio fallito')
      $q.notify({ type: 'positive', message: 'Prodotto aggiornato' })
    }

    editor.value.show = false
    await loadAllProducts()
    if (selectedCategoryId.value && onlyDirect.value) {
      await loadDirectList(selectedCategoryId.value)
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    saving.value = false
  }
}

/* ---------- DELETE ---------- */
const showDeleteConfirm = ref(false)
const deleteTarget = ref({ id: null, label: '' })
const deleteWarningHtml = computed(() => {
  const name = deleteTarget.value?.label || 'prodotto'
  return `
    <p>Questa azione <b>non può essere annullata</b>.<br/>
    Verrà eliminato definitivamente <b>${name}</b>.</p>
    <p class="q-mt-sm">Digita il codice di sicurezza per confermare.</p>
  `
})

function askDeleteProduct (id) {
  const p = (allProducts.value || []).find(x => x._id === id)
  deleteTarget.value = { id, label: p?.name || '' }
  showDeleteConfirm.value = true
}

async function doDelete (id) {
  if (!id) return
  saving.value = true
  try {
    const res = await fetch(`${API}/cms/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Eliminazione fallita')
    $q.notify({ type: 'positive', message: 'Prodotto eliminato' })
    await loadAllProducts()
    if (selectedCategoryId.value && onlyDirect.value) {
      await loadDirectList(selectedCategoryId.value)
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    saving.value = false
  }
}
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

/* Riga prodotto */
.item-row {
  background: var(--q-surface, #fff);
  border: 1px solid rgba(0,0,0,0.06);
}
.body--dark .item-row {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.08);
}

/* Lista comoda al tocco */
.comfy-list :deep(.he-tree-node) {
  min-height: 48px;
  padding-top: 4px;
  padding-bottom: 4px;
}

/* Disabilita DnD in lettura, ma lascia click sui contenuti */
.dnd-disabled { pointer-events: none; }
.dnd-disabled :deep(.q-icon),
.dnd-disabled :deep(.q-btn),
.dnd-disabled :deep(.q-chip) { pointer-events: auto; }
</style>
