<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card
      class="q-pa-xl shadow-8 animate__animated animate__fadeInDown"
      style="width: 400px; max-width: 90vw; border-radius: 20px"
    >
      <q-card-section>
        <div class="text-h5 text-center text-teal q-mb-md">Bentornato!</div>
        <div class="text-subtitle2 text-center text-grey-7 q-mb-lg">
          Inserisci i tuoi dati per accedere
        </div>

        <q-form
          @submit.prevent="handleLogin"
          class="q-gutter-md"
          :class="error ? 'animate__animated animate__shakeX' : ''"
        >
          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            dense
            color="teal"
            :rules="[val => !!val || 'Email richiesta']"
          />
          <q-input
            v-model="password"
            :type="isPwd ? 'password' : 'text'"
            label="Password"
            outlined
            dense
            color="teal"
            :rules="[val => !!val || 'Password richiesta']"
          >
            <template #append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>

          <q-btn
            :loading="loading"
            label="Accedi"
            type="submit"
            color="teal"
            class="full-width q-mt-sm"
            unelevated
            rounded
          />

          <q-banner v-if="error" type="negative" class="q-mt-md q-pa-sm text-center">
            {{ error }}
          </q-banner>
        </q-form>

        <q-banner v-if="noPermission" type="warning" class="q-mt-md q-pa-sm text-center">
          Non hai i permessi per registrare un nuovo utente
        </q-banner>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from 'src/stores/usersStore'
import { useCompanyStore } from 'src/stores/companyStore'

const router = useRouter()
const usersStore = useUsersStore()
const companyStore = useCompanyStore()

const email = ref('')
const password = ref('')
const isPwd = ref(true)
const error = ref(null)
const noPermission = ref(false)
const loading = ref(false)

async function handleLogin () {
  if (loading.value) return
  loading.value = true
  error.value = null

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Credenziali non valide')

    await usersStore.setUserAndToken(data.user, data.token)
    try { sessionStorage.setItem('token', data.token)
    } catch (e) {
      console.warn(e)
    }

    try { await companyStore.fetchCompany() } catch (e) { console.warn(e) }

    await nextTick()


    router.push('/hub')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>
@import 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css';

.q-btn--glossy {
  background: linear-gradient(135deg, #ffec64, #ffab00);
  box-shadow: inset 0 0 20px 5px rgba(255, 255, 255, 0.6);
  transition: box-shadow 0.3s ease;
}
.q-btn--glossy:hover {
  box-shadow: inset 0 0 30px 10px rgba(255, 255, 255, 0.8);
}

.q-input:hover .q-field__control {
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  transition: box-shadow 0.2s ease-in-out;
}

.q-banner {
  border-radius: 8px;
}
</style>
