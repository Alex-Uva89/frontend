<template>
  <div class="order-item-row">
    <!-- Main Product Row - Collapsible -->
    <div
      class="row items-center q-pa-sm bg-grey-2 rounded-borders cursor-pointer"
      @click="expanded = !expanded"
    >
      <!-- Product Name and Basic Info -->
      <div class="col-xs-12 col-sm-6">
        <div class="row items-center">
          <q-icon
            name="expand_more"
            size="sm"
            :class="{'rotate-180': expanded}"
            class="q-mr-sm transition-rotate"
          />
          <span class="text-weight-bold">{{ product.reference.name }}</span>
          <q-chip
            v-if="product.reference.notes"
            dense
            size="sm"
            color="orange-1"
            text-color="orange"
            class="q-ml-sm"
          >
            <q-icon name="info" size="xs" class="q-mr-xs"/>
            {{ product.reference.notes }}
          </q-chip>
        </div>
      </div>

      <!-- Quantity and Price -->
      <div class="col-xs-12 col-sm-6">
        <div class="row items-center justify-end">
          <div class="col-auto text-right q-mr-md">
            <span class="text-weight-medium">Q.tà:</span>
            <span class="q-ml-sm">{{ product.quantity }}</span>
          </div>

          <div class="col-auto text-right q-mr-md">
            <span class="text-weight-medium">Prezzo:</span>
            <span class="q-ml-sm">{{ formatPrice(product.reference.price) }}</span>
          </div>

          <div class="col-auto text-right">
            <span class="text-weight-medium">Totale:</span>
            <span class="q-ml-sm text-weight-bold">
              {{ formatPrice(product.quantity * product.reference.price) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Expanded Details -->
    <q-slide-transition>
      <div v-show="expanded" class="q-pa-sm bg-grey-1 rounded-borders q-mt-xs">
        <!-- Added By Info -->
        <div class="row items-center q-mb-sm">
          <q-icon name="person" size="sm" color="grey-6" class="q-mr-sm"/>
          <span class="text-caption text-grey-7">
            Aggiunto da {{ product.addedBy.firstName }} {{ product.addedBy.lastName }}
            <span v-if="product.addedAt">il {{ formatDate(product.addedAt) }}</span>
          </span>
        </div>

        <!-- Volume Info -->
        <div v-if="product.reference.volume" class="row items-center q-mb-sm">
          <q-icon name="scale" size="sm" color="grey-6" class="q-mr-sm"/>
          <span class="text-caption text-grey-7">
            Volume: {{ product.reference.volume }}
          </span>
        </div>

        <!-- Action Buttons -->
        <div class="row justify-end q-mt-sm">
          <q-btn
            flat
            dense
            color="primary"
            icon="edit"
            label="Modifica"
            @click.stop="showEditDialog = true"
            class="q-mr-sm"
          />
          <q-btn
            flat
            dense
            color="negative"
            icon="delete"
            label="Elimina"
            @click.stop="confirmDelete"
          />
        </div>
      </div>
    </q-slide-transition>

    <edit-product-dialog
      v-model:show-dialog="showEditDialog"
      :product="product"
      :order-id="orderId"
    />

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useOrderStore } from 'src/stores/orderStore'
import EditProductDialog from './EditProductDialog.vue'

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  orderId: {
    type: String,
    required: true
  }
})

const showEditDialog = ref(false)

const $q = useQuasar()
const orderStore = useOrderStore()
const expanded = ref(false)

function formatPrice(price) {
  return `€${price.toFixed(2).replace('.', ',')}`
}

function formatDate(dateString) {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (e) {
    console.log(e)
    console.error('Invalid date format:', dateString)
    return ''
  }
}
async function confirmDelete() {
  $q.dialog({
    title: 'Conferma eliminazione',
    message: `Sei sicuro di voler eliminare ${props.product.reference.name} dall'ordine?`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Elimina',
      color: 'negative'
    }
  }).onOk(async () => {
    try {
      const success = await orderStore.deleteOrderItem(props.orderId, props.product._key)
      if (success) {
        $q.notify({
          type: 'positive',
          message: 'Referenza eliminata con successo'
        })
      }
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Errore durante l\'eliminazione'
      })
      console.error(error)
    }
  })
}
</script>

<style scoped>
.order-item-row {
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.order-item-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.transition-rotate {
  transition: transform 0.3s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
