<template>
  <q-card :class="['q-pa-md', 'q-mt-lg', appSettings.layoutSpace]">

    <!-- Stato: user assente (loading) -->
    <div v-if="!safeUser" class="column items-center q-gutter-sm">
      <q-skeleton type="QAvatar" :size="isMobile ? '96px' : '120px'" />
      <q-skeleton type="text" width="60%" />
      <q-skeleton type="text" width="30%" />
      <q-separator class="q-my-md" />
      <div class="row q-col-gutter-md full-width">
        <div class="col-12 col-sm-6"><q-skeleton type="rect" height="40px" /></div>
        <div class="col-12 col-sm-6"><q-skeleton type="rect" height="40px" /></div>
      </div>
      <q-skeleton type="rect" height="40px" class="q-mt-sm" />
    </div>

    <!-- Contenuto reale -->
    <template v-else>
      <!-- Header / Avatar + info (first-mobile) -->
      <q-card-section class="column items-center q-gutter-sm">
        <q-avatar :size="isMobile ? '96px' : '120px'" class="overflow-hidden">
          <img
            :src="safeUser.photoUrl || defaultAvatar"
            alt="Avatar utente"
            @error="onImgError"
            style="object-fit: cover; object-position: center; width: 100%; height: 100%;"
          />
        </q-avatar>

        <div class="column items-center q-gutter-xs">
          <div class="text-h6 text-center">{{ fullName || 'Utente' }}</div>

          <div class="row items-center justify-center q-gutter-sm">
            <q-chip
              v-if="roleLabel"
              :color="roleColor"
              text-color="white"
              :icon="roleIcon"
              square
            >
              {{ roleLabel }}
            </q-chip>

            <q-chip
              :color="safeUser.isActive ? 'positive' : 'negative'"
              text-color="white"
              :icon="safeUser.isActive ? 'check_circle' : 'do_not_disturb_on'"
              square
            >
            {{ console.log(safeUser) }}
              {{ safeUser.isActive ? 'Attivo' : 'Non attivo' }}
            </q-chip>
          </div>
        </div>

        <div class="row items-center justify-end full-width q-mt-sm" v-if="!isMobile">
          <q-btn
            flat
            color="teal"
            icon="edit"
            label="Modifica profilo"
            @click="openDialog"
          />
        </div>
      </q-card-section>

      <q-separator inset />

      <!-- Dettagli -->
      <q-list dense separator>
        <q-item>
          <q-item-section avatar><q-icon name="business" /></q-item-section>
          <q-item-section>
            <q-item-label>Struttura</q-item-label>
            <q-item-label caption class="text-grey-8">
              {{ safeUser.business?.name || '—' }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable :href="mailtoHref" target="_blank" rel="noopener" :disable="!safeUser.email">
          <q-item-section avatar><q-icon name="mail" /></q-item-section>
          <q-item-section>
            <q-item-label>Email</q-item-label>
            <q-item-label caption class="text-grey-8">
              {{ safeUser.email || '—' }}
            </q-item-label>
          </q-item-section>
          <q-item-section side v-if="safeUser.email">
            <q-icon name="open_in_new" class="text-grey-7" />
          </q-item-section>
        </q-item>

        <q-item>
          <q-item-section avatar><q-icon name="badge" /></q-item-section>
          <q-item-section>
            <q-item-label>Ruolo</q-item-label>
            <q-item-label caption class="text-grey-8">
              {{ roleLabel || '—' }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Azioni (mobile) -->
      <q-card-actions align="stretch" class="q-pt-none" v-if="isMobile">
        <q-btn
          color="teal"
          icon="edit"
          label="Modifica profilo"
          class="full-width"
          unelevated
          @click="openDialog"
        />
      </q-card-actions>

      <!-- Dialog integrata: montala SOLO quando user è pronto -->
      <EditUserProfile
        v-if="safeUser"
        v-model="isOpen"
        :user="safeUser"
        :businesses="businesses"
        @save="forwardSave"
      />
    </template>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useAppSettingStore } from 'src/stores/appSettingStore'
import EditUserProfile from './dashboard/users/EditUserProfile.vue' // aggiorna se il path è diverso

const appSettings = useAppSettingStore()
const $q = useQuasar()

/* Props: consenti null finché il fetch non è finito */
const props = defineProps({
  user: { type: Object, default: null },
  businesses: { type: Array, default: () => [] }
})
const emit = defineEmits(['edit', 'save'])

/* Guardie */
const safeUser = computed(() => props.user || null)

/* Dialog */
const isOpen = ref(false)
function openDialog () {
  if (!safeUser.value) return
  isOpen.value = true
  emit('edit')
}
function forwardSave (payload) {
  emit('save', payload)
}

/* Responsive */
const isMobile = computed(() => $q.screen.lt.sm)

/* Derivati */
const fullName = computed(() =>
  [safeUser.value?.firstName, safeUser.value?.lastName].filter(Boolean).join(' ')
)
const roleLabel = computed(() => safeUser.value?.role || '')
const roleMeta = computed(() => {
  const r = (roleLabel.value || '').toLowerCase()
  switch (r) {
    case 'dev':        return { color: 'deep-orange-8', icon: 'code' }
    case 'owner':      return { color: 'purple-7',      icon: 'workspace_premium' }
    case 'hr':         return { color: 'pink-6',        icon: 'diversity_3' }
    case 'supervisor': return { color: 'cyan-7',        icon: 'supervisor_account' }
    case 'manager':    return { color: 'indigo-7',      icon: 'badge' }
    case 'staff':
    case 'operator':
    case 'operatore':  return { color: 'teal-6',        icon: 'engineering' }
    default:           return { color: 'grey-7',        icon: 'person' }
  }
})
const roleColor = computed(() => roleMeta.value.color)
const roleIcon  = computed(() => roleMeta.value.icon)

const mailtoHref = computed(() => safeUser.value?.email ? `mailto:${safeUser.value.email}` : null)

/* Avatar fallback */
const defaultAvatar = '/icons/favicon-128x128.png'
function onImgError(e) {
  const fallbackUrl = window.location.origin + defaultAvatar
  if (e?.target && e.target.src !== fallbackUrl) {
    e.target.src = defaultAvatar
  }
}
</script>
