<template>
  <q-card class="shadow-3 q-my-lg">
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
</template>

<script setup>
import { useCompanyStore } from 'src/stores/companyStore'
import { ref, onMounted } from 'vue'

const companyStore = useCompanyStore()
const company = ref({})

onMounted(async () => {
  await companyStore.fetchCompany()
  company.value = companyStore.company
})
</script>
