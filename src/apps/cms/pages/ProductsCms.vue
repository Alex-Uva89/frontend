<template>
  <q-page class="q-pa-md">
    <!-- HERO -->
    <q-card flat class="hero q-pa-md q-mb-md rounded-borders shadow-2">
      <div class="column q-gutter-sm">
        <div class="row items-center no-wrap">
          <div class="text-h5 text-white">Prodotti</div>
          <q-space />
          <q-chip v-if="businessName" dense color="white" text-color="primary" icon="storefront" class="q-ml-sm">
            {{ businessName }}
          </q-chip>
        </div>
        <div class="text-caption text-white opacity-80">Gestione per categoria & ordine</div>

        <q-banner v-if="!businessId" dense class="bg-amber-3 text-amber-10 q-mt-sm rounded-borders">
          <q-icon name="info" class="q-mr-sm" />
          Nessun locale attivo. Associa un <b>business</b> all'utente per vedere categorie e prodotti.
        </q-banner>

        <div class="row q-col-gutter-sm items-center q-mt-xs">
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
            :disable="!businessId || !categoriesTree.length"
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
            :disable="!businessId"
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
              :disable="!businessId || !categoriesTree.length || !canCreateProducts"
              @click="openCreateProduct"
            />
          </div>

          <!-- Stampa (componente esterno) -->
          <div class="col-12 col-md-auto">
            <q-btn
              color="white"
              outline
              text-color="white"
              icon="print"
              label="Stampa menù (PDF)"
              class="full-width"
              :disable="!businessId || !categoriesTree.length || !canReadProducts"
              @click="showPrintMenu = true"
            />
          </div>
        </div>

        <!-- Toggle “solo diretti” -->
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
      <q-banner v-if="!canReadProducts" class="q-mb-md" type="warning" dense>
        Non hai i permessi per visualizzare i prodotti.
      </q-banner>

      <q-banner v-else-if="!businessId" class="q-mb-md" type="warning" dense>
        Seleziona/associa un locale per visualizzare categorie e prodotti.
      </q-banner>

      <q-banner v-else-if="categoriesTree.length === 0" class="q-mb-md" type="warning" dense>
        Nessuna categoria collegata al locale “{{ businessName }}”.
      </q-banner>

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
              <Draggable :modelValue="filteredFlatByRoot[root.id]" :indent="0" class="comfy-list dnd-disabled" :draggable="false">
                <template #default="{ node }">
                  <div class="row items-center justify-between q-pa-sm q-mb-xs rounded-borders item-row">
                    <div class="row items-center col">
                      <q-avatar square size="64px" class="thumb q-mr-sm">
                        <img v-if="node.imgUrl" :src="node.imgUrl" :alt="node.label" loading="lazy" />
                        <q-icon v-else name="image_not_supported" />
                      </q-avatar>
                      <div class="column col">
                        <div class="title text-body1 line-clamp-2">{{ node.label }}</div>
                        <div class="row items-center no-wrap q-mt-2">
                          <div class="text-caption text-grey-7 caption-ellipsis">
                            {{ node.sku || '—' }} <span class="q-mx-xs">·</span>
                            <span v-if="typeof node.price === 'number'">€ {{ node.price.toFixed(2) }}</span>
                            <span v-else>prezzo n/d</span>
                          </div>
                        </div>
                        <div class="gt-sm q-mt-xs">
                          <q-chip v-if="node.path" dense outline color="primary">{{ node.path }}</q-chip>
                          <q-chip v-if="!node.active" dense color="grey-4" text-color="grey-9">non attivo</q-chip>
                        </div>
                      </div>
                    </div>
                    <div class="row items-center q-gutter-xs actions-col">
                      <q-toggle dense :model-value="node.active" :disable="!canUpdateProducts || busyToggle.has(node.id)" @update:model-value="val => toggleActive(node.id, val)" />
                      <q-btn dense flat round icon="edit" :disable="!canUpdateProducts" @click="openEditFromItem(node.id)" />
                      <q-btn dense flat round icon="delete" color="negative" :disable="!canDeleteProducts" @click="askDeleteProduct(node.id)" />
                    </div>
                  </div>
                </template>
              </Draggable>
              <div v-if="!filteredFlatByRoot[root.id]?.length" class="q-pa-md text-grey-7">Nessun prodotto in questa categoria.</div>
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

            <!-- SUBALBERO -->
            <Draggable v-if="!onlyDirect" :modelValue="filteredFlattenList" :indent="0" class="comfy-list dnd-disabled" :draggable="false">
              <template #default="{ node }">
                <div class="row items-center justify-between q-pa-sm q-mb-xs rounded-borders item-row">
                  <div class="row items-center col">
                    <q-avatar square size="64px" class="thumb q-mr-sm">
                      <img v-if="node.imgUrl" :src="node.imgUrl" :alt="node.label" loading="lazy" />
                      <q-icon v-else name="image_not_supported" />
                    </q-avatar>
                    <div class="column col">
                      <div class="title text-body1 line-clamp-2">{{ node.label }}</div>
                      <div class="row items-center no-wrap q-mt-2">
                        <div class="text-caption text-grey-7 caption-ellipsis">
                          {{ node.sku || '—' }} <span class="q-mx-xs">·</span>
                          <span v-if="typeof node.price === 'number'">€ {{ node.price.toFixed(2) }}</span>
                          <span v-else>prezzo n/d</span>
                        </div>
                      </div>
                      <div class="gt-sm q-mt-xs">
                        <q-chip v-if="node.path" dense outline color="primary">{{ node.path }}</q-chip>
                        <q-chip v-if="!node.active" dense color="grey-4" text-color="grey-9">non attivo</q-chip>
                      </div>
                    </div>
                  </div>
                  <div class="row items-center q-gutter-xs actions-col">
                    <q-toggle dense :model-value="node.active" :disable="!canUpdateProducts || busyToggle.has(node.id)" @update:model-value="val => toggleActive(node.id, val)" />
                    <q-btn dense flat round icon="edit" :disable="!canUpdateProducts" @click="openEditFromItem(node.id)" />
                    <q-btn dense flat round icon="delete" color="negative" :disable="!canDeleteProducts" @click="askDeleteProduct(node.id)" />
                  </div>
                </div>
              </template>
            </Draggable>

            <!-- SOLO DIRETTI -->
            <Draggable v-else v-model="directList" :indent="0" class="comfy-list" :draggable="canUpdateProducts && !search" @change="onOrderChange">
              <template #default="{ node }">
                <div class="row items-center justify-between q-pa-sm q-mb-xs rounded-borders item-row">
                  <div class="row items-center col">
                    <q-icon name="drag_indicator" class="q-mr-xs lt-md" v-if="canUpdateProducts && !search" />
                    <q-avatar square size="64px" class="thumb q-mr-sm">
                      <img v-if="node.imgUrl" :src="node.imgUrl" :alt="node.label" loading="lazy" />
                      <q-icon v-else name="image_not_supported" />
                    </q-avatar>
                    <div class="column col">
                      <div class="title text-body1 line-clamp-2">{{ node.label }}</div>
                      <div class="row items-center no-wrap q-mt-2">
                        <div class="text-caption text-grey-7 caption-ellipsis">
                          {{ node.sku || '—' }} <span class="q-mx-xs">·</span>
                          <span v-if="typeof node.price === 'number'">€ {{ node.price.toFixed(2) }}</span>
                          <span v-else>prezzo n/d</span>
                        </div>
                      </div>
                      <div class="gt-sm q-mt-xs">
                        <q-chip v-if="!node.active" dense color="grey-4" text-color="grey-9">non attivo</q-chip>
                      </div>
                    </div>
                  </div>
                  <div class="row items-center q-gutter-xs actions-col">
                    <q-toggle dense :model-value="node.active" :disable="!canUpdateProducts || busyToggle.has(node.id)" @update:model-value="val => toggleActive(node.id, val)" />
                    <q-btn dense flat round icon="edit" :disable="!canUpdateProducts" @click="openEditFromItem(node.id)" />
                    <q-btn dense flat round icon="delete" color="negative" :disable="!canDeleteProducts" @click="askDeleteProduct(node.id)" />
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
    </div>

    <!-- DIALOG EDITOR -->
    <q-dialog v-model="editor.show" :maximized="$q.screen.lt.md" transition-show="slide-up" transition-hide="slide-down" persistent>
      <q-card style="width: 90vw; height: fit-content;" class="q-pa-md">
        <q-toolbar>
          <q-btn flat round dense icon="arrow_back" v-close-popup />
          <q-toolbar-title>{{ editor.mode === 'create' ? 'Nuovo prodotto' : 'Modifica prodotto' }}</q-toolbar-title>
          <q-btn flat dense icon="save" color="primary" :loading="saving" :disable="editor.mode==='create' ? !canCreateProducts : !canUpdateProducts" @click="submitEditor" />
        </q-toolbar>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="form.name" label="Nome *" dense outlined :rules="[rRequired]" @update:model-value="autoSlug()" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.slug" label="Slug *" dense outlined :rules="[rRequired]" />
            </div>
          </div>

          <div class="row q-my-md">
            <div class="col-12 col-md-5 q-mr-md">
              <q-input v-model="form.sku" label="SKU" dense outlined />
            </div>
            <div class="col-12 col-md-3">
              <q-input v-model.number="form.price" type="number" step="0.01" label="Prezzo" dense outlined />
            </div>
            <div class="col-12 col-md-1 flex items-center">
              <q-toggle v-model="form.active" label="Attivo" />
            </div>
          </div>

          <q-input v-model="form.description" type="textarea" class="q-my-md" autogrow label="Descrizione" dense outlined />
          <q-input v-model="form.notes" type="textarea" autogrow label="Note interne" dense outlined />

          <!-- Immagini -->
          <div class="q-my-md">
            <div class="text-subtitle2 q-mb-xs">Immagini</div>
            <q-uploader label="Aggiungi immagini" accept="image/*" multiple :auto-upload="false" :disable="uploading" @added="onImagesAdded" flat bordered class="bg-white" />
            <div class="row q-col-gutter-sm q-mt-sm">
              <div v-for="(img, idx) in form.images" :key="img._key || idx" class="col-6 col-sm-4 col-md-3">
                <q-card bordered flat class="rounded-borders">
                  <q-img :src="imagePreview(img)" :ratio="1" spinner-color="primary">
                    <div class="absolute-top-right q-pa-xs">
                      <q-btn dense flat round icon="delete" color="negative" @click="removeImageAt(idx)" />
                    </div>
                  </q-img>
                </q-card>
              </div>
            </div>
          </div>

          <!-- Categorie -->
          <q-select
            v-model="form.categories"
            :options="categoryOptions"
            option-label="label"
            option-value="id"
            multiple
            use-chips
            class="q-my-md"
            dense
            outlined
            emit-value
            map-options
            label="Categorie *"
            :disable="!businessId || !categoriesTree.length"
            :rules="[v => (v && v.length) || 'Seleziona almeno una categoria']"
          />

          <!-- Attributi -->
          <div class="column q-gutter-sm q-mt-sm">
            <div class="text-subtitle2">Attributi</div>
            <q-banner v-if="availableKinds.length === 0" dense class="bg-grey-2 text-grey-8 rounded-borders">
              Nessun attributo disponibile.
            </q-banner>

            <q-select
              v-if="availableKinds.length"
              v-model="selectedKind"
              :options="availableKinds"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              dense
              outlined
              label="Tipo di attributo"
              class="q-mb-sm"
            >
              <template #prepend><q-icon name="sell" /></template>
            </q-select>

            <q-select
              v-if="availableKinds.length && selectedKind"
              v-model="selectedKindModel"
              :options="attributeOptionsForSelectedKind"
              option-label="label"
              option-value="id"
              multiple
              use-chips
              dense
              outlined
              emit-value
              map-options
              :label="`Attributi · ${kindPretty(selectedKind)}`"
              :hint="selectedKind === 'allergen' ? 'Seleziona gli allergeni presenti' : undefined"
            >
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
              <template #selected-item="scope">
                <q-chip removable @remove="scope.removeAtIndex(scope.index)" :style="chipStyle(scope.opt)" class="q-mr-xs q-mb-xs">
                  <q-icon :name="scope.opt.icon || 'label'" class="q-mr-xs" />
                  {{ scope.opt.label }}
                </q-chip>
              </template>
            </q-select>

            <div v-if="selectedAttributeChips.length" class="q-mt-xs">
              <q-chip v-for="c in selectedAttributeChips" :key="c.id" :style="chipStyle(c)" class="q-mr-xs q-mb-xs">
                <q-icon :name="c.icon || 'label'" class="q-mr-xs" />
                {{ c.label }}
              </q-chip>
            </div>
          </div>

          <q-banner dense class="bg-grey-2 text-grey-8 rounded-borders q-mt-sm" v-if="form.isAvailableForSale !== undefined">
            Disponibile alla vendita: <b>{{ form.isAvailableForSale ? 'Sì' : 'No' }}</b> (sola lettura)
          </q-banner>
        </q-card-section>

        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Annulla" v-close-popup />
          <q-btn color="primary" label="Salva" :loading="saving" :disable="editor.mode==='create' ? !canCreateProducts : !canUpdateProducts" @click="submitEditor" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: conferma eliminazione -->
    <SecurityCodeConfirmDialog
      v-model="showDeleteConfirm"
      :title="`Elimina “${deleteTarget?.label || ''}”`"
      :message="deleteWarningHtml"
      confirm-label="Elimina definitivamente"
      color="red"
      :length="6"
      @confirmed="doDelete(deleteTarget.id)"
    />

    <!-- Componente esterno stampa -->
    <MenuPrintDialog
      v-model="showPrintMenu"
      :business-name="businessName"
      :categories-tree="categoriesTree"
      :products="allProducts"
      :attributes="attributes"
      :use-path-in-headers="false"
      :cover-charge="2"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { Draggable } from '@he-tree/vue'
