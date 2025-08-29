<template>
  <q-page class="q-pa-md">
    <!-- Titolo -->
    <div class="text-h5 q-mb-md">Categorie</div>

    <!-- HERO + SEARCH -->
    <q-card flat class="hero q-pa-md q-mb-md rounded-borders shadow-2">
      <div class="column q-gutter-xs">
        <div class="row items-center justify-between no-wrap">
          <!-- Chip locale attivo -->
          <q-chip
            v-if="businessName"
            color="white"
            text-color="primary"
            icon="storefront"
            class="q-ml-sm"
          >
            {{ businessName }}
          </q-chip>

          <!-- Select locale (solo chi ha MANAGE_ALL_BUSINESSES) -->
          <q-select
            v-if="canSeeAllBusinesses"
            dense
            filled
            class="hero-input"
            behavior="menu"
            emit-value
            map-options
            :options="(businessStore.businesses || []).map(b => ({ label: b.name, value: b._id }))"
            v-model="usersStore.selectedBusinessId"
            placeholder="Seleziona locale"
            style="min-width: 280px"
          >
            <template #prepend><q-icon name="storefront" class="text-white" /></template>
          </q-select>
        </div>

        <div class="text-caption text-white opacity-80">
          Gestione ad albero filtrata per locale
        </div>

        <!-- Se manca il business, avvisa -->
        <q-banner
          v-if="!businessId"
          dense
          class="bg-amber-3 text-amber-10 q-mt-sm rounded-borders"
        >
          <q-icon name="info" class="q-mr-sm" />
          Nessun locale attivo. Associa un <b>business</b> all'utente o seleziona un locale.
        </q-banner>

        <!-- MOBILE -->
        <div class="lt-md column q-gutter-sm q-mt-sm">
          <q-input
            v-model="search"
            dense
            filled
            clearable
            debounce="200"
            placeholder="Cerca categoria…"
            class="rounded-borders hero-input"
            input-class="text-white"
          >
            <template #prepend><q-icon name="search" class="text-white" /></template>
            <template #append>
              <q-btn v-if="search" flat round dense icon="close" class="text-white" @click="search=''" />
            </template>
          </q-input>

          <div class="relative-position inline-block">
            <q-btn
              color="white"
              text-color="primary"
              icon="add_circle"
              label="Aggiungi categoria radice"
              class="full-width q-mx-auto"
              :disable="!businessId || !canCreateCategories || dragMode"
              @click="openCreateRoot"
            />
          </div>

          <div class="relative-position inline-block">
            <q-btn
              color="white"
              outline
              text-color="white"
              icon="subdirectory_arrow_right"
              label="Aggiungi sottocategoria"
              :class="{ 'full-width': $q.screen.lt.md }"
              :disable="!selectedId || !businessId || !canCreateCategories || dragMode"
              @click="openCreateChildFromSelection"
            />
            <q-tooltip v-if="!selectedId" anchor="top middle" self="bottom middle" class="bg-grey-9 text-white">
              Seleziona prima la categoria genitore
            </q-tooltip>
          </div>

          <!-- Toggle modalità ordinamento -->
          <q-btn
            :color="dragMode ? 'negative' : 'white'"
            :text-color="dragMode ? 'white' : 'primary'"
            :icon="dragMode ? 'done' : 'tune'"
            :label="dragMode ? 'Fine ordinamento' : 'Ordina categorie'"
            class="full-width"
            :disable="!canUpdateCategories || !businessId || hasFilter || loading"
            @click="toggleDragMode"
          />
          <div v-if="hasFilter" class="text-caption text-amber-2 q-mt-xs">
            Filtro attivo: disabilita il filtro per ordinare.
          </div>
        </div>

        <!-- DESKTOP -->
        <div class="gt-sm row items-center q-gutter-sm q-mt-sm">
          <q-input
            v-model="search"
            dense
            filled
            clearable
            debounce="200"
            placeholder="Cerca categoria…"
            class="rounded-borders hero-input col"
            input-class="text-white"
          >
            <template #prepend><q-icon name="search" class="text-white" /></template>
            <template #append>
              <q-btn v-if="search" flat round dense icon="close" class="text-white" @click="search=''" />
            </template>
          </q-input>

          <q-btn
            color="white"
            text-color="primary"
            icon="add_circle"
            label="Aggiungi categoria radice"
            :disable="!businessId || !canCreateCategories || dragMode"
            @click="openCreateRoot"
          />
          <q-btn
            color="white"
            outline
            text-color="white"
            icon="subdirectory_arrow_right"
            label="Aggiungi sottocategoria"
            :disable="!selectedId || !businessId || !canCreateCategories || dragMode"
            @click="openCreateChildFromSelection"
          />
          <q-separator vertical spaced class="opacity-30" />
          <q-btn
            :color="dragMode ? 'negative' : 'white'"
            :text-color="dragMode ? 'white' : 'primary'"
            :icon="dragMode ? 'done' : 'tune'"
            :label="dragMode ? 'Fine ordinamento' : 'Ordina categorie'"
            :disable="!canUpdateCategories || !businessId || hasFilter || loading"
            @click="toggleDragMode"
          />
          <div v-if="hasFilter" class="text-caption text-amber-2">
            Filtro attivo: disabilita il filtro per ordinare.
          </div>
        </div>
      </div>
    </q-card>

    <!-- Stato -->
    <q-skeleton v-if="loading" type="rect" height="220px" class="rounded-borders" />
    <q-banner v-else-if="error" type="negative" dense class="q-mb-md">{{ error }}</q-banner>

    <!-- CARD ORFANE -->
    <q-card
      v-if="orphans.length"
      flat
      bordered
      class="rounded-borders q-pa-sm q-mb-md orphan-card"
    >
      <div class="row items-start q-gutter-sm">
        <q-icon name="warning" class="text-amber-9 q-mt-xs" />
        <div class="column col">
          <div class="text-subtitle1 text-amber-10">Categorie fuori albero</div>
          <div class="text-caption q-mb-sm">
            Sistema collegandole a un genitore o impostandole come root del locale.
          </div>

          <!-- Candidati root (senza genitori) -->
          <div v-if="orphansSplit.noParents.length" class="q-mb-xs">
            <div class="text-caption text-grey-8 q-mb-xs">Senza genitori (candidati root)</div>
            <div class="q-gutter-xs">
              <q-chip
                v-for="c in orphansSplit.noParents"
                :key="c._id"
                :icon="c.icon || 'fork_right'"
                :style="chipStyle(c)"
                clickable
                @click="openEditFromOrphan(c)"
              >
                {{ c.title || c.slug || c._id }}
              </q-chip>
            </div>
          </div>

          <!-- Genitori non validi / fuori albero -->
          <div v-if="orphansSplit.dangling.length" class="q-mt-sm">
            <div class="text-caption text-grey-8 q-mb-xs">Genitori non validi / fuori albero</div>
            <div class="q-gutter-xs">
              <q-chip
                v-for="c in orphansSplit.dangling"
                :key="c._id"
                :icon="c.icon || 'link_off'"
                :style="chipStyle(c)"
                clickable
                @click="openEditFromOrphan(c)"
              >
                {{ c.title || c.slug || c._id }}
              </q-chip>
            </div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- ALBERO -->
    <q-card flat bordered class="rounded-borders shadow-1 relative-position">
      <!-- overlay ordinamento -->
      <q-inner-loading :showing="reordering">
        <q-spinner-gears size="42px" />
        <div class="text-subtitle2 q-mt-sm">Salvataggio ordinamento…</div>
      </q-inner-loading>

      <!-- Banner stato -->
      <q-banner
        v-if="dragMode"
        class="bg-indigo-1 text-indigo-10 q-ma-sm rounded-borders"
        dense
      >
        Modalità ordinamento attiva — trascina le categorie per cambiare gerarchia e ordine.
      </q-banner>
      <q-banner
        v-else-if="search"
        dense
        class="bg-grey-2 text-grey-8 q-ma-sm rounded-borders"
      >
        Filtro attivo.
      </q-banner>

      <div class="q-pa-sm">
        <!-- Modalità ORDINA: Draggable -->
        <template v-if="dragMode">
          <Draggable
            v-model="dragData"
            :indent="18"
            class="comfy-tree"
            @change="onTreeChange"
            @choose="onChoose"
            :draggable="canUpdateCategories"
          >
            <template #default="{ node }">
              <div class="row items-center no-wrap full-width q-py-xs">
                <q-icon :name="node.icon || 'folder'" :color="node.color || 'primary'" size="20px" class="q-mr-sm" />
                <div
                  class="ellipsis text-body1 col cursor-move"
                  :class="{'text-primary': selectedId === node.id}"
                >
                  <div class="row items-center no-wrap">
                    <span class="ellipsis">{{ node.label }}</span>
                    <q-chip v-if="node.hidden" dense size="sm" class="q-ml-sm">nascosta</q-chip>
                  </div>
                  <div class="text-caption text-grey-7 ellipsis">{{ node.slug }}</div>
                </div>
                <div class="col-auto row items-center q-gutter-xs q-ml-sm">
                  <q-btn dense flat round icon="edit"    :disable="!canUpdateCategories" @click.stop="openEditFromTreeNode(node.id)" />
                  <q-btn dense flat round icon="delete"  color="negative" :disable="!canDeleteCategories" @click.stop="askDelete(node.id)" />
                </div>
              </div>
            </template>
          </Draggable>
        </template>

        <!-- Modalità NAVIGA: QTree -->
        <template v-else>
          <q-tree
            v-if="businessId"
            :nodes="treeNodes"
            node-key="id"
            v-model:selected="selectedId"
            v-model:expanded="expandedKeys"
            :filter="search"
            :filter-method="filterMethod"
            dense
            no-connectors
          >
            <template #default-header="prop">
              <div
                class="row items-center no-wrap full-width q-py-xs header-row cursor-pointer"
                role="button"
                tabindex="0"
                @click="onHeaderClick(prop)"
                @keydown.enter.prevent="onHeaderClick(prop)"
                @keydown.space.prevent="onHeaderClick(prop)"
              >
                <q-icon :name="prop.node.icon || 'folder'" :color="prop.node.color || 'primary'" size="20px" class="q-mr-sm" />
                <div
                  class="ellipsis text-body1 col"
                  :class="{'text-primary': selectedId === prop.node.id}"
                >
                  <div class="row items-center no-wrap">
                    <span class="ellipsis">{{ prop.node.label }}</span>
                    <q-chip v-if="prop.node.hidden" dense size="sm" class="q-ml-sm">nascosta</q-chip>
                  </div>
                  <div class="text-caption text-grey-7 ellipsis">{{ prop.node.slug }}</div>
                </div>
                <div class="col-auto row items-center q-gutter-xs q-ml-sm">
                  <q-btn
                    dense flat round icon="subdirectory_arrow_right"
                    :disable="!canCreateCategories"
                    @click.stop="openCreateChildFromNode(prop.node.id)"
                  />
                  <q-btn
                    dense flat round icon="edit"
                    :disable="!canUpdateCategories"
                    @click.stop="openEditFromTreeNode(prop.node.id)"
                  />
                  <q-btn
                    dense flat round icon="delete" color="negative"
                    :disable="!canDeleteCategories"
                    @click.stop="askDelete(prop.node.id)"
                  />
                </div>
              </div>
            </template>
          </q-tree>

          <div v-else class="q-pa-md text-grey-7">
            Seleziona/associa un locale per visualizzare le categorie.
          </div>

          <div v-if="businessId && !treeNodes.length" class="q-pa-md text-grey-7">
            Nessuna categoria per “{{ businessName }}”. Crea la prima con
            <b>Aggiungi categoria radice</b>.
          </div>
        </template>
      </div>
    </q-card>

    <!-- FAB (mobile) -->
    <q-page-sticky position="bottom-right" :offset="[16,16]" class="lt-md">
      <q-fab color="primary" icon="add" direction="up" glossy v-show="!dragMode">
        <q-fab-action color="primary" icon="add_circle" label="Nuova root" :disable="!businessId || !canCreateCategories" @click="openCreateRoot" />
        <q-fab-action
          color="primary" icon="subdirectory_arrow_right" label="Nuova sottocategoria"
          :disable="!selectedId || !businessId || !canCreateCategories" @click="openCreateChildFromSelection"
        />
      </q-fab>
    </q-page-sticky>

    <!-- Editor -->
    <q-dialog v-model="editor.show" :maximized="$q.screen.lt.md" transition-show="slide-up" transition-hide="slide-down" persistent>
      <q-card style="width: 95vw; height: fit-content;" class="q-pa-md">
        <q-toolbar>
          <q-btn flat round dense icon="arrow_back" v-close-popup />
          <q-toolbar-title>{{ editor.mode === 'create' ? 'Nuova categoria' : 'Modifica categoria' }}</q-toolbar-title>

          <!-- Elimina in edit -->
          <q-btn
            v-if="editor.mode==='edit'"
            flat dense icon="delete" color="negative"
            :disable="!canDeleteCategories"
            @click="askDeleteFromEditor"
          />

          <q-btn
            flat dense icon="save" color="primary" :loading="saving"
            :disable="editor.mode === 'create' ? !canCreateCategories : !canUpdateCategories"
            @click="submitEditor"
          />
        </q-toolbar>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-input v-model="form.title" label="Nome *" dense outlined :rules="[rRequired]" @update:model-value="autoSlug()" />
          <q-input v-model="form.slug" label="Slug *" dense outlined :rules="[rRequired]" />

          <div class="row">
            <div class="col-6"><q-input v-model.number="form.order" type="number" label="Ordine" dense outlined /></div>
            <div class="col-6 flex items-center"><q-toggle v-model="form.hidden" label="Nascosta" /></div>
          </div>

          <div class="row">
            <div class="col-5 q-mr-md"><IconPicker v-model="form.icon" label="Icona (Material icon name)" variant="twotone" /></div>
            <div class="col-6">
              <q-input v-model="form.color" label="Colore (HEX)" dense outlined placeholder="#6A5ACD" :rules="[rHexColor]">
                <template #append>
                  <div :style="{ width:'22px', height:'22px', borderRadius:'6px', background: validHexOrFallback(form.color), border:'1px solid rgba(0,0,0,.1)'}" class="q-mr-sm"/>
                  <q-btn dense flat round icon="palette">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-color v-model="form.color" format="hex" default-view="palette" />
                    </q-popup-proxy>
                  </q-btn>
                </template>
              </q-input>
            </div>
          </div>

          <q-input v-model="form.description" type="textarea" autogrow label="Descrizione" dense outlined />

          <!-- Toggle root per business corrente -->
          <div class="row items-center q-mt-sm" v-if="businessId">
            <div class="col-12">
              <q-toggle
                v-model="asRootToggle"
                :disable="saving"
                label="Imposta come root del locale corrente"
              />
              <div class="text-caption text-grey-7 q-ml-sm">
                Se attivo, la categoria diventa una radice per “{{ businessName }}”.
                Se disattivo, seleziona almeno un genitore qui sotto.
              </div>
            </div>
          </div>

          <!-- Selettore genitori -->
          <q-select
            v-model="form.parents"
            :options="parentOptions"
            multiple use-chips dense outlined
            option-value="id" option-label="path" emit-value map-options
            label="Genitori"
            :hint="'Lascia vuoto per impostarla come root del locale. Evita cicli: non selezionare questa categoria o i suoi discendenti.'"
          />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Annulla" v-close-popup />
          <q-btn
            color="primary" label="Salva" :loading="saving"
            :disable="editor.mode === 'create' ? !canCreateCategories : !canUpdateCategories"
            @click="submitEditor"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog delete -->
    <SecurityCodeConfirmDialog
      v-model="showDeleteConfirm"
      :title="`Elimina “${deleteTarget?.label || ''}”`"
      :message="deleteWarningHtml"
      confirm-label="Elimina definitivamente"
      color="red"
      :length="6"
      @confirmed="doDelete(deleteTarget.id)"
    />

    <!-- Figli presenti (blocco) -->
    <q-dialog v-model="showChildrenBlock" transition-show="scale" transition-hide="scale">
      <q-card style="width: 95vw; height: 90vh;">
        <q-card-section class="row items-center q-col-gutter-sm">
          <div class="col">
            <div class="text-h6">Impossibile eliminare</div>
            <div class="text-caption">
              La categoria <b>{{ deleteTarget?.label }}</b> contiene sottocategorie. Rimuovi o sposta prima le sottocategorie elencate qui sotto.
            </div>
          </div>
          <div class="col-auto"><q-btn dense round flat icon="close" v-close-popup /></div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-list bordered separator class="rounded-borders">
            <q-item v-for="c in childrenOfDelete" :key="c.id">
              <q-item-section avatar><q-icon :name="c.icon || 'folder'" :color="c.color || 'primary'" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ c.title }}</q-item-label>
                <q-item-label caption>{{ c.slug }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right"><q-btn flat label="Ok" v-close-popup /></q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Prodotti presenti (blocco) -->
    <q-dialog v-model="showProductsBlock" transition-show="scale" transition-hide="scale">
      <q-card style="width: 95vw; max-width: 800px;">
        <q-card-section class="row items-center q-col-gutter-sm">
          <div class="col">
            <div class="text-h6">Impossibile eliminare</div>
            <div class="text-caption">
              La categoria <b>{{ deleteTarget?.label }}</b> è utilizzata da {{ productsBlocking.length }} prodotto/i.
              Rimuovi prima il riferimento alla categoria da questi prodotti.
            </div>
          </div>
          <div class="col-auto"><q-btn dense round flat icon="close" v-close-popup /></div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-sm">
          <q-list bordered separator class="rounded-borders">
            <q-item v-for="p in productsBlocking" :key="p._id">
              <q-item-section avatar><q-icon name="inventory_2" /></q-item-section>
              <q-item-section>
                <q-item-label>{{ p.name || p.slug || p._id }}</q-item-label>
                <q-item-label caption v-if="p.slug">{{ p.slug }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right"><q-btn flat label="Ok" v-close-popup /></q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { Draggable } from '@he-tree/vue'
import '@he-tree/vue/style/default.css'
import SecurityCodeConfirmDialog from 'src/components/common/SecurityCodeConfirmDialog.vue'
import IconPicker from 'src/components/pickers/IconPicker.vue'

import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'
import { PERM } from 'src/auth/perm'
import { api } from 'boot/axios'

const $q = useQuasar()
const API = import.meta.env.VITE_API_URL

/* ---------- stores & business ---------- */
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

// SOLO chi ha MANAGE_ALL_BUSINESSES vede la tendina
const canSeeAllBusinesses = computed(() => {
  const perm = usersStore.currentUser?.perm ?? 0
  return (perm & PERM.MANAGE_ALL_BUSINESSES) !== 0
})

/* ========== PERMESSI CRUD categorie ========== */
const canCreateCategories = computed(() => {
  const perm = usersStore.currentUser?.perm ?? 0
  return !!(perm & PERM.CATEGORIES_CREATE)
})
const canUpdateCategories = computed(() => {
  const perm = usersStore.currentUser?.perm ?? 0
  return !!(perm & (PERM.CATEGORIES_UPDATE | PERM.CATEGORIES_WRITE))
})
const canDeleteCategories = computed(() => {
  const perm = usersStore.currentUser?.perm ?? 0
  return !!(perm & PERM.CATEGORIES_DELETE)
})

// business effettivo
const businessId = computed(() => {
  if (canSeeAllBusinesses.value) {
    return usersStore.selectedBusinessId || usersStore.currentUser?.primaryBusinessId || null
  }
  return usersStore.currentUser?.primaryBusinessId || usersStore.currentUser?.business?._id || null
})

const businessName = computed(() => {
  const id = businessId.value
  const found = (businessStore.businesses || []).find(b => b._id === id)
  return found?.name
    || usersStore.currentUser?.business?.name
    || (businessStore.currentBusiness?.name) || ''
})

/* ---------- state ---------- */
const loading = ref(false)
const saving = ref(false)
const reordering = ref(false)     // overlay loading per ordinamento
const error = ref(null)
const search = ref('')

const dragMode = ref(false)       // modalità ordinamento
const hasFilter = computed(() => (search.value || '').trim().length > 0)

const rawTree = ref([])           // struttura dal backend (array root con children)
const selectedId = ref(null)
const expandedKeys = ref([])

const dragData = ref([])          // dati per Draggable
const snapshot = ref({ parentOf: new Map(), orders: new Map() })

const orphans = ref([]) // categorie fuori albero

let idToNode = new Map()
let idToParentId = new Map()

/* ---------- load ---------- */
async function loadTree() {
  if (!businessId.value) {
    rawTree.value = []
    orphans.value = []
    expandedKeys.value = []
    dragData.value = []
    snapshot.value = makeSnapshot([])
    return
  }
  loading.value = true
  error.value = null
  try {
    const { data: json } = await api.get(`${API}/cms/categories`, {
      params: { includeHidden: 1, businessId: businessId.value }
    })
    if (!json.ok) throw new Error(json.error || 'Errore caricamento categorie')
    rawTree.value = json.data || []
    orphans.value = json.orphans || []
    rebuildIndexes()

    // QTree chiuso all'apertura
    expandedKeys.value = []

    // prepara dati per Draggable + snapshot corrente
    dragData.value = toDragNodes(rawTree.value)
    snapshot.value = makeSnapshot(dragData.value)
  } catch (e) {
    error.value = e.message
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    loading.value = false
  }
}

function rebuildIndexes() {
  idToNode = new Map()
  idToParentId = new Map()
  const walk = (n, parentId = null) => {
    idToNode.set(n._id, n)
    idToParentId.set(n._id, parentId)
    n.children?.forEach(c => walk(c, n._id))
  }
  rawTree.value.forEach(r => walk(r, null))
}

/* ---------- mapping: raw -> QTree nodes ---------- */
const treeNodes = computed(() => toTreeNodes(rawTree.value))
function toTreeNodes(list) {
  return (list || []).map(n => ({
    id: n._id,
    label: n.title,
    slug: n.slug,
    hidden: !!n.hidden,
    icon: n.icon || null,
    color: n.color || null,
    description: n.description || null,
    children: toTreeNodes(n.children || [])
  }))
}

/* ---------- mapping: raw -> Draggable nodes ---------- */
function toDragNodes(list) {
  return (list || []).map(n => ({
    id: n._id,
    label: n.title,
    slug: n.slug,
    order: n.order ?? 0,
    hidden: !!n.hidden,
    icon: n.icon || null,
    color: n.color || null,
    description: n.description || null,
    children: toDragNodes(n.children || [])
  }))
}

/* ---------- filtro per QTree ---------- */
function filterMethod (node, term) {
  const t = (term || '').toLowerCase().trim()
  if (!t) return true
  const label = (node.label || '').toLowerCase()
  const slug = (node.slug || '').toLowerCase()
  return label.includes(t) || slug.includes(t)
}

/* ---------- espansione tramite click sulla riga ---------- */
function toggleExpandById (id) {
  const i = expandedKeys.value.indexOf(id)
  if (i > -1) expandedKeys.value.splice(i, 1)
  else expandedKeys.value.push(id)
}
function onHeaderClick (prop) {
  const node = prop.node
  selectedId.value = node.id
  if (node.children && node.children.length) {
    toggleExpandById(node.id)
  }
}

/* ---------- Modalità ORDINA ---------- */
function toggleDragMode () {
  if (dragMode.value) {
    // chiudo: ricarico struttura per riflettere eventuali salvataggi
    loadTree()
    dragMode.value = false
  } else {
    if (hasFilter.value) {
      $q.notify({ type: 'warning', message: 'Rimuovi il filtro per ordinare' })
      return
    }
    dragData.value = toDragNodes(rawTree.value)
    snapshot.value = makeSnapshot(dragData.value)
    dragMode.value = true
  }
}

function onChoose({ node }) {
  selectedId.value = node?.id || null
}

function makeSnapshot(nodes) {
  const parentOf = new Map()
  const orders = new Map()
  const walk = (arr, parent=null) => {
    arr.forEach((n, idx) => {
      parentOf.set(n.id, parent)
      const key = parent || 'ROOT'
      if (!orders.has(key)) orders.set(key, [])
      orders.get(key).push({ id: n.id, order: idx })
      if (n.children?.length) walk(n.children, n.id)
    })
  }
  walk(nodes, null)
  return { parentOf, orders }
}

async function onTreeChange () {
  if (!canUpdateCategories.value) return

  const next = makeSnapshot(dragData.value)
  const prev = snapshot.value

  const updates = []
  for (const [id, newParent] of next.parentOf.entries()) {
    const oldParent = prev.parentOf.get(id) ?? null
    if (oldParent !== newParent) updates.push({ id, parents: newParent ? [newParent] : [], _type: 'parentChange' })
  }
  for (const [, arr] of next.orders.entries()) {
    arr.forEach(({ id, order }) => updates.push({ id, order, _type: 'orderSet' }))
  }

  if (!updates.length) return

  try {
    reordering.value = true
    for (const u of updates) {
      const body = {}
      if ('parents' in u) body.parents = u.parents
      if ('order' in u) body.order = u.order

      await api.put(`${API}/cms/categories/${u.id}`, body, {
        params: { businessId: businessId.value }
      })
    }
    snapshot.value = next
    $q.notify({ type: 'positive', message: 'Struttura aggiornata' })
    await loadTree()
    // resta in drag mode finché l’utente non preme "Fine"
    dragMode.value = true
    // ricostruisco i dati della vista drag dalla nuova struttura
    dragData.value = toDragNodes(rawTree.value)
    snapshot.value = makeSnapshot(dragData.value)
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Errore nel salvataggio dell’ordinamento' })
  } finally {
    reordering.value = false
  }
}

/* ---------- editor ---------- */
const editor = ref({ show: false, mode: 'edit', id: null })
const form = ref({
  title: '', slug: '', order: 0, hidden: false, icon: '', color: '', description: '', parents: []
})

function openEditFromTreeNode(id) {
  const src = idToNode.get(id)
  if (!src) return
  selectedId.value = id
  editor.value = { show: true, mode: 'edit', id }
  form.value = {
    title: src?.title || '',
    slug: src?.slug || '',
    order: src?.order ?? 0,
    hidden: !!src?.hidden,
    icon: src?.icon || '',
    color: src?.color || '',
    description: src?.description || '',
    parents: src ? [idToParentId.get(src._id)].filter(Boolean) : []
  }
}

function openEditFromOrphan(orph) {
  editor.value = { show: true, mode: 'edit', id: orph._id }
  form.value = {
    title: orph?.title || '',
    slug: orph?.slug || '',
    order: 0,
    hidden: false,
    icon: orph?.icon || '',
    color: orph?.color || '',
    description: '',
    parents: [] // parte senza genitori
  }
}

/* crea nuove */
function openCreateRoot() {
  editor.value = { show: true, mode: 'create', id: null }
  form.value = { title: '', slug: '', order: 0, hidden: false, icon: '', color: '', description: '', parents: [] }
}
function openCreateChildFromSelection() {
  if (!selectedId.value) return
  openCreateChildFromNode(selectedId.value)
}
function openCreateChildFromNode(parentId) {
  editor.value = { show: true, mode: 'create', id: null }
  form.value = { title: '', slug: '', order: 0, hidden: false, icon: '', color: '', description: '', parents: [parentId] }
}

/* ---------- Toggle "root per business corrente" ---------- */
const asRootToggle = computed({
  get () {
    return (form.value.parents || []).length === 0
  },
  set (val) {
    if (val) {
      form.value.parents = []
    } else {
      $q.notify({ type: 'info', message: 'Per togliere dalle root, seleziona almeno un genitore.' })
    }
  }
})

/* ---------- HEX helpers ---------- */
function expand3to6(hex) { return hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex }
function normalizeHex(v) {
  if (!v) return null
  let s = String(v).trim()
  if (s.startsWith('#')) s = s.slice(1)
  if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s)) return null
  const six = expand3to6(s).toLowerCase()
  return `#${six}`
}
function validHexOrFallback(v) { return normalizeHex(v) || '#cccccc' }
const rHexColor = v => (normalizeHex(v) !== null || !v) ? true : 'Inserisci un colore HEX valido (#RRGGBB)'
const rRequired = v => (v && String(v).trim().length > 0) || 'Obbligatorio'
function slugify(s='') { return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,'') }
function autoSlug() { if (!form.value.slug || form.value.slug.length < 2) form.value.slug = slugify(form.value.title) }

