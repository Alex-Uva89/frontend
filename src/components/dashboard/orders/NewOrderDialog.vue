<template>
  <q-dialog v-model="modelValue">
    <q-card style="min-width: 90vw">
      <q-card-section class="text-h6">
        Nuovo ordine per oggi
      </q-card-section>

      <q-card-section>
        <q-select
          v-model="selectedReference"
          :options="referenceStore.references"
          option-label="name"
          option-value="_id"
          label="Seleziona prodotto"
          emit-value
          map-options
          class="q-mb-md"
        />

        <q-btn
          outline
          color="primary"
          label="Aggiungi nuova referenza"
          icon="add"
          @click="showNewReferenceDialog = true"
        />

        <q-input
          v-model.number="quantity"
          type="number"
          label="Quantità"
          class="q-mt-md"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Annulla" v-close-popup />
        <q-btn color="primary" label="Crea ordine" @click="createOrder" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Dialog nuova referenza -->
  <NewReferenceDialog
    v-model="showNewReferenceDialog"
    @reference-created="handleReferenceCreated"
  />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useReferenceStore } from 'src/stores/referenceStore'
import { useUsersStore } from 'src/stores/usersStore'
import { useOrderStore } from 'src/stores/orderStore' // 👈 import
import NewReferenceDialog from 'src/components/dashboard/references/NewReferenceDialog.vue'

const props = defineProps({
  modelValue: Boolean,
  businessId: String
})
const emit = defineEmits(['update:modelValue', 'order-created'])

const modelValue = ref(props.modelValue)
watch(() => props.modelValue, val => modelValue.value = val)
watch(modelValue, val => emit('update:modelValue', val))

const referenceStore = useReferenceStore()
const usersStore = useUsersStore()
const orderStore = useOrderStore() // 👈 inizializziamo lo store

const selectedReference = ref(null)
const quantity = ref(1)
const showNewReferenceDialog = ref(false)

onMounted(() => {
  referenceStore.fetchReferences()
})

async function createOrder() {
  if (!selectedReference.value) return

  const currentUser = usersStore.currentUser

  const items = [{
    quantity: quantity.value,
    referenceId: selectedReference.value, // l'ID della referenza
    addedById: currentUser._id
  }]

  // Chiamiamo lo store per inviare al BE
  const newOrder = await orderStore.createOrder(props.businessId, items)

  if (newOrder) {
    modelValue.value = false
  }
}

function handleReferenceCreated(newRef) {
  referenceStore.references.push(newRef)
  selectedReference.value = newRef._id
}
</script>

