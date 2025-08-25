<template>
  <q-page class="q-pa-md">

    <!-- HERO + SEARCH (mobile-first) -->
    <q-card flat class="hero q-pa-md q-mb-md rounded-borders shadow-2">
      <div class="row items-center">
        <div class="col-12 col-md">
          <div class="text-h5 text-white">Categorie</div>
          <div class="text-caption text-white opacity-80">Gestione ad albero (mobile-first)</div>
        </div>

        <!-- Azioni visibili solo su desktop -->
        <div class="col-12 col-md-auto q-mt-sm q-mt-md-none row q-gutter-sm justify-end gt-sm">
          <q-btn color="white" text-color="primary" icon="add_circle" label="Nuova root" @click="openCreateRoot" />
          <q-btn
            color="white" outline text-color="white"
            icon="subdirectory_arrow_right" label="Nuova sottocategoria"
            :disable="!selectedId" @click="openCreateChildFromSelection"
          />
        </div>
      </div>

      <div class="q-mt-sm">
        <q-input
          v-model="search"
          dense filled clearable debounce="200"
          placeholder="Cerca categoria…"
          class="rounded-borders hero-input"
          input-class="text-white"
        >
          <template #prepend>
            <q-icon name="search" class="text-white" />
          </template>
          <template #append>
            <q-btn v-if="search" flat round dense icon="close" class="text-white" @click="search=''" />
          </template>
        </q-input>
      </div>
    </q-card>

    <!-- Stato -->
    <q-skeleton v-if="loading" type="rect" height="220px" class="rounded-borders" />
    <q-banner v-else-if="error" type="negative" dense class="q-mb-md">{{ error }}</q-banner>

    <!-- Albero -->
    <q-card v-else flat bordered class="rounded-borders shadow-1">
      <q-tree
        :nodes="treeNodes"
        node-key="id"
        v-model:selected="selectedId"
        v-model:expanded="expandedIds"
        :filter="search"
        :filter-method="filterNode"
        default-expand-all
        class="q-pa-sm comfy-tree"
      >
        <template #default-header="scope">
          <div class="row items-center no-wrap full-width">
            <div class="row items-center col cursor-pointer" @click.stop="openEdit(scope.node)">
              <q-icon :name="scope.node.icon || 'folder'" :color="scope.node.color || 'primary'" size="20px" class="q-mr-sm" />
              <div class="ellipsis text-body1">{{ scope.node.label }}</div>
              <q-chip v-if="scope.node.hidden" dense size="sm" class="q-ml-xs">nascosta</q-chip>
            </div>
            <div class="col-auto">
              <q-btn dense flat round icon="edit" @click.stop="openEdit(scope.node)" />
            </div>
          </div>
        </template>
      </q-tree>

      <div v-if="!treeNodes.length" class="q-pa-md text-grey-7">
        Nessuna categoria. Crea la prima con “Nuova root”.
      </div>
    </q-card>

    <!-- FAB (mobile) -->
    <q-page-sticky position="bottom-right" :offset="[16,16]" class="lt-md">
      <q-fab color="primary" icon="add" direction="left" glossy>
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
      <q-card style="width: 90vw; height: 90vh;">
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
            <div class="col-6">
              <q-input v-model="form.color" label="Colore (es. #6A5ACD o primary)" dense outlined />
            </div>
          </div>

          <q-input v-model="form.description" type="textarea" autogrow label="Descrizione" dense outlined />

          <!-- Genitori -->
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
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const API = import.meta.env.VITE_API_URL

/* ---------- state ---------- */
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const search = ref('')

const rawTree = ref([])
const selectedId = ref(null)
const expandedIds = ref([])

