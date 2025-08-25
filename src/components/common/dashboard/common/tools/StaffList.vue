<template>
  <div>
    <q-card class="shadow-2">
      <!-- Header -->
      <q-card-section class="bg-teal-1">
        <div class="row items-center justify-between">
          <div>
            <div class="text-h6 text-teal-8">Dipendenti</div>
            <div class="text-caption text-grey-7">
              Totale: {{ totalCount }} • Attivi: {{ activeCount }} • Inattivi: {{ inactiveCount }}
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-btn
              color="teal"
              icon="person_add"
              label="Aggiungi Membro"
              rounded dense size="sm"
              @click="showNewUser = true"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Filtri -->
      <q-card-section class="q-gutter-sm">
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-4">
            <q-input
              v-model="search"
              dense outlined clearable debounce="200"
              placeholder="Cerca per nome o email…"
              prepend-inner-icon="search"
            />
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="selectedRoles"
              :options="roleOptions"
              dense outlined multiple use-chips clearable
              label="Ruoli"
            />
          </div>

          <div class="col-12 col-md-3">
            <q-select
              v-model="selectedBusinessId"
              :options="businessOptions"
              dense outlined clearable emit-value map-options
              label="Locale"
            />
          </div>

          <div class="col-12 col-md-2 flex items-center">
            <q-toggle v-model="onlyActive" label="Solo attivi" />
            <q-btn flat dense class="q-ml-sm" icon="filter_alt_off" @click="resetFilters">
              <q-tooltip>Reset filtri</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Lista per ruolo -->
      <q-card-section class="q-pa-none">
        <q-list bordered>
          <q-expansion-item
            v-for="role in groupedRoles"
            :key="role"
            :label="role"
            :caption="`${getUsersByRole(role).length} membri`"
            header-class="bg-grey-2"
            class="q-mb-xs"
            group="staff"
            dense
          >
            <q-card>
              <q-card-section class="q-pa-none">
                <q-list dense separator>
                  <q-item
                    v-for="user in getUsersByRole(role)"
                    :key="userKey(user)"
                    class="q-py-sm"
                  >
                    <!-- Avatar -->
                    <q-item-section avatar>
                      <q-avatar size="72px" class="flex flex-center">
                        <img
                          :src="photoUrl(user)"
                          alt="avatar"
                          style="object-fit: cover; width: 100%; height: 100%;"
                        />
                      </q-avatar>
                    </q-item-section>

                    <!-- Dati -->
                    <q-item-section>
                      <div class="row items-center q-col-gutter-sm">
                        <div class="col-12 col-md-auto">
                          <div class="text-weight-medium">
                            {{ user.firstName }} {{ user.lastName }}
                          </div>
                          <div class="text-caption">
                            <a :href="`mailto:${user.email}`" class="text-primary">{{ user.email }}</a>
                          </div>
                        </div>

                        <div class="col-12 col-md-auto">
                          <q-chip size="sm" outline icon="work">{{ user.role }}</q-chip>
                        </div>

                        <div class="col-12 col-md-auto">
                          <q-chip size="sm" outline icon="store">{{ businessName(user) }}</q-chip>
                        </div>

                        <div class="col-12 col-md-auto">
                          <q-chip
                            size="sm"
                            :color="user.isActive ? 'green' : 'grey-5'"
                            text-color="white"
                            :icon="user.isActive ? 'check_circle' : 'pause_circle'"
                          >
                            {{ user.isActive ? 'Attivo' : 'Inattivo' }}
                          </q-chip>
                        </div>
                      </div>
                    </q-item-section>

                    <!-- Azioni -->
                    <q-item-section side class="text-right">
                      <div class="row items-center q-gutter-xs justify-end">
                        <q-toggle
                          :model-value="!!user.isActive"
                          @update:model-value="toggleActive(user, $event)"
                          color="teal"
                          :label="user.isActive ? 'Attivo' : 'Inattivo'"
                        />

                        <q-select
                          v-model="localRole[userKey(user)]"
                          :options="roleOptions"
                          dense outlined
                          style="min-width: 140px"
                          @update:model-value="onChangeRole(user, $event)"
                        >
                          <template #append>
                            <q-icon name="admin_panel_settings" />
                          </template>
                        </q-select>

                        <q-btn flat round dense icon="email" @click="$emit('email-user', user)">
                          <q-tooltip>Contatta</q-tooltip>
                        </q-btn>

                        <q-btn flat round dense icon="visibility" @click="$emit('view-user', user)">
                          <q-tooltip>Dettagli</q-tooltip>
                        </q-btn>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <div v-if="groupedRoles.length === 0" class="q-pa-lg text-grey-7">
            Nessun dipendente corrisponde ai filtri.
          </div>
        </q-list>
      </q-card-section>
    </q-card>


    <NewUserDialog
      v-model="showNewUser"
      @saved="onUserCreated"
    />
  </div>
</template>

<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'
import NewUserDialog from '../../users/NewUserDialog.vue'