import '@he-tree/vue/style/default.css'
import SecurityCodeConfirmDialog from 'src/components/common/SecurityCodeConfirmDialog.vue'
import MenuPrintDialog from 'src/components/print/MenuPrintDialog.vue'
import { useUsersStore } from 'src/stores/usersStore'
import { api } from 'boot/axios'
import { PERM } from 'src/auth/perm'

const $q = useQuasar()
const API = import.meta.env.VITE_API_URL

/* ---------- store & business ---------- */
const usersStore = useUsersStore()
const businessId   = computed(() => usersStore.currentUser?.business?._id || usersStore.currentUser?.primaryBusinessId || null)
const businessName = computed(() => usersStore.currentUser?.business?.name || '')

/* ---------- permessi prodotti ---------- */
const canReadProducts = computed(() => {
  const p = usersStore.currentUser?.perm ?? 0
  return !!(p & (PERM.PRODUCTS_READ | PERM.PRODUCTS_CREATE | PERM.PRODUCTS_UPDATE | PERM.PRODUCTS_DELETE | PERM.PRODUCTS_WRITE))
})
const canCreateProducts = computed(() => {
  const p = usersStore.currentUser?.perm ?? 0
  return !!(p & (PERM.PRODUCTS_CREATE | PERM.PRODUCTS_WRITE))
})
const canUpdateProducts = computed(() => {
  const p = usersStore.currentUser?.perm ?? 0
  return !!(p & (PERM.PRODUCTS_UPDATE | PERM.PRODUCTS_WRITE))
})
const canDeleteProducts = computed(() => {
  const p = usersStore.currentUser?.perm ?? 0
  return !!(p & (PERM.PRODUCTS_DELETE | PERM.PRODUCTS_WRITE))
})

