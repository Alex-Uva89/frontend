<template>
  <q-page class="q-pt-xl">

    <!-- Info Azienda -->
    <q-card class="shadow-3 q-ma-lg" v-if="company">
      <q-card-section class="row items-center q-gutter-md">
        <q-avatar size="140px" class="overflow-hidden shadow-2" rounded>
          <img
            v-if="company.logo?.asset?.url"
            :src="company.logo.asset.url"
            alt="Logo azienda"
            style="object-fit: contain; width: 100%; height: 100%;"
          />
          <q-icon v-else name="business" size="xl" />
        </q-avatar>
        <div class="col">
          <div class="text-h5 text-teal">{{ company.name }}</div>
          <div class="text-subtitle2 text-secondary q-mb-sm">{{ company.brandName }}</div>
          <div class="text-body2 q-mb-md" style="white-space: pre-line;">{{ company.description }}</div>
          <q-btn color="teal" label="Modifica Azienda" icon="edit" rounded dense />
        </div>
      </q-card-section>
    </q-card>

    <!-- Locali dell'owner -->
    <q-card class="q-mb-lg shadow-2 q-ma-lg" v-if="ownerBusinesses.length">
      <q-card-section>
        <div class="text-h6 q-mb-md text-teal">Locali di tua proprietà</div>
        <q-list bordered padding class="rounded-borders">
          <q-item
            v-for="biz in ownerBusinesses"
            :key="biz._id"
            clickable
            @click="goToBusiness(biz._id)"
            class="hoverable"
          >
            <q-item-section avatar>
              <q-icon :name="getIconForType(biz.type)" color="teal" size="36px" />
            </q-item-section>
            <q-item-section>
              <div class="text-subtitle1">{{ biz.name }}</div>
              <div class="text-caption text-grey-6">{{ biz.type }}</div>
              <div class="text-caption q-mt-xs">Email: {{ biz.email }}</div>
            </q-item-section>
            <q-item-section side class="text-right">
              <q-badge
                :label="biz.isOpen ? 'Attivo' : 'Inattivo'"
                :color="biz.isOpen ? 'green' : 'grey-5'"
                align="top"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <q-card class="q-mb-lg shadow-2 q-ma-lg" v-if="ownerBusinesses.length">
      <q-card-section>

        <OrderTool
        :business-id="businessStore.currentBusiness._id"
        :business-name="businessStore.currentBusiness.name"
        :orders="orderStore.orders"
        :loading="orderStore.loading"
        :error-message="orderStore.error"
        @order-created="handleOrderCreated"
        />
      </q-card-section>
    </q-card>

    <!-- Staff per ruolo -->
    <q-card v-if="roles.length" class="q-ma-lg shadow-2">
      <q-card-section>
        <div class="text-h6 q-mb-md text-teal">Dipendenti</div>

        <q-expansion-item
          v-for="role in roles"
          :key="role"
          :label="role"
          expand-icon="keyboard_arrow_down"
          switch-toggle-side
        >
          <template v-if="getUsersByRole(role).length">
            <q-list bordered padding class="rounded-borders">
              <q-item
                v-for="user in getUsersByRole(role)"
                :key="user.id"
                clickable
                class="hoverable"
                :style="{ opacity: user.isActive ? 1 : 0.5 }"
                @click="goToStaffProfile(user.id)"
              >
                <q-item-section avatar>
                  <q-avatar size="80px">
                    <img
                      :src="user.photoUrl || defaultAvatar"
                      style="object-fit: cover; object-position: center; width: 100%; height: 100%;"
                    />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <div class="text-subtitle2">{{ user.firstName }} {{ user.lastName }}</div>
                  <div class="text-caption text-grey-6">{{ user.email }}</div>
                </q-item-section>

                <q-item-section side>
                  <q-icon
                    name="circle"
                    :color="user.isActive ? 'green' : 'grey-5'"
                    size="14px"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </template>
          <template v-else>
            <div class="text-caption text-grey q-pa-sm">
              Non ci sono {{ role }} in azienda
            </div>
          </template>
        </q-expansion-item>
      </q-card-section>
    </q-card>

    <!-- Statistiche rapide -->
    <q-card class="q-ma-lg shadow-2" >
      <q-card-section>
        <div class="text-h6 q-mb-md text-teal">Statistiche Rapide</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="q-pa-md text-center rounded shadow-4">
              <q-icon name="business" size="3rem" color="teal" />
              <div class="text-h6 q-mt-sm">{{ ownerBusinesses.length }}</div>
              <div class="text-caption text-grey-7">Locali Totali</div>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card flat bordered class=" q-pa-md text-center rounded shadow-4">
              <q-icon name="group" size="3rem" color="teal" />
              <div class="text-h6 q-mt-sm">{{ staff.length - 1 }}</div>
              <div class="text-caption text-grey-7">Dipendenti Totali</div>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="q-pa-md text-center rounded shadow-4">
              <q-icon
                :name="company && company.isOpen ? 'check_circle' : 'cancel'"
                size="3rem"
                :color="company && company.isOpen ? 'green' : 'red'"
              />
              <div class="text-h6 q-mt-sm">
                {{ company && company.isOpen ? 'Azienda registrata' : 'Azienda non registrata' }}
              </div>
              <div class="text-caption text-grey-7">Stato azienda</div>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card class="q-pa-md q-ma-lg">
      <div class="text-h6 q-mb-md text-teal">Statistiche Vendite Mensili</div>
      <MyChart />
    </q-card>



  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOrderStore } from 'src/stores/orderStore'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'
