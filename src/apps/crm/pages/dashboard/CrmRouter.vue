<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from 'src/stores/usersStore'

const router = useRouter()
const usersStore = useUsersStore()

onMounted(() => {
  const role = String(usersStore.currentUser?.role || '').toLowerCase()
  const map = {
    staff: '/dashboard/staff',
    manager: '/dashboard/manager',
    owner: '/dashboard/owner',
    dev: '/dashboard/dev',
    hr: '/dashboard/hr',
    supervisor: '/dashboard/supervisor'
  }
  router.replace(map[role] || '/dashboard/main')
})
</script>