/* ---------- orphans split + stile chip ---------- */
const orphansSplit = computed(() => ({
  noParents: (orphans.value || []).filter(o => o.orphanType === 'noParents'),
  dangling:  (orphans.value || []).filter(o => o.orphanType === 'dangling')
}))
function chipStyle (opt) {
  const c = opt?.color
  if (!c) return ''
  return `background:${c}26;border:1px solid ${c}66;border-radius:12px`
}

/* genitori per select (include anche le orfane) */
const parentOptions = computed(() => {
  const opts = []
  const pushFromTree = (n, path) => {
    const me = { id: n._id, path: path ? `${path} / ${n.title}` : n.title, from: 'tree' }
    opts.push(me); (n.children || []).forEach(c => pushFromTree(c, me.path))
  }
  ;(rawTree.value || []).forEach(r => pushFromTree(r, ''))

  for (const o of (orphans.value || [])) {
    if (!opts.some(x => x.id === o._id)) {
      const label = o.title || o.slug || o._id
      const suffix = o.orphanType === 'noParents' ? ' (orfana)' : ' (genitore non valido)'
      opts.push({ id: o._id, path: `${label}${suffix}`, from: 'orphan' })
    }
  }

  const block = new Set()
  if (editor.value?.id) {
    block.add(editor.value.id)
    const start = idToNode.get(editor.value.id)
    const collect = (n) => { block.add(n._id); (n.children || []).forEach(collect) }
    if (start) collect(start) // se l’orfana non è nell’albero, blocchiamo solo se stessa
  }
  return opts.map(o => ({ ...o, disable: block.has(o.id) }))
})

