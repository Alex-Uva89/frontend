<template>
  <div class="q-mt-md">
    <div class="text-subtitle2 q-mb-sm">{{ title }}</div>

    <!-- Oggetto annidato -->
    <div v-if="isObject(modelValue)">
      <div v-for="(val, key) in modelValue" :key="key" class="q-mb-sm">
        <template v-if="isObject(val)">
          <q-expansion-item dense expand-separator :label="key">
            <!-- self recursion -->
            <RecursiveFields
              :model-value="modelValue[key] ?? {}"
              @update:model-value="(v) => updateKey(key, v)"
              :title="key"
            />
          </q-expansion-item>
        </template>

        <template v-else>
          <q-input
            :model-value="modelValue[key] ?? ''"
            @update:model-value="(v) => updateKey(key, v)"
            :label="key"
            dense
            outlined
            autogrow
            :type="String(modelValue[key] ?? '').length > 80 ? 'textarea' : 'text'"
          />
        </template>
      </div>
    </div>

    <!-- Valore semplice -->
    <div v-else>
      <q-input
        :model-value="buffer"
        @update:model-value="(v) => emit('update:modelValue', v)"
        :label="title"
        dense
        outlined
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 👇 serve per far funzionare il richiamo ricorsivo <RecursiveFields />
defineOptions({ name: 'RecursiveFields' })

const props = defineProps({
  modelValue: { type: [Object, String, Number, null], default: () => ({}) },
  title: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v)

// aggiorna una chiave senza mutare il prop
function updateKey(key, value) {
  const base = isObject(props.modelValue) ? { ...props.modelValue } : {}
  base[key] = value
  emit('update:modelValue', base)
}

// caso primitivo
const buffer = computed(() => (props.modelValue ?? ''))
</script>
