<template>
  <q-dialog v-model="modelValue">
    <q-card>
      <q-card-section class="text-h6">
        Nuova Unità di Misura
      </q-card-section>
      <q-card-section>
        Questa è la dialog per creare una nuova unità di misura.
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Chiudi" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])
const modelValue = ref(props.modelValue)
watch(() => props.modelValue, val => modelValue.value = val)
watch(modelValue, val => emit('update:modelValue', val))
</script>
