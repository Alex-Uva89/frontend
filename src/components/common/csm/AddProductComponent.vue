<template>
  <div>
    <q-btn
      :label="buttonLabel"
      icon="add"
      color="primary"
      :disable="disabled"
      @click="openDialog"
    />

    <q-dialog v-model="open" persistent :maximized="$q.screen.lt.sm">
      <q-card style="width: 720px; max-width: 95vw">
        <q-toolbar>
          <q-btn flat round dense icon="close" v-close-popup />
          <q-toolbar-title>Nuovo prodotto</q-toolbar-title>
          <q-btn
            flat dense icon="save" color="primary"
            :loading="saving" :disable="!canSave"
            @click="save"
          />
        </q-toolbar>
        <q-separator />

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8">
              <q-input
                v-model="form.name" dense outlined
                label="Nome *" :rules="[rRequired]"
                autofocus
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="form.sku" dense outlined label="SKU" />
            </div>

            <div class="col-12 col-md-4">
              <q-input v-model.number="form.price" type="number" step="0.01" dense outlined label="Prezzo" />
            </div>
            <div class="col-6 col-md-4">
              <q-input v-model.number="form.priceGlass" type="number" step="0.01" dense outlined label="Prezzo calice" />
            </div>
            <div class="col-6 col-md-4">
              <q-input v-model.number="form.priceBottle" type="number" step="0.01" dense outlined label="Prezzo bottiglia" />
            </div>

            <div class="col-12 col-md-8">
              <q-select
                v-model="form.categoryId"
                :options="categoryOptions"
                option-value="id" option-label="label"
                emit-value map-options dense outlined clearable
                :rules="[rRequired]"
                label="Categoria *"
              >
                <template #prepend><q-icon name="category" /></template>
              </q-select>
            </div>

            <div class="col-12 col-md-4 flex items-center">
              <q-toggle v-model="form.active" label="Attivo" />
            </div>

            <div class="col-12">
              <q-input v-model="form.description" type="textarea" autogrow dense outlined label="Descrizione" />
            </div>
            <div class="col-12">
              <q-input v-model="form.notes" type="textarea" autogrow dense outlined label="Note interne" />
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="form.t_name_it" dense outlined label="Traduzione nome — Italiano (it)" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.t_name_en" dense outlined label="Traduzione nome — English (en)" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.t_name_fr" dense outlined label="Traduzione nome — Francais (fr)" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.t_name_es" dense outlined label="Traduzione nome — Spanish (es)" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.t_name_pt" dense outlined label="Traduzione nome — Portoguese (pt)" />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Annulla" v-close-popup />
          <q-btn color="primary" label="Crea" :loading="saving" :disable="!canSave" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
// Vue & Quasar
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'

// App
import { api } from 'boot/axios'

const props = defineProps({
  categoryOptions: { // [{ id, label }]
    type: Array,
    required: true
  },
  defaultCategoryId: {
    type: [String, null],
    default: null
  },
  businessId: {
    type: [String, null],
    default: null
  },
  canCreate: {
    type: Boolean,
    default: true
  },
  buttonLabel: {
    type: String,
    default: 'Nuovo prodotto'
  }
})

const emit = defineEmits(['created'])

const $q = useQuasar()
const API = import.meta.env.VITE_API_URL

const open = ref(false)
const saving = ref(false)

const form = ref({
  name: '',
  sku: '',
  price: null,
  priceGlass: null,
  priceBottle: null,
  active: true,
  description: '',
  notes: '',
  t_name_it: '',
  t_name_en: '',
  t_name_fr: '',
  t_name_es: '',
  t_name_pt: '',
  categoryId: null
})

/* ===== Utils ===== */
const rRequired = v => (v !== null && String(v || '').trim().length > 0) || 'Obbligatorio'
const toMoney = v => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}
const trimOrNull = s => {
  const t = (s ?? '').toString().trim()
  return t.length ? t : null
}

/* ===== State ===== */
const disabled = computed(() => !props.canCreate || !props.businessId)
const canSave = computed(() =>
  props.canCreate &&
  !!(form.value.name && form.value.categoryId)
)

/* ===== Actions ===== */
function resetForm () {
  form.value = {
    name: '',
    sku: '',
    price: null,
    priceGlass: null,
    priceBottle: null,
    active: true,
    description: '',
    notes: '',
    t_name_it: '',
    t_name_en: '',
    t_name_fr: '',
    t_name_es: '',
    t_name_pt: '',
    categoryId: props.defaultCategoryId || null
  }
}
function openDialog () {
  resetForm()
  open.value = true
}
watch(() => props.defaultCategoryId, (nv) => {
  // aggiorna default se il dialog non è aperto
  if (!open.value && !form.value.name) form.value.categoryId = nv || null
})

async function save () {
  if (!canSave.value) return
  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      sku: form.value.sku || '',
      price: toMoney(form.value.price),
      priceGlass: toMoney(form.value.priceGlass),
      priceBottle: toMoney(form.value.priceBottle),
      active: !!form.value.active,
      description: form.value.description || '',
      notes: form.value.notes || '',
      translations: {
        name: {
          it: trimOrNull(form.value.t_name_it),
          en: trimOrNull(form.value.t_name_en),
          fr: trimOrNull(form.value.t_name_fr),
          es: trimOrNull(form.value.t_name_es),
          pt: trimOrNull(form.value.t_name_pt),
        }
      },
      // Associa ad una categoria esistente (array di ID)
      categories: form.value.categoryId ? [form.value.categoryId] : []
    }

    const { data: json } = await api.post(`${API}/cms/products`, payload)
    if (!json?.ok) throw new Error(json?.error || 'create product failed')

    $q.notify({ type: 'positive', message: 'Prodotto creato' })
    open.value = false
    emit('created', json.data) // lascia al genitore il refresh della lista
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'Creazione fallita' })
  } finally {
    saving.value = false
  }
}
</script>
