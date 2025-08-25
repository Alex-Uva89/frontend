<template>
  <q-dialog v-model="innerOpen" persistent @show="onShow">
    <q-card style="min-width: 560px; max-width: 720px">
      <!-- Header -->
      <q-card-section class="row items-center justify-between bg-teal-1">
        <div class="text-h6 text-teal-9">Nuovo membro</div>
        <q-btn icon="close" flat round dense @click="close" aria-label="Chiudi dialog" />
      </q-card-section>

      <q-separator />

      <q-form class="q-pa-lg" ref="formRef" @submit="onSubmit" @reset="onReset" greedy>
        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                ref="firstNameRef"
                v-model="form.firstName"
                label="Nome *"
                dense outlined clearable
                :rules="[v => !!(v && v.trim()) || 'Campo obbligatorio']"
                autocomplete="off"
              />
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="form.lastName"
                label="Cognome *"
                dense outlined clearable
                :rules="[v => !!(v && v.trim()) || 'Campo obbligatorio']"
                autocomplete="off"
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
              >
                <template #prepend>
                  <q-icon name="store" />
                </template>
              </q-select>
            </div>

            <div class="col-12 col-md-4 flex items-center">
              <q-toggle v-model="form.isActive" label="Attivo" />
            </div>

            <!-- Password -->
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                label="Password *"
                dense outlined clearable
                autocomplete="new-password"
                :rules="passwordRules"
              >
                <template #append>
                  <q-icon
                    :name="showPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showPwd = !showPwd"
                  />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="form.passwordConfirm"
                :type="showPwd2 ? 'text' : 'password'"
                label="Conferma password *"
                dense outlined clearable
                autocomplete="new-password"
                :rules="confirmRules"
              >
                <template #append>
                  <q-icon
                    :name="showPwd2 ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showPwd2 = !showPwd2"
                  />
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="between" class="q-pa-md">
          <div class="text-caption text-grey-7">
            I campi contrassegnati con * sono obbligatori
          </div>
          <div class="row q-gutter-sm">
            <q-btn flat label="Annulla" color="grey-7" @click="close" />
            <q-btn flat label="Reset" color="grey-7" type="reset" />
            <q-btn
              :loading="submitting"
              :disable="submitting || !canSubmit"
              label="Crea"
              color="teal"
              unelevated
              type="submit"
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
function close () { innerOpen.value = false }

/** stores */
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

/** options */
const roleOptions = ['Dev', 'Owner', 'Hr', 'Supervisor', 'Manager', 'Staff']
const businessOptions = computed(() =>
  (businessStore.businesses || []).map(b => ({ label: b.name, value: b._id }))
)

/** form */
const formRef = ref(null)
const submitting = ref(false)
const firstNameRef = ref(null)
const showPwd = ref(false)
const showPwd2 = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  role: null,
  businessId: null,
  isActive: true,
  password: '',
  passwordConfirm: ''
})

/** autofocus all'apertura */
async function onShow () {
  await nextTick()
  firstNameRef.value?.focus?.()
}

/** rules */
const emailRules = [
  v => !!v || 'Campo obbligatorio',
  v => /.+@.+\..+/.test(v) || 'Email non valida'
]
const passwordRules = [
  v => !!v || 'Campo obbligatorio',
  v => (v?.length >= 8) || 'Minimo 8 caratteri',
  v => /[A-Za-z]/.test(v) || 'Almeno una lettera',
  v => /\d/.test(v) || 'Almeno un numero'
]
const confirmRules = [
  v => !!v || 'Campo obbligatorio',
  v => v === form.password || 'Le password non coincidono'
]

/** validità complessiva (abilita submit) */
const canSubmit = computed(() => {
  return !!(
    form.firstName?.trim() &&
    form.lastName?.trim() &&
    /.+@.+\..+/.test(form.email || '') &&
    form.role &&
    form.businessId &&
    passwordRules.every(r => r(form.password) === true) &&
    confirmRules.every(r => r(form.passwordConfirm) === true)
  )
})

/** helpers */
function toPayload () {
  return {
    firstName: form.firstName?.trim(),
    lastName: form.lastName?.trim(),
    email: form.email?.trim(),
    role: form.role,
    business: form.businessId,
    isActive: !!form.isActive,
    password: form.password
  }
}

function onReset () {
  Object.assign(form, {
    firstName: '', lastName: '', email: '',
    role: null, businessId: null, isActive: true,
    password: '', passwordConfirm: ''
  })
  nextTick(() => firstNameRef.value?.focus?.())
}

async function onSubmit () {
  const ok = await formRef.value.validate()
  if (!ok) return
  submitting.value = true
  try {
    const created = await usersStore.createUser(toPayload())
    emit('saved', created) // il parent ricarica la lista con fetchUsers()
    close()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}
</script>
