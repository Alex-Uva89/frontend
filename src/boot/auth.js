// src/boot/auth.js
import { boot } from 'quasar/wrappers'
import { useUsersStore } from 'src/stores/usersStore'
import { authFetch, authFetchJson } from 'src/utils/api'

export default boot(({ app }) => {
  // inizializza lo store utenti (come già facevi)
  void useUsersStore()

  // espone helpers globali (this.$authFetch / in <script setup> -> $authFetch)
  app.config.globalProperties.$authFetch = authFetch
  app.config.globalProperties.$authFetchJson = authFetchJson

  // opzionale: provide/inject (per composables o script setup con inject)
  app.provide('authFetch', authFetch)
  app.provide('authFetchJson', authFetchJson)
})
