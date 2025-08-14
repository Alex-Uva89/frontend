<template>
  <q-page class="q-pt-md">
    <!-- 2. Staff sotto supervisione -->
    <q-card
      class="q-mb-lg q-mx-lg shadow-2"
      v-if="filteredStaff.length"
    >
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-teal">Staff sotto la tua supervisione</div>
        </div>

        <q-list bordered padding class="rounded-borders">
          <q-item
            v-for="member in filteredStaff"
            :key="member.id"
            clickable
            :style="{ opacity: member.isActive ? 1 : 0.5 }"
          >
            <q-item-section avatar>
              <q-avatar size="80px">
                <img :src="member.photoUrl || defaultAvatar" style="object-fit: cover;" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <div class="text-subtitle2">{{ member.firstName }} {{ member.lastName }}</div>
              <div class="text-caption text-grey-6">{{ member.email }}</div>
              <div class="text-caption text-grey-6">Ruolo: {{ member.role }}</div>
            </q-item-section>
            <q-item-section side>
              <q-icon :name="'circle'" :color="member.isActive ? 'green' : 'grey-5'" size="14px" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <div
      class="q-ma-lg"
      v-if="filteredStaff.length"
    >
      <OrderActions
        @add="aggiungiOrdine"
        @edit="modificaOrdine"
        @delete="eliminaOrdine"
      />
    </div>

    <q-card class="q-pa-md q-ma-lg">
      <div class="text-h6 q-mb-md text-teal">Storico Ordini</div>
      <q-table
        :rows="staffActivity"
        :columns="columnsActivity"
        row-key="id"
        flat
        bordered
        hide-bottom
      />
    </q-card>

    <!-- 3. Statistiche Ordini -->
    <q-card class="q-pa-md q-ma-lg">
      <div class="text-h6 q-mb-md text-teal">Statistiche Ordini</div>
      <!-- <MyChartOrders /> -->
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from 'src/stores/usersStore'
import OrderActions from 'src/components/OrderActions.vue'

const usersStore = useUsersStore()
const staff = ref([])
const user = computed(() => usersStore.currentUser)
const defaultAvatar = 'https://cdn.quasar.dev/img/avatar.png'

function getUsersUnderSupervision(supervisorId) {
  return staff.value
    .filter(u => (u.role === 'Manager' || u.role === 'Staff') && u.supervisorId === supervisorId)
    .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1))
}

const filteredStaff = computed(() =>
  user.value ? getUsersUnderSupervision(user.value.id) : []
)

const staffActivity = ref([
  { id: 1, name: 'Mario Rossi', ordersHandled: 25, lastLogin: '2025-08-11 09:23' },
  { id: 2, name: 'Anna Bianchi', ordersHandled: 18, lastLogin: '2025-08-10 17:45' }
])

const columnsActivity = [
  { name: 'name', label: 'Nome', field: 'name', align: 'left' },
  { name: 'ordersHandled', label: 'Ordini Gestiti', field: 'ordersHandled', align: 'center' },
  { name: 'lastLogin', label: 'Ultimo Login', field: 'lastLogin', align: 'center' }
]

// const errorLogs = ref([
//   { message: 'Errore connessione API ordini', time: '2025-08-11 09:12' },
//   { message: 'Timeout caricamento statistiche', time: '2025-08-10 15:40' }
// ])

function aggiungiOrdine() {
  console.log('Funzione aggiungiOrdine non ancora implementata')
}

function modificaOrdine() {
  console.log('Funzione modificaOrdine non ancora implementata')
}

function eliminaOrdine() {
  console.log('Funzione eliminaOrdine non ancora implementata')
}

async function loadStaff() {
  await usersStore.fetchUsers()
  staff.value = usersStore.users
}

onMounted(() => {
  if (user.value) loadStaff()
})
</script>
