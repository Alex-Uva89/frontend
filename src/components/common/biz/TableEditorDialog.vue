<!-- src/components/common/biz/TableEditorDialog.vue -->
<template>
  <q-dialog v-model="model" persistent>
    <q-card style="min-width: 640px; max-width: 90vw">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ isEdit ? 'Modifica tavolo' : 'Nuovo tavolo' }}</div>
        <q-space />
        <q-btn flat round icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-model="form.name" label="Nome tavolo" dense outlined />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="form.shape"
              :options="shapeOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              label="Forma"
              dense
              outlined
            />
          </div>

          <div class="col-6 col-md-3">
            <q-input v-model.number="form.seats" type="number" min="1" label="Posti" dense outlined />
          </div>
          <div class="col-6 col-md-3">
            <q-input v-model.number="form.highChairs" type="number" min="0" label="Seggioloni" dense outlined />
          </div>
          <div class="col-12 col-md-6">
            <q-toggle v-model="form.hasHighChairs" label="Disponibili seggioloni" />
          </div>

          <!-- Dimensioni dinamiche per forma -->
          <template v-if="form.shape === 'round'">
            <div class="col-6">
              <q-input v-model.number="form.size.r" type="number" min="10" label="Raggio (px)" dense outlined />
            </div>
          </template>

          <template v-else-if="form.shape === 'square'">
            <div class="col-6">
              <q-input v-model.number="form.size.side" type="number" min="20" label="Lato (px)" dense outlined />
            </div>
          </template>

          <template v-else-if="form.shape === 'rect'">
            <div class="col-6">
              <q-input v-model.number="form.size.w" type="number" min="30" label="Larghezza (px)" dense outlined />
            </div>
            <div class="col-6">
              <q-input v-model.number="form.size.h" type="number" min="30" label="Altezza (px)" dense outlined />
            </div>
          </template>

          <template v-else-if="form.shape === 'polygon'">
            <div class="col-6">
              <q-input v-model.number="form.size.sides" type="number" min="3" label="Numero lati" dense outlined />
            </div>
            <div class="col-6">
              <q-input v-model.number="form.size.r" type="number" min="10" label="Raggio (px)" dense outlined />
            </div>
          </template>

          <div class="col-6">
            <q-input v-model.number="form.rotation" type="number" label="Rotazione (°)" dense outlined />
          </div>
          <div class="col-6">
            <q-select
              v-model="form.status"
              :options="statusOptions"
              emit-value map-options
              label="Stato"
              dense outlined
            />
          </div>

          <div class="col-12">
            <q-input v-model="form.notes" label="Note" type="textarea" autogrow dense outlined />
          </div>

          <div class="col-12 col-md-6">
            <q-input v-model="form.color" label="Colore" dense outlined />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="form.tags"
              use-input use-chips multiple new-value-mode="add-unique"
              :options="[]"
              label="Tag"
              dense outlined
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Annulla" v-close-popup />
        <q-btn color="primary" :label="isEdit ? 'Salva' : 'Crea'" @click="onSave" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  value: { type: Object, default: null } // per edit: tavolo esistente
})
const emit = defineEmits(['update:modelValue', 'save'])

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const isEdit = computed(() => !!props.value)

const shapeOptions = [
  { label: 'Rotondo', value: 'round' },
  { label: 'Quadrato', value: 'square' },
  { label: 'Rettangolare', value: 'rect' },
  { label: 'Poligono regolare', value: 'polygon' }
]
const statusOptions = [
  { label: 'Disponibile', value: 'available' },
  { label: 'Riservato', value: 'reserved' },
  { label: 'Occupato', value: 'busy' },
  { label: 'Disabilitato', value: 'disabled' }
]

const form = reactive({
  name: props.value?.name || '',
  shape: props.value?.shape || 'round',
  seats: props.value?.seats ?? 4,
  highChairs: props.value?.highChairs ?? 0,
  hasHighChairs: !!props.value?.hasHighChairs,
  size: {
    r: props.value?.size?.r ?? 40,
    w: props.value?.size?.w ?? 80,
    h: props.value?.size?.h ?? 80,
    side: props.value?.size?.side ?? 80,
    sides: props.value?.size?.sides ?? 4
  },
  rotation: props.value?.rotation ?? 0,
  status: props.value?.status || 'available',
  notes: props.value?.notes || '',
  color: props.value?.color || '#455A64',
  tags: props.value?.tags ? [...props.value.tags] : []
})

function onSave () {
  emit('save', { ...form })
  model.value = false
}
</script>