/* ---------- state ---------- */
const loading = ref(false)
const error = ref(null)
const search = ref('')

const categoriesTree = ref([])
const allProducts = ref([])
const selectedCategoryId = ref(null)
const currentCategory = ref(null)

const onlyDirect = ref(false)
const directList = ref([])

const attributes = ref([])

/* editor */
const saving = ref(false)
const uploading = ref(false)
const editor = ref({ show: false, mode: 'create', id: null })
const form = ref({
  name: '', slug: '', sku: '',
  description: '', notes: '',
  price: null, active: true,
  categories: [], attributes: [],
  ingredients: [], images: [],
  isAvailableForSale: undefined
})

/* stampa esterna */
const showPrintMenu = ref(false)

/* toggle attivo: busy per riga */
const busyToggle = ref(new Set())

/* ---------- helpers id ---------- */
function toId (refOrObj) {
  if (!refOrObj) return null
  if (typeof refOrObj === 'string') return refOrObj
  if (refOrObj._ref) return refOrObj._ref
  if (refOrObj._id) return refOrObj._id
  if (refOrObj?._type === 'reference' && refOrObj?.ref) return refOrObj.ref
  return null
}

/* ---------- boot ---------- */
onMounted(async () => {
  if (!usersStore.currentUser && usersStore.token) {
    try { await usersStore.fetchCurrentUser() } catch(e) { console.log('Errore user in prodotti', e) }
  }
  if (!canReadProducts.value) return
  await Promise.all([loadCategories(), loadAllProducts(), loadAttributes()])
})
watch(businessId, async () => {
  selectedCategoryId.value = null
  currentCategory.value = null
  onlyDirect.value = false
  if (!canReadProducts.value) return
  await loadCategories()
})

