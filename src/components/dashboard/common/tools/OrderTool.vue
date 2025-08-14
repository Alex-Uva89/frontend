<!-- src/components/dashboard/common/tools/OrderTool.vue -->
<template>
  <div>
    <!-- Pulsante nuova lista con tooltip -->
    <div>
      <q-tooltip v-if="disableNewOrder" anchor="bottom middle" self="top middle" class="bg-orange text-white">
        Esiste già un ordine per oggi
      </q-tooltip>
      <q-btn
        outline
        style="color: teal;"
        icon="add"
        label="Nuova Lista"
        :disable="disableNewOrder"
        @click="openNewOrderDialog"
      />
    </div>

    <!-- Titolo della lista ordini -->
    <div class="text-h4 text-bold q-my-lg">
      Lista ordini - {{ businessName }}
    </div>

    <!-- Loading indicator -->
    <q-inner-loading :showing="loading" />

    <!-- Lista ordini o messaggio vuoto -->
    <template v-if="!loading">
      <OrderItemsList v-if="hasOrders" />
      <div v-else class="text-grey-6 q-mt-lg">
        {{ errorMessage || 'Nessun ordine disponibile' }}
      </div>
    </template>

    <!-- Dialog per nuovo ordine -->
    <NewOrderDialog
      v-model="showDialog"
      :business-id="businessId"
      @order-created="emit('order-created', $event)"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import OrderItemsList from 'src/components/dashboard/common/OrderItemsList.vue'
import NewOrderDialog from 'src/components/dashboard/orders/NewOrderDialog.vue'

const props = defineProps({
  businessId: {
    type: String,
    required: true
  },
  businessName: {
    type: String,
    required: true
  },
  orders: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['order-created'])

const showDialog = ref(false)

const hasOrders = computed(() => props.orders.length > 0)

const disableNewOrder = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return props.orders.some(order => order.addedAt?.startsWith(today))
})

function openNewOrderDialog() {
  showDialog.value = true
}
</script>
