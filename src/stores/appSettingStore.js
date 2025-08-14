// stores/appSettingStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppSettingStore = defineStore('appSettings', () => {
  const col1 = ref('col-5')  // Prodotto + Categoria
  const col2 = ref('col-2')  // Quantità
  const col3 = ref('col-2')  // Prezzo Unitario
  const col4 = ref('col-2')  // Totale
  const col5 = ref('col-1')  // Azioni

  const layoutSpace = ref('q-ma-lg q-pa-lg')

  return { col1, col2, col3, col4, col5, layoutSpace }
})
