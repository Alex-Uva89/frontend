<template>
  <div class="full-width">
    <!-- Mobile Tabs -->
    <q-tabs
      v-model="currentTab"
      inline-label
      outside-arrows
      mobile-arrows
      align="center"
      class="lt-md text-teal shadow-2"
      active-color="teal"
      indicator-color="teal"
    >
      <q-tab
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :icon="tab.icon"
        class="q-px-sm"
      >
        <q-tooltip anchor="top middle" self="bottom middle">
          {{ tab.label || tab.name }}
        </q-tooltip>
      </q-tab>
    </q-tabs>

    <!-- Desktop Tabs -->
    <q-tabs
      v-model="currentTab"
      align="center"
      class="gt-sm text-teal shadow-2"
      active-color="teal"
      indicator-color="teal"
    >
      <q-tab
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :icon="tab.icon"
        :label="tab.label || tab.name"
        class="q-px-md"
      />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="currentTab" animated class="bg-transparent q-mt-none">
      <q-tab-panel
        v-for="tab in tabs"
        :key="`panel-${tab.name}`"
        :name="tab.name"
        class="q-pa-none q-my-md margin-personalized"
      >
        <!--
          Forward di TUTTI gli eventi dal parent direttamente al componente attivo
          + props valutate anche se sono funzioni.
        -->
        <component
          :is="tab.component"
          :class="{'mobile-view': $q.screen.lt.md, 'desktop-view': $q.screen.gt.sm}"
          v-bind="getTabProps(tab)"
          v-on="$attrs"
        />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

// Evita che gli attrs vengano messi sul root e poi persi: li passiamo noi al componente attivo
defineOptions({ inheritAttrs: false })

const props = defineProps({
  tabs: {
    type: Array,
    required: true,
    validator: (arr) => arr.every(t =>
      typeof t?.name === 'string' &&
      (typeof t?.label === 'string' || t?.label === undefined) &&
      (typeof t?.icon === 'string' || t?.icon === undefined) &&
      (t?.component != null)
    )
  },
  modelValue: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

// stato interno sincronizzato con v-model; fallback alla prima tab
const currentTab = ref(props.modelValue ?? props.tabs?.[0]?.name ?? '')

// sync: se cambia la prop aggiorno lo stato locale
watch(() => props.modelValue, (val) => {
  if (val !== currentTab.value) currentTab.value = val ?? props.tabs?.[0]?.name ?? ''
})

// sync: se cambia lo stato locale notifico il genitore
watch(currentTab, (val) => {
  emit('update:modelValue', val)
})

/**
 * Consente di passare props sia come oggetto statico sia come funzione
 * (es. props: () => ({ dynamic: value }))
 */
function getTabProps (tab) {
  try {
    if (typeof tab?.props === 'function') {
      return tab.props()
    }
    return tab?.props || {}
  } catch {
    // in caso di eccezioni nella funzione props, fallback sicuro
    return {}
  }
}
</script>

<style scoped>
.mobile-view { padding: 6px; }
.desktop-view { padding: 12px; }
.q-tab { min-height: 48px; }
.q-tab__icon { font-size: 1.4rem; }
.margin-personalized { margin-left: 1px; margin-right: 1px;}
@media (max-width: 600px) {
  .q-tab { min-width: 60px; padding: 0 4px; }
}
@media (min-width: 601px) {
  .q-tab { min-width: 120px; padding: 0 12px; }
}
</style>