/* ---------- DELETE UX ---------- */
const showDeleteConfirm = ref(false)
const deleteTarget = ref({ id: null, label: '' })
const showChildrenBlock = ref(false)
const childrenOfDelete = ref([])

/* nuovo: dialog per prodotti che bloccano la delete */
const showProductsBlock = ref(false)
const productsBlocking = ref([])

const deleteWarningHtml = computed(() => {
  const name = deleteTarget.value?.label || 'categoria'
  return `
    <p>Questa azione <b>non può essere annullata</b>.<br/>
    Verrà eliminata definitivamente <b>${name}</b>.</p>
    <p class="q-mt-sm">Digita il codice di sicurezza per confermare.</p>
  `
})

function askDelete(id) {
  const src = idToNode.get(id)
  if (!src) {
    // se non è nell'albero, può essere un'orfana
    deleteTarget.value = { id, label: '' }
    showDeleteConfirm.value = true
    return
  }
  const hasChildren = Array.isArray(src.children) && src.children.length > 0

  deleteTarget.value = { id, label: src.title }

  if (hasChildren) {
    childrenOfDelete.value = src.children.map(c => ({
      id: c._id,
      title: c.title,
      slug: c.slug,
      icon: c.icon,
      color: c.color
    }))
    showChildrenBlock.value = true
  } else {
    showDeleteConfirm.value = true
  }
}

