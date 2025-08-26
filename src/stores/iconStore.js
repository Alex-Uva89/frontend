// src/stores/iconStore.js
import { defineStore } from 'pinia'

export const useIconStore = defineStore('iconStore', {
  state: () => ({
    all: [],        // array di stringhe: nomi icone
    ready: false,
    error: null
  }),
  actions: {
    async load () {
      if (this.ready) return
      try {
        // Carica una lista statica di nomi icone (vedi sezione 2)
        const mod = await import('src/assets/icons/material-icons.twotone.json')
        const arr = mod?.default || mod
        this.all = Array.isArray(arr) ? arr : []
        this.ready = true
      } catch (e) {
        this.error = e?.message || 'Impossibile caricare le icone'
      }
    }
  },
  getters: {
    options: (state) => state.all.map(n => ({ label: n, value: n, icon: n }))
  }
})
