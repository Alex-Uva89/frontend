<!-- src/apps/cms/pages/AttributesCms.vue -->
<template>
  <q-page class="q-pa-md">

    <!-- HERO -->
    <q-card flat class="hero q-pa-md q-mb-md rounded-borders shadow-2">
      <div class="column q-gutter-sm">
        <div class="text-h5 text-white">Attributi prodotto</div>
        <div class="text-caption text-white opacity-80">Allergeni, stagionalità, promo, ecc.</div>

        <div class="row q-col-gutter-sm items-center q-mt-sm">
          <!-- Filtro tipo (select) -->
          <q-select
            v-model="kindFilter"
            :options="kindOptions"
            emit-value
            map-options
            dense
            filled
            class="col-12 col-md-3 hero-input q-my-sm"
            label="Tipo"
            clearable
            aria-label="Filtro tipo attributo"
          >
            <template #prepend><q-icon name="tune" class="text-white" /></template>
          </q-select>

          <!-- Cerca -->
          <q-input
            v-model="search"
            dense
            filled
            clearable
            debounce="200"
            placeholder="Cerca attributo…"
            class="col-12 col-md hero-input q-my-sm"
            input-class="text-white"
            aria-label="Cerca attributo"
          >
            <template #prepend><q-icon name="search" class="text-white" /></template>
            <template #append>
              <q-btn v-if="search" flat round dense icon="close" class="text-white" @click="search=''" aria-label="Pulisci ricerca" />
            </template>
          </q-input>

          <q-space />

          <!-- CTA desktop -->
          <q-btn
            class="q-my-sm gt-sm"
            color="white"
            text-color="primary"
            icon="add_circle"
            label="Nuovo attributo"
            @click="openCreate"
          />
        </div>

        <!-- Chip bar tipi + toggle “solo attivi” -->
        <div class="row items-center q-col-gutter-xs q-mt-xs">
          <q-chip
            clickable
            outline
            :color="!kindFilter ? 'white' : 'grey-5'"
            text-color="black"
            @click="kindFilter=null"
            icon="apps"
            aria-label="Mostra tutti i tipi"
            class="q-pa-md"
          >
            Tutti
            <q-badge class="q-ml-xs" color="white" text-color="primary">{{ baseFiltered.length }}</q-badge>
          </q-chip>

          <q-chip
            v-for="opt in kindOptions.filter(o => !!o.value)"
            :key="opt.value"
            clickable
            outline
            :color="kindFilter === opt.value ? 'white' : 'grey-5'"
            :text-color="kindFilter === opt.value ? 'black' : 'black'"
            @click="kindFilter = opt.value"
            :icon="groupIcon(opt.value)"
            :aria-label="`Filtra ${opt.label}`"
            class="q-pa-md"
          >
            {{ opt.label }}
            <q-badge class="q-ml-xs" color="white" text-color="primary">{{ countByKind(opt.value) }}</q-badge>
          </q-chip>

          <q-space />

          <q-toggle
            v-model="onlyActive"
            color="white"
            keep-color
            label="Solo attivi"
            class="text-white"
            aria-label="Mostra solo attivi"
          />
        </div>
      </div>
    </q-card>

    <!-- Stati -->
    <q-skeleton v-if="loading" type="rect" height="220px" class="rounded-borders" />
    <q-banner v-else-if="error" type="negative" dense class="q-mb-md">{{ error }}</q-banner>

    <!-- CONTENUTO -->
    <div v-else>
      <q-banner
        v-if="!groupsToRender.some(g => g.items.length)"
        dense class="bg-grey-2 text-grey-8 rounded-borders q-mb-md"
      >
        Nessun attributo corrispondente.
        <q-btn flat color="primary" class="q-ml-sm" icon="add_circle" label="Crea nuovo" @click="openCreate" />
      </q-banner>

      <!-- Gruppi per tipo -->
      <q-expansion-item
        v-for="g in groupsToRender"
        :key="g.kind"
        v-show="g.items.length"
        :label="g.label"
        expand-icon="expand_more"
        switch-toggle-side
        class="rounded-borders q-mb-md bg-white"
      >
        <template #header>
          <div class="row items-center full-width q-px-sm q-py-sm">
            <q-icon :name="groupIcon(g.kind)" class="q-mr-sm" />
            <div class="text-subtitle1">{{ g.label }}</div>
            <q-space />
            <q-chip color="primary" text-color="white" icon="tag"> {{ g.items.length }} </q-chip>
          </div>
        </template>

        <q-separator />

        <!-- MOBILE: lista con swipe actions -->
        <div v-if="$q.screen.lt.md" class="q-pa-xs">
          <q-list bordered separator class="rounded-borders">
            <q-slide-item
              v-for="row in g.items"
              :key="row._id"
              left-color="primary"
              right-color="negative"
              @left="openEdit(row)"
              @right="askDelete(row)"
              class="attr-slide"
              :aria-label="`Riga attributo ${row.name}`"
            >
              <template #left>
                <q-icon name="edit" />
              </template>
              <template #right>
                <q-icon name="delete" />
              </template>

              <q-item>
                <q-item-section avatar>
                  <q-icon :name="row.icon || 'label'" :style="chipStyle(row)" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body1">{{ row.name }}</q-item-label>
                  <q-item-label caption>{{ row.slug }}</q-item-label>
                  <div class="row items-center q-gutter-sm q-mt-xs">
                    <q-chip dense outline :color="kindColor(row.kind)">{{ kindPretty(row.kind) }}</q-chip>
                    <div class="row items-center">
                      <div
                        v-if="row.color"
                        :style="{ width: '16px', height: '16px', borderRadius: '4px', background: row.color, border: '1px solid rgba(0,0,0,.12)' }"
                        class="q-mr-xs"
                      />
                      <span class="text-caption">{{ row.color || '—' }}</span>
                    </div>
                    <q-chip v-if="row.active === false" dense color="grey-4" text-color="grey-9">non attivo</q-chip>
                  </div>
                </q-item-section>
                <q-item-section side>
                  <q-toggle
                    :model-value="row.active"
                    :disable="row._saving === true"
                    @update:model-value="v => toggleActive(row, v)"
                  />
                </q-item-section>
              </q-item>
            </q-slide-item>
          </q-list>
        </div>

        <!-- DESKTOP: tabella compatta -->
        <q-table
          v-else
          :rows="g.items"
          :columns="columns"
          row-key="_id"
          flat
          dense
          :rows-per-page-options="[10,25,50]"
          :pagination="{ rowsPerPage: 25 }"
          :no-data-label="'Nessun attributo in questa tipologia'"
        >
          <template #body-cell-name="props">
            <q-td :props="props">
              <div class="row items-center no-wrap">
                <q-icon :name="props.row.icon || 'label'" :style="chipStyle(props.row)" class="q-mr-sm" />
                <div>
                  <div class="text-body1">{{ props.row.name }}</div>
                  <div class="text-caption text-grey-7">{{ props.row.slug }}</div>
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-kind="props">
            <q-td :props="props">
              <q-chip dense outline :color="kindColor(props.row.kind)">{{ kindPretty(props.row.kind) }}</q-chip>
            </q-td>
          </template>

          <template #body-cell-color="props">
            <q-td :props="props">
              <div class="row items-center">
                <div
                  v-if="props.row.color"
                  :style="{ width: '18px', height: '18px', borderRadius: '4px', background: props.row.color, border: '1px solid rgba(0,0,0,.12)' }"
                  class="q-mr-sm"
                />
                <span class="text-caption">{{ props.row.color || '—' }}</span>
              </div>
            </q-td>
          </template>

          <template #body-cell-active="props">
            <q-td :props="props">
              <q-toggle
                :model-value="props.row.active"
                :disable="props.row._saving === true"
                @update:model-value="v => toggleActive(props.row, v)"
              />
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn dense flat round icon="edit" @click="openEdit(props.row)" aria-label="Modifica" />
              <q-btn dense flat round icon="delete" color="negative" @click="askDelete(props.row)" aria-label="Elimina" />
            </q-td>
          </template>
        </q-table>
      </q-expansion-item>
    </div>

    <!-- FAB mobile -->
    <q-fab
      v-if="$q.screen.lt.md"
      color="primary"
      icon="add"
      direction="up"
      vertical-actions-align="right"
      class="fixed fab-bottom-right"
      @click="openCreate"
      aria-label="Crea nuovo attributo"
    >
      <q-fab-action color="primary" icon="add_circle" label="Nuovo attributo" @click="openCreate" />
    </q-fab>

    <!-- DIALOG: EDITOR CREATE/EDIT -->
    <q-dialog
      v-model="editor.show"
      :maximized="$q.screen.lt.md"
      transition-show="slide-up"
      transition-hide="slide-down"
      persistent
    >
      <q-card style="width: 95vw; height: fit-content;" class="q-pa-md column no-wrap">
        <q-toolbar class="q-px-md q-py-sm">
          <q-btn flat round dense icon="arrow_back" v-close-popup aria-label="Chiudi editor" />
          <q-toolbar-title>{{ editor.mode === 'create' ? 'Nuovo attributo' : 'Modifica attributo' }}</q-toolbar-title>
        </q-toolbar>

        <q-separator />

        <q-card-section class="q-gutter-md scroll fit">
          <div class="row">
            <div class="col-12 col-md-6">
              <q-input v-model="form.name" label="Nome *" dense outlined :rules="[rRequired]" @update:model-value="autoSlug()" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.slug" label="Slug *" dense outlined :rules="[rRequired]" />
            </div>
          </div>

          <div class="row">
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.kind"
                :options="kindOptions.filter(k => k.value)"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                dense
                outlined
                label="Tipo"
              />
            </div>
            <div class="col-12 col-md-6 flex items-center">
              <q-toggle v-model="form.active" label="Attivo" />
            </div>
          </div>

          <div class="row">
            <div class="col-12 col-md-6">
              <q-input v-model="form.color" label="Colore (HEX)" dense outlined :rules="[rHexColor]" placeholder="#6A5ACD">
                <template #append>
                  <div
                    :style="{ width: '22px', height: '22px', borderRadius: '6px', background: validHexOrFallback(form.color), border: '1px solid rgba(0,0,0,.1)' }"
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
            <div class="col-12 col-md-6">
              <IconPicker v-model="form.icon" label="Icona (Material icon name)" variant="twotone" />
              <div class="text-caption q-mt-xs">
                Verrà salvato solo il nome (es. <code>warning</code>, <code>inventory_2</code>, …)
              </div>
            </div>
          </div>

          <q-input v-model="form.description" type="textarea" autogrow label="Descrizione" outlined />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-px-md q-py-sm sticky-actions">
          <q-btn flat label="Annulla" v-close-popup />
          <q-btn color="primary" label="Salva" :loading="saving" @click="submitEditor" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIALOG: conferma eliminazione (se NON referenziato) -->
    <SecurityCodeConfirmDialog
      v-model="showDeleteConfirm"
      :title="`Elimina “${deleteTarget?.name || ''}”`"
      :message="`Questa azione <b>non può essere annullata</b>.<br/>L'attributo sarà eliminato definitivamente.`"
      confirm-label="Elimina definitivamente"
      color="red"
      :length="6"
      @confirmed="doDelete(deleteTarget._id, false)"
    />

    <!-- DIALOG: attributo referenziato → mostra lista + azione “recidi & elimina” -->
    <q-dialog v-model="showReferrersDialog" transition-show="scale" transition-hide="scale">
      <q-card style="width: 95vw; max-width: 720px;">
        <q-card-section class="row items-center q-col-gutter-sm">
          <div class="col">
            <div class="text-h6">Attributo in uso</div>
            <div class="text-caption">
              L'attributo <b>{{ deleteTarget?.name }}</b> è usato in questi prodotti:
            </div>
          </div>
          <div class="col-auto">
            <q-btn dense flat round icon="close" v-close-popup />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-list bordered separator class="rounded-borders" style="max-height: 50vh; overflow: auto;">
            <q-item v-for="p in referrersList" :key="p._id">
              <q-item-section avatar><q-icon name="inventory_2" /></q-item-section>
              <q-item-section>{{ p.name }}</q-item-section>
            </q-item>
          </q-list>

          <q-banner class="bg-red-2 text-red-10 rounded-borders q-mt-md" inline-actions>
            <q-icon name="report" class="q-mr-sm" />
            <div>
              Procedendo con <b>Recidi & Elimina</b>, l’attributo verrà rimosso da tutti i prodotti sopra e poi eliminato.
            </div>
          </q-banner>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annulla" v-close-popup />
          <q-btn color="negative" label="Recidi & Elimina" @click="doDelete(deleteTarget._id, true)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import IconPicker from 'src/components/pickers/IconPicker.vue'
