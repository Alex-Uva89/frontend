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
    }
  }
});
