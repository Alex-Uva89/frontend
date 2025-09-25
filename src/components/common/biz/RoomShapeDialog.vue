<template>
  <q-dialog v-model="model" persistent maximized>
    <q-card class="column fit">
      <!-- Header -->
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-h6">Crea stanza</div>
        <q-space />
        <q-input v-model="name" dense outlined label="Nome stanza" style="min-width: 220px" />
        <q-separator vertical />
        <q-toggle v-model="showGrid" label="Griglia" dense />
        <q-toggle v-model="snapGrid" label="Snap" dense />
        <q-toggle v-model="autoAlign" label="Auto-allineamento" dense />
        <q-input v-model.number="gridSize" type="number" dense outlined label="Step griglia" style="width: 120px" />
        <q-separator vertical />
        <q-btn dense flat icon="undo" label="Annulla punto" :disable="points.length === 0" @click="undoPoint" />
        <q-btn dense flat icon="close" label="Pulisci" :disable="points.length === 0" @click="clearPoints" />
        <q-btn dense color="primary" icon="check" label="Salva" :disable="!canSave" @click="saveRoom" />
        <q-btn dense flat color="negative" icon="close" label="Annulla" @click="close" />
      </q-card-section>

      <q-separator />

      <!-- Canvas -->
      <div class="q-pa-md col">
        <div ref="stageWrap" class="stage-wrap" @wheel.prevent="onWheel">
          <v-stage
            :config="stageCfg"
            @mousemove="onMouseMove"
            @click="onClick"
          >
            <!-- Grid -->
            <v-layer v-if="showGrid">
              <v-line
                v-for="g in gridLines"
                :key="g.id"
                :config="g"
              />
            </v-layer>

            <!-- Drawing -->
            <v-layer>
              <!-- Poligono (chiuso se >=3 punti) -->
              <v-line :config="polyCfg" />

              <!-- Ghost: ultimo punto -> preview -->
              <v-line v-if="ghostCfg" :config="ghostCfg" />

              <!-- Guida allineamento -->
              <v-line v-if="guideCfg" :config="guideCfg" />

              <!-- Punti -->
              <v-circle
                v-for="(p, i) in points"
                :key="'pt-' + i"
                :config="pointCfg(p)"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'

/* Props/Emits */
const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'save'])

/* Dialog model */
const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

/* State */
const name = ref('Nuova stanza')
const points = ref([])                 // [{x,y}]
const preview = ref(null)              // {x,y} punto fantasma
const alignMode = ref(null)            // 'h' | 'v' | 'd' | null

/* Preferenze */
const showGrid = ref(true)
const snapGrid = ref(true)
const autoAlign = ref(true)
const gridSize = ref(40)

/* Viewport */
const stageWrap = ref(null)
const stageState = ref({ scale: 1, x: 0, y: 0 })
const isPanning = ref(false)

onMounted(() => {
  stageWrap.value?.focus?.()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})

/* Stage config */
const stageWidth = ref(Math.min(window.innerWidth, 1200))
const stageHeight = ref(Math.min(window.innerHeight - 200, 700))
const stageCfg = computed(() => ({
  width: stageWidth.value,
  height: stageHeight.value,
  scaleX: stageState.value.scale,
  scaleY: stageState.value.scale,
  x: stageState.value.x,
  y: stageState.value.y,
  draggable: isPanning.value
}))

/* Utils */
function clamp (v, min, max) { return Math.max(min, Math.min(max, v)) }
function pointerToWorld (stage) {
  const pt = stage.getPointerPosition()
  const sc = stageState.value.scale
  return { x: (pt.x - stageState.value.x) / sc, y: (pt.y - stageState.value.y) / sc }
}
function snap (p) {
  if (!snapGrid.value) return p
  const s = gridSize.value || 40
  return { x: Math.round(p.x / s) * s, y: Math.round(p.y / s) * s }
}
function align (p) {
  if (!autoAlign.value || points.value.length === 0) return { p, mode: null }
  const last = points.value[points.value.length - 1]
  const dx = p.x - last.x
  const dy = p.y - last.y
  const tol = Math.max(6, (gridSize.value || 40) * 0.4)

  const out = { ...p }
  // verticale
  if (Math.abs(dx) < tol) { out.x = last.x; return { p: out, mode: 'v' } }
  // orizzontale
  if (Math.abs(dy) < tol) { out.y = last.y; return { p: out, mode: 'h' } }
  // diagonale 45°
  if (Math.abs(Math.abs(dx) - Math.abs(dy)) < tol) {
    const step = Math.min(Math.abs(dx), Math.abs(dy))
    out.x = last.x + Math.sign(dx || 1) * step
    out.y = last.y + Math.sign(dy || 1) * step
    return { p: out, mode: 'd' }
  }
  return { p: out, mode: null }
}

/* Mouse handlers */
function onMouseMove (e) {
  if (isPanning.value) return
  const stage = e.target.getStage()
  if (!stage) return
  let p = pointerToWorld(stage)
  const a = align(p); p = a.p; alignMode.value = a.mode
  p = snap(p)
  preview.value = p
}