import SecurityCodeConfirmDialog from 'src/components/common/SecurityCodeConfirmDialog.vue'

const $q = useQuasar()
const API = import.meta.env.VITE_API_URL

/* ---------- state ---------- */
const loading = ref(false)
const saving  = ref(false)
const error   = ref(null)

const rows        = ref([])  // attributi dal BE
const search      = ref('')
const kindFilter  = ref(null)
const onlyActive  = ref(false)

/* ---------- columns (desktop) ---------- */
const columns = [
  { name: 'name',   label: 'Attributo', field: 'name',   align: 'left',  sortable: true },
  { name: 'kind',   label: 'Tipo',      field: 'kind',   align: 'left',  sortable: true },
  { name: 'color',  label: 'Colore',    field: 'color',  align: 'left' },
  { name: 'active', label: 'Attivo',    field: 'active', align: 'left' },
  { name: 'actions',label: '',          field: 'actions',align: 'right' }
]

/* ---------- kind utils ---------- */
const kindOptions = [
  { label: '— Tutti i tipi —', value: null },
  { label: 'Allergene',        value: 'allergen' },
  { label: 'Stagionale',       value: 'season' },
  { label: 'Promo / In saldo', value: 'promo' },
  { label: 'Ultimo minuto',    value: 'lastminute' },
  { label: 'Generico',         value: 'generic' }
]
const kindOrder = ['allergen','season','promo','lastminute','generic']

