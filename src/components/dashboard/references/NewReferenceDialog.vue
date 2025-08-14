<template>
  <q-dialog v-model="modelValue">
    <q-card style="min-width: 600px">
      <q-card-section class="text-h6">
        Nuova referenza
      </q-card-section>

      <q-card-section>
        <!-- Nome -->
        <q-input
          v-model="name"
          label="Nome"
          class="q-mb-md"
          outlined
        />

        <!-- Categoria -->
        <div class="row items-center q-mb-md">
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
            />
          </div>
          <q-btn
            flat
            round
            color="primary"
            icon="add"
            @click="showCategoryDialog = true"
            class="q-ml-sm"
          />
        </div>

        <!-- Unità di misura -->
        <div class="row items-center q-mb-md">
          <div class="col">
            <q-select
              v-model="unit"
              :options="unitOptions"
              label="Unità di misura disponibili"
              multiple
              use-chips
              outlined
            />
          </div>
          <q-btn
            flat
            round
            color="primary"
            icon="add"
            @click="showUnitDialog = true"
            class="q-ml-sm"
          />
        </div>

        <!-- Volume -->
        <q-input
          v-model.number="volume"
          type="number"
          label="Volume (es. 0.75L)"
          outlined
          class="q-mb-md"
        />

        <!-- Fornitori -->
        <div class="row items-center q-mb-md">
          <div class="col">
            <q-select
              v-model="selectedSuppliers"
              :options="supplierStore.suppliers"
              option-label="name"
              option-value="_id"
              label="Fornitori associati"
              multiple
              emit-value
              map-options
              outlined
            />
          </div>
          <q-btn
            flat
            round
            color="primary"
            icon="add"
            @click="showSupplierDialog = true"
            class="q-ml-sm"
          />
        </div>

        <!-- Prezzo -->
        <q-input
          v-model.number="price"
          type="number"
          label="Prezzo medio (opzionale)"
          outlined
          class="q-mb-md"
        />

        <!-- Note -->
        <q-input
          v-model="notes"
          type="textarea"
          label="Note"
          outlined
          class="q-mt-md"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Annulla" v-close-popup />
        <q-btn color="primary" label="Salva" @click="createReference" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Dialogs -->
  <new-category-dialog v-model="showCategoryDialog" />
  <new-unit-dialog v-model="showUnitDialog" />
  <new-supplier-dialog v-model="showSupplierDialog" />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useCategoryStore } from 'src/stores/categoryStore'
import { useSupplierStore } from 'src/stores/supplierStore'
import NewCategoryDialog from '../categories/NewCategoryDialog.vue'
import NewUnitDialog from '../units/NewUnitDialog.vue'
import NewSupplierDialog from '../suppliers/NewSupplierDialog.vue'

const props = defineProps({
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue', 'reference-created'])

const modelValue = ref(props.modelValue)
watch(() => props.modelValue, val => modelValue.value = val)
watch(modelValue, val => emit('update:modelValue', val))

const categoryStore = useCategoryStore()
const supplierStore = useSupplierStore()

// Stati dialog secondarie
const showCategoryDialog = ref(false)
const showUnitDialog = ref(false)
const showSupplierDialog = ref(false)

// Campi referenza
const name = ref('')
const selectedCategory = ref(null)
const unit = ref([])
const unitOptions = ['bottiglia', 'cartone', 'litro', 'pezzo']
const volume = ref(null)
const selectedSuppliers = ref([])
const price = ref(null)
const notes = ref('')

onMounted(() => {
  categoryStore.fetchCategories()
  supplierStore.fetchSuppliers()
})

function createReference() {
  const newRef = {
    _type: 'referenceItem',
    name: name.value,
    category: { _ref: selectedCategory.value, _type: 'reference' },
    unit: unit.value,
    volume: volume.value,
    supplier: selectedSuppliers.value.map(id => ({ _ref: id, _type: 'reference' })),
    price: price.value || null,
    notes: notes.value
  }
  emit('reference-created', newRef)
  modelValue.value = false
}
</script>
