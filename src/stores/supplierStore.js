// stores/supplierStore.js
import { defineStore } from 'pinia';
import { api } from 'boot/axios';

export const useSupplierStore = defineStore('supplier', {
  state: () => ({
    suppliers: []
  }),
  actions: {
    async fetchSuppliers() {
      const response = await api.get('suppliers/');
      this.suppliers = response.data;
    },

    async createSupplier(payload) {
      const { data } = await api.post('suppliers/', payload);

      this.suppliers = [...this.suppliers, data].sort((a, b) =>
        a.name.localeCompare(b.name, 'it', { sensitivity: 'base' })
      )
      return data
    }
  }
});
