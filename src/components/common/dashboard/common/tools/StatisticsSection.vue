<template>
  <div class="q-pa-md">

    <!-- Ricerca -->
    <q-input
      v-model="search"
      label="Cerca prodotto"
      filled
      debounce="300"
      class="q-mb-md"
      clearable
    />

    <q-card class="q-pa-md shadow-2">

      <div class="text-h5 text-teal-8 q-mb-sm">
        Costi Prodotti
      </div>

      <q-separator class="q-my-md" />

      <!-- Lista prodotti -->
      <div
        v-for="p in filteredProducts"
        :key="p._id"
        class="q-mb-xl"
      >

        <!-- Header prodotto -->
        <div class="row items-center justify-between">
          <div>
            <div class="text-h6">{{ p.name }}</div>
            <div class="text-caption text-grey-7">ID: {{ p._id }}</div>
          </div>

          <div class="text-h6 text-teal-8">
            Totale costo ingredienti:
            {{ formatCurrency(calculateProductCost(p)) }}
          </div>
        </div>

        <q-separator class="q-my-md" />

        <!-- Se ha ingredienti -->
        <q-list bordered separator v-if="p.ingredients?.length">

          <q-item
            v-for="ing in p.ingredients"
            :key="ing._key"
          >
            <q-item-section>

              <div class="row justify-between">
                <div>
                  <div class="text-body1">
                    {{ ing.reference?.name }}
                  </div>

                  <div class="text-caption text-grey-7">
                    Quantità: {{ ing.quantity }} {{ normalizeUnit(ing.unit) }}
                  </div>

                  <div class="text-caption text-grey-7">
                    Prezzo unitario: {{ formatCurrency(ing.reference?.price) }}
                    / {{ ing.reference?.unit?.[0] || 'kg' }}
                  </div>
                </div>

                <!-- Costo calcolato -->
                <div class="text-body1 text-weight-bold text-teal-8">
                  {{ formatCurrency(calculateIngredientCost(ing)) }}
                </div>
              </div>

            </q-item-section>
          </q-item>

        </q-list>

        <!-- Nessun ingrediente -->
        <div v-else class="text-negative">
          Nessun ingrediente associato
        </div>

        <q-separator class="q-my-lg" />
      </div>

    </q-card>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from 'src/stores/productStore'

const productStore = useProductStore()

const search = ref('')

/* ============================================
   CARICA PRODOTTI (lista già con ingredienti)
============================================= */
onMounted(async () => {
  await productStore.fetchProducts() // LIST_QUERY ora include ingredients con reference
})

/* ============================================
   FILTRO DI RICERCA
============================================= */
const filteredProducts = computed(() => {
  const q = search.value.toLowerCase()
  return productStore.products.filter(p =>
    p.name?.toLowerCase().includes(q)
  )
})

/* ============================================
   NORMALIZZAZIONE UNITÀ
============================================= */
function normalizeUnit(u) {
  if (Array.isArray(u)) return u[0]
  return u || 'kg'
}

/* ============================================
   CALCOLO COSTO INGREDIENTE
============================================= */
function calculateIngredientCost(ing) {
  if (!ing.reference?.price) return 0

  const pricePerKg = ing.reference.price
  const qty = ing.quantity
  const unit = normalizeUnit(ing.unit)

  // kg
  if (unit === 'kg') return pricePerKg * qty

  // grammi
  if (unit === 'g') return pricePerKg * (qty / 1000)

  // milligrammi
  if (unit === 'mg') return pricePerKg * (qty / 1_000_000)

  // litri
  if (unit === 'l') return pricePerKg * qty

  // millilitri
  if (unit === 'ml') return pricePerKg * (qty / 1000)

  // pezzi
  if (unit === 'pz') return pricePerKg * qty

  // fallback
  return pricePerKg * qty
}

/* ============================================
   COSTO TOTALE PRODOTTO
============================================= */
function calculateProductCost(product) {
  return (product.ingredients || [])
    .map(i => calculateIngredientCost(i))
    .reduce((a, b) => a + b, 0)
}

/* ============================================
   FORMATTATORE €
============================================= */
function formatCurrency(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value || 0)
}
</script>
