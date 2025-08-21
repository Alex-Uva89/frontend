<template>
  <q-dialog v-model="modelValue" persistent>
    <q-card style="min-width: 520px; max-width: 90vw">
      <q-card-section class="text-h6">
        Nuovo Fornitore
      </q-card-section>

      <q-card-section>
        <q-form ref="formRef" @submit="onSubmit" class="q-gutter-md">
          <!-- Nome (obbligatorio) -->
          <q-input
            v-model="name"
            label="Nome Fornitore *"
            outlined
            autofocus
            :rules="[v => !!(v && v.trim()) || 'Il nome è obbligatorio']"
            lazy-rules
          />

          <!-- Email (opzionale, validazione formale) -->
          <q-input
            v-model="email"
            type="email"
            label="Email (opzionale)"
            outlined
            :rules="[v => !v || isValidEmail(v) || 'Email non valida']"
            lazy-rules
          />

          <!-- Telefono (opzionale) -->
          <q-input
            v-model="phone"
            type="tel"
            label="Telefono (opzionale)"
            outlined
            :rules="[v => !v || isLikelyPhone(v) || 'Telefono non valido']"
            lazy-rules
            hint="Esempi: +39 0832 123456 · 333 1234567"
          />
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Annulla" :disable="saving" v-close-popup />
        <q-btn
          color="primary"
          label="Salva"
          :loading="saving"
          :disable="saving"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

// Emettiamo sia l'update del v-model, sia l'evento custom "created"
const emit = defineEmits(['update:modelValue', 'created'])

const modelValue = ref(props.modelValue)
watch(() => props.modelValue, (val) => {
  modelValue.value = val
  if (val) {
    // reset form quando si apre
    nextTick(resetForm)
  }
})
watch(modelValue, (val) => emit('update:modelValue', val))

// Stato form
const formRef = ref(null)
const name = ref('')
const email = ref('')
const phone = ref('')
const saving = ref(false)

// Validator semplici
function isValidEmail(v) {
  // Regex semplice e permissiva
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())
}
function isLikelyPhone(v) {
  // Accetta +, cifre, spazi e trattini, minimo 7 caratteri “utili”
  const only = String(v).replace(/[^\d+]/g, '')
  return only.length >= 7
}

function resetForm() {
  name.value = ''
  email.value = ''
  phone.value = ''
  saving.value = false
}

async function submit() {
  // trigger submit del q-form (rispetta le rules)
  if (formRef.value) {
    const ok = await formRef.value.validate()
    if (!ok) return
  }
  onSubmit()
}

function onSubmit() {
  saving.value = true

  const newSupplier = {
    _type: 'supplier',
    name: name.value.trim(),
    // se vuoti, meglio non inviare le chiavi a Sanity
    ...(email.value?.trim() ? { email: email.value.trim() } : {}),
    ...(phone.value?.trim() ? { phone: phone.value.trim() } : {})
  }

  // qui notifichiamo il parent che può fare la create su Sanity
  emit('created', newSupplier)

  // chiudi dialog
  modelValue.value = false
  saving.value = false
}
</script>
