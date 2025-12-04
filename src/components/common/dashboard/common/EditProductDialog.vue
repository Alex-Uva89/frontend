<template>
  <q-dialog v-model="show" @hide="cancel">
    <q-card style="min-width: 90vw;">
      <q-card-section class="text-h6">
        Modifica {{ product.reference.name }}
      </q-card-section>

      <q-card-section>
        <!-- Nome prodotto -->
        <q-input
          :model-value="product.reference.name"
          label="Nome prodotto"
          outlined dense readonly class="q-mb-sm"
        />

        <!-- Fornitore -->
        <q-select
          v-model="localSupplierId"
          :options="supplierOptions"
          option-label="name"
          option-value="_id"
          emit-value
          map-options
          dense outlined clearable
          label="Fornitore"
          class="q-mb-sm"
        />

        <!-- Quantità -->
        <q-input
          v-model.number="localQuantity"
          type="number"
          label="Quantità"
          outlined dense
          :rules="[v => v > 0 || 'La quantità deve essere maggiore di 0']"
          class="q-mb-sm"
        />

        <!-- Note -->
        <q-input
          v-model="localNotes"
          label="Note"
          type="textarea"
          outlined dense autogrow
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
import { ref, watch, computed, onMounted } from "vue";
import { useQuasar } from "quasar";

import { useOrderStore } from "src/stores/orderStore";
import { useSupplierStore } from "src/stores/supplierStore";

const orderStore = useOrderStore();
const supplierStore = useSupplierStore();

const props = defineProps({
  showDialog: Boolean,
  product: Object,
  orderId: String
});

const emit = defineEmits(["update:showDialog", "saved"]);

const $q = useQuasar();

/* ------------------------- STATE ------------------------- */
const show = ref(props.showDialog);
const localQuantity = ref(props.product.quantity);
const localNotes = ref(props.product.notes || props.product.reference.notes || "");

/* ⭐ FORNITORE: priorità a product.supplier */
const localSupplierId = ref(
  props.product.supplier?._id ||
  props.product.supplierId ||
  props.product.reference?.supplier?._id ||
  null
);

const supplierOptions = computed(() => supplierStore.suppliers);

/* ------------------------- INIT ------------------------- */
onMounted(() => {
  if (!supplierStore.suppliers.length) supplierStore.fetchSuppliers?.();
});

/* ------------------------- WATCHERS ------------------------- */
watch(() => props.showDialog, val => (show.value = val));

watch(
  () => props.product,
  val => {
    localQuantity.value = val.quantity;
    localNotes.value = val.notes || val.reference.notes || "";
    localSupplierId.value =
      val.supplier?._id ||
      val.supplierId ||
      val.reference?.supplier?._id ||
      null;
  },
  { deep: true }
);

/* ------------------------- ACTIONS ------------------------- */
function cancel() {
  show.value = false;
  emit("update:showDialog", false);
}

async function confirm() {
  if (localQuantity.value <= 0) {
    $q.notify({ type: "negative", message: "La quantità deve essere maggiore di 0" })
    return
  }

  // 🔹 1. Supplier originale
  const originalSupplierId =
    props.product.supplier?._id ||
    props.product.supplierId ||
    props.product.reference?.supplier?._id ||
    null

  // 🔹 2. Se il fornitore cambia → aggiorno la referenza in Sanity
  if (localSupplierId.value !== originalSupplierId) {
    await orderStore.updateReferenceSupplier(
      props.product.reference._id,
      localSupplierId.value || null
    )
  }

  // 🔹 3. Dati da inviare all’ordine
  const updateData = {
    quantity: localQuantity.value
  }

  // NOTE
  const originalNotes = props.product.notes || props.product.reference.notes || ""
  if (localNotes.value !== originalNotes) {
    updateData.notes = localNotes.value
  }

  // 🔹 FORNITORE dell’ordine (dato locale dell’item, NON la referenza)
  if (localSupplierId.value !== originalSupplierId) {
    updateData.supplierId = localSupplierId.value || null
  }

  // 🔹 4. PATCH dell'ordine
  const success = await orderStore.updateOrderItem(
    props.orderId,
    props.product._key,
    updateData
  )

  if (!success) {
    $q.notify({ type: "negative", message: "Errore durante il salvataggio" })
    return
  }

  // 🔹 5. Notifica + emit per aggiornamento UI
  $q.notify({ type: "positive", message: "Modifiche salvate con successo" })

  emit("saved", {
    ...props.product,
    quantity: localQuantity.value,
    notes: localNotes.value,
    supplierId: localSupplierId.value,
    supplier: supplierStore.suppliers.find(s => s._id === localSupplierId.value) || null
  })

  show.value = false
  emit("update:showDialog", false)
}

</script>
