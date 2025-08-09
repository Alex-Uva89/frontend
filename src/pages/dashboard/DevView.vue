<template>
  <q-layout view="lHh Lpr lFf" container style="height: 100vh">

    <!-- Main content -->
    <q-page-container>
      <q-page padding>

        <!-- Profilo -->
        <q-card class="q-mb-md" v-if="user">
          <q-card-section class="row items-center">
            <q-avatar size="120px" class="q-mr-md overflow-hidden">
              <img
                :src="user.photoUrl"
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

        <!-- Statistiche -->
        <div class="row ">
          <q-card class="col" bordered>
            <q-card-section>
              <div class="text-h6">Visitatori oggi</div>
              <div class="text-subtitle1 text-green">+134</div>
            </q-card-section>
          </q-card>
          <q-card class="col" bordered>
            <q-card-section>
              <div class="text-h6">Errori 500</div>
              <div class="text-subtitle1 text-red">2</div>
            </q-card-section>
          </q-card>
          <q-card class="col" bordered>
            <q-card-section>
              <div class="text-h6">Media sessioni</div>
              <div class="text-subtitle1">3min 22s</div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Tools -->
        <q-card class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Strumenti rapidi</div>
            <div class="row q-gutter-sm">
              <q-btn icon="analytics" label="Analizza traffico" flat color="info" />
              <q-btn icon="sync" label="Flush Cache" flat color="warning" />
              <q-btn icon="article" label="Genera Sitemap" flat color="secondary" />
              <q-btn icon="download" label="Esporta dati" flat color="primary" />
            </div>
          </q-card-section>
        </q-card>

      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import {  computed } from 'vue'
import { useUsersStore } from 'src/stores/usersStore'


const usersStore = useUsersStore()
const user = computed(() => usersStore.currentUser)

</script>
