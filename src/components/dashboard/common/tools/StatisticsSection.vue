<template>
  <div>
    <q-card class="q-ma-lg shadow-2">
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
  </div>
</template>

<script setup>
import { useBusinessStore } from 'src/stores/businessStore'
import { useUsersStore } from 'src/stores/usersStore'
import { useCompanyStore } from 'src/stores/companyStore'
import MyChart from 'src/components/MyChart.vue'
import { ref, onMounted } from 'vue'

const businessStore = useBusinessStore()
const usersStore = useUsersStore()
const companyStore = useCompanyStore()

const ownerBusinesses = ref([])
const staff = ref([])
const company = ref(null)

onMounted(async () => {
  await Promise.all([
    businessStore.fetchBusinesses(),
    usersStore.fetchUsers(),
    companyStore.fetchCompany()
  ])

  ownerBusinesses.value = businessStore.businesses
  staff.value = usersStore.users
  company.value = companyStore.company
})
</script>
