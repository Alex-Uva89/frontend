<template>
  <q-dialog v-model="show" @hide="cancel">
    <q-card style="min-width: 90vw;">
      <q-card-section class="text-h6">
        Modifica {{ product.reference.name }}
      </q-card-section>

      <q-card-section>
        <q-input
          :model-value="product.reference.name"
          label="Nome prodotto"
          outlined
          dense
          class="q-mb-sm"
          readonly
        />

        <q-input
          v-model.number="localQuantity"
          type="number"
          label="Quantità"
          outlined
          dense
          class="q-mb-sm"
          :rules="[val => val > 0 || 'La quantità deve essere maggiore di 0']"
        />

        <q-input
          v-model="localNotes"
          label="Note"
          type="textarea"
          outlined
          dense
          autogrow
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Annulla" color="primary" @click="cancel" />
        <q-btn flat label="Salva" color="positive" @click="confirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'

import { useOrderStore } from 'src/stores/orderStore'

const orderStore = useOrderStore()

const props = defineProps({
  showDialog: Boolean,
  product: { type: Object, required: true },
  orderId: { type: String, required: true }
})

const emit = defineEmits(['update:showDialog', 'saved'])

const $q = useQuasar()
const show = ref(props.showDialog)
const localQuantity = ref(props.product.quantity)
const localNotes = ref(props.product.reference.notes || '')

// Aggiorna lo stato interno quando cambiano le props
watch(() => props.showDialog, (val) => {
  show.value = val
})

watch(() => props.product, (val) => {
  localQuantity.value = val.quantity
  localNotes.value = val.reference.notes || ''
}, { deep: true })

function cancel() {
  show.value = false
  emit('update:showDialog', false)
}

async function confirm() {
  // Validazione
  if (localQuantity.value <= 0) {
    $q.notify({
      type: 'negative',
      message: 'La quantità deve essere maggiore di 0'
    })
    return
  }

  try {
    const updateData = {
      quantity: localQuantity.value
    }

    if (localNotes.value !== props.product.reference.notes) {
      updateData.notes = localNotes.value
    }

    // Chiama direttamente lo store
    const success = await orderStore.updateOrderItem(
      props.orderId,
      props.product._key,
      updateData
    )

    if (success) {
      show.value = false
      emit('update:showDialog', false)

      $q.notify({
        type: 'positive',
        message: 'Modifiche salvate con successo'
      })

      // Non è più necessario ricaricare gli ordini qui
      // perché lo store.updateOrderItem già aggiorna lo stato
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Errore durante il salvataggio'
    })
    console.error(error)
  }
}
</script>
