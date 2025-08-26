<!-- src/apps/cms/pages/CategoriesCms.vue -->
<template>
  <q-page class="q-pa-md">
    <!-- HERO + SEARCH -->
    <q-card flat class="hero q-pa-md q-mb-md rounded-borders shadow-2">
  <div class="column q-gutter-xs">
    <div class="text-h5 text-white">Categorie</div>
    <div class="text-caption text-white opacity-80">Gestione ad albero</div>

    <!-- MOBILE: stack verticale -->
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

      <div
        class="relative-position inline-block"
        :class="{ 'col-12': $q.screen.lt.md }"
      >
      <q-btn
        color="white"
        text-color="primary"
        icon="add_circle"
        label="Aggiungi categoria radice"
        class="full-width q-mx-auto"
        @click="openCreateRoot"
      />
    </div>

      <div
        class="relative-position inline-block"
        :class="{ 'col-12': $q.screen.lt.md }"
      >
        <q-btn
          color="white"
          outline
          text-color="white"
          icon="subdirectory_arrow_right"
          label="Aggiungi sottocategoria"
          :class="{ 'full-width': $q.screen.lt.md }"
          :disable="!selectedId"
          @click="openCreateChildFromSelection"
        />
        <q-tooltip
          v-if="!selectedId"
          anchor="top middle"
          self="bottom middle"
          class="bg-grey-9 text-white"
        >
          Per aggiungere una sottocategoria seleziona prima la categoria genitore
        </q-tooltip>
      </div>
    </div>

    <!-- DESKTOP: in riga -->
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
        @click="openCreateRoot"
      />
      <q-btn
        color="white"
        outline
        text-color="white"
        icon="subdirectory_arrow_right"
        label="Aggiungi sottocategoria"
        :disable="!selectedId"
        @click="openCreateChildFromSelection"
      />
    </div>
  </div>
