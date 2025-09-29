<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="text-h5">Site — Dashboard</div>
      <q-space />
      <q-select
        v-model="locale"
        :options="locales"
        dense
        outlined
        class="q-mr-sm"
        style="min-width: 160px"
        label="Locale"
        emit-value
        map-options
      />
      <q-btn dense flat icon="refresh" @click="load" :loading="loading" title="Ricarica" />
    </div>

    <!-- Error banner -->
    <q-banner v-if="error" class="bg-red-2 text-negative q-mb-md">
      <div class="row items-center">
        <q-icon name="error" class="q-mr-sm" />
        <div class="ellipsis">{{ error }}</div>
        <q-space />
        <q-btn dense flat label="Chiudi" @click="error = ''" />
      </div>
    </q-banner>

    <!-- Card contenuti -->
    <q-card flat bordered>
      <q-card-section class="q-gutter-md">
        <div class="row items-center">
          <div class="text-subtitle1">Modifica contenuti</div>
          <q-space />
          <q-btn
            flat
            label="Annulla modifiche"
            @click="reset"
            :disable="loading || saving || !isDirty"
          />
          <q-btn
            color="primary"
            label="Salva su Sanity"
            class="q-ml-sm"
            @click="onSave"
            :loading="saving"
            :disable="!isDirty || loading"
          />
        </div>

        <q-separator class="q-my-sm" />

        <q-expansion-item icon="language" label="Brand & Nav" default-opened>
          <div class="row q-col-gutter-md q-mb-sm">
            <div class="col-12 col-md-6">
              <q-input v-model="form.brand" label="brand" dense outlined />
            </div>
          </div>
          <RecursiveFields v-model="form.nav" title="nav" />
          <RecursiveFields v-model="form.drawer" title="drawer" />
        </q-expansion-item>

        <q-expansion-item icon="star" label="Hero & Actions">
          <RecursiveFields v-model="form.hero" title="hero" />
          <RecursiveFields v-model="form.actionsSection" title="actionsSection" />
        </q-expansion-item>

        <q-expansion-item icon="mail" label="Newsletter">
          <RecursiveFields v-model="form.newsletter" title="newsletter" />
          <RecursiveFields v-model="form.newsletterAliases" title="newsletterAliases" />
        </q-expansion-item>

        <q-expansion-item icon="article" label="Pagine / Common / OurStory / Jobs">
          <RecursiveFields v-model="form.pages" title="pages" />
          <RecursiveFields v-model="form.common" title="common" />
          <RecursiveFields v-model="form.ourstory" title="ourstory" />
          <RecursiveFields v-model="form.jobs" title="jobs (team)" />
        </q-expansion-item>

        <q-expansion-item icon="place" label="Aliases vari">
          <RecursiveFields v-model="form.venues" title="venues" />
          <RecursiveFields v-model="form.actions" title="actions" />
        </q-expansion-item>
      </q-card-section>

      <!-- Loading overlay dentro la card -->
      <q-inner-loading :showing="loading">
        <q-spinner size="32px" />
      </q-inner-loading>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { Notify } from 'quasar'
import { fetchSiteStrings, saveSiteStrings } from 'src/composables/useSiteContent'
import RecursiveFields from 'src/components/common/site/RecursiveFields.vue' // usato nel template

// --- helper: rende gli oggetti JSON-plain (niente Proxy Vue) ---
const toPlain = (obj) => JSON.parse(JSON.stringify(obj ?? {}))

// --- locale selector ---
const locales = [
  { label: 'Italiano (it-IT)', value: 'it-IT' },
  { label: 'English (en-US)', value: 'en-US' },
]
const locale  = ref(localStorage.getItem('cms_site_locale') || 'it-IT')

// --- ui state ---
const loading = ref(false)
const saving  = ref(false)
const error   = ref('')

// --- shape base per filtrare le chiavi salvabili ---
const emptyShape = () => ({
  brand: '',
  nav: {}, drawer: {}, hero: {},
  actionsSection: {}, newsletter: {},
  venues: {}, actions: {}, newsletterAliases: {},
  pages: {}, common: {}, ourstory: {}, jobs: {}
})

// --- data ---
const original = ref({})
const form = reactive(emptyShape())

// --- dirty check ---
const isDirty = computed(() =>
  JSON.stringify(toPlain(form)) !== JSON.stringify(toPlain(original.value))
)

// --- actions ---
async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchSiteStrings(locale.value)
    original.value = toPlain(data)
    Object.assign(form, emptyShape(), data) // reset + assign
  } catch (e) {
    console.error(e)
    error.value = 'Impossibile caricare i contenuti: ' + (e?.message || e)
  } finally {
    loading.value = false
  }
}

function reset() {
  Object.assign(form, emptyShape(), original.value)
}

async function onSave() {
  saving.value = true
  error.value = ''
  try {
    // prendi una copia plain del form e filtra le chiavi consentite
    const raw = toPlain(form)
    const payload = {}
    for (const k of Object.keys(emptyShape())) {
      if (raw[k] !== undefined) payload[k] = raw[k]
    }

    await saveSiteStrings(locale.value, payload)
    original.value = toPlain(payload)
    Notify.create({ type: 'positive', message: 'Salvato su Sanity' })
  } catch (e) {
    console.error(e)
    error.value = 'Errore salvataggio: ' + (e?.message || e)
    Notify.create({ type: 'negative', message: 'Errore nel salvataggio' })
  } finally {
    saving.value = false
  }
}

// --- load immediato + reload al cambio lingua ---
watch(
  locale,
  (val) => {
    localStorage.setItem('cms_site_locale', val)
    load()
  },
  { immediate: true }
)
</script>

