<!-- src/components/pickers/EmojiPicker.vue -->
<template>
  <div class="column">
    <!-- Input con anteprima emoji -->
    <div class="row items-center q-gutter-sm">
      <q-input
        :model-value="modelValue"
        @update:model-value="val => emit('update:modelValue', val)"
        :label="label"
        dense
        outlined
        :clearable="clearable"
        class="col"
        placeholder="Scegli un'emoji…"
      >
        <template #prepend>
          <span class="emoji-preview">{{ modelValue || '🏷️' }}</span>
        </template>
        <template #append>
          <q-btn dense flat round icon="apps" @click="open = true">
            <q-tooltip>Apri selettore emoji</q-tooltip>
          </q-btn>
        </template>
      </q-input>

      <q-btn
        v-if="modelValue"
        outline
        dense
        icon="visibility"
        :label="$q.screen.gt.sm ? 'Anteprima' : ''"
        @click="preview = true"
      />
    </div>

    <!-- Dialog: Emoji Picker -->
    <q-dialog
      v-model="open"
      :maximized="$q.screen.lt.md"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="ep-card q-pa-none">
        <!-- HEADER -->
        <q-toolbar class="ep-toolbar">
          <q-btn flat round dense icon="arrow_back" v-close-popup />
          <q-toolbar-title>Selettore emoji</q-toolbar-title>
          <q-space />
          <q-btn flat round dense icon="done" v-close-popup />
        </q-toolbar>

        <!-- CONTROLLI sticky (search + tabs + recenti) -->
        <div class="ep-sticky">
          <div class="q-pa-lg">
            <div class="row q-col-gutter-md items-center">
              <q-input
                v-model="term"
                dense
                filled
                debounce="150"
                placeholder="Cerca per nome o parola chiave…"
                class="col-12"
              >
                <template #prepend><q-icon name="search" /></template>
                <template #append><q-btn v-if="term" flat round dense icon="close" @click="term=''" /></template>
              </q-input>

              <!-- Categorie: Tabs scrollabili -->
              <q-tabs
                v-model="activeGroup"
                dense
                narrow-indicator
                inline-label
                shrink
                align="left"
                class="ep-tabs col-12"
                mobile-arrows
                outside-arrows
                left-icon="chevron_left"
                right-icon="chevron_right"
                content-class="q-pl-xs q-pr-xs"
              >
                <q-tab name="__all" label="Tutti" />
                <q-tab
                  v-for="g in groups"
                  :key="g"
                  :name="g"
                  :label="g"
                  :icon="groupEmoji[g]"
                  class="q-mx-xs"
                />
              </q-tabs>


              <!-- Recenti: scroll orizzontale su mobile -->
              <div class="col-12">
                <div class="text-caption text-grey-7">Recenti</div>
                <q-scroll-area horizontal class="ep-recent-scroll">
                  <div class="row no-wrap items-center q-gutter-xs q-mt-xs">
                    <q-chip
                      v-for="e in recent"
                      :key="e"
                      clickable
                      outline
                      @click="select(e)"
                    >
                      <span class="q-mr-sm">{{ e }}</span> <span class="ep-chip-label">{{ emojiName(e) }}</span>
                    </q-chip>
                    <span v-if="!recent.length" class="text-caption text-grey-6">—</span>
                  </div>
                </q-scroll-area>
              </div>
            </div>
          </div>
          <q-separator />
        </div>

        <!-- LISTA SCORREVOLE (solo la griglia) -->
        <q-scroll-area class="col grid-scroll">
          <div class="grid q-pa-sm">
            <button
              v-for="e in filtered"
              :key="e.char"
              type="button"
              class="emoji-btn"
              @click="select(e.char)"
              :title="e.name"
            >
              <span class="emoji">{{ e.char }}</span>
              <div class="name">{{ e.name }}</div>
            </button>
          </div>

          <div v-if="!filtered.length" class="q-pa-md text-grey-6">
            Nessun risultato.
          </div>
        </q-scroll-area>
      </q-card>
    </q-dialog>

    <!-- Dialog: Anteprima -->
    <q-dialog v-model="preview">
      <q-card class="q-pa-lg items-center justify-center column" style="min-width: 300px;">
        <div class="emoji big">{{ modelValue || '🏷️' }}</div>
        <div class="text-subtitle1 q-mt-md">{{ emojiName(modelValue) || '—' }}</div>
        <q-card-actions align="right" class="q-mt-md">
          <q-btn flat v-close-popup label="Chiudi" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: { type: String, default: '' },     // Salviamo direttamente il carattere emoji
  label: { type: String, default: 'Emoji' },
  clearable: { type: Boolean, default: true },
  // opzionale: puoi passare un array custom di emoji { char, name, keywords?, group? }
  customList: { type: Array, default: () => [] },
  // chiave per recenti
  recentKey: { type: String, default: 'recentEmoji:v1' }
})
const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const open = ref(false)
const preview = ref(false)
const term = ref('')

