<template>
  <q-card class="q-ma-lg shadow-2">
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
</template>

<script setup>
import { useUsersStore } from 'src/stores/usersStore'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const usersStore = useUsersStore()
const defaultAvatar = 'https://cdn.quasar.dev/img/avatar.png'

const staff = ref([])
const roles = computed(() => {
  return [...new Set(staff.value.map(u => u.role))]
    .filter(role => role.toLowerCase() !== 'owner')
    .sort()
})

function getUsersByRole(role) {
  return staff.value.filter(u => u.role === role)
}

function goToStaffProfile(userId) {
  router.push({ name: 'StaffProfile', params: { id: userId } })
}

onMounted(async () => {
  await usersStore.fetchUsers()
  staff.value = usersStore.users
})
</script>