</q-card>


    <!-- Stato -->
    <q-skeleton v-if="loading" type="rect" height="220px" class="rounded-borders" />
    <q-banner v-else-if="error" type="negative" dense class="q-mb-md">{{ error }}</q-banner>

    <!-- Albero con DnD (@he-tree/vue) -->
    <q-card v-else flat bordered class="rounded-borders shadow-1">
      <q-banner v-if="hasFilter" dense class="bg-grey-2 text-grey-8 q-ma-sm rounded-borders">
        Filtra attivo: drag & drop disabilitato.
      </q-banner>

      <!-- Vista con DnD -->
      <div v-if="!hasFilter" class="q-pa-sm">
        <Draggable
          v-model="dragData"
          :indent="18"
          class="comfy-tree"
          @change="onTreeChange"
          @choose="onChoose"
        >
          <template #default="{ node }">
            <div class="row items-center no-wrap full-width q-py-xs">
              <q-icon :name="node.icon || 'folder'" :color="node.color || 'primary'" size="20px" class="q-mr-sm" />
              <!-- click sul titolo: solo seleziona -->
              <div
                class="ellipsis text-body1 cursor-pointer col"
                @click.stop="selectedId = node.id"
                :class="{'text-primary': selectedId === node.id}"
              >
                {{ node.label }}
              </div>
              <q-chip v-if="node.hidden" dense size="sm" class="q-ml-xs">nascosta</q-chip>
              <div class="col-auto row items-center q-gutter-xs q-ml-sm">
                <!-- edit SOLO dall’icona -->
                <q-btn dense flat round icon="edit" @click.stop="openEditFromItem(node)" />
                <q-btn dense flat round icon="delete" color="negative" @click.stop="askDelete(node.id)" />
              </div>
            </div>
          </template>
        </Draggable>
      </div>

      <!-- Vista filtrata (read-only) -->
      <div v-else class="q-pa-sm dnd-disabled">
        <Draggable
          :modelValue="filteredDragData"
          @update:modelValue="noop"
          :indent="18"
          class="comfy-tree"
          :draggable="false"
        >
          <template #default="{ node }">
            <div class="row items-center no-wrap full-width q-py-xs">
              <q-icon :name="node.icon || 'folder'" :color="node.color || 'primary'" size="20px" class="q-mr-sm" />
              <div
                class="ellipsis text-body1 cursor-pointer col"
                @click.stop="selectedId = node.id"
                :class="{'text-primary': selectedId === node.id}"
              >
                {{ node.label }}
              </div>
              <q-chip v-if="node.hidden" dense size="sm" class="q-ml-xs">nascosta</q-chip>
              <div class="col-auto row items-center q-gutter-xs q-ml-sm">
                <q-btn dense flat round icon="edit" @click.stop="openEditFromItem(node)" />
                <q-btn dense flat round icon="delete" color="negative" @click.stop="askDelete(node.id)" />
              </div>
            </div>
          </template>
        </Draggable>
      </div>

      <div v-if="!dragData.length" class="q-pa-md text-grey-7">
        Nessuna categoria. Crea la prima con “Root”.
      </div>
    </q-card>

    <!-- FAB (mobile) -->
    <q-page-sticky position="bottom-right" :offset="[16,16]" class="lt-md">
      <q-fab color="primary" icon="add" direction="up" glossy>
        <q-fab-action color="primary" icon="add_circle" label="Nuova root" @click="openCreateRoot" />
        <q-fab-action
          color="primary" icon="subdirectory_arrow_right" label="Nuova sottocategoria"
          :disable="!selectedId" @click="openCreateChildFromSelection"
        />
      </q-fab>
    </q-page-sticky>

    <!-- Editor (create/edit) -->
    <q-dialog
      v-model="editor.show"
      :maximized="$q.screen.lt.md"
      transition-show="slide-up"
      transition-hide="slide-down"
      persistent
    >
      <q-card style="width: 95vw; height: 90vh;">
        <q-toolbar>
          <q-btn flat round dense icon="arrow_back" v-close-popup />
          <q-toolbar-title>{{ editor.mode === 'create' ? 'Nuova categoria' : 'Modifica categoria' }}</q-toolbar-title>
          <q-btn flat dense icon="save" color="primary" :loading="saving" @click="submitEditor" />
        </q-toolbar>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <q-input v-model="form.title" label="Nome *" dense outlined :rules="[rRequired]" @update:model-value="autoSlug()" />
          <q-input v-model="form.slug" label="Slug *" dense outlined :rules="[rRequired]" />

          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input v-model.number="form.order" type="number" label="Ordine" dense outlined />
            </div>
            <div class="col-6 flex items-center">
              <q-toggle v-model="form.hidden" label="Nascosta" />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input v-model="form.icon" label="Icona (material)" dense outlined />
            </div>

            <!-- COLOR PICKER (HEX normalizzato #rrggbb) -->
            <div class="col-6">
              <q-input
                v-model="form.color"
                label="Colore (HEX)"
                dense outlined placeholder="#6A5ACD"
                :rules="[rHexColor]"
              >
                <template #append>
                  <div
                    :style="{
                      width: '22px', height: '22px',
                      borderRadius: '6px',
                      background: validHexOrFallback(form.color),
                      border: '1px solid rgba(0,0,0,.1)'
                    }"
                    class="q-mr-sm"
                  />
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

          <!-- Genitori (multi; DnD gestisce il “primario”) -->
          <q-select
            v-model="form.parents"
            :options="parentOptions"
            multiple
            use-chips
            dense
            outlined
            option-value="id"
            option-label="path"
            emit-value
            map-options
            label="Genitori"
            :hint="'Evita cicli: non selezionare questa categoria o i suoi discendenti.'"
          />
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

    <!-- Dialog: blocco eliminazione se ha figli -->
    <q-dialog v-model="showChildrenBlock" transition-show="scale" transition-hide="scale">
      <q-card style="width: 95vw; height: 90vh;">
        <q-card-section class="row items-center q-col-gutter-sm">
          <div class="col">
            <div class="text-h6">Impossibile eliminare</div>
            <div class="text-caption">
              La categoria <b>{{ deleteTarget?.label }}</b> contiene sottocategorie.
              Rimuovi o sposta prima le sottocategorie elencate qui sotto.
            </div>
          </div>
          <div class="col-auto">
            <q-btn dense round flat icon="close" v-close-popup />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-list bordered separator class="rounded-borders">
            <q-item v-for="c in childrenOfDelete" :key="c.id">
              <q-item-section avatar>
                <q-icon :name="c.icon || 'folder'" :color="c.color || 'primary'" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ c.title }}</q-item-label>
                <q-item-label caption>{{ c.slug }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Ok" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { Draggable } from '@he-tree/vue'
import '@he-tree/vue/style/default.css'
import SecurityCodeConfirmDialog from 'src/components/common/SecurityCodeConfirmDialog.vue'

const $q = useQuasar()
const API = import.meta.env.VITE_API_URL

/* ---------- state ---------- */
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const search = ref('')

const rawTree = ref([])      // albero profondo dal BE
const dragData = ref([])     // struttura per Draggable (mutabile)
const selectedId = ref(null) // ultimo item selezionato

let idToNode = new Map()
let idToParentId = new Map() // genitore unico “primario” ricostruito

const hasFilter = computed(() => (search.value || '').trim().length > 0)
function noop () {}

/* ---------- load ---------- */
async function loadTree() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch(`${API}/cms/categories?includeHidden=1`)
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Errore caricamento categorie')
    rawTree.value = json.data || []
    rebuildIndexes()
    dragData.value = toDragNodes(rawTree.value)
    snapshot.value = makeSnapshot(dragData.value) // snapshot iniziale
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

/* ---------- mapping: raw -> draggable ---------- */
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

/* ---------- filtro client (disabilita DnD quando attivo) ---------- */
const filteredDragData = computed(() => {
  const term = (search.value || '').trim().toLowerCase()
  if (!term) return dragData.value
  const match = (node) =>
    (node.label || '').toLowerCase().includes(term) ||
    (node.slug || '').toLowerCase().includes(term)

  const filterTree = (nodes) => nodes
    .map(n => {
      const kids = filterTree(n.children || [])
      if (match(n) || kids.length) return { ...n, children: kids }
      return null
    })
    .filter(Boolean)

  return filterTree(dragData.value)
})

/* ---------- DnD: snapshot + diff ---------- */
const snapshot = ref({ parentOf: new Map(), orders: new Map() })

function makeSnapshot(nodes) {
  const parentOf = new Map()
  const orders = new Map() // key parent|null -> [{id, order}]
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

function onChoose({ node }) {
  selectedId.value = node?.id || null
}

async function onTreeChange () {
  const next = makeSnapshot(dragData.value)
  const prev = snapshot.value

  const updates = []

  // cambi parent
  for (const [id, newParent] of next.parentOf.entries()) {
    const oldParent = prev.parentOf.get(id) ?? null
    if (oldParent !== newParent) {
      updates.push({ id, parents: newParent ? [newParent] : [], _type: 'parentChange' })
    }
  }
  // ordini
  for (const [, arr] of next.orders.entries()) {
    arr.forEach(({ id, order }) => updates.push({ id, order, _type: 'orderSet' }))
  }

  if (!updates.length) return

  try {
    saving.value = true
    for (const u of updates) {
      const body = {}
      if ('parents' in u) body.parents = u.parents
      if ('order' in u) body.order = u.order
      const res = await fetch(`${API}/cms/categories/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || 'Aggiornamento fallito')
      }
    }
    snapshot.value = next
    $q.notify({ type: 'positive', message: 'Struttura aggiornata' })
    await loadTree()
  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Errore nel salvataggio dell’ordinamento' })
  } finally {
    saving.value = false
  }
}

/* ---------- editor (apre solo con icona) ---------- */
const editor = ref({ show: false, mode: 'edit', id: null })
const form = ref({
  title: '', slug: '', order: 0, hidden: false, icon: '', color: '', description: '', parents: []
})

function openEditFromItem(item) {
  const src = idToNode.get(item.id)
  if (!src) return
  selectedId.value = item.id
  editor.value = { show: true, mode: 'edit', id: item.id }
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

function openCreateRoot() {
  editor.value = { show: true, mode: 'create', id: null }
  form.value = { title: '', slug: '', order: 0, hidden: false, icon: '', color: '', description: '', parents: [] }
}
function openCreateChildFromSelection() {
  if (!selectedId.value) return
  editor.value = { show: true, mode: 'create', id: null }
  form.value = { title: '', slug: '', order: 0, hidden: false, icon: '', color: '', description: '', parents: [selectedId.value] }
}

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

/* genitori per select (path leggibile) + blocco cicli in edit */
const parentOptions = computed(() => {
  const out = []
  const walk = (n, path) => {
    const me = { id: n._id, path: path ? `${path} / ${n.title}` : n.title }
    out.push(me)
    n.children?.forEach(c => walk(c, me.path))
  }
  rawTree.value.forEach(r => walk(r, ''))

  const block = new Set()
  if (editor.value.mode === 'edit' && editor.value.id) {
    const start = idToNode.get(editor.value.id)
    const collect = (n) => { block.add(n._id); n.children?.forEach(collect) }
    if (start) collect(start)
  }
  return out.map(o => ({ ...o, disable: block.has(o.id) }))
})

/* ---------- DELETE UX ---------- */
const showDeleteConfirm = ref(false)
const deleteTarget = ref({ id: null, label: '' })
const showChildrenBlock = ref(false)
const childrenOfDelete = ref([])
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
  if (!src) return
  const hasChildren = Array.isArray(src.children) && src.children.length > 0

  deleteTarget.value = { id, label: src.title }

  if (hasChildren) {
    // Blocca: mostra elenco sottocategorie (dirette)
    childrenOfDelete.value = src.children.map(c => ({
      id: c._id,
      title: c.title,
      slug: c.slug,
      icon: c.icon,
      color: c.color
    }))
    showChildrenBlock.value = true
  } else {
    // Nessun figlio → mostra dialog con security code
    showDeleteConfirm.value = true
  }
}

async function doDelete(id) {
  if (!id) return
  saving.value = true
  try {
    const res = await fetch(`${API}/cms/categories/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Eliminazione fallita')
    $q.notify({ type: 'positive', message: 'Categoria eliminata' })
    await loadTree()
    selectedId.value = null
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
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
  const colorToSend = normalizeHex(form.value.color)
  saving.value = true
  try {
    if (editor.value.mode === 'create') {
      const res = await fetch(`${API}/cms/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.value.title,
          slug: form.value.slug,
          order: form.value.order || 0,
          hidden: !!form.value.hidden,
          icon: form.value.icon || null,
          color: colorToSend,
          description: form.value.description || null,
          parents: form.value.parents || []
        })
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Creazione fallita')
      $q.notify({ type: 'positive', message: 'Categoria creata' })
    } else {
      const id = editor.value.id
      const res = await fetch(`${API}/cms/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.value.title,
          slug: form.value.slug,
          order: form.value.order || 0,
          hidden: !!form.value.hidden,
          icon: form.value.icon || null,
          color: colorToSend,
          description: form.value.description || null,
          parents: form.value.parents
        })
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Salvataggio fallito')
      $q.notify({ type: 'positive', message: 'Salvato' })
    }
    editor.value.show = false
    await loadTree()
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    saving.value = false
  }
}

/* ---------- boot ---------- */
onMounted(loadTree)
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #6a5acd, #7b68ee, #00bcd4);
}

/* colore testo dentro l'input dell'hero */
.hero-input :deep(.q-field__native),
.hero-input :deep(.q-field__prefix),
.hero-input :deep(.q-field__suffix),
.hero-input :deep(.q-field__input) {
  color: #fff !important;
}
.hero-input :deep(.q-field__control) {
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(6px);
  border-radius: 12px;
}

/* Tree più comodo su mobile */
.comfy-tree :deep(.q-tree__node-header),
.comfy-tree :deep(.he-tree-node) {
  min-height: 44px;
  padding-top: 6px;
  padding-bottom: 6px;
}

/* Disabilita DnD quando filtri (ma lascia clic sui bottoni/icona) */
.dnd-disabled { pointer-events: none; }
.dnd-disabled :deep(button),
.dnd-disabled :deep(.q-btn),
.dnd-disabled :deep(.q-icon) { pointer-events: auto; }
</style>