let idToNode = new Map()
let idToParentIds = new Map()

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
    expandAll()
  } catch (e) {
    error.value = e.message
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    loading.value = false
  }
}
function rebuildIndexes() {
  idToNode = new Map()
  idToParentIds = new Map()
  const walk = (n, parentId = null) => {
    idToNode.set(n._id, n)
    const set = idToParentIds.get(n._id) || new Set()
    if (parentId) set.add(parentId)
    idToParentIds.set(n._id, set)
    n.children?.forEach(c => walk(c, n._id))
  }
  rawTree.value.forEach(r => walk(r))
}
function expandAll() {
  const ids = []
  const walk = (n) => { ids.push(n._id); n.children?.forEach(walk) }
  rawTree.value.forEach(walk)
  expandedIds.value = ids
}

/* ---------- map → QTree ---------- */
function mapNode(n) {
  return {
    id: n._id,
    label: n.title,
    slug: n.slug,
    order: n.order ?? 0,
    hidden: !!n.hidden,
    icon: n.icon || null,
    color: n.color || null,
    description: n.description || null,
    children: (n.children || []).map(mapNode)
  }
}
const treeNodes = computed(() => (rawTree.value || []).map(mapNode))

function filterNode(node, term) {
  const t = (term || '').toLowerCase()
  return (node.label || '').toLowerCase().includes(t) || (node.slug || '').toLowerCase().includes(t)
}

/* ---------- editor ---------- */
const editor = ref({ show: false, mode: 'edit', id: null })
const form = ref({
  title: '', slug: '', order: 0, hidden: false, icon: '', color: '', description: '', parents: []
})

function openEdit(node) {
  selectedId.value = node.id
  const src = idToNode.get(node.id)
  editor.value = { show: true, mode: 'edit', id: node.id }
  form.value = {
    title: src?.title || '',
    slug: src?.slug || '',
    order: src?.order ?? 0,
    hidden: !!src?.hidden,
    icon: src?.icon || '',
    color: src?.color || '',
    description: src?.description || '',
    parents: Array.from(idToParentIds.get(node.id) || [])
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

const rRequired = v => (v && String(v).trim().length > 0) || 'Obbligatorio'
function slugify(s='') {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,'')
}
function autoSlug() {
  if (!form.value.slug || form.value.slug.length < 2) form.value.slug = slugify(form.value.title)
}

/* genitori (path leggibile) + blocco cicli sul nodo in edit */
const parentOptions = computed(() => {
  const out = []
  const walk = (n, path) => {
    const me = { id: n._id, path: path ? `${path} / ${n.title}` : n.title }
    out.push(me)
    n.children?.forEach(c => walk(c, me.path))
  }
  rawTree.value.forEach(r => walk(r, ''))

  // blocca se stesso + discendenti (solo in edit)
  const block = new Set()
  if (editor.value.mode === 'edit' && editor.value.id) {
    const start = idToNode.get(editor.value.id)
    const collect = (n) => { block.add(n._id); n.children?.forEach(collect) }
    if (start) collect(start)
  }
  return out.map(o => ({ ...o, disable: block.has(o.id) }))
})

async function submitEditor() {
  if (!form.value.title || !form.value.slug) {
    $q.notify({ type: 'warning', message: 'Titolo e slug sono obbligatori' })
    return
  }
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
          color: form.value.color || null,
          description: form.value.description || null,
          parents: form.value.parents || []
        })
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Creazione fallita')
      $q.notify({ type: 'positive', message: 'Categoria creata' })
      editor.value.show = false
      await loadTree()
      selectedId.value = json.data?._id || null
      expandAll()
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
          color: form.value.color || null,
          description: form.value.description || null,
          parents: form.value.parents
        })
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Salvataggio fallito')
      $q.notify({ type: 'positive', message: 'Salvato' })
      editor.value.show = false
      await loadTree()
      selectedId.value = id
      expandAll()
    }
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
  /* gradiente sobrio, leggibile, mobile-first */
  background: linear-gradient(135deg, #6a5acd, #7b68ee, #00bcd4);
}
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

/* Tree più “comfy” su mobile */
.comfy-tree :deep(.q-tree__node-header) {
  min-height: 44px;
  padding-top: 6px;
  padding-bottom: 6px;
}
</style>
