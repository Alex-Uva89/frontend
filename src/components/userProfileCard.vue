<template>
  <q-card class="q-my-lg q-py-lg" style="max-width: 900px; margin: auto; margin-bottom: 10px; margin-top: 40px;">
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
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  user: {
    type: Object,
    required: true
  },
})
</script>
