<template>
  <div>
    <q-card class="shadow-2">
      <!-- Header -->
      <q-card-section class="bg-indigo-1">
        <div class="row items-center justify-between">
          <div>
            <div class="text-h6 text-indigo-8">App</div>
            <div class="text-caption text-grey-7">
              Totali: {{ apps.length }}
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-btn color="indigo" icon="add" label="Nuova App" rounded dense size="sm" @click="openDialog()" />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Filtri -->
      <q-card-section class="q-gutter-sm">
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-5">
            <q-input
              v-model="search"
              dense outlined clearable debounce="200"
              placeholder="Cerca per titolo/descrizione/slug…"
              prepend-inner-icon="search"
            />
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="selectedStatus"
              :options="statusOptions"
              emit-value map-options
              dense outlined clearable
              label="Stato"
            />
          </div>

          <div class="col-12 col-md-4 flex items-center">
            <q-toggle v-model="onlyNew" label="Solo nuove" />
            <q-toggle v-model="showHidden" class="q-ml-md" label="Mostra nascoste" />
            <q-btn flat dense class="q-ml-sm" icon="filter_alt_off" @click="resetFilters">
              <q-tooltip>Reset filtri</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Lista -->
      <q-card-section>
        <q-list bordered separator>
          <q-item
            v-for="app in filteredApps"
            :key="app._id"
            class="q-py-md"
          >
            <!-- Logo/Icona -->
            <q-item-section avatar>
              <q-avatar square size="64px" class="bg-grey-2 flex flex-center">
                <img v-if="app.logoUrl" :src="app.logoUrl" alt="logo" />
                <q-icon v-else :name="app.iconName || 'apps'" size="32px" color="indigo" />
              </q-avatar>
            </q-item-section>

            <!-- Dati -->
            <q-item-section>
              <div class="row items-center q-col-gutter-sm">
                <div class="col-12 col-md-auto">
                  <div class="text-subtitle1">{{ firstOf(app.title) || '(senza titolo)' }}</div>
                  <div class="text-caption text-grey-7 ellipsis">
                    {{ firstOf(app.shortDescription) || '—' }}
                  </div>
                </div>

                <div class="col-12 col-md-auto">
                  <q-chip dense size="sm" outline :color="statusColor(app.status)">
                    {{ statusLabel(app.status) }}
                  </q-chip>
                  <q-chip v-if="app.isNew" dense size="sm" color="green" text-color="white" icon="fiber_new">
                    Nuovo
                  </q-chip>
                  <q-chip v-if="app.isHidden" dense size="sm" color="grey" text-color="white" icon="visibility_off">
                    Nascosta
                  </q-chip>
                </div>

                <div class="col-12 col-md-auto">
                  <q-chip dense size="sm" outline icon="label">Slug: {{ app.slug }}</q-chip>
                </div>

                <div class="col-12 col-md-auto">
                  <q-chip dense size="sm" outline icon="route">
                    {{ app.isExternal ? 'URL esterno' : 'Path interno' }}
                  </q-chip>
                </div>
              </div>
            </q-item-section>

            <!-- Azioni -->
            <q-item-section side>
              <div class="row q-gutter-xs">
                <q-btn flat round dense icon="edit" @click="openDialog(app)">
                  <q-tooltip>Modifica</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="delete" color="negative" @click="deleteApp(app)">
                  <q-tooltip>Elimina</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>

          <div v-if="filteredApps.length === 0" class="q-pa-lg text-grey-7">
            Nessuna app corrisponde ai filtri.
          </div>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Dialog Crea/Modifica -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="width: 92vw; max-width: 1280px;" class="q-pa-lg">
        <q-card-section>
          <div class="text-h6">{{ editing?._id ? 'Modifica App' : 'Nuova App' }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="form.title.it" label="Titolo IT" outlined dense @update:model-value="onTitleChange" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.title.en" label="Titolo EN" outlined dense />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.title.fr" label="Titolo FR" outlined dense />
            </div>

            <div class="col-12">
              <q-input v-model="form.shortDescription.it" type="textarea" rows="2" outlined dense label="Descrizione breve IT" />
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="form.slug" label="Slug" outlined dense hint="Lasciare vuoto per auto-generare dal Titolo IT" />
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="form.pathOrUrl" label="Path interno o URL" outlined dense />
            </div>

            <div class="col-12 col-md-4">
              <q-select v-model="form.status" :options="statusOptions" emit-value map-options outlined dense label="Stato" />
            </div>

            <div class="col-12 col-md-4">
              <q-input v-model="form.order" type="number" outlined dense label="Ordine" />
            </div>

            <div class="col-12 col-md-4">
              <q-input v-model="form.accentColor" outlined dense label="Colore accent (es. #00bcd4)" />
            </div>

            <div class="col-12 col-md-4">
              <q-input v-model="form.iconName" outlined dense label='Icona fallback (es. "analytics")' />
            </div>

            <div class="col-12 col-md-8">
              <q-input v-model="form.logoAssetId" outlined dense label="Sanity logo asset _id (opzionale)" />
              <div class="text-caption q-mt-xs">
                Se impostato, sostituisce il logo. Upload/asset via tua rotta uploads.
              </div>
            </div>

            <div class="col-12">
              <q-toggle v-model="form.isExternal" label="Link esterno" />
              <q-toggle v-model="form.isNew" label="Badge: Nuovo" class="q-ml-md" />
              <q-toggle v-model="form.isHidden" label="Nascondi dallo store" class="q-ml-md" />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                v-model="form.rolesAllowed"
                :options="roleOptions"
                multiple use-chips
                emit-value map-options
                outlined dense
                label="Ruoli abilitati"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-select
                v-model="form.usersAllowed"
                multiple use-chips use-input
                new-value-mode="add-unique"
                outlined dense
                label="Utenti abilitati (email o ID)"
                :options="[]"
                hint="Scrivi e premi INVIO per aggiungere"
              />
            </div>

            <div class="col-12">
              <q-select
                v-model="form.businessesAllowed"
                :options="businessOptions"
                multiple use-chips
                emit-value map-options
                outlined dense
                label="Locali/Sedi abilitate"
              />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Annulla" v-close-popup />
          <q-btn color="indigo" label="Salva" @click="saveApp" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { useBusinessStore } from 'src/stores/businessStore'

const $q = useQuasar()
const businessStore = useBusinessStore?.()

/* Stato base */
const apps = ref([])
const search = ref('')
const selectedStatus = ref(null)
const onlyNew = ref(false)
const showHidden = ref(false)

const statusOptions = [
  { label: 'Attiva', value: 'attiva' },
  { label: 'In arrivo', value: 'in_arrivo' },
  { label: 'In aggiornamento', value: 'in_aggiornamento' }
]

const roleOptions = [
  { label: 'staff', value: 'staff' },
  { label: 'manager', value: 'manager' },
  { label: 'owner', value: 'owner' },
  { label: 'dev', value: 'dev' },
  { label: 'hr', value: 'hr' },
  { label: 'supervisor', value: 'supervisor' }
]

/* Opzioni business da store */
const businessOptions = computed(() =>
  (businessStore?.businesses || []).map(b => ({ label: b.name, value: b._id }))
)

/* Utils */
function firstOf (obj) {
  if (!obj) return ''
  return obj.it || obj.en || obj.fr || ''
}
function statusColor (status) {
  switch (status) {
    case 'attiva': return 'green'
    case 'in_arrivo': return 'orange'
    case 'in_aggiornamento': return 'blue'
    default: return 'grey'
  }
}
function statusLabel (status) {
  const o = statusOptions.find(s => s.value === status)
  return o?.label || '—'
}

/* Filtri */
const filteredApps = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (apps.value || []).filter(a => {
    if (!showHidden.value && a.isHidden === true) return false
    if (onlyNew.value && !a.isNew) return false
    if (selectedStatus.value && a.status !== selectedStatus.value) return false
    if (q) {
      const hay = [firstOf(a.title), firstOf(a.shortDescription), a.slug].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

function resetFilters () {
  search.value = ''
  selectedStatus.value = null
  onlyNew.value = false
  showHidden.value = false
}

/* Dialog form */
const showDialog = ref(false)
const editing = ref(null)
const form = ref({
  title: { it: '', en: '', fr: '' },
  shortDescription: { it: '', en: '', fr: '' },
  slug: '',
  iconName: '',
  accentColor: '',
  order: 0,
  status: 'attiva',
  isNew: false,
  isHidden: false,
  isExternal: false,
  pathOrUrl: '',
  rolesAllowed: [],
  usersAllowed: [],
  businessesAllowed: [],
  logoAssetId: ''
})

function openDialog (row = null) {
  editing.value = row
  if (row) {
    form.value = {
      title: row.title || { it: '', en: '', fr: '' },
      shortDescription: row.shortDescription || { it: '', en: '', fr: '' },
      slug: row.slug || '',
      iconName: row.iconName || '',
      accentColor: row.accentColor || '',
      order: Number.isFinite(row.order) ? row.order : 0,
      status: row.status || 'attiva',
      isNew: !!row.isNew,
      isHidden: !!row.isHidden,
      isExternal: !!row.isExternal,
      pathOrUrl: row.pathOrUrl || '',
      rolesAllowed: row.rolesAllowed || [],
      usersAllowed: row.usersAllowed || [],
      businessesAllowed: row.businessesAllowed || [],
      logoAssetId: '' // lo imposti solo se vuoi sostituire il logo
    }
  } else {
    form.value = {
      title: { it: '', en: '', fr: '' },
      shortDescription: { it: '', en: '', fr: '' },
      slug: '',
      iconName: '',
      accentColor: '',
      order: 0,
      status: 'attiva',
      isNew: false,
      isHidden: false,
      isExternal: false,
      pathOrUrl: '',
      rolesAllowed: [],
      usersAllowed: [],
      businessesAllowed: [],
      logoAssetId: ''
    }
  }
  showDialog.value = true
}

/* Auto-slug in creazione */
function onTitleChange () {
  if (!editing.value && !form.value.slug) {
    form.value.slug = slugify(form.value.title?.it || '')
  }
}
function slugify (s = '') {
  return String(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/* CRUD */
async function fetchApps () {
  try {
    const { data } = await api.get('/apps', { params: { includeHidden: showHidden.value ? 1 : 0 } })
    apps.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Errore nel recupero app' })
  }
}

async function saveApp () {
  try {
    const payload = { ...form.value }
    if (!payload.slug) delete payload.slug
    if (!payload.logoAssetId) delete payload.logoAssetId

    if (editing.value?._id) {
      await api.put(`/apps/${editing.value._id}`, payload)
      $q.notify({ type: 'positive', message: 'App aggiornata' })
    } else {
      await api.post('/apps', payload)
      $q.notify({ type: 'positive', message: 'App creata' })
    }
    showDialog.value = false
    await fetchApps()
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: err?.response?.data?.error || 'Errore salvataggio' })
  }
}

async function deleteApp (row) {
  try {
    await $q.dialog({
      title: 'Conferma eliminazione',
      message: `Vuoi eliminare "${firstOf(row.title) || row.slug}"?`,
      cancel: true,
      persistent: true
    })
    await api.delete(`/apps/${row._id}`)
    $q.notify({ type: 'positive', message: 'App eliminata' })
    await fetchApps()
  } catch (err) {
    // annullato o errore
    if (err) console.error(err)
  }
}

/* Bootstrap */
onMounted(async () => {
  try {
    if (!businessStore?.businesses?.length && typeof businessStore?.fetchBusinesses === 'function') {
      await businessStore.fetchBusinesses()
    }
  } catch (e) {
    console.error(e)
  }
  await fetchApps()
})
</script>
