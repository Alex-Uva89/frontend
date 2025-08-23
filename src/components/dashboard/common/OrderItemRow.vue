<template>
  <div class="order-item-row">
    <!-- Riga principale -->
    <div
      class="row items-center q-pa-sm bg-grey-2 rounded-borders"
      :class="[{ 'cursor-pointer': !isCompleted }, { 'opacity-60': isCompleted }]"
      @click="onRowClick"
    >
      <div class="col-xs-12 col-sm-6">
        <div class="row items-center">
          <q-icon
            name="expand_more"
            size="sm"
            :class="[{ 'rotate-180': expanded }, 'q-mr-sm', 'transition-rotate']"
          />
          <span class="text-weight-bold">{{ safeRef?.name || 'Senza nome' }}</span>

          <!-- NOTE: le note stanno sull'item -->
          <q-chip
            v-if="product?.notes"
            dense size="sm"
            color="orange-1"
            text-color="orange"
            class="q-ml-sm"
          >
            <q-icon name="info" size="xs" class="q-mr-xs"/>
            {{ product.notes }}
          </q-chip>
        </div>
      </div>

      <div class="col-xs-12 col-sm-6">
        <div class="row items-center justify-end q-gutter-sm">
          <div class="col-auto text-right">
            <span class="text-weight-medium">Q.tà:</span>
            <span class="q-ml-sm">{{ product.quantity }}</span>
            <span v-if="unitToShow" class="q-ml-xs text-caption text-grey-7">{{ unitToShow }}</span>
          </div>
          <div class="col-auto text-right">
            <span class="text-weight-medium">Prezzo:</span>
            <span class="q-ml-sm">{{ formatPrice(safeRef?.price) }}</span>
          </div>
          <div class="col-auto text-right">
            <span class="text-weight-medium">Totale:</span>
            <span class="q-ml-sm text-weight-bold">
              {{ formatPrice((product.quantity || 0) * (safeRef?.price || 0)) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Dettagli -->
    <q-slide-transition>
      <div v-show="expanded" class="q-pa-sm bg-grey-1 rounded-borders q-mt-xs">
        <div class="row items-center q-mb-sm">
          <q-icon name="person" size="sm" color="grey-6" class="q-mr-sm"/>
          <span class="text-caption text-grey-7">
            Aggiunto da {{ product.addedBy?.firstName }} {{ product.addedBy?.lastName }}
            <span v-if="product.addedAt">il {{ formatDate(product.addedAt) }}</span>
          </span>
        </div>

        <div v-if="safeRef?.volume" class="row items-center q-mb-sm">
          <q-icon name="scale" size="sm" color="grey-6" class="q-mr-sm"/>
          <span class="text-caption text-grey-7">Volume: {{ safeRef.volume }}</span>
        </div>

        <div v-if="unitToShow" class="row items-center q-mb-sm">
          <q-icon name="straighten" size="sm" color="grey-6" class="q-mr-sm"/>
          <span class="text-caption text-grey-7">Unità: {{ unitToShow }}</span>
        </div>

        <div class="row justify-end q-mt-sm">
          <q-btn
            flat dense color="primary" icon="edit" label="Modifica"
            class="q-mr-sm"
            :disable="isCompleted"
            @click.stop="showEditDialog = true"
          />
          <q-btn
            flat dense color="negative" icon="delete" label="Elimina"
            :disable="isCompleted"
            @click.stop="confirmDelete"
          />
        </div>
      </div>
    </q-slide-transition>

    <!-- Mantengo il tuo v-model personalizzato -->
    <edit-product-dialog
      v-model:show-dialog="showEditDialog"
      :product="product"
      :order-id="orderId"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useOrderStore } from 'src/stores/orderStore'
import EditProductDialog from './EditProductDialog.vue'

const props = defineProps({
  product: { type: Object, required: true },
  orderId: { type: String, required: true }
})

const $q = useQuasar()
const orderStore = useOrderStore()

// Fallback sicuro: reference || item
const safeRef = computed(() => props.product?.reference || props.product?.item || null)

// Stato riga espansa
const expanded = ref(false)
const showEditDialog = ref(false)

// Disabled se l'ordine è completed
const isCompleted = computed(() => {
  const ord = orderStore.orders.find(o => o._id === props.orderId)
  return ord?.status === 'completed'
})

// Click riga: solo se non completed
function onRowClick () {
  if (isCompleted.value) return
  expanded.value = !expanded.value
}

// unità da mostrare: item -> reference/item -> ''
const unitToShow = computed(() =>
  props.product?.unit || safeRef.value?.unit || ''
)

function formatPrice(n) {
  const num = Number(n || 0)
  return `€${num.toFixed(2).replace('.', ',')}`
}

function formatDate(dateString) {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return '' }
}

async function confirmDelete() {
  $q.dialog({
    title: 'Conferma eliminazione',
    message: `Sei sicuro di voler eliminare ${safeRef.value?.name || 'questa referenza'} dall'ordine?`,
    cancel: true,
    persistent: true,
    ok: { label: 'Elimina', color: 'negative' }
  }).onOk(async () => {
    const success = await orderStore.deleteOrderItem(props.orderId, props.product._key)
    if (success) $q.notify({ type: 'positive', message: 'Referenza eliminata con successo' })
  })
}
</script>

<style scoped>
.order-item-row{ border-radius:8px; margin-bottom:8px; transition:all .3s ease }
.order-item-row:hover{ background-color:rgba(0,0,0,.02) }
.transition-rotate{ transition: transform .3s ease }
.rotate-180{ transform: rotate(180deg) }
.opacity-60 { opacity: .6 }
.cursor-pointer { cursor: pointer }
</style>
