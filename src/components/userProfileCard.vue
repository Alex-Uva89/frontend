<template>
  <q-card :class="['user-card', appSettings.layoutSpace]" style="margin-top: 40px; margin-bottom: 10px;">
    <!-- HEADER -->
    <q-card-section :class="containerClass">
      <!-- Avatar -->
      <q-avatar :size="isMobile ? '96px' : '120px'" class="overflow-hidden" :class="isMobile ? 'q-mb-sm' : 'q-mr-md'">
        <img
          :src="user?.photoUrl || defaultAvatar"
          alt="Avatar utente"
          @error="onImgError"
          style="object-fit: cover; object-position: center; width: 100%; height: 100%;"
        />
      </q-avatar>

      <!-- Titoli -->
      <div :class="isMobile ? 'text-center' : ''" class="col">
        <div class="row items-center" :class="isMobile ? 'justify-center' : 'q-gutter-sm'">
          <div class="text-h6">{{ fullName || 'Utente' }}</div>
          <q-chip
            v-if="roleLabel"
            outline
            :color="roleColor"
            text-color="white"
            :icon="roleIcon"
            :class="isMobile ? 'q-ml-sm' : ''"
          >
            {{ roleLabel }}
          </q-chip>
        </div>
        <div class="text-caption text-grey-7 q-mt-xs" v-if="user?.email && !isMobile">
          <q-icon name="mail" class="q-mr-xs" />
          <a class="text-primary" :href="`mailto:${user.email}`">{{ user.email }}</a>
        </div>
      </div>

      <!-- Azione (desktop) -->
      <q-space v-if="!isMobile" />
      <q-btn
        v-if="!isMobile"
        flat
        color="teal"
        icon="edit"
        label="Modifica profilo"
        @click="$emit('edit')"
      />
    </q-card-section>

    <q-separator inset />

    <!-- DETTAGLI (lista, migliore su mobile) -->
    <q-list dense>
      <q-item>
        <q-item-section avatar>
          <q-icon name="business" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Struttura</q-item-label>
          <q-item-label caption class="text-grey-8">
            {{ user?.business?.name || '—' }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section avatar>
          <q-icon name="badge" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Ruolo</q-item-label>
          <q-item-label caption class="text-grey-8">
            {{ roleLabel || '—' }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable :href="user?.email ? `mailto:${user.email}` : null">
        <q-item-section avatar>
          <q-icon name="mail" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Email</q-item-label>
          <q-item-label caption class="text-grey-8">
            {{ user?.email || '—' }}
          </q-item-label>
        </q-item-section>
        <q-item-section side v-if="user?.email">
          <q-icon name="open_in_new" class="text-grey-7" />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Azione (mobile) -->
    <q-card-actions align="stretch" v-if="isMobile">
      <q-btn
        color="teal"
        icon="edit"
        label="Modifica profilo"
        class="full-width"
        unelevated
        @click="$emit('edit')"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useAppSettingStore } from 'src/stores/appSettingStore'

const appSettings = useAppSettingStore()
const $q = useQuasar()

/* Props */
const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})
defineEmits(['edit'])

/* Responsive */
const isMobile = computed(() => $q.screen.lt.sm)
const containerClass = computed(() =>
  isMobile.value ? 'column items-center text-center q-gutter-sm' : 'row items-center'
)

/* Dati derivati */
const fullName = computed(() =>
  [props.user?.firstName, props.user?.lastName].filter(Boolean).join(' ')
)

const roleLabel = computed(() => props.user?.role || '')
const roleMeta = computed(() => {
  const r = (roleLabel.value || '').toLowerCase()
  switch (r) {
    case 'admin':   return { color: 'deep-orange-8', icon: 'security' }
    case 'manager': return { color: 'indigo-7',      icon: 'badge' }
    case 'staff':
    case 'operator':
    case 'operatore': return { color: 'teal-6', icon: 'workspace_premium' }
    default:        return { color: 'grey-7',        icon: 'person' }
  }
})
const roleColor = computed(() => roleMeta.value.color)
const roleIcon  = computed(() => roleMeta.value.icon)

/* Avatar fallback: favicon base di Quasar (public/icons) */
const defaultAvatar = '/icons/favicon-128x128.png'
function onImgError(e) {
  const fallbackUrl = window.location.origin + defaultAvatar
  if (e?.target && e.target.src !== fallbackUrl) {
    e.target.src = defaultAvatar
  }
}
</script>

<style scoped>
.user-card :deep(.q-item) {
  min-height: 44px;
}
</style>
