<template>
  <q-dialog
    v-model="innerOpen"
    persistent
    @show="onShow"
  >
    <q-card  style="min-width: 100px; max-width: 90vw">
      <!-- Header -->
      <q-card-section class="row items-center justify-between bg-teal-1">
        <div class="text-h6 text-teal-9">Nuovo membro</div>
        <q-btn icon="close" flat round dense @click="handleClose" aria-label="Chiudi dialog" />
      </q-card-section>

      <!-- Info/Errors -->
      <q-banner
        v-if="errorMsg"
        class="bg-red-1 text-red-10 q-px-md q-py-sm"
        inline-actions
      >
        {{ errorMsg }}
        <template #action>
          <q-btn flat dense color="red-10" icon="close" @click="errorMsg = ''"/>
        </template>
      </q-banner>

      <q-separator />

      <q-form class="q-ma-lg" ref="formRef" @submit="onSubmit" @reset="onReset" greedy>
        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-lg">
            <!-- Left -->
            <div class="col-12 col-md-8">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    ref="firstNameRef"
                    v-model="form.firstName"
                    label="Nome *"
                    dense outlined clearable
                    :rules="[v => !!(v && v.trim()) || 'Campo obbligatorio']"
                    autocomplete="off"
                    tabindex="1"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <q-input
                    v-model="form.lastName"
                    label="Cognome *"
                    dense outlined clearable
                    :rules="[v => !!(v && v.trim()) || 'Campo obbligatorio']"
                    autocomplete="off"
                    tabindex="2"
                  />
                </div>

                <div class="col-12 col-md-8">
                  <q-input
                    v-model="form.email"
                    label="Email *"
                    type="email"
                    dense outlined clearable
                    :rules="emailRules"
                    autocomplete="off"
                    tabindex="3"
                    hint="Usa un'email aziendale se possibile"
                  >
                    <template #append>
                      <q-icon name="alternate_email" />
                    </template>
                  </q-input>
                </div>

                <div class="col-12 col-md-4">
                  <q-select
                    v-model="form.role"
                    :options="roleOptions"
                    label="Ruolo *"
                    dense outlined
                    :rules="[v => !!v || 'Campo obbligatorio']"
                    tabindex="4"
                    hint="Definisce i permessi in app"
                  >
                    <template #append>
                      <q-icon name="admin_panel_settings" />
                    </template>
                  </q-select>
                </div>

                <div class="col-12 col-md-8">
                  <q-select
                    v-model="form.businessId"
                    :options="businessOptions"
                    label="Locale *"
                    dense outlined emit-value map-options
                    :rules="[v => !!v || 'Campo obbligatorio']"
                    :loading="isBizLoading"
                    tabindex="5"
                    hint="Sede/negozio di riferimento"
                  >
                    <template #prepend>
                      <q-icon name="store" />
                    </template>
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">Nessun locale trovato</q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>

                <div class="col-12 col-md-4 flex items-center">
                  <q-toggle v-model="form.isActive" label="Attivo" tabindex="6" />
                </div>

                <div class="col-12">
                  <q-input
                    v-model="form.photoUrl"
                    label="URL foto (opzionale)"
                    dense outlined clearable
                    :rules="[urlOptionalRule]"
                    tabindex="7"
                    hint="PNG/JPG pubblico; lascia vuoto per avatar di default"
                  >
                    <template #append>
                      <q-icon name="link" />
                    </template>
                  </q-input>
                </div>
              </div>
            </div>

            <!-- Right: live preview -->
            <div class="col-12 col-md-4">
              <div class="column items-center q-gutter-sm">
                <q-avatar size="96px" class="bg-grey-2">
                  <img :src="previewPhoto" alt="Anteprima avatar" style="object-fit: cover;" />
                </q-avatar>
                <div class="text-caption text-grey-7">
                  Anteprima immagine profilo
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="between" class="q-pa-md">
          <div class="text-caption text-grey-7">
            I campi contrassegnati con * sono obbligatori
          </div>
          <div class="row q-gutter-sm">
            <q-btn flat label="Annulla" color="grey-7" @click="handleClose" tabindex="9" />
            <q-btn flat label="Reset" color="grey-7" type="reset" tabindex="10">
              <q-tooltip>Ripristina i campi</q-tooltip>
            </q-btn>
            <q-btn
              :loading="submitting"
              :disable="submitting || !canSubmit"
              label="Crea"
              color="teal"
              unelevated
              type="submit"
              tabindex="11"
            />
          </div>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch, nextTick } from 'vue'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'

/** v-model open */
const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'saved'])
const innerOpen = ref(props.modelValue)
watch(() => props.modelValue, v => (innerOpen.value = v))
watch(innerOpen, v => emit('update:modelValue', v))
function handleClose () { innerOpen.value = false }

/** stores */
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

/** options */
const roleOptions = ['Dev', 'Owner', 'Hr', 'Supervisor', 'Manager', 'Staff']
const businessOptions = computed(() =>
  (businessStore.businesses || []).map(b => ({ label: b.name, value: b._id }))
)
const isBizLoading = computed(() => !!businessStore.loading)

/** form */
const formRef = ref(null)
const submitting = ref(false)
const errorMsg = ref('')
const firstNameRef = ref(null)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  role: null,
  businessId: null,
  isActive: true,
  photoUrl: ''
})

/** autofocus all'apertura */
async function onShow () {
  await nextTick()
  firstNameRef.value?.focus?.()
}

/** rules */
const emailRules = [
  v => !!v || 'Campo obbligatorio',
  v => /.+@.+\..+/.test(v) || 'Email non valida',
  // unicità (sincrona su store locale)
  v => {
    const e = (v || '').trim().toLowerCase()
    const exists = (usersStore.users || []).some(u => (u.email || '').toLowerCase() === e)
    return !exists || 'Email già presente'
  }
]

const urlOptionalRule = (v) => {
  if (!v) return true
  const ok = /^(https?:\/\/).+\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(v.trim())
  return ok || 'Inserisci un URL immagine valido (http/https)'
}

/** anteprima avatar */
const previewPhoto = computed(() => {
  const url = (form.photoUrl || '').trim()
  return url ? url : 'https://cdn.quasar.dev/img/avatar.png'
})

/** validità complessiva (abilita submit) */
const canSubmit = computed(() => {
  return !!(
    form.firstName?.trim() &&
    form.lastName?.trim() &&
    /.+@.+\..+/.test(form.email || '') &&
    form.role &&
    form.businessId &&
    (!form.photoUrl || urlOptionalRule(form.photoUrl) === true)
  )
})

/** helpers */
function toPayload () {
  const payload = {
    firstName: form.firstName?.trim(),
    lastName: form.lastName?.trim(),
    email: form.email?.trim(),
    role: form.role,
    business: form.businessId,
    isActive: !!form.isActive
  }
  if ((form.photoUrl || '').trim()) payload.photoUrl = form.photoUrl.trim()
  return payload
}

function onReset () {
  errorMsg.value = ''
  Object.assign(form, {
    firstName: '', lastName: '', email: '',
    role: null, businessId: null, isActive: true, photoUrl: ''
  })
  nextTick(() => firstNameRef.value?.focus?.())
}

async function onSubmit () {
  errorMsg.value = ''
  const ok = await formRef.value.validate()
  if (!ok) return
  submitting.value = true
  try {
    const created = await usersStore.createUser(toPayload())
    emit('saved', created)
    handleClose()
  } catch (e) {
    // mostro il messaggio all'utente
    errorMsg.value = e?.message || 'Errore durante la creazione'
    console.error(e)
  } finally {
    submitting.value = false
  }
}
</script>
