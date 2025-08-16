<template>
  <div>
    <q-card class="shadow-2 q-mb-md">
      <q-card-section class="bg-teal-1">
        <div class="text-h6 text-teal-8">
          I Tuoi Locali
        </div>
        <div class="text-caption text-grey-7">
          {{ businesses.length }} locali registrati
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none">
        <q-list bordered separator>
          <q-item
            v-for="biz in businesses"
            :key="biz._id"
            clickable
            v-ripple
            class="q-py-sm"
          >
            <q-item-section avatar>
              <q-icon
                :name="getIconForType(biz.type)"
                color="teal"
                size="md"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ biz.name }}
              </q-item-label>
              <q-item-label caption>
                {{ biz.type }} • {{ biz.address?.city || 'Nessuna città' }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-badge
                :color="biz.isOpen ? 'green' : 'grey-5'"
                :label="biz.isOpen ? 'APERTO' : 'CHIUSO'"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="teal"
          icon="add"
          label="Aggiungi Locale"
          rounded
          dense
          size="sm"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useBusinessStore } from 'src/stores/businessStore'
import { storeToRefs } from 'pinia'

const businessStore = useBusinessStore()
const { businesses } = storeToRefs(businessStore)

onMounted(async () => {
  await businessStore.fetchBusinesses()
})

function getIconForType(type) {
  const types = {
    restaurant: 'restaurant',
    bar: 'local_bar',
    cafe: 'coffee',
    shop: 'store',
    hotel: 'hotel'
  }
  return types[type?.toLowerCase()] || 'store'
}
</script>