function kindPretty (k) {
  const m = new Map(kindOptions.map(o => [o.value, o.label]))
  return m.get(k) || '—'
}
function kindColor (k) {
  switch (k) {
    case 'allergen':  return 'deep-orange'
    case 'season':    return 'teal'
    case 'promo':     return 'red'
    case 'lastminute':return 'amber'
    default:          return 'grey'
  }
}
function groupIcon (k) {
  switch (k) {
    case 'allergen':  return 'warning_amber'
    case 'season':    return 'calendar_month'
    case 'promo':     return 'local_offer'
    case 'lastminute':return 'bolt'
    default:          return 'label'
  }
}

/* ---------- color utils ---------- */
function expand3to6 (hex) { return hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex }
function normalizeHex (v) {
  if (!v) return null
  let s = String(v).trim()
  if (s.startsWith('#')) s = s.slice(1)
  if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s)) return null
  const six = expand3to6(s).toLowerCase()
  return `#${six}`
}
function validHexOrFallback (v) { return normalizeHex(v) || '#cccccc' }
const rHexColor = v => (normalizeHex(v) !== null || !v) ? true : 'Inserisci un colore HEX valido (#RRGGBB)'
const rRequired = v => (v && String(v).trim().length > 0) || 'Obbligatorio'
function slugify (s = '') { return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,'') }
function autoSlug () { if (!form.value.slug || form.value.slug.length < 2) form.value.slug = slugify(form.value.name) }

