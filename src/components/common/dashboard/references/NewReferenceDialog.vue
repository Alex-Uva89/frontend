<template>
  <q-dialog v-model="modelValue" persistent>
    <q-card style="width: 90vw">
      <q-card-section class="text-h6">
        Nuova referenza
      </q-card-section>

      <q-card-section>
        <q-form ref="formRef" @submit="onSubmit" class="q-gutter-md">
          <!-- Nome (obbligatorio) -->
          <q-input
            v-model="name"
            label="Nome *"
            outlined
            autofocus
            :rules="[v => !!(v && v.trim()) || 'Il nome è obbligatorio']"
            lazy-rules
          />

          <!-- Categoria -->
          <div class="row items-cente">
            <div class="col">
              <q-select
                v-model="selectedCategory"
                :options="categoryStore.categories"
                option-label="name"
                option-value="_id"
                label="Categoria merceologica"
                emit-value
                map-options
                outlined
                :loading="categoryStore.loading"
                clearable
              />
            </div>
            <q-btn
              flat
              round
              color="primary"
              icon="add"
              @click="showCategoryDialog = true"
              aria-label="Nuova categoria"
            >
              <q-tooltip anchor="top middle" self="bottom middle">
                Aggiungi nuova categoria
              </q-tooltip>
            </q-btn>
          </div>

          <!-- Unità di misura (multiple) -->
          <q-select
            v-model="units"
            :options="unitOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            multiple
            use-chips
            outlined
            label="Unità di misura disponibili"
            hint="Seleziona una o più unità (es. kg, l, pz)"
          />

          <!-- Fornitore (singolo) -->
          <div class="row items-center">
            <div class="col">
              <q-select
                v-model="selectedSupplier"
                :options="supplierStore.suppliers"
                option-label="name"
                option-value="_id"
                label="Fornitore"
                emit-value
                map-options
                outlined
                clearable
              />
            </div>
            <q-btn
              flat
              round
              color="primary"
              icon="add"
              @click="showSupplierDialog = true"
              aria-label="Nuovo fornitore"
            >
              <q-tooltip anchor="top middle" self="bottom middle">
                Aggiungi nuovo fornitore
              </q-tooltip>
            </q-btn>
          </div>

          <!-- Prezzo medio (opzionale) -->
          <q-input
            v-model.number="price"
            type="number"
            outlined
            label="Prezzo medio (opzionale)"
            :min="0"
          />

          <!-- Note -->
          <q-input
            v-model="notes"
            type="textarea"
            outlined
            label="Note"
            autogrow
          />
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Annulla" :disable="saving" v-close-popup />
        <q-btn color="primary" label="Salva" :loading="saving" :disable="saving" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Dialogs secondari -->
  <new-category-dialog
    v-model="showCategoryDialog"
    @created="handleCategoryCreated"
  />
  <new-supplier-dialog
    v-model="showSupplierDialog"
    @created="handleSupplierCreated"
  />
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useCategoryStore } from 'src/stores/categoryStore'
import { useSupplierStore } from 'src/stores/supplierStore'
import NewCategoryDialog from '../categories/NewCategoryDialog.vue'
import NewSupplierDialog from '../suppliers/NewSupplierDialog.vue'

/* Props & emits */
const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'created'])

/* v-model locale del dialog */
const modelValue = ref(props.modelValue)
watch(() => props.modelValue, (v) => {
  modelValue.value = v
  if (v) nextTick(resetForm)
})
watch(modelValue, (v) => emit('update:modelValue', v))

/* Store */
const categoryStore = useCategoryStore()
const supplierStore = useSupplierStore()

/* Stati dialog secondari */
const showCategoryDialog = ref(false)
const showSupplierDialog = ref(false)

/* Form state */
const formRef = ref(null)
const saving = ref(false)

const name = ref('')
const selectedCategory = ref(null)     // _id string
const units = ref([])                  // array di sigle (es. ['kg','l'])
const selectedSupplier = ref(null)     // _id string
const price = ref(null)
const notes = ref('')

/* Opzioni unità: { label, value } -> v-model (units) contiene solo le sigle */
const unitOptions = [
  // Peso
  { label: 'mg (milligrammo)', value: 'mg' },
  { label: 'g (grammo)', value: 'g' },
  { label: 'hg (etto)', value: 'hg' },
  { label: 'kg (chilogrammo)', value: 'kg' },
  { label: 'q (quintale)', value: 'q' },
  { label: 't (tonnellata)', value: 't' },
  // Volume
  { label: 'ml (millilitro)', value: 'ml' },
  { label: 'cl (centilitro)', value: 'cl' },
  { label: 'dl (decilitro)', value: 'dl' },
  { label: 'l (litro)', value: 'l' },
  { label: 'hl (ettolitro)', value: 'hl' },
  { label: 'm³ (metro cubo)', value: 'm³' },
  // Quantità / conteggio
  { label: 'pz (pezzo)', value: 'pz' },
  { label: 'cf (confezione)', value: 'cf' },
  { label: 'scat (scatola)', value: 'scat' },
  { label: 'ct (cartone)', value: 'ct' },
  { label: 'colli (collo)', value: 'colli' },
  { label: 'pallet (pallet)', value: 'pallet' },
  { label: 'bancale (bancale)', value: 'bancale' },
  { label: 'rotolo (rotolo)', value: 'rotolo' },
  { label: 'fusto (fusto)', value: 'fusto' },
  // Alimentare / agricolo
  { label: 'bottiglia (bottiglia)', value: 'bottiglia' },
  { label: 'lattina (lattina)', value: 'lattina' },
  { label: 'barattolo (barattolo)', value: 'barattolo' },
  { label: 'flacone (flacone)', value: 'flacone' },
  { label: 'tanica (tanica)', value: 'tanica' },
  { label: 'sacco (sacco)', value: 'sacco' },
  { label: 'cassa (cassa)', value: 'cassa' },
  { label: 'latta (latta)', value: 'latta' }
]

/* Lifecycle */
onMounted(() => {
  categoryStore.fetchCategories()
  supplierStore.fetchSuppliers()
})

/* Helpers */
function resetForm () {
  name.value = ''
  selectedCategory.value = null
  units.value = []
  selectedSupplier.value = null
  price.value = null
  notes.value = ''
  saving.value = false
}

/* Submit */
async function submit () {
  if (formRef.value) {
    const ok = await formRef.value.validate()
    if (!ok) return
  }
  onSubmit()
}

function onSubmit () {
  saving.value = true

  const newRef = {
    _type: 'referenceItem',
    name: name.value.trim(),
    category: selectedCategory.value
      ? { _type: 'reference', _ref: selectedCategory.value }
      : null,
    unit: units.value, // <-- già solo sigle grazie a emit-value
    supplier: selectedSupplier.value
      ? { _type: 'reference', _ref: selectedSupplier.value }
      : null,
    price: (price.value ?? null) !== null ? Number(price.value) : null,
    notes: notes.value?.trim() || ''
  }

  emit('created', newRef)
  modelValue.value = false
  saving.value = false
}

/* Handlers: creazione rapida categoria/fornitore */
async function handleCategoryCreated (doc) {
  // doc: {_type:'category', name}
  const created = await categoryStore.createCategory(doc)
  selectedCategory.value = created._id
}

async function handleSupplierCreated (doc) {
  // doc: {_type:'supplier', name, email?, phone?}
  const created = await supplierStore.createSupplier(doc)
  selectedSupplier.value = created._id
}
</script>