/* elimina dalla toolbar dell'editor */
function askDeleteFromEditor () {
  if (!editor.value?.id) return
  deleteTarget.value = {
    id: editor.value.id,
    label: form.value?.title || form.value?.slug || editor.value.id
  }
  showDeleteConfirm.value = true
}

async function doDelete(id) {
  if (!id) return
  if (!canDeleteCategories.value) {
    $q.notify({ type: 'warning', message: 'Non hai i permessi per eliminare categorie' })
    return
  }
  saving.value = true
  try {
    await api.delete(`${API}/cms/categories/${id}`, {
      params: { businessId: businessId.value }
    })
    $q.notify({ type: 'positive', message: 'Categoria eliminata' })
    editor.value.show = false
    await loadTree()
    selectedId.value = null
  } catch (e) {
    const status = e?.response?.status
    const payload = e?.response?.data
    if (status === 409 && payload?.children?.length) {
      // blocco per sottocategorie
      childrenOfDelete.value = payload.children.map(c => ({
        id: c._id,
        title: c.title,
        slug: c.slug,
        icon: c.icon,
        color: c.color
      }))
      showChildrenBlock.value = true
    } else if (status === 409 && payload?.products?.length) {
      // blocco per prodotti collegati
      productsBlocking.value = payload.products.map(p => ({
        _id: p._id,
        name: p.name,
        slug: typeof p.slug === 'string' ? p.slug : (p.slug?.current || '')
      }))
      showProductsBlock.value = true
    } else {
      $q.notify({ type: 'negative', message: e.message || 'Eliminazione fallita' })
    }
  } finally {
    saving.value = false
  }
}

