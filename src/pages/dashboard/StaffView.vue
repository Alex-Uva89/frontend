<!-- StaffView.vue -->
<template>
  <q-page :class="appSetting.layoutSpace">
    <OrderTool
      :business-id="businessStore.currentBusiness._id"
      :business-name="businessStore.currentBusiness.name"
      :orders="orderStore.orders"
      :loading="orderStore.loading"
      :error-message="orderStore.error"
      @order-created="handleOrderCreated"
    />
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAppSettingStore } from 'src/stores/appSettingStore'
import { useOrderStore } from 'src/stores/orderStore'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'
import OrderTool from 'src/components/dashboard/common/tools/OrderTool.vue'

const appSetting = useAppSettingStore()
const orderStore = useOrderStore()
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

function handleOrderCreated(newOrder) {
  orderStore.orders.push(newOrder)
}

onMounted(async () => {
  const user = usersStore.currentUser
  businessStore.currentBusiness = user.business

  if (!user?.business?._id) {
    console.error('Business ID non trovato per l\'utente')
    return
  }

  orderStore.currentBusinessId = user.business._id
  await orderStore.fetchOrders()
})
</script>