function onClick (e) {
  if (isPanning.value) return
  if (e.target !== e.target.getStage()) return
  const stage = e.target.getStage()
  if (!stage) return
  let p = pointerToWorld(stage)
  const a = align(p); p = a.p
  p = snap(p)

  // chiusura rapida se vicino al primo punto
  if (points.value.length >= 3) {
    const f = points.value[0]
    const dist = Math.hypot(p.x - f.x, p.y - f.y)
    if (dist < (gridSize.value * 0.6)) {
      // non aggiungo p: consideriamo chiuso in preview; salvi con bottone
      return
    }
  }
  points.value.push(p)
}

/* Zoom */
function onWheel (e) {
  const s = e.target.getStage()
  if (!s) return
  e.evt.preventDefault()
  const scaleBy = 1.05
  const old = stageState.value.scale
  const pt = s.getPointerPosition()
  const mousePointTo = { x: (pt.x - stageState.value.x) / old, y: (pt.y - stageState.value.y) / old }
  const dir = e.evt.deltaY > 0 ? -1 : 1
  const next = dir > 0 ? old * scaleBy : old / scaleBy
  const nx = pt.x - mousePointTo.x * next
  const ny = pt.y - mousePointTo.y * next
  stageState.value = { scale: clamp(next, 0.2, 4), x: nx, y: ny }
}

/* Points edit */
function onPointDrag (i, e) {
  const n = e.target
  points.value[i] = snap({ x: n.x(), y: n.y() })
}
function undoPoint () { points.value.pop() }
function clearPoints () { points.value = [] }

/* Grid */
const gridLines = computed(() => {
  if (!showGrid.value) return []
  const step = gridSize.value || 40
  const sc = stageState.value.scale
  const w = stageWidth.value / sc
  const h = stageHeight.value / sc
  const arr = []
  for (let x = 0; x <= w; x += step) {
    arr.push({ id: 'gx' + x, points: [x, 0, x, h], stroke: '#eee', strokeWidth: 1 / sc })
  }
  for (let y = 0; y <= h; y += step) {
    arr.push({ id: 'gy' + y, points: [0, y, w, y], stroke: '#eee', strokeWidth: 1 / sc })
  }
  return arr
})

/* Poly + helpers */
function flat (pts) { const r = []; for (const p of pts) { r.push(p.x, p.y) } return r }
const polyCfg = computed(() => ({
  points: flat(points.value),
  closed: points.value.length >= 3,               // chiuso se abbastanza punti
  stroke: '#1976D2',
  strokeWidth: 2,
  lineJoin: 'round',
  lineCap: 'round',
  fill: points.value.length >= 3 ? 'rgba(25,118,210,.10)' : undefined
}))
const ghostCfg = computed(() => {
  if (!preview.value || points.value.length === 0) return null
  const last = points.value[points.value.length - 1]
  return { points: [last.x, last.y, preview.value.x, preview.value.y], stroke: '#26A69A', dash: [8, 6], strokeWidth: 2 }
})
const guideCfg = computed(() => {
  if (!preview.value || points.value.length === 0 || !alignMode.value) return null
  const last = points.value[points.value.length - 1]
  const sc = stageState.value.scale
  const w = stageWidth.value / sc
  const h = stageHeight.value / sc
  if (alignMode.value === 'v') return { points: [last.x, 0, last.x, h], stroke: '#FF8F00', dash: [6, 6], strokeWidth: 1.5 }
  if (alignMode.value === 'h') return { points: [0, last.y, w, last.y], stroke: '#FF8F00', dash: [6, 6], strokeWidth: 1.5 }
  // diagonale: disegna due croci 45°
  const len = Math.min(w, h) * 0.2
  return {
    points: [last.x - len, last.y - len, last.x + len, last.y + len],
    stroke: '#FF8F00', dash: [6, 6], strokeWidth: 1.5
  }
})
function pointCfg (p) {
  return { x: p.x, y: p.y, radius: 5, fill: '#fff', stroke: '#1976D2', strokeWidth: 2, draggable: true }
}

/* Save/Close */
const canSave = computed(() => name.value.trim().length > 0 && points.value.length >= 3)
function saveRoom () {
  if (!canSave.value) return
  emit('save', { name: name.value.trim(), points: points.value.slice() })
  reset()
}
function close () { reset() }
function reset () {
  name.value = 'Nuova stanza'
  points.value = []
  preview.value = null
  alignMode.value = null
  model.value = false
}

/* Space pan */
function onKeyDown (e) { if (e.code === 'Space') isPanning.value = true }
function onKeyUp (e) { if (e.code === 'Space') isPanning.value = false }
</script>

<style scoped>
.stage-wrap {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background:
    linear-gradient(180deg, #fafafa, #fff 40%) no-repeat;
  width: 100%;
  height: calc(100vh - 260px);
  outline: none;
  box-shadow: inset 0 1px 0 rgba(0,0,0,.03);
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