const showNewUser = ref(false)

/* Emits verso il parent */
const emit = defineEmits(['add-user', 'email-user', 'view-user', 'update-user'])

/* Store */
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

/* Dati base */
const staff = computed(() => usersStore.users || [])

/* Filtri */
const search = ref('')
const selectedRoles = ref([])           // array di stringhe
const onlyActive = ref(false)
const selectedBusinessId = ref(null)    // string|nil

/* Opzioni ruoli (coerenti con lo schema) */
const roleOptions = ['Dev', 'Owner', 'Hr', 'Supervisor', 'Manager', 'Staff']

/* Opzioni business (id,label) */
const businessOptions = computed(() =>
  (businessStore.businesses || []).map(b => ({ label: b.name, value: b._id }))
)

/* Helpers render */
function userKey (u) {
  return u?._id || u?.id || u?.email
}

function photoUrl (user) {
  return (
    user?.photoUrl ||
    user?.photo?.url ||
    user?.photo?.asset?.url ||
    'https://cdn.quasar.dev/img/avatar.png'
  )
}

function businessName (user) {
  const id = user?.business?._id || user?.business?._ref || null
  if (!id) return '—'
  const byGetter = typeof businessStore.getNameById === 'function' ? businessStore.getNameById(id) : null
  if (byGetter) return byGetter
  const found = (businessStore.businesses || []).find(b => b._id === id)
  return found?.name || '—'
}

/* Filtraggio */
const filteredStaff = computed(() => {
  const q = search.value.trim().toLowerCase()
  const roleSet = new Set((selectedRoles.value || []).map(String))
  const bizId = selectedBusinessId.value

  return (staff.value || []).filter(u => {
    if (onlyActive.value && !u?.isActive) return false
    if (roleSet.size > 0 && !roleSet.has(String(u?.role))) return false
    const ub = u?.business?._id || u?.business?._ref || null
    if (bizId && ub !== bizId) return false
    if (q) {
      const hay = `${u?.firstName || ''} ${u?.lastName || ''} ${u?.email || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

/* Raggruppamento per ruolo (mantenendo l'ordine dei roleOptions) */
const groupedRoles = computed(() => {
  const found = new Set(filteredStaff.value.map(u => u?.role).filter(Boolean))
  return roleOptions.filter(r => found.has(r))
})

function getUsersByRole (role) {
  return filteredStaff.value.filter(u => u?.role === role)
}

/* Conteggi */
const totalCount = computed(() => staff.value.length)
const activeCount = computed(() => staff.value.filter(u => u?.isActive).length)
const inactiveCount = computed(() => Math.max(0, totalCount.value - activeCount.value))

/* Reset filtri */
function resetFilters () {
  search.value = ''
  selectedRoles.value = []
  onlyActive.value = false
  selectedBusinessId.value = null
}

function onUserCreated () {
  // dopo il salvataggio ricarico la lista
  if (typeof usersStore.fetchUsers === 'function') {
    usersStore.fetchUsers()
  }
}

/* Ruolo locale per il select di ogni utente */
const localRole = ref({})

watch(
  () => filteredStaff.value,
  (list) => {
    const next = {}
    ;(list || []).forEach(u => { next[userKey(u)] = u?.role })
    localRole.value = next
  },
  { immediate: true }
)

/* Azioni: se lo store espone metodi li usiamo, altrimenti emettiamo verso il parent */
async function toggleActive (user, newVal) {
  try {
    const id = user?._id || user?.id
    if (!id) return
    if (typeof usersStore.updateUser === 'function') {
      await usersStore.updateUser(id, { isActive: !!newVal })
      await usersStore.fetchUsers()
    } else if (typeof usersStore.setActive === 'function') {
      await usersStore.setActive(id, !!newVal)
      await usersStore.fetchUsers()
    } else {
      emit('update-user', { user, patch: { isActive: !!newVal } })
    }
  } catch (e) {
    console.error(e)
  }
}

async function onChangeRole (user, newRole) {
  try {
    const key = userKey(user)
    localRole.value[key] = newRole
    const id = user?._id || user?.id
    if (!id) return
    if (typeof usersStore.updateUser === 'function') {
      await usersStore.updateUser(id, { role: newRole })
      await usersStore.fetchUsers()
    } else if (typeof usersStore.updateRole === 'function') {
      await usersStore.updateRole(id, newRole)
      await usersStore.fetchUsers()
    } else {
      emit('update-user', { user, patch: { role: newRole } })
    }
  } catch (e) {
    console.error(e)
  }
}

/* Bootstrap */
onMounted(async () => {
  try {
    if (!businessStore.businesses?.length && typeof businessStore.fetchBusinesses === 'function') {
      await businessStore.fetchBusinesses()
    }
  } catch (e) {
    console.error(e)
  }
  try {
    if (typeof usersStore.fetchUsers === 'function') {
      await usersStore.fetchUsers()
    }
  } catch (e) {
    console.error(e)
  }
})
</script>
