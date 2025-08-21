<template>
  <q-dialog v-model="internalVisible" persistent transition-show="scale" transition-hide="scale">
    <q-card style="min-width: 600px; max-width: 90vw">
      <q-card-section class="row items-center q-col-gutter-sm">
        <div class="col">
          <div class="text-h6">{{ title }}</div>
        </div>
        <div class="col-auto">
          <q-btn dense round flat icon="close" v-close-popup />
        </div>
      </q-card-section>

      <q-card-section>
        <q-banner inline-actions rounded class="bg-red-2 text-red-10 q-pa-md q-mb-md" v-if="message" >
          <q-icon name="report" class="q-mr-sm" />
          <div v-html="message"></div>
        </q-banner>

        <div class="q-mb-sm">
          Per confermare, copia e incolla il codice di sicurezza:
        </div>

        <div class="row items-center q-col-gutter-sm q-mb-sm">
          <div class="col-auto">
            <q-chip outline :color="color" class="text-bold text-body1 q-pa-sm">
              {{ securityCode }}
            </q-chip>
          </div>
          <div class="col-auto">
            <q-btn flat dense icon="content_copy" @click="copyCode" :color="color">
              <q-tooltip>Copia codice</q-tooltip>
            </q-btn>
          </div>
        </div>

        <q-input
          v-model="enteredCode"
          :label="`Inserisci codice (${length} caratteri)`"
          :maxlength="length"
          autofocus
          clearable
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Annulla" v-close-popup />
        <q-btn :color="color" :disable="enteredCode !== securityCode" :label="confirmLabel" @click="confirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Conferma' },
  message: { type: String, default: '' }, // può contenere HTML (v-html)
  confirmLabel: { type: String, default: 'Conferma' },
  color: { type: String, default: 'red' },
  length: { type: Number, default: 6 }
})
const emit = defineEmits(['update:modelValue', 'confirmed'])
const $q = useQuasar()

const internalVisible = ref(false)
watch(() => props.modelValue, v => {
  internalVisible.value = v
  if (v) regenerate()
})
watch(internalVisible, v => emit('update:modelValue', v))

const securityCode = ref('')
const enteredCode = ref('')

function regenerate () {
  securityCode.value = generateSecurityCode(props.length)
  enteredCode.value = ''
}
function generateSecurityCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // niente O/0, I/1 per evitare ambiguità
  let code = ''
  for (let i = 0; i < length; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
  return code
}
async function copyCode () {
  try {
    await navigator.clipboard.writeText(securityCode.value)
    $q.notify({ type: 'positive', message: 'Codice copiato' })
  } catch {
    $q.notify({ type: 'warning', message: 'Copia negli appunti non riuscita' })
  }
}
function confirm () {
  if (enteredCode.value !== securityCode.value) return
  internalVisible.value = false
  emit('confirmed')
}
</script>
