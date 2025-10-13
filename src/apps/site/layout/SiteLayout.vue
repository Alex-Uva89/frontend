<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title>Site</q-toolbar-title>
        <q-space />
        <!-- spazio per lingua/utente -->
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list padding>
        <q-item :to="{ name: 'site.index' }" clickable v-ripple>
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item :to="{ name: 'site.pages' }" clickable v-ripple>
          <q-item-section avatar><q-icon name="article" /></q-item-section>
          <q-item-section>Testi pagine</q-item-section>
        </q-item>

        <q-item :to="{ name: 'site.media' }" clickable v-ripple>
          <q-item-section avatar><q-icon name="image" /></q-item-section>
          <q-item-section>Media</q-item-section>
        </q-item>

        <q-item :to="{ name: 'site.menu' }" clickable v-ripple>
          <q-item-section avatar><q-icon name="storefront" /></q-item-section>
          <q-item-section>Locali</q-item-section>
        </q-item>

        <q-item :to="{ name: 'site.settings' }" clickable v-ripple>
          <q-item-section avatar><q-icon name="settings" /></q-item-section>
          <q-item-section>Impostazioni</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>


    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
const leftDrawerOpen = ref(true)
</script>
