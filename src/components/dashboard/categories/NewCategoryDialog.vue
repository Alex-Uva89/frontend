<template>
  <q-dialog v-model="modelValue" persistent>
    <q-card style="min-width: 460px; max-width: 90vw">
      <q-card-section class="text-h6">
        Nuova Categoria
      </q-card-section>

      <q-card-section>
        <q-form ref="formRef" @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="name"
            label="Nome Categoria *"
            outlined
            autofocus
            :rules="[v => !!(v && v.trim()) || 'Il nome è obbligatorio']"
            lazy-rules
          />
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Annulla" :disable="saving" v-close-popup />
        <q-btn color="primary" label="Salva" :loading="saving" :disable="saving" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'created'])

const modelValue = ref(props.modelValue)
watch(() => props.modelValue, v => {
  modelValue.value = v
  if (v) nextTick(reset)
})
watch(modelValue, v => emit('update:modelValue', v))

const formRef = ref(null)
const name = ref('')
const saving = ref(false)

function reset() {
  name.value = ''
  saving.value = false
}

async function submit() {
  if (formRef.value) {
    const ok = await formRef.value.validate()
    if (!ok) return
  }
  onSubmit()
}

function onSubmit() {
  saving.value = true
  const doc = {
    _type: 'category',
    name: name.value.trim()
  }
  emit('created', doc)
  modelValue.value = false
  saving.value = false
}
</script>
