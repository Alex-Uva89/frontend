<template>
  <q-dialog v-model="isOpen" persistent class="z-top">
    <q-card style="width: 90vw; height: fit-content;">

      <!-- HERO FOTO con pulsante rotondo per upload -->
      <div class="relative-position">
        <q-img
          :src="previewPhoto || form.photoUrl || defaultCover"
          alt="Foto profilo"
          height="220px"
          ratio="16/9"
          spinner-color="teal"
        />
        <div class="absolute-top-left q-pa-sm">
          <q-chip square color="teal" text-color="white" icon="manage_accounts">
            Modifica profilo
          </q-chip>
        </div>

        <!-- Pulsanti overlay -->
        <div class="absolute-top-right q-pa-sm row items-center q-gutter-sm">
          <!-- Cambia foto -->
          <q-btn
            round
            color="teal"
            icon="photo_camera"
            size="sm"
            @click="pickPhoto"
            aria-label="Carica nuova foto"
          />
          <!-- Rimuovi selezione (se c'è un file in anteprima) -->
          <q-btn
            v-if="previewPhoto"
            round
            color="negative"
            icon="close"
            size="sm"
            @click="clearPhoto"
            aria-label="Rimuovi foto selezionata"
          />
        </div>
      </div>

      <!-- QFile nascosto: viene aperto dal bottone rotondo -->
      <q-file
        ref="fileRef"
        v-model="photoFile"
        accept="image/*"
        style="display:none"
        @update:model-value="onPhotoPicked"
      />

      <q-separator />

      <q-card-section class="q-pt-md">
        <div class="text-subtitle2 text-grey-7 q-mb-md">
          Aggiorna i dati dell’utente
        </div>

        <q-form @submit.prevent="submit" ref="formRef" class="q-gutter-md">
          <!-- Nome / Cognome -->
          <div class="row q-col-gutter-md q-px-lg">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.firstName"
                label="Nome"
                outlined
                dense
                :rules="[val => !!val || 'Nome richiesto']"
                autocomplete="given-name"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.lastName"
                label="Cognome"
                outlined
                dense
                :rules="[val => !!val || 'Cognome richiesto']"
                autocomplete="family-name"
              />
            </div>
          </div>

          <!-- Email -->
          <q-input
            v-model="form.email"
            label="Email"
            type="email"
            outlined
            dense
            :rules="emailRules"
            autocomplete="email"
            class="row q-col-gutter-md q-px-lg"
          >
            <template #prepend><q-icon name="mail" /></template>
          </q-input>

          <!-- Ruolo / Locale -->
          <div class="row q-col-gutter-md q-px-lg">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.role"
                :options="roleOptions"
                label="Ruolo"
                outlined
                dense
                emit-value
                map-options
                :rules="[val => !!val || 'Ruolo richiesto']"
              >
                <template #prepend><q-icon name="badge" /></template>
              </q-select>
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.business"
                :options="businessOptions"
                label="Locale di lavoro"
                outlined
                dense
                emit-value
                map-options
                :rules="[val => !!val || 'Locale richiesto']"
              >
                <template #prepend><q-icon name="business" /></template>
              </q-select>
            </div>
          </div>

          <!-- Stato -->
          <q-toggle v-model="form.isActive" label="Ancora in servizio" />
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Annulla" color="grey" v-close-popup />
        <q-btn label="Salva" color="teal" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { authFetch, authFetchJson } from 'src/utils/api' // ⬅️ AGGIUNTO

/* Props */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  user: { type: Object, required: true },
  businesses: { type: Array, default: () => [] } // [{ _id, name }]
})
const emit = defineEmits(['update:modelValue', 'save'])

/* Stato dialog */
const isOpen = ref(props.modelValue)
watch(() => props.modelValue, v => { isOpen.value = v })
watch(isOpen, v => emit('update:modelValue', v))

/* Cover/Avatar di default (usa icone pubbliche del progetto) */
const defaultCover = '/icons/favicon-256x256.png'

/* Form state */
const formRef = ref(null)
const form = ref({
  firstName: props.user?.firstName || '',
  lastName:  props.user?.lastName  || '',
  email:     props.user?.email     || '',
  role:      props.user?.role      || '',
  business:  props.user?.business?._id || props.user?.business || '',
  isActive:  props.user?.isActive ?? true,
  photoUrl:  props.user?.photoUrl || null
})

/* QFile + anteprima */
const fileRef = ref(null)
const photoFile = ref(null)
const previewPhoto = ref(null)

function pickPhoto () {
  fileRef.value?.pickFiles?.()
}
function clearPhoto () {
  photoFile.value = null
  previewPhoto.value = null
}
function onPhotoPicked (file) {
  const f = Array.isArray(file) ? file[0] : file
  if (!f) {
    previewPhoto.value = null
    return
  }
  photoFile.value = f
  try {
    previewPhoto.value = URL.createObjectURL(f)
  } catch {
    previewPhoto.value = null
  }
}

/* Regole */
const emailRules = [
  v => !!v || 'Email richiesta',
  v => /.+@.+\..+/.test(v) || 'Email non valida'
]

/* Opzioni ruolo/business (coerenti con schema) */
const roleOptions = [
  { label: 'Dev', value: 'Dev' },
  { label: 'Owner', value: 'Owner' },
  { label: 'HR', value: 'Hr' },
  { label: 'Supervisor', value: 'Supervisor' },
  { label: 'Manager', value: 'Manager' },
  { label: 'Staff', value: 'Staff' },
]
const businessOptions = computed(() =>
  (props.businesses || []).map(b => ({ label: b.name, value: b._id }))
)

/* ============ AGGIUNTO: helpers chiamate API ============ */
const API = import.meta.env.VITE_API_URL

async function uploadPhotoIfNeeded () {
  if (!photoFile.value) return null
  const fd = new FormData()
  fd.append('file', photoFile.value)
  const res = await authFetch(`${API}/cms/uploads`, {
    method: 'POST',
    body: fd
  })
  let json
  try { json = await res.json() } catch { json = null }
  if (!res.ok) throw new Error(json?.error || `Upload fallito (HTTP ${res.status})`)
  // adatta ai campi della tua /cms/uploads
  return json?.assetId || json?.id || json?.asset?._id || null
}
/* ======================================================== */

/* Submit */
async function submit () {
  const ok = await formRef.value?.validate?.()
  if (!ok) return

  try {
    // 1) upload immagine se presente
    const photoAssetId = await uploadPhotoIfNeeded()

    // 2) PATCH profilo (⚠️ non invio "role" per evitare 403 in self-edit)
    const payload = {
      firstName: form.value.firstName,
      lastName:  form.value.lastName,
      email:     form.value.email,
      business:  form.value.business || null,
      isActive:  form.value.isActive,
      ...(photoAssetId ? { photoAssetId } : {})
    }

    const id = props.user?._id || props.user?.id
    const updated = await authFetchJson(`${API}/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    // 3) ritorna al parent il dato aggiornato (comportamento invariato)
    emit('save', updated)
    isOpen.value = false
  } catch (e) {
    console.error(e)
    // lascia la gestione notifiche al parent; qui loggo solo
  }
}
</script>

<style lang="css" scoped>
.my-profile{
  z-index: 999999999;
}
</style>
