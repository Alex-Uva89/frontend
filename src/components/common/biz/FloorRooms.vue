<!-- Dentro il tuo componente padre (quello che hai incollato) -->
<template>
  <div class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-gutter-sm q-mb-sm">
      <!-- Stanza -->
      <q-select
        v-model="currentRoomId"
        :options="rooms.roomOptionsIdName"
        option-value="id" option-label="name"
        emit-value map-options
        label="Seleziona stanza" dense outlined style="min-width: 240px"
      />

      <q-input
        v-if="rooms.currentRoom"
        v-model="roomName"
        dense outlined label="Rinomina stanza"
        style="min-width: 240px"
      />

      <q-btn color="primary" icon="add" label="Crea stanza" dense @click="openDialog" />

      <q-space />

      <!-- ⬇️ NUOVA SELECT & BOTTONE "Aggiungi tavolo" -->
      <q-select
        v-model="newTableShape"
        :options="shapeOptions"
        option-value="value" option-label="label"
        emit-value map-options
        label="Forma tavolo" dense outlined style="min-width: 180px"
      />
      <q-btn
        :disable="!rooms.currentRoom"
        color="secondary" icon="event_seat"
        label="Aggiungi tavolo"
        dense @click="openTableDialog"
      />

      <q-btn
        v-if="rooms.currentRoom"
        flat color="negative" icon="delete" label="Elimina stanza" dense @click="removeCurrent"
      />
    </div>

    <!-- Stage -->
    <div ref="stageWrap" class="stage-wrap" @wheel.prevent="onWheel">
      <v-stage :config="stageCfg" @mousedown="onStageMouseDown">
        <v-layer>
          <template v-if="rooms.currentRoom">
            <v-line :config="roomLineCfg(rooms.currentRoom)" />
            <v-circle
              v-for="(p, i) in rooms.currentRoom.points"
              :key="'vpt-' + i"
              :config="{ x: p.x, y: p.y, radius: 3, fill: '#1976D2' }"
            />
          </template>
        </v-layer>

        <!-- ⬇️ LAYER TAVOLI -->
        <v-layer v-if="rooms.currentRoom && rooms.currentRoom.tables?.length">
          <template v-for="t in rooms.currentRoom.tables" :key="t.id">
            <v-circle
              v-if="t.shape === 'round'"
              :config="{
                x: t.pos.x, y: t.pos.y, radius: t.size.r || 40,
                fill: t.color || '#607D8B', opacity: t.status === 'disabled' ? 0.4 : 0.9
              }"
            />
            <v-rect
              v-else-if="t.shape === 'square'"
              :config="{
                x: t.pos.x - (t.size.side||80)/2, y: t.pos.y - (t.size.side||80)/2,
                width: t.size.side||80, height: t.size.side||80, rotation: t.rotation||0,
                cornerRadius: 8, fill: t.color || '#607D8B', opacity: t.status === 'disabled' ? 0.4 : 0.9
              }"
            />
            <v-rect
              v-else-if="t.shape === 'rect'"
              :config="{
                x: t.pos.x - (t.size.w||100)/2, y: t.pos.y - (t.size.h||60)/2,
                width: t.size.w||100, height: t.size.h||60, rotation: t.rotation||0,
                cornerRadius: 8, fill: t.color || '#607D8B', opacity: t.status === 'disabled' ? 0.4 : 0.9
              }"
            />
            <v-regular-polygon
              v-else-if="t.shape === 'polygon'"
              :config="{
                x: t.pos.x, y: t.pos.y, sides: t.size.sides || 5, radius: t.size.r || 40,
                rotation: t.rotation||0, fill: t.color || '#607D8B', opacity: t.status === 'disabled' ? 0.4 : 0.9
              }"
            />
            <!-- Etichetta -->
            <v-text
              :config="{
                x: t.pos.x, y: (t.pos.y + (t.shape==='rect' ? (t.size.h||60)/2 + 14 : (t.shape==='square' ? (t.size.side||80)/2 + 14 : (t.size.r||40) + 14))),
                text: t.name + ' (' + t.seats + ')',
                fontSize: 14, fill: '#37474F', align: 'center'
              }"
              :offsetX="(t.name.length * 7) / 2"
            />
          </template>
        </v-layer>
      </v-stage>
    </div>

    <!-- Dialog stanza -->
    <RoomShapeDialog v-model="dialog" @save="onSaveRoom" />

    <!-- Dialog tavolo -->
    <TableEditorDialog v-model="tableDialog" :value="null" @save="onSaveTable" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoomsStore } from 'src/stores/biz/rooms'