function chipStyle (rowOrOpt, forIcon = false) {
  const color = normalizeHex(rowOrOpt?.color) || null
  if (!color) return {}
  return forIcon ? { color } : { color, border: `1px solid ${color}` }
}

/* ---------- load ---------- */
async function loadAll () {
  loading.value = true
  error.value = null
  try {
    const res  = await fetch(`${API}/cms/attributes`)
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Errore caricamento attributi')
    rows.value = json.data || []
  } catch (e) {
    error.value = e.message
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    loading.value = false
  }
}
onMounted(loadAll)

/* ---------- filters & grouping ---------- */
const baseFiltered = computed(() => {
  const term = (search.value || '').trim().toLowerCase()
  return (rows.value || [])
    .filter(r => !onlyActive.value || r.active !== false)
    .filter(r =>
      !term ||
      (r.name || '').toLowerCase().includes(term) ||
      (r.slug || '').toLowerCase().includes(term)
    )
})

function countByKind (k) {
  return baseFiltered.value.filter(r => r.kind === k).length
}

const groupsToRender = computed(() => {
  const kinds = kindFilter.value ? [kindFilter.value] : kindOrder
  return kinds.map(kind => {
    const items = baseFiltered.value
      .filter(r => r.kind === kind)
      // attivi prima, poi per nome
      .sort((a, b) => {
        const aa = a.active === false ? 1 : 0
        const bb = b.active === false ? 1 : 0
        if (aa !== bb) return aa - bb
        return (a.name || '').localeCompare(b.name || '')
      })
    return { kind, label: kindPretty(kind), items }
  })
})

