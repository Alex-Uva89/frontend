<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card
      class="q-pa-xl shadow-8 animate__animated animate__fadeInDown"
      style="width: 400px; max-width: 90vw; border-radius: 20px"
    >
      <q-card-section>
        <div class="text-h5 text-center text-primary q-mb-md">Bentornato!</div>
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
            color="primary"
            :rules="[val => !!val || 'Email richiesta']"
          />
          <q-input
            v-model="password"
            :type="isPwd ? 'password' : 'text'"
            label="Password"
            outlined
            dense
            color="primary"
            :rules="[val => !!val || 'Password richiesta']"
          >
            <template v-slot:append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>


          <q-btn
            label="Accedi"
            type="submit"
            color="primary"
            class="full-width q-mt-sm"
            unelevated
            rounded
          />

          <q-banner v-if="error" type="negative" class="q-mt-md q-pa-sm text-center">
            {{ error }}
          </q-banner>
        </q-form>

        <div class="q-mt-xl q-mb-lg text-center">
          <q-tooltip v-if="!isLogged" anchor="top middle" self="bottom middle" class="bg-yellow text-black">
            Ti sei dimenticato di loggarti
          </q-tooltip>

          <q-btn
            color="yellow"
            text-color="black"
            unelevated
            rounded
            glossy
            @click="handleRegisterClick"
            :disable="!isLogged"
          >
        Vuoi registrare un nuovo utente ->
        </q-btn>
        </div>

        <q-banner v-if="noPermission" type="warning" class="q-mt-md q-pa-sm text-center">
          Non hai i permessi per registrare un nuovo utente
        </q-banner>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from 'src/stores/usersStore'

const router = useRouter()
const usersStore = useUsersStore()

const email = ref('')
const password = ref('')
const isPwd = ref(true)
const error = ref(null)
const noPermission = ref(false)

const isLogged = computed(() => email.value.trim() !== '' && password.value.trim() !== '' && !error.value)

const currentUser = computed(() => usersStore.getUserByEmail(email.value))

// Carica gli utenti appena montato
usersStore.fetchUsers()

async function handleLogin() {
  error.value = null
  noPermission.value = false

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })

    const data = await res.json()

    if (!res.ok) {
      error.value = data.error || 'Credenziali non valide'
      return
    }

    // ⬇️ Salva user e token in Pinia
    usersStore.setUserAndToken(data.user, data.token)

    // Redirect alla dashboard in base al ruolo
    const role = data.user.role
    router.push(`/dashboard/${role}View`)

  } catch (err) {
    error.value = 'Errore di rete'
    console.error(err)
  }
}

function handleRegisterClick() {
  noPermission.value = false

  if (!isLogged.value) {
    return
  }

  if (currentUser.value?.role === 'Dev') {
    router.push('/auth/register')
  } else {
    noPermission.value = true
  }
}

</script>

<style scoped>
@import 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css';

/* Glossy effect button giallo */
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
