<template>
  <q-page class="q-pt-xl">
    <q-card class="q-mb-lg q-pb-lg" v-if="user" style="max-width: 900px; margin: auto;">
          <q-card-section class="row items-center">
            <q-avatar size="120px" class="q-mr-md overflow-hidden">
              <img
                :src="user.photoUrl || defaultAvatar"
                alt="Avatar"
                style="object-fit: cover; object-position: center; width: 100%; height: 100%;"
              />
            </q-avatar>
            <div>
              <div class="text-h6">{{ user.firstName }} {{ user.lastName }}</div>
              <div class="text-subtitle2 text-grey">Ruolo: {{ user.role }}</div>
              <div class="text-caption">Email: {{ user.email }}</div>
            </div>
            <q-space />
            <q-btn label="Modifica profilo" flat color="primary" />
          </q-card-section>
    </q-card>

    <q-card class="q-mb-lg shadow-2" style="max-width: 900px; margin: auto;" v-if="filteredStaff.length">
      <q-card-section>
        <div class="text-h6 q-mb-md text-primary">Staff e Manager sotto la tua supervisione</div>
        <q-list bordered padding class="rounded-borders">
          <q-item
            v-for="user in filteredStaff"
            :key="user.id"
            clickable
            class="hoverable"
            :style="{ opacity: user['isActive'] ? 1 : 0.5 }"
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
              <div class="text-caption text-grey-6">Ruolo: {{ user.role }}</div>
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
      </q-card-section>
    </q-card>

    <q-card class="q-pa-md q-mb-lg" style="max-width: 900px; margin: auto;">
      <div class="text-h6 q-mb-md text-primary">Statistiche Ordini</div>
      <!-- <MyChartOrders /> -->
       Lista ordini
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from 'src/stores/usersStore'
// import MyChartOrders from 'src/components/MyChartOrders.vue'

const usersStore = useUsersStore()

const staff = ref([])
const user = computed(() => usersStore.currentUser)
const defaultAvatar = 'https://cdn.quasar.dev/img/avatar.png'

function getUsersUnderSupervision(supervisorId) {
  return staff.value
    .filter(u => (u.role === 'Manager' || u.role === 'Staff') && u.supervisorId === supervisorId)
    .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1))
}

const filteredStaff = computed(() => {
  if (!user.value) return []
  return getUsersUnderSupervision(user.value.id)
})

async function loadStaff() {
  await usersStore.fetchUsers()
  staff.value = usersStore.users
}

onMounted(() => {
  if (user.value) loadStaff()
})
</script>
