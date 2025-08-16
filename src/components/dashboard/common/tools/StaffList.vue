<template>
  <div>
    <q-card class="shadow-2">
      <q-card-section class="bg-teal-1">
        <div class="text-h6 text-teal-8">
          Il Tuo Team
        </div>
        <div class="text-caption text-grey-7">
          {{ staff.length }} membri del team
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none">
        <q-list bordered>
          <q-expansion-item
            v-for="role in roles"
            :key="role"
            :label="role"
            group="staff"
            class="q-mb-xs"
            header-class="bg-grey-2"
          >
            <q-card>
              <q-card-section class="q-pa-none">
                <q-list dense separator>
                  <q-item
                    v-for="user in getUsersByRole(role)"
                    :key="user.id"
                    class="q-py-xs"
                  >
                    <q-item-section avatar>
                      <q-avatar size="100px" class="flex flex-center">
                        <img
                          :src="user.photoUrl || 'https://cdn.quasar.dev/img/avatar.png'"
                          style="object-fit: cover; width: 100%; height: 100%;"
                        >
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <div class="text-weight-medium">
                        {{ user.firstName }} {{ user.lastName }}
                      </div>
                      <div class="text-caption text-grey-7">
                        {{ user.email }}
                      </div>
                    </q-item-section>

                    <q-item-section side>
                      <q-icon
                        name="circle"
                        :color="user.isActive ? 'green' : 'grey-5'"
                        size="12px"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="teal"
          icon="person_add"
          label="Aggiungi Membro"
          rounded
          dense
          size="sm"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUsersStore } from 'src/stores/usersStore'
import { computed } from 'vue'

const usersStore = useUsersStore()
const staff = computed(() => usersStore.users)

onMounted(async () => {
  await usersStore.fetchUsers()
})

const roles = computed(() => {
  const allRoles = [...new Set(staff.value.map(u => u.role))]
  return allRoles.filter(role => role.toLowerCase() !== 'owner').sort()
})

function getUsersByRole(role) {
  return staff.value.filter(u => u.role === role)
}
</script>