/* ---------- load ---------- */
async function loadCategories () {
  if (!businessId.value) { categoriesTree.value = []; return }
  loading.value = true; error.value = null
  try {
    const { data: json } = await api.get(`${API}/cms/categories`, {
      params: { includeHidden: 1, businessId: businessId.value }
    })
    if (!json.ok) throw new Error(json.error || 'Errore categorie')
    categoriesTree.value = json.data || []
  } catch (e) {
    error.value = e.message; $q.notify({ type: 'negative', message: e.message })
  } finally { loading.value = false }
}
async function loadAllProducts () {
  loading.value = true; error.value = null
  try {
    const { data: json } = await api.get(`${API}/cms/products`)
    if (!json.ok) throw new Error(json.error || 'Errore prodotti')
    allProducts.value = json.data || []
  } catch (e) {
    error.value = e.message; $q.notify({ type: 'negative', message: e.message })
  } finally { loading.value = false }
}
async function loadAttributes () {
  try {
    const { data: json } = await api.get(`${API}/cms/attributes`)
    if (!json.ok) throw new Error(json.error || 'Errore attributi')
    attributes.value = json.data || []
  } catch (e) { $q.notify({ type: 'warning', message: e.message }) }
}

/* ---------- util categorie ---------- */
function buildParentMap (tree) {
  const parent = new Map()
  const walk = (n) => { (n.children || []).forEach(c => { parent.set(c._id, n._id); walk(c) }) }
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
  const parts = []; let cur = id
  while (cur) {
    const n = catById.value.get(cur); if (!n) break
    parts.push(n.title); cur = parentOf.value.get(cur)
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

/* ---------- ATTRIBUTI (FIX) ---------- */
const KIND_LABELS = { allergen:'Allergeni', season:'Stagioni', promo:'Promozioni', lastminute:'Ultimo minuto', generic:'Generici', tag:'Tag' }
const KIND_ORDER  = ['allergen','season','promo','lastminute','generic','tag']
function kindPretty (k) { return KIND_LABELS[k] || (String(k||'').charAt(0).toUpperCase()+String(k||'').slice(1)) }

const attrsByKind = computed(() => {
  const m = {}
  for (const a of (attributes.value || [])) {
    if (!m[a.kind]) m[a.kind] = []
    m[a.kind].push({ id:a._id, label:a.name, icon:a.icon||'label', color:a.color||null, kind:a.kind })
  }
  for (const k of Object.keys(m)) m[k].sort((a,b)=> (a.label||'').localeCompare(b.label||''))
  return m
})
const availableKinds = computed(() => {
  const kinds = Object.keys(attrsByKind.value || [])
  kinds.sort((a,b)=> (KIND_ORDER.indexOf(a)-KIND_ORDER.indexOf(b)))
  return kinds.map(k => ({ value:k, label:kindPretty(k) }))
})
const selectedKind = ref(null)
const groupModelValue = ref({})
const attributeOptionsForSelectedKind = computed(() =>
  (selectedKind.value && attrsByKind.value[selectedKind.value]) ? attrsByKind.value[selectedKind.value] : []
)
watch([() => editor.value.show, attributes], ([open]) => {
  if (!open) return
  if (!selectedKind.value || !availableKinds.value.some(k => k.value === selectedKind.value)) {
    selectedKind.value = availableKinds.value[0]?.value || null
  }
})
watch([attributes, () => form.value.attributes], () => {
  const map = {}; const allSelected = new Set(form.value.attributes || [])
  for (const k of Object.keys(attrsByKind.value)) {
    map[k] = (attrsByKind.value[k] || []).map(o => o.id).filter(id => allSelected.has(id))
  }
  groupModelValue.value = map
}, { immediate: true })
const selectedKindModel = computed({
  get () { const k = selectedKind.value; return k ? (groupModelValue.value[k] || []) : [] },
  set (val) { if (!selectedKind.value) return; setGroupSelection(selectedKind.value, val || []) }
})
function setGroupSelection (kind, selectedIds) {
  const clone = { ...(groupModelValue.value || {}) }
  clone[kind] = selectedIds || []
  groupModelValue.value = clone
  const union = new Set()
  for (const ids of Object.values(clone)) (ids || []).forEach(id => union.add(id))
  form.value.attributes = Array.from(union)
}
function chipStyle (opt, muted=false) {
  const c = opt?.color
  if (!c) return muted ? 'opacity:.9' : ''
  return muted
    ? `background:${c}20;border:1px solid ${c}40;border-radius:12px;padding:2px`
    : `background:${c}33;border:1px solid ${c}66;border-radius:12px`
}
const selectedAttributeChips = computed(() => {
  const set = new Set(form.value.attributes || [])
  return (attributes.value || [])
    .filter(a => set.has(a._id))
    .map(a => ({ id:a._id, label:a.name, icon:a.icon||'label', color:a.color||null }))
})

/* ---------- scelta “categoria di appartenenza” ---------- */
function distanceToAncestor (catId, ancestorId) {
  let d = 0; let cur = catId
  while (cur && cur !== ancestorId) { cur = parentOf.value.get(cur); d++; if (d > 1000) break }
  return cur === ancestorId ? d : -1
}
function bestCategoryInSet (product, allowedIdsSet, rootId) {
  const cands = (product.categories || []).map(toId).filter(Boolean)
  const inSet = cands.filter(id => allowedIdsSet.has(id))
  if (!inSet.length) return null
  let best = inSet[0], bestDepth = distanceToAncestor(inSet[0], rootId)
  for (const id of inSet) {
    const d = distanceToAncestor(id, rootId)
    if (d > bestDepth) { best = id; bestDepth = d }
  }
  return best
}

/* ---------- select options ---------- */
const categoryOptions = computed(() => {
  const out = []
  const walk = (n, path) => {
    const label = path ? `${path} / ${n.title}` : n.title
    out.push({ id: n._id, label }); (n.children || []).forEach(c => walk(c, label))
  }
  ;(categoriesTree.value || []).forEach(r => walk(r, ''))
  return out
})
const categoryOptionsWithAll = computed(() =>
  [{ id: null, label: '— Tutte le categorie —' }, ...categoryOptions.value]
)

/* ---------- filtro testo ---------- */
function matchProduct (p, term) {
  const t = term.toLowerCase()
  return (p.name || '').toLowerCase().includes(t) || (p.sku || '').toLowerCase().includes(t)
}

/* ---------- gruppi per root ---------- */
const rootCategoryGroups = computed(() => (categoriesTree.value || []).map(r => ({ id: r._id, label: r.title })))
const filteredFlatByRoot = computed(() => {
  const term = (search.value || '').trim()
  const map = {}
  for (const root of rootCategoryGroups.value) {
    const ids = descendantsOf(root.id)
    const items = (allProducts.value || [])
      .filter(p => (p.categories || []).some(c => ids.has(toId(c))))
      .filter(p => !term || matchProduct(p, term))
      .map(p => {
        const ownCatId = bestCategoryInSet(p, ids, root.id)
        return toRowNode(p, ownCatId ? categoryPathLabel(ownCatId) : '')
      })
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''))
    map[root.id] = items
  }
  return map
})

