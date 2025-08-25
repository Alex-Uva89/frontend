<template>
  <q-card class="shadow-2">
    <q-card-section class="row items-center q-gutter-sm">
      <q-avatar
        size="80px"
        class="lt-md"
        rounded
      >
        <img v-if="company.logo" :src="company.logo.asset.url">
        <q-icon v-else name="business" size="xl" />
      </q-avatar>

      <q-avatar
        size="120px"
        class="gt-sm"
        rounded
      >
        <img v-if="company.logo" :src="company.logo.asset.url">
        <q-icon v-else name="business" size="xl" />
      </q-avatar>

      <div class="col">
        <div class="text-h6 text-weight-bold text-teal-8">
          {{ company.name }}
        </div>
        <div class="text-caption text-grey-8 q-mt-xs">
          {{ company.brandName }}
        </div>

        <q-btn
          color="teal"
          icon="edit"
          label="Modifica"
          rounded
          dense
          class="q-mt-sm"
          size="sm"
        />
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pt-none">
      <div class="text-caption text-grey-8">
        Informazioni Azienda
      </div>
      <div class="text-body2 q-mt-sm" style="white-space: pre-line;">
        {{ company.description || 'Nessuna descrizione inserita' }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { useCompanyStore } from 'src/stores/companyStore'
import { storeToRefs } from 'pinia'

const companyStore = useCompanyStore()
const { company } = storeToRefs(companyStore)
</script>

<style scoped>
.q-card {
  border-radius: 12px;
}
</style>
