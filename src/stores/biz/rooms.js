import { defineStore } from 'pinia'

const STORAGE_KEY = 'biz-rooms-v1'

function uid () {
  return 'r_' + Math.random().toString(36).slice(2, 10)
}

export const useRoomsStore = defineStore('rooms', {
  state: () => ({
    rooms: [
      // example structure:
      // { id: 'r_xxx', name: 'Sala 1', points: [{x:..,y:..}, ...] }
    ],
    currentRoomId: null
  }),

  getters: {
    currentRoom (state) {
      return state.rooms.find(r => r.id === state.currentRoomId) || null
    },
    roomOptions (state) {
      return state.rooms.map(r => ({ label: r.name || r.id, value: r.id }))
    },
    roomOptionsIdName (state) {
      return state.rooms.map(r => ({
        id: r.id,
        name: r.name || r.id
      }))
    },
  },

  actions: {
    addRoom ({ name, points }) {
      const id = uid()
      const room = { id, name: name || `Sala ${this.rooms.length + 1}`, points: points || [] }
      this.rooms.push(room)
      this.currentRoomId = id
      this.save()
      return room
    },
    setCurrentRoom (id) {
      const sid = id != null ? String(id) : null
      if (this.rooms.find(r => r.id === sid)) {
        this.currentRoomId = sid
        this.save()
      }
    },

    renameRoom (id, name) {
      const r = this.rooms.find(x => x.id === id)
      if (r) { r.name = name || r.name; this.save() }
    },
    removeRoom (id) {
      const idx = this.rooms.findIndex(r => r.id === id)
      if (idx !== -1) {
        this.rooms.splice(idx, 1)
        if (this.currentRoomId === id) {
          this.currentRoomId = this.rooms[0]?.id || null
        }
        this.save()
      }
    },
    // ------------------------------------------------------------
    //                    TABLE
    //-------------------------------------------------------------
    addTable (roomId, table) {
      const r = this.rooms.find(x => x.id === roomId)
      if (!r) return null
      if (!Array.isArray(r.tables)) r.tables = []
      const t = {
        id: uid(),
        name: table?.name || `Tavolo ${r.tables.length + 1}`,
        shape: table?.shape || 'round', // round | square | rect | polygon
        seats: Number(table?.seats || 4),
        highChairs: Number(table?.highChairs || 0),
        hasHighChairs: !!table?.hasHighChairs, // flag rapido
        pos: table?.pos || { x: 100, y: 100 },
        size: table?.size || { r: 40, w: 80, h: 80, side: 80, sides: 4 }, // default per forme
        rotation: Number(table?.rotation || 0),
        status: table?.status || 'available', // available | reserved | busy | disabled
        notes: table?.notes || '',
        color: table?.color || '#455A64',
        tags: Array.isArray(table?.tags) ? table.tags : []
      }
      r.tables.push(t)
      this.save()
      return t
    },
    updateTable (roomId, tableId, patch) {
      const r = this.rooms.find(x => x.id === roomId)
      if (!r || !Array.isArray(r.tables)) return
      const t = r.tables.find(x => x.id === tableId)
      if (!t) return
      Object.assign(t, patch || {})
      this.save()
    },
    removeTable (roomId, tableId) {
      const r = this.rooms.find(x => x.id === roomId)
      if (!r || !Array.isArray(r.tables)) return
      const i = r.tables.findIndex(x => x.id === tableId)
      if (i !== -1) { r.tables.splice(i, 1); this.save() }
    },
    // ------------------------------------------------------------
    //                    END TABLE
    //-------------------------------------------------------------
    save () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        rooms: this.rooms,
        currentRoomId: this.currentRoomId
      }))
    },
    load () {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      try {
        const p = JSON.parse(raw)
        this.rooms = Array.isArray(p.rooms) ? p.rooms : []
        this.currentRoomId = p.currentRoomId || this.rooms[0]?.id || null
      } catch (e) {
        console.error('rooms load failed', e)
      }
    },
    reset () {
      this.rooms = []
      this.currentRoomId = null
      this.save()
    },

  }
})