/* ---------- save singola categoria ---------- */
async function submitEditor() {
  if (!form.value.title || !form.value.slug) {
    $q.notify({ type: 'warning', message: 'Titolo e slug sono obbligatori' })
    return
  }
  if (!businessId.value) {
    $q.notify({ type: 'warning', message: 'Seleziona un locale' })
    return
  }

  const colorToSend = normalizeHex(form.value.color)
  const isRoot = !(form.value.parents && form.value.parents.length)

  saving.value = true
  try {
    if (editor.value.mode === 'create') {
      if (!canCreateCategories.value) {
        $q.notify({ type: 'warning', message: 'Non hai i permessi per creare categorie' })
        saving.value = false
        return
      }
      await api.post(`${API}/cms/categories`,
        {
          title: form.value.title,
          slug: form.value.slug,
          order: form.value.order || 0,
          hidden: !!form.value.hidden,
          icon: form.value.icon || null,
          color: colorToSend,
          description: form.value.description || null,
          parents: form.value.parents || []
        },
        { params: { businessId: businessId.value } }
      )

      $q.notify({
        type: 'positive',
        message: isRoot && businessName.value
          ? 'Categoria creata e collegata come root del locale “' + businessName.value + '”'
          : 'Categoria creata'
      })
    } else {
      if (!canUpdateCategories.value) {
        $q.notify({ type: 'warning', message: 'Non hai i permessi per modificare categorie' })
        saving.value = false
        return
      }
      const id = editor.value.id
      await api.put(`${API}/cms/categories/${id}`,
        {
          title: form.value.title,
          slug: form.value.slug,
          order: form.value.order || 0,
          hidden: !!form.value.hidden,
          icon: form.value.icon || null,
          color: colorToSend,
          description: form.value.description || null,
          parents: form.value.parents
        },
        { params: { businessId: businessId.value } }
      )
      $q.notify({ type: 'positive', message: isRoot ? 'Impostata come root' : 'Salvato' })
    }
    editor.value.show = false
    await loadTree()
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    saving.value = false
  }
}

