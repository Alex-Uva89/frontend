<template>
  <q-dialog v-model="model" persistent maximized>
    <q-card class="column fit">
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-h6">Crea stanza</div>
        <q-space />
        <q-input v-model="name" dense outlined label="Nome stanza" style="min-width: 220px" />
        <q-btn dense flat icon="undo" label="Annulla punto" :disable="points.length === 0" @click="undoPoint" />
        <q-btn dense flat icon="close" label="Pulisci" :disable="points.length === 0" @click="clearPoints" />
        <q-btn dense flat icon="gesture" :color="closed ? 'primary' : 'grey'" label="Chiudi poligono" :disable="points.length < 3" @click="toggleClosed" />
        <q-btn dense color="primary" icon="check" label="Salva" :disable="!canSave" @click="saveRoom" />
        <q-btn dense flat color="negative" icon="close" label="Annulla" @click="close" />
      </q-card-section>

      <q-separator />

      <div class="q-pa-md col">
        <div ref="stageWrap" class="stage-wrap" @wheel.prevent="onWheel">
          <v-stage
            :config="stageCfg"
            @mousedown="onStageMouseDown"
            @click="onStageClick"
          >
            <v-layer>
              <!-- Poly preview -->
              <v-line
                :config="polyCfg"
              />
              <!-- Points -->
              <v-circle
                v-for="(p, i) in points"
                :key="'pt-' + i"
                :config="pointCfg(p, i)"
                @dragmove="e => onPointDrag(i, e)"
              />
            </v-layer>
          </v-stage>
        </div>
      </div>

      <q-card-section class="text-caption">
        Clic per aggiungere punti. Tieni premuto <kbd>SPACE</kbd> per spostare la mappa, rotella per zoom.
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'save'])

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const name = ref('Nuova stanza')
const points = ref([]) // [{x,y}]
const closed = ref(false)

const stageWrap = ref(null)
const stageState = ref({ scale: 1, x: 0, y: 0 })
const isPanning = ref(false)

onMounted(() => {
  // focus to capture spacebar inside dialog
  stageWrap.value?.focus?.()
})

const stageCfg = computed(() => ({
  width: Math.min(window.innerWidth, 1200),
  height: Math.min(window.innerHeight - 200, 700),
  scaleX: stageState.value.scale,
  scaleY: stageState.value.scale,
  x: stageState.value.x,
  y: stageState.value.y,
  draggable: isPanning.value
}))

function toWorld (evt) {
  // Convert pointer to world coords considering stage transform
  const s = evt.target.getStage()
  const pt = s.getPointerPosition()
  const sc = stageState.value.scale
  const wx = (pt.x - stageState.value.x) / sc
  const wy = (pt.y - stageState.value.y) / sc
  return { x: wx, y: wy }
}

function onStageClick (e) {
  if (isPanning.value) return
  // only add when clicking on empty space (stage)
  if (e.target !== e.target.getStage()) return
  if (closed.value) return
  const p = toWorld(e)
  points.value.push(p)
}

function onStageMouseDown (e) {
console.log(e)}

function onWheel (e) {
  const s = e.target.getStage()
  if (!s) return
  e.evt.preventDefault()
  const scaleBy = 1.05
  const old = stageState.value.scale
  const pt = s.getPointerPosition()
  const mousePointTo = {
    x: (pt.x - stageState.value.x) / old,
    y: (pt.y - stageState.value.y) / old
  }
  const dir = e.evt.deltaY > 0 ? -1 : 1
  const next = dir > 0 ? old * scaleBy : old / scaleBy
  const nx = pt.x - mousePointTo.x * next
  const ny = pt.y - mousePointTo.y * next
  stageState.value = { scale: clamp(next, 0.2, 4), x: nx, y: ny }
}

function clamp (v, min, max) { return Math.max(min, Math.min(max, v)) }

function undoPoint () {
  points.value.pop()
}
function clearPoints () {
  points.value = []
  closed.value = false
}
function toggleClosed () {
  if (points.value.length >= 3) closed.value = !closed.value
}

const polyCfg = computed(() => ({
  points: flattenPoints(points.value),
  closed: closed.value,
  stroke: '#1976D2',
  strokeWidth: 2,
  lineJoin: 'round',
  lineCap: 'round',
  fill: closed.value ? 'rgba(25,118,210,0.15)' : undefined
}))

function flattenPoints (arr) {
  const res = []
  for (const p of arr) { res.push(p.x, p.y) }
  return res
}

function pointCfg (p) {
  return {
    x: p.x, y: p.y,
    radius: 5,
    fill: '#fff',
    stroke: '#1976D2',
    strokeWidth: 2,
    draggable: true
  }
}
function onPointDrag (i, e) {
  const n = e.target
  points.value[i] = { x: n.x(), y: n.y() }
}

const canSave = computed(() => name.value.trim().length > 0 && points.value.length >= 3 && closed.value)

function saveRoom () {
  if (!canSave.value) return
  emit('save', { name: name.value.trim(), points: points.value.slice() })
  // reset and close
  name.value = 'Nuova stanza'
  points.value = []
  closed.value = false
  model.value = false
}
function close () {
  // discard and close
  name.value = 'Nuova stanza'
  points.value = []
  closed.value = false
  model.value = false
}

// Global listeners for SPACE pan
window.addEventListener('keydown', onKeyDown)
window.addEventListener('keyup', onKeyUp)
function onKeyDown (e) { if (e.code === 'Space') isPanning.value = true }
function onKeyUp (e) { if (e.code === 'Space') isPanning.value = false }
</script>

<style scoped>
.stage-wrap {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  width: 100%;
  height: calc(100vh - 260px);
  outline: none;
}
kbd {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-bottom-width: 2px;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: .9em;
}
</style>
