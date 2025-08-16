<template>
  <q-card class="shadow-2 q-my-lg" v-if="businesses.length">
    <q-card-section>
      <div class="text-h6 q-mb-md text-teal">Locali di tua proprietà</div>
      <q-list bordered padding class="rounded-borders">
        <q-item
          v-for="biz in businesses"
          :key="biz._id"
          clickable
          @click="goToBusiness(biz._id)"
          class="hoverable"
        >
          <q-item-section avatar>
            <q-icon :name="getIconForType(biz.type)" color="teal" size="36px" />
          </q-item-section>
          <q-item-section>
            <div class="text-subtitle1">{{ biz.name }}</div>
            <div class="text-caption text-grey-6">{{ biz.type }}</div>
            <div class="text-caption q-mt-xs">Email: {{ biz.email }}</div>
          </q-item-section>
          <q-item-section side class="text-right">
            <q-badge
              :label="biz.isOpen ? 'Attivo' : 'Inattivo'"
              :color="biz.isOpen ? 'green' : 'grey-5'"
              align="top"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { useBusinessStore } from 'src/stores/businessStore'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const businessStore = useBusinessStore()
const businesses = ref([])

function getIconForType(type) {
  switch (type?.toLowerCase()) {
    case 'restaurant': return 'restaurant'
    case 'bar': return 'local_bar'
    case 'cafe': return 'coffee'
    default: return 'store'
  }
}

function goToBusiness(businessId) {
  router.push({ name: 'BusinessDetail', params: { id: businessId } })
}

onMounted(async () => {
  await businessStore.fetchBusinesses()
  businesses.value = businessStore.businesses
})
</script>