/* ---------- editor ---------- */
const editor = ref({ show: false, mode: 'create', id: null })
const form   = ref({
  name: '', slug: '', kind: 'generic', color: '', icon: '', description: '', active: true
})

function openCreate () {
  editor.value = { show: true, mode: 'create', id: null }
  form.value   = { name: '', slug: '', kind: 'generic', color: '', icon: '', description: '', active: true }
}
function openEdit (row) {
  editor.value = { show: true, mode: 'edit', id: row._id }
  form.value   = {
    name: row.name || '',
    slug: row.slug || '',
    kind: row.kind || 'generic',
    color: row.color || '',
    icon: row.icon || '',
    description: row.description || '',
    active: row.active !== false
  }
}

async function submitEditor () {
  if (!form.value.name || !form.value.slug) {
    $q.notify({ type: 'warning', message: 'Nome e slug sono obbligatori' })
    return
  }
  saving.value = true
  try {
    if (editor.value.mode === 'create') {
      const res  = await fetch(`${API}/cms/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.value.name,
          slug: form.value.slug,
          kind: form.value.kind,
          color: normalizeHex(form.value.color),
          icon: form.value.icon,
          description: form.value.description,
          active: !!form.value.active
        })
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Creazione fallita')
      $q.notify({ type: 'positive', message: 'Attributo creato' })
    } else {
      const id   = editor.value.id
      const res  = await fetch(`${API}/cms/attributes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.value.name,
          slug: form.value.slug,
          kind: form.value.kind,
          color: normalizeHex(form.value.color),
          icon: form.value.icon,
          description: form.value.description,
          active: !!form.value.active
        })
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Salvataggio fallito')
      $q.notify({ type: 'positive', message: 'Salvato' })
    }
    editor.value.show = false
    await loadAll()
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    saving.value = false
  }
}

/* ---------- toggle attivo inline (con lock UI sulla riga) ---------- */
async function toggleActive (row, newVal) {
  const prev = row.active
  row.active = newVal
  row._saving = true
  try {
    const res  = await fetch(`${API}/cms/attributes/${row._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !!row.active })
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'Aggiornamento fallito')
    $q.notify({ type: 'positive', message: row.active ? 'Attivato' : 'Disattivato' })
  } catch (e) {
    row.active = prev // revert
    $q.notify({ type: 'negative', message: e.message })
  } finally {
    row._saving = false
  }
}

/* ---------- delete flow ---------- */
const showDeleteConfirm  = ref(false)
const showReferrersDialog= ref(false)
const deleteTarget       = ref(null)
const referrersList      = ref([])

function askDelete (row) {
  deleteTarget.value = row
  showDeleteConfirm.value = true
}

async function doDelete (id, force) {
  if (!id) return
  saving.value = true
  try {
    const url = `${API}/cms/attributes/${id}${force ? '?force=1' : ''}`
    const res = await fetch(url, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.ok === false) {
      if (res.status === 409 && json?.referrers) {
        referrersList.value      = json.referrers
        showReferrersDialog.value= true
        showDeleteConfirm.value  = false
        throw new Error('Attributo in uso in alcuni prodotti')
      }
      throw new Error(json?.error || 'Eliminazione fallita')
    }
    $q.notify({ type: 'positive', message: force ? 'Legami recisi ed attributo eliminato' : 'Attributo eliminato' })
    showReferrersDialog.value = false
    showDeleteConfirm.value   = false
    await loadAll()
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

/* slide items mobile */
.attr-slide :deep(.q-item) { padding: 8px 10px; }

/* FAB posizionamento */
.fab-bottom-right {
  right: 18px;
  bottom: 18px;
}

/* sticky actions in dialog */
.sticky-actions {
  position: sticky;
  bottom: 0;
  background: var(--q-surface, #fff);
  border-top: 1px solid rgba(0,0,0,.06);
}

/* riduci padding lista su mobile per guadagnare spazio */
@media (max-width: 599px) {
  .q-page { padding-bottom: 70px; } /* spazio per la FAB */
}
</style>
