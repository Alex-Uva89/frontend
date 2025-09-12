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
    }
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
      if (this.rooms.find(r => r.id === id)) {
        this.currentRoomId = id
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
    }
  }
})
