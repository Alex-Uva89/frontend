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

    <!-- Info Azienda -->
    <q-card class="q-mb-lg shadow-3" v-if="company" style="max-width: 900px; margin: auto;">
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
          <div class="text-h5 text-primary">{{ company.name }}</div>
          <div class="text-subtitle2 text-secondary q-mb-sm">{{ company.brandName }}</div>
          <div class="text-body2 q-mb-md" style="white-space: pre-line;">{{ company.description }}</div>
          <q-btn color="primary" label="Modifica Azienda" icon="edit" rounded dense />
        </div>
      </q-card-section>
    </q-card>

    <!-- Locali dell'owner -->
    <q-card class="q-mb-lg shadow-2" v-if="ownerBusinesses.length" style="max-width: 900px; margin: auto;">
      <q-card-section>
        <div class="text-h6 q-mb-md text-primary">Locali di tua proprietà</div>
        <q-list bordered padding class="rounded-borders">
          <q-item
            v-for="biz in ownerBusinesses"
            :key="biz._id"
            clickable
            @click="goToBusiness(biz._id)"
            class="hoverable"
          >
            <q-item-section avatar>
              <q-icon :name="getIconForType(biz.type)" color="primary" size="36px" />
            </q-item-section>
            <q-item-section>
              <div class="text-subtitle1">{{ biz.name }}</div>
              <div class="text-caption text-grey-6">{{ biz.type }}</div>
              <div class="text-caption q-mt-xs">Email: {{ biz.email }}</div>
            </q-item-section>
            <q-item-section side class="text-right">
              <q-badge
                :label="biz.active ? 'Attivo' : 'Inattivo'"
                :color="biz.active ? 'green' : 'grey-5'"
                align="top"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Staff per ruolo -->
    <q-card v-if="roles.length" class="q-mb-lg shadow-2" style="max-width: 900px; margin: auto;">
      <q-card-section>
        <div class="text-h6 q-mb-md text-primary">Dipendenti</div>

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
    <q-card class="q-mb-lg shadow-2" style="max-width: 900px; margin: auto;">
      <q-card-section>
        <div class="text-h6 q-mb-md text-primary">Statistiche Rapide</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="bg-blue-grey-1 q-pa-md text-center rounded">
              <q-icon name="business" size="3rem" color="primary" />
              <div class="text-h6 q-mt-sm">{{ ownerBusinesses.length }}</div>
              <div class="text-caption text-grey-7">Locali Totali</div>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="bg-blue-grey-1 q-pa-md text-center rounded">
              <q-icon name="group" size="3rem" color="primary" />
              <div class="text-h6 q-mt-sm">{{ staff.length - 1 }}</div>
              <div class="text-caption text-grey-7">Dipendenti Totali</div>
            </q-card>
          </div>
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="bg-blue-grey-1 q-pa-md text-center rounded">
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

    <q-card class="q-pa-md q-mb-lg" style="max-width: 900px; margin: auto;">
      <div class="text-h6 q-mb-md text-primary">Statistiche Vendite Mensili</div>
      <MyChart />
    </q-card>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'
import { useCompanyStore } from 'src/stores/companyStore'
import MyChart from 'src/components/MyChart.vue'

const usersStore = useUsersStore()
const businessStore = useBusinessStore()
const companyStore = useCompanyStore()

const company = ref(null)
const ownerBusinesses = ref([])
const staff = ref([])

const roles = ref([]) // ruoli dinamici da Sanity

const user = computed(() => usersStore.currentUser)

const defaultAvatar = 'https://cdn.quasar.dev/img/avatar.png'

async function loadData() {
  await Promise.all([
    companyStore.fetchCompany(),
    businessStore.fetchBusinesses(),
    usersStore.fetchUsers()
  ])

  company.value = companyStore.company
  ownerBusinesses.value = businessStore.businesses
  staff.value = usersStore.users

  // Prendo i ruoli unici dall'elenco staff, escludendo "Owner"
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

onMounted(() => {
  if (user.value) loadData()
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