import RoomShapeDialog from 'src/components/common/biz/RoomShapeDialog.vue'
import TableEditorDialog from 'src/components/common/biz/TableEditorDialog.vue'

const rooms = useRoomsStore()
const dialog = ref(false)

// ⬇️ nuovo stato per tavoli
const newTableShape = ref('round')
const tableDialog = ref(false)

const shapeOptions = [
  { label: 'Rotondo', value: 'round' },
  { label: 'Quadrato', value: 'square' },
  { label: 'Rettangolare', value: 'rect' },
  { label: 'Poligono regolare', value: 'polygon' }
]

function openTableDialog () {
  if (!rooms.currentRoom) return
  // il dialog ha default sensati; se vuoi pre-impostare la forma:
  // lo passiamo via provide/inject o store? Qui settiamo un default globale:
  // userai "newTableShape" applicandolo nel save.
  tableDialog.value = true
}
function onSaveTable (payload) {
  if (!rooms.currentRoom) return
  // forza la forma scelta dalla select rapida (selezione header)
  const tableData = { ...payload, shape: newTableShape.value }
  // posizione di default: centro stanza (approssimato)
  tableData.pos ||= { x: 200, y: 200 }
  rooms.addTable(rooms.currentRoom.id, tableData)
}

const stageWrap = ref(null)
const stageState = ref({ scale: 1, x: 0, y: 0 })
const isPanning = ref(false)

onMounted(() => {
  rooms.load()
  if (!rooms.currentRoomId) dialog.value = true
})

// header bindings
const currentRoomId = computed({
  get: () => rooms.currentRoomId,
  set: v => rooms.setCurrentRoom(v)
})
const roomName = computed({
  get: () => rooms.currentRoom?.name || '',
  set: v => { if (rooms.currentRoom) rooms.renameRoom(rooms.currentRoom.id, v) }
})

function openDialog () { dialog.value = true }
function onSaveRoom ({ name, points }) {
  const r = rooms.addRoom({ name, points })
  fitToRoom(r)
}
function removeCurrent () {
  if (!rooms.currentRoom) return
  rooms.removeRoom(rooms.currentRoom.id)
}

const stageCfg = computed(() => ({
  width: Math.min(window.innerWidth, 1200),
  height: 600,
  scaleX: stageState.value.scale,
  scaleY: stageState.value.scale,
  x: stageState.value.x,
  y: stageState.value.y,
  draggable: isPanning.value
}))

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
function onStageMouseDown (e) { console.log(e) }
function clamp (v, min, max) { return Math.max(min, Math.min(max, v)) }

function roomLineCfg (room) {
  return {
    points: flattenPoints(room.points),
    closed: true,
    stroke: '#00796B',
    strokeWidth: 3,
    lineJoin: 'round',
    lineCap: 'round',
    fill: 'rgba(0,121,107,0.12)'
  }
}
function flattenPoints (arr) { const res = []; for (const p of arr) res.push(p.x, p.y); return res }

function fitToRoom (room) {
  const pts = room.points
  if (!pts || pts.length === 0) return
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of pts) { if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y; if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y }
  const w = Math.max(1, maxX - minX)
  const h = Math.max(1, maxY - minY)
  const pad = 40
  const viewW = Math.min(window.innerWidth, 1200)
  const viewH = 600
  const scaleX = (viewW - pad * 2) / w
  const scaleY = (viewH - pad * 2) / h
  const scale = Math.max(0.2, Math.min(3, Math.min(scaleX, scaleY)))
  const x = pad - minX * scale + (viewW - (w * scale + pad * 2)) / 2
  const y = pad - minY * scale + (viewH - (h * scale + pad * 2)) / 2
  stageState.value = { scale, x, y }
}

watch(() => rooms.currentRoomId, (id) => {
  const room = rooms.rooms.find(r => r.id === id)
  if (room) fitToRoom(room)
})

// SPACE pan global
window.addEventListener('keydown', e => { if (e.code === 'Space') isPanning.value = true })
window.addEventListener('keyup', e => { if (e.code === 'Space') isPanning.value = false })
</script>

<style scoped>
.stage-wrap {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  width: 100%;
  height: 600px;
}
</style>
