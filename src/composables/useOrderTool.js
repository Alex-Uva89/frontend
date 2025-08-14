import { ref, computed } from 'vue'

export function useOrderTool(orderStore) {
  const showNewOrderDialog = ref(false)

  const disableNewOrder = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return orderStore.orders.some(order => order.orderDate?.startsWith(today))
  })

  function openNewOrderDialog() {
    showNewOrderDialog.value = true
  }

  function handleOrderCreated(newOrder) {
    // Modifica lo store solo quando il genitore gestisce l’evento
    orderStore.orders.push(newOrder)
  }

  return { showNewOrderDialog, disableNewOrder, openNewOrderDialog, handleOrderCreated }
}