/* ---------- categoria selezionata ---------- */
async function onCategoryChange () {
  if (!selectedCategoryId.value) { currentCategory.value = null; onlyDirect.value = false; return }
  if (!catById.value.has(selectedCategoryId.value)) { selectedCategoryId.value = null; currentCategory.value = null; return }
  const n = catById.value.get(selectedCategoryId.value)
  currentCategory.value = n ? { _id: n._id, title: n.title } : null
  if (onlyDirect.value) await loadDirectList(selectedCategoryId.value)
}
async function loadDirectList (categoryId) {
  try {
    const { data: json } = await api.get(`${API}/cms/products/by-category`, { params: { categoryId } })
    if (!json.ok) throw new Error(json.error || 'Errore caricamento diretti')
    if (!catById.value.has(categoryId)) { directList.value = []; return }
    directList.value = (json.data || []).map(p => toRowNode(p, null))
  } catch {
    directList.value = (allProducts.value || [])
      .filter(p => (p.categories || []).some(c => toId(c) === categoryId))
      .map(p => toRowNode(p, null))
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''))
  }
}

const filteredFlattenList = computed(() => {
  if (!selectedCategoryId.value) return []
  if (!catById.value.has(selectedCategoryId.value)) return []
  const ids = descendantsOf(selectedCategoryId.value)
  const term = (search.value || '').trim()
  const seen = new Set()
  const out = []
  for (const p of (allProducts.value || [])) {
    const hasAny = (p.categories || []).some(c => ids.has(toId(c)))
    if (!hasAny) continue
    if (term && !matchProduct(p, term)) continue
    if (seen.has(p._id)) continue
    seen.add(p._id)
    const ownCatId = bestCategoryInSet(p, ids, selectedCategoryId.value)
    out.push(toRowNode(p, ownCatId ? categoryPathLabel(ownCatId) : ''))
  }
  return out.sort((a, b) => (a.label || '').localeCompare(b.label || ''))
})