import { useCompanyStore } from 'src/stores/companyStore'
import MyChart from 'src/components/MyChart.vue'
import OrderTool from 'src/components/dashboard/common/tools/OrderTool.vue'

const usersStore = useUsersStore()
const businessStore = useBusinessStore()
const companyStore = useCompanyStore()
const orderStore = useOrderStore()

const company = ref(null)
const ownerBusinesses = ref([])
const staff = ref([])
const roles = ref([])

const user = computed(() => usersStore.currentUser)
const defaultAvatar = 'https://cdn.quasar.dev/img/avatar.png'

function handleOrderCreated(newOrder) {
  orderStore.orders.push(newOrder)
}

async function loadData() {
  await Promise.all([
    companyStore.fetchCompany(),
    businessStore.fetchBusinesses(),
    usersStore.fetchUsers()
  ])

  company.value = companyStore.company
  ownerBusinesses.value = businessStore.businesses
  staff.value = usersStore.users

  roles.value = [...new Set(staff.value.map(u => u.role))]
    .filter(role => role.toLowerCase() !== 'owner')
    .sort()
}

function getUsersByRole(role) {
  return staff.value
    .filter(u => u.role === role)
    .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1))
}

function getIconForType(type) {
  switch (type?.toLowerCase()) {
    case 'ristorante': return 'restaurant'
    case 'bar': return 'local_cafe'
    case 'negozio': return 'storefront'
    default: return 'business'
  }
}

function goToBusiness(id) {
  alert(`Vai al dettaglio business ${id}`)
}

function goToStaffProfile(id) {
  alert(`Vai al profilo staff ${id}`)
}

// Correzione principale: aggiungere async prima della funzione
onMounted(async () => {
  if (user.value) await loadData()

  const currentUser = usersStore.currentUser // Cambiato il nome da user a currentUser per evitare conflitti
  businessStore.currentBusiness = currentUser.business

  if (!currentUser?.business?._id) {
    console.error('Business ID non trovato per l\'utente')
    return
  }

  orderStore.currentBusinessId = currentUser.business._id
  await orderStore.fetchOrders()
})
</script>

<style scoped>
.hoverable:hover {
  background-color: #f0f0f0;
  cursor: pointer;
}
.rounded-borders {
  border-radius: 8px;
}
</style>
