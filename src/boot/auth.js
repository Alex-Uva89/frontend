// src/boot/auth.js
import { boot } from 'quasar/wrappers'
import { useUsersStore } from 'src/stores/usersStore'

export default boot(() => {

  void useUsersStore()
})