/* ---------- helper riga ---------- */
function toRowNode (p, pathLabel) {
  return {
    id: p._id,
    label: p.name,
    sku: p.sku,
    price: typeof p.price === 'number' ? p.price : null,
    description: p.description || '',
    active: p.active !== false,
    path: pathLabel || null,
    imgUrl: p.imageUrl || (p.images?.[0]?.asset?.url) || null
  }
}

/* ---------- switch tra viste ---------- */
watch(onlyDirect, async (val) => {
  if (!selectedCategoryId.value) return
  if (val) await loadDirectList(selectedCategoryId.value)
})

/* ---------- ordine (diretti) ---------- */
async function onOrderChange () {
  if (!canUpdateProducts.value) return
  if (!selectedCategoryId.value || !onlyDirect.value || search.value) return
  if (!catById.value.has(selectedCategoryId.value)) return

  const ids = directList.value.map(p => p.id)
  try {
    const { data: json } = await api.put(`${API}/cms/products/order`, { categoryId: selectedCategoryId.value, productIds: ids })
    if (!json?.ok) throw new Error(json?.error || 'Endpoint ordine non disponibile')
    $q.notify({ type: 'positive', message: 'Ordine salvato' })
  } catch (e) {
    $q.notify({ type: 'warning', message: e.message || 'Impossibile salvare ordine (endpoint mancante?)' })
  }
}

