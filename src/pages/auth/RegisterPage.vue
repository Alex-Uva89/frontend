<template>
  <q-page class="q-pa-md flex flex-center">
    <q-form @submit.prevent="handleRegister" class="q-gutter-md" style="width: 300px">
      <q-input v-model="firstName" label="Nome" required />
      <q-input v-model="lastName" label="Cognome" required />
      <q-input v-model="email" label="Email" type="email" required />
      <q-input
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        label="Password"
        required
      >
        <template v-slot:append>
          <q-icon
            :name="showPassword ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="showPassword = !showPassword"
          />
        </template>
      </q-input>

      <q-select
        v-model="role"
        label="Ruolo"
        :options="['Dev', 'Owner','Supervisor','Manager', 'Staff']"
        required
      />

      <q-select
        v-model="business"
        label="Locale di lavoro"
        :options="businessOptions"
        option-label="name"
        option-value="_id"
        emit-value
        map-options
        required
      />

      <q-btn label="Registrati" type="submit" color="secondary" class="full-width" />
      <q-banner v-if="error" type="negative">{{ error }}</q-banner>
      <q-banner v-if="success" type="positive">{{ success }}</q-banner>
    </q-form>


    <q-btn
      label="Torna indietro"
      icon="arrow_back"
      color="teal"
      align="right"
      flat
      class="full-width"
      @click="router.back()"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useBusinessStore } from 'stores/businessStore'
import { useRouter } from 'vue-router'

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const role = ref('')
const business = ref('')

const error = ref(null)
const success = ref(null)

const businessStore = useBusinessStore()
const businessOptions = computed(() => businessStore.businesses)

const router = useRouter()

async function handleRegister() {
  error.value = null
  success.value = null

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value,
        password: password.value,
        role: role.value,
        business: business.value,
        isActive: true
      })
    })

    const data = await res.json()

    if (!res.ok) {
      error.value = data.error || 'Errore registrazione'
      return
    }

    success.value = 'Registrazione completata!'
    setTimeout(() => {
      router.push('/')
    }, 2000);

  } catch (err) {
    error.value = 'Errore di rete'
    console.error(err)
  }
}

onMounted(async () => {
  await businessStore.fetchBusinesses()
})
</script>
