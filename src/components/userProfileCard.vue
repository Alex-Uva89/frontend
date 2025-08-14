<template>
  <q-card :class="appSettings.layoutSpace" style="margin-bottom: 10px; margin-top: 40px;">
    <q-card-section class="row items-center">
      <q-avatar size="120px" class="q-mr-md overflow-hidden">
        <img
          :src="user.photoUrl || defaultAvatar"
          alt="Avatar"
          style="object-fit: cover; object-position: center; width: 100%; height: 100%;"
        />
      </q-avatar>
      <div>
        <div class="text-h5">{{ user.firstName }} {{ user.lastName }}</div>
        <div><strong class="text-grey">Dipendente presso: </strong>{{ user.business.name }}</div>
        <div><strong class="text-grey">Ruolo: </strong>{{ user.role }}</div>
        <div><strong class="text-grey">Email: </strong>{{ user.email }}</div>
      </div>
      <q-space />
      <q-btn label="Modifica profilo" flat color="teal" />
    </q-card-section>
  </q-card>
</template>

<script setup>
import { defineProps } from 'vue'

import { useAppSettingStore } from 'src/stores/appSettingStore'

const appSettings = useAppSettingStore()

defineProps({
  user: {
    type: Object,
    required: true
  },
})
</script>