const curated = ref([])

/* Recenti (localStorage) */
const recent = ref([])
function loadRecent () {
  try {
    recent.value = JSON.parse(localStorage.getItem(props.recentKey) || '[]')
      .filter(x => typeof x === 'string')
      .slice(0, 20)
  } catch { recent.value = [] }
}
function pushRecent (char) {
  const arr = [char, ...recent.value.filter(n => n !== char)].slice(0, 20)
  recent.value = arr
  localStorage.setItem(props.recentKey, JSON.stringify(arr))
}

onMounted(async () => {
  loadRecent()
  if (!props.customList?.length) {
    const mod = await import('src/assets/icons/emoji-curated.json')
    curated.value = (mod?.default || mod) ?? []
  }
})

/* dataset normalizzato */
const baseList = computed(() => {
  const arr = props.customList?.length ? props.customList : curated.value
  return (arr || []).map(item => {
    if (typeof item === 'string') return { char: item, name: item, keywords: [], group: 'Altro' }
    return { char: item.char, name: item.name || item.char, keywords: item.keywords || [], group: item.group || 'Altro' }
  })
})

/* gruppi (mobile-first: mostriamo tabs scrollabili) */
const groups = computed(() => {
  const set = new Set(baseList.value.map(e => e.group || 'Altro'))
  const order = ['Promo', 'Allergeni', 'Cibo & Bevande', 'Stagioni & Meteo', 'Tempo', 'Animali & Natura', 'Attività', 'Oggetti', 'Simboli', 'Altro']
  const arr = Array.from(set)
  return arr.sort((a,b) => (order.indexOf(a) + 999) - (order.indexOf(b) + 999))
})

/* mini-icona (emoji) per i tab delle categorie */
const groupEmoji = {
  Promo: '🏷️',
  Allergeni: '🥚',
  'Cibo & Bevande': '🍽️',
  'Stagioni & Meteo': '❄️',
  Tempo: '⏰',
  'Animali & Natura': '🐟',
  Attività: '🎯',
  Oggetti: '📦',
  Simboli: '✅',
  Altro: '✨'
}

const activeGroup = ref('__all')

/* helpers */
function emojiName (char) {
  const hit = baseList.value.find(e => e.char === char)
  return hit?.name || ''
}

/* filtro + ricerca */
const filtered = computed(() => {
  const t = (term.value || '').trim().toLowerCase()
  return baseList.value
    .filter(e => activeGroup.value === '__all' ? true : e.group === activeGroup.value)
    .filter(e => {
      if (!t) return true
      return e.name.toLowerCase().includes(t) ||
             e.keywords.some(k => k.toLowerCase().includes(t)) ||
             e.char === t
    })
})

function select (char) {
  emit('update:modelValue', char)
  pushRecent(char)
  open.value = false
}

/* aggiorna recenti se l’utente cambia a mano */
watch(() => props.modelValue, (val) => { if (val) pushRecent(val) })
</script>

<style scoped>
/* Layout dialog */
.ep-card {
  width: 95vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--q-surface, #fff);
}

/* Toolbar compatta */
.ep-toolbar { padding-inline: 8px; }

/* Barra sticky: resta in alto quando si scrolla la griglia */
.ep-sticky {
  position: sticky;
  top: 0;
  z-index: 2;
  backdrop-filter: blur(6px);
  background: color-mix(in srgb, var(--q-surface, #fff) 80%, transparent);
  border-bottom: 1px solid rgba(0,0,0,.06);
}

/* Recenti: scroll orizzontale su mobile */
.ep-recent-scroll {
  height: 40px;
  max-width: 100%;
}

/* Solo la griglia scrolla */
.grid-scroll { min-height: 0; }

/* Griglia responsive (first mobile) */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
}
@media (min-width: 768px) {
  .grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
}

/* Card emoji */
.emoji-btn {
  width: 100%;
  padding: 12px 10px;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px; /* tap target */
  text-align: left;
}
.emoji-btn:hover {
  border-color: rgba(0,0,0,.18);
  box-shadow: 0 1px 6px rgba(0,0,0,.06);
}

/* Emoji + testi */
.emoji-preview {
  font-size: 20px; line-height: 1;
  width: 22px; display: inline-flex; align-items: center; justify-content: center;
}
.emoji { font-size: 22px; }
.emoji.big { font-size: 64px; }
.name {
  font-size: 12px;
  color: var(--q-dark, #666);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Nasconde parte del testo in spazi stretti (mobile) per restare pulito */
@media (max-width: 599px) {
  .ep-chip-label { display: none; }
}
</style>