/* ---------- boot & reactivity ---------- */
onMounted(async () => {
  if (!usersStore.currentUser && usersStore.token) {
    try { await usersStore.fetchCurrentUser() } catch(e) { console.error('Errore user in Categorie', e) }
  }
  if (!businessStore.businesses?.length) {
    try { await businessStore.fetchBusinesses() } catch(e) { console.error('Errore locale in Categorie', e) }
  }
  await loadTree()
})
watch(() => usersStore.selectedBusinessId, async () => {
  if (!canSeeAllBusinesses.value) return
  selectedId.value = null
  search.value = ''
  dragMode.value = false
  await loadTree()
})
watch(businessId, async () => {
  dragMode.value = false
  await loadTree()
})
</script>

<style scoped>
.hero { background: linear-gradient(135deg, #6a5acd, #7b68ee, #00bcd4); }
.hero-input :deep(.q-field__native),
.hero-input :deep(.q-field__prefix),
.hero-input :deep(.q-field__suffix),
.hero-input :deep(.q-field__input) { color: #fff !important; }
.hero-input :deep(.q-field__control) {
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(6px);
  border-radius: 12px;
}

/* QTree “accordion look” + riga cliccabile ampia */
:deep(.q-tree__node-header) { min-height: 44px; padding: 6px 4px; }
:deep(.q-tree__node--parent > .q-tree__node-header) {
  border-radius: 10px;
  background: rgba(0,0,0,0.02);
}
.body--dark :deep(.q-tree__node--parent > .q-tree__node-header) {
  background: rgba(255,255,255,0.05);
}

.header-row { padding: 10px 6px; border-radius: 10px; }
.header-row:hover { background: rgba(0,0,0,0.03); }
.body--dark .header-row:hover { background: rgba(255,255,255,0.06); }

/* Draggable spacing */
.comfy-tree :deep(.he-tree-node) { min-height: 44px; padding-top: 6px; padding-bottom: 6px; }

/* Orphans card */
.orphan-card { background: #fff7e6; border-color: #ffd699; }
.body--dark .orphan-card { background: rgba(255, 193, 7, 0.08); border-color: rgba(255, 193, 7, .3); }
</style>
