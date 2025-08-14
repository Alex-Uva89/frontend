import { ref, reactive, computed } from 'vue'
import { useOrderStore } from 'src/stores/orderStore'

export default function useOrderActions() {
  const orderStore = useOrderStore()
  const showEditProduct = ref(false)

  const editProductData = reactive({
    orderIndex: null,
    productIndex: null,
    quantity: 1,
    name: ''
  })

  const filteredOrders = computed(() => orderStore.orders)

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'green'
      case 'pending': return 'orange'
      default: return 'grey'
    }
  }

  const openEditProduct = (order, index) => {
    const orderIndex = filteredOrders.value.findIndex(o => o._id === order._id)
    if (orderIndex === -1) return

    editProductData.orderIndex = orderIndex
    editProductData.productIndex = index
    editProductData.quantity = order.items[index]?.quantity || 1
    editProductData.name = order.items[index]?.reference?.name || 'Prodotto generico'
    showEditProduct.value = true
  }

  const saveProductEdit = async () => {
    try {
      const order = filteredOrders.value[editProductData.orderIndex]
      if (!order) return

      // Clona l'ordine per evitare mutazioni dirette
      const updatedOrder = JSON.parse(JSON.stringify(order))
      updatedOrder.items[editProductData.productIndex].quantity = editProductData.quantity

      await orderStore.updateOrder(updatedOrder)
      showEditProduct.value = false
    } catch (error) {
      console.error('Errore:', error)
      alert('Si è verificato un errore durante il salvataggio')
    }
  }

  const deleteOrder = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo ordine?')) return
    try {
      await orderStore.deleteOrder(id)
    } catch (error) {
      console.error('Errore:', error)
      alert('Si è verificato un errore durante l\'eliminazione')
    }
  }

  const deleteProduct = async ({ order, index }) => {
    if (!confirm('Eliminare questo prodotto dall\'ordine?')) return
    try {
      // Clona l'ordine per evitare mutazioni dirette
      const updatedOrder = JSON.parse(JSON.stringify(order))
      updatedOrder.items.splice(index, 1)

      await orderStore.updateOrder(updatedOrder)
    } catch (error) {
      console.error('Errore:', error)
      alert('Si è verificato un errore durante l\'eliminazione')
    }
  }

  return {
    showEditProduct,
    editProductData,
    filteredOrders,
    getStatusColor,
    openEditProduct,
    saveProductEdit,
    deleteOrder,
    deleteProduct
  }
}