/* ====================== IMMAGINI ====================== */
function imageRefFromAssetId(assetId) {
  return { _type:'image', asset:{ _type:'reference', _ref: assetId } }
}
async function uploadImageFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  const { data: json } = await api.post(`${API}/cms/uploads/image`, fd)
  if (!json.ok) throw new Error(json.error || 'Upload immagine fallito')
  return { ...imageRefFromAssetId(json.data.assetId), __tmpUrl: json.data.url }
}
async function onImagesAdded(files) {
  if (!files?.length) return
  uploading.value = true
  try {
    for (const f of files) {
      const raw = f.__file || f
      const imgObj = await uploadImageFile(raw)
      form.value.images = [...(form.value.images || []), imgObj]
    }
    $q.notify({ type: 'positive', message: 'Immagini caricate' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'Upload immagine fallito' })
  } finally { uploading.value = false }
}
function removeImageAt(index) {
  const next = [...(form.value.images || [])]
  next.splice(index, 1); form.value.images = next
}
function imagePreview(img) { return img?.__tmpUrl || img?.asset?.url || null }

/* ====================== EDITOR: CREATE / EDIT ====================== */
function openCreateProduct () {
  editor.value = { show: true, mode: 'create', id: null }
  form.value = {
    name: '', slug: '', sku: '',
    description: '', notes: '',
    price: null, active: true,
    categories: [], attributes: [],
    ingredients: [], images: [],
    isAvailableForSale: undefined
  }
  groupModelValue.value = {}
  selectedKind.value = availableKinds.value[0]?.value || null
}

async function openEditFromItem (id) {
  let p = (allProducts.value || []).find(x => x._id === id)
  try {
    const { data: json } = await api.get(`${API}/cms/products/${encodeURIComponent(id)}`)
    if (json?.ok && json?.data) p = json.data
  } catch(e) { console.log(e) }
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
    categories: (p.categories || []).map(c => toId(c)).filter(Boolean),
    attributes: (p.attributes || []).map(a => toId(a)).filter(Boolean),
    ingredients: (p.ingredients || []).map(it => ({
      reference: toId(it?.reference) || null,
      quantity: typeof it?.quantity === 'number' ? it.quantity : null,
      unit: it?.unit || ''
    })),
    images: (p.images || []).map(img => ({
      _type: 'image',
      _key: img._key,
      alt: img.alt,
      crop: img.crop,
      hotspot: img.hotspot,
      asset: { _type: 'reference', _ref: img?.asset?._id, url: img?.asset?.url }
    })),
    isAvailableForSale: p.isAvailableForSale
  }

  const firstSelectedKind = Object.keys(attrsByKind.value).find(k =>
    (form.value.attributes || []).some(id => (attrsByKind.value[k] || []).some(o => o.id === id))
  )
  selectedKind.value = firstSelectedKind || availableKinds.value[0]?.value || null
}

/* ---------- validazioni + slug ---------- */
const rRequired = v => (v && String(v).trim().length > 0) || 'Obbligatorio'
function slugify (s='') {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,'')
}
function autoSlug () { if (!form.value.slug || form.value.slug.length < 2) form.value.slug = slugify(form.value.name) }

/* ---------- helpers payload ---------- */
const toRef = (id) => id ? ({ _type: 'reference', _ref: id }) : null
function sanitizeIngredients (arr) {
  return (arr || [])
    .map(it => ({
      _type: 'ingredientItem',
      reference: toRef(it.reference),
      quantity: typeof it.quantity === 'number' ? it.quantity : null,
      unit: it.unit || ''
    }))
    .filter(it => it.reference && typeof it.quantity === 'number')
}

