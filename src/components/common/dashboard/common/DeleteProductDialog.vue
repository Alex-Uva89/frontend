<template>
  <q-dialog v-model="show">
    <q-card>
      <q-card-section class="text-h6">
        Conferma eliminazione
      </q-card-section>

      <q-card-section>
        Per confermare l'eliminazione del prodotto devi ricopiare questo codice:
        <div class="q-mt-sm q-mb-sm">
          <q-chip color="grey-3" text-color="black">{{ code }}</q-chip>
        </div>

        <q-input
          v-model="input"
          label="Inserisci il codice"
          outlined
          dense
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Annulla" color="primary" @click="cancel"/>
        <q-btn flat label="Elimina" color="negative" @click="confirm" :disable="input !== code"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  props: {
    showDialog: Boolean
  },
  emits: ['confirm', 'cancel'],
  setup(props, { emit }) {
    const show = ref(props.showDialog)
    const input = ref('')
    const code = ref('')

    const generateCode = (length = 10) => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let result = ''
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    watch(() => props.showDialog, val => {
      show.value = val
      if (val) {
        input.value = ''
        code.value = generateCode()
      }
    })

    const confirm = () => {
      emit('confirm')
      show.value = false
    }

    const cancel = () => {
      emit('cancel')
      show.value = false
    }

    return {
      show,
      input,
      code,
      confirm,
      cancel
    }
  }
}
</script>