/* ---------- submit ---------- */
async function submitEditor () {
  if (!form.value.name || !form.value.slug || !(form.value.categories || []).length) {
    $q.notify({ type: 'warning', message: 'Nome, slug e almeno una categoria sono obbligatori' })
    return
  }
  const invalid = (form.value.categories || []).some(id => !catById.value.has(id))
  if (invalid) { $q.notify({ type: 'warning', message: 'Seleziona solo categorie del locale attivo' }); return }

  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      slug: form.value.slug,
      sku: form.value.sku || '',
      description: form.value.description || '',
      notes: form.value.notes || '',
      price: form.value.price ?? null,
      active: !!form.value.active,
      categories: (form.value.categories || []).map(toRef),
      attributes: (form.value.attributes || []).map(toRef),
      ingredients: sanitizeIngredients(form.value.ingredients),
      categoryIds: (form.value.categories || []),
      attributeIds: (form.value.attributes || []),
      images: form.value.images || []
    }

    if (editor.value.mode === 'create') {
      if (!canCreateProducts.value) { $q.notify({ type: 'warning', message: 'Permesso insufficiente per creare' }); saving.value = false; return }
      const { data: json } = await api.post(`${API}/cms/products`, payload)
      if (!json.ok) throw new Error(json.error || 'Creazione fallita')
      $q.notify({ type: 'positive', message: 'Prodotto creato' })
    } else {
      if (!canUpdateProducts.value) { $q.notify({ type: 'warning', message: 'Permesso insufficiente per modificare' }); saving.value = false; return }
      const { data: json } = await api.put(`${API}/cms/products/${encodeURIComponent(editor.value.id)}`, payload)
      if (!json.ok) throw new Error(json.error || 'Salvataggio fallito')
      $q.notify({ type: 'positive', message: 'Prodotto aggiornato' })
    }

    editor.value.show = false
    await loadAllProducts()
    if (selectedCategoryId.value && onlyDirect.value) await loadDirectList(selectedCategoryId.value)
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  } finally { saving.value = false }
}

/* ---------- toggle ACTIVE ---------- */
async function toggleActive (id, nextVal) {
  if (!canUpdateProducts.value) {
    $q.notify({ type: 'warning', message: 'Non hai i permessi per modificare prodotti' })
    return
  }
  if (!id) return
  busyToggle.value.add(id)
  try {
    const { data: json } = await api.put(`${API}/cms/products/${encodeURIComponent(id)}`, { active: !!nextVal })
    if (!json.ok) throw new Error(json.error || 'Salvataggio stato fallito')

    const idx = (allProducts.value || []).findIndex(p => p._id === id)
    if (idx >= 0) allProducts.value[idx] = { ...allProducts.value[idx], active: !!nextVal }

    if (selectedCategoryId.value && onlyDirect.value) await loadDirectList(selectedCategoryId.value)
    $q.notify({ type: 'positive', message: nextVal ? 'Prodotto attivato' : 'Prodotto disattivato' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    busyToggle.value.delete(id)
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
  if (!canDeleteProducts.value) { $q.notify({ type: 'warning', message: 'Non hai i permessi per eliminare' }); return }
  saving.value = true
  try {
    const { data: json } = await api.delete(`${API}/cms/products/${encodeURIComponent(id)}`)
    if (!json.ok) throw new Error(json.error || 'Eliminazione fallita')
    $q.notify({ type: 'positive', message: 'Prodotto eliminato' })
    await loadAllProducts()
    if (selectedCategoryId.value && onlyDirect.value) await loadDirectList(selectedCategoryId.value)
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  } finally { saving.value = false }
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
.item-row { background: var(--q-surface, #fff); border: 1px solid rgba(0,0,0,0.06); }
.body--dark .item-row { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); }

/* Miniatura */
.thumb { background: #f5f5f5; border-radius: 10px; overflow: hidden; }
.item-row :deep(.q-avatar img) { width: 100%; height: 100%; object-fit: cover; }

/* Testi lunghi */
.line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.caption-ellipsis { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* Azioni */
.actions-col { flex: 0 0 auto; }

/* Lista comoda al tocco */
.comfy-list :deep(.he-tree-node) { min-height: 64px; padding-top: 4px; padding-bottom: 4px; }

/* Disabilita DnD in lettura, ma lascia click sui contenuti */
.dnd-disabled { pointer-events: none; }
.dnd-disabled :deep(.q-icon),
.dnd-disabled :deep(.q-btn),
.dnd-disabled :deep(.q-chip),
.dnd-disabled :deep(.q-toggle) { pointer-events: auto; }
</style>
