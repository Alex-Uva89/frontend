<template>
  <q-page class="cms-hero">

    <!-- titolo/subtitle -->
    <div class="hero-head text-center">
      <div class="text-h4 text-weight-bold q-mb-xs">Pannello CMS</div>
      <div class="text-subtitle2 text-grey-6">Scegli cosa gestire</div>
    </div>

    <!-- call-to-action: due maxi “bottoni” -->
    <div class="hero-actions row items-center justify-center q-col-gutter-xl">

      <!-- Categorie -->
      <div class="col-12 col-sm-6 col-md-5 col-lg-4">
        <q-card
          class="cta-card cta-categories"
          clickable
          bordered
          @click="goCategories"
          @keyup.enter.space="goCategories"
          tabindex="0"
          aria-label="Gestisci categorie"
          role="button"
        >
          <q-card-section class="text-center q-pa-xl">
            <q-icon name="category" size="64px" class="q-mb-md" />
            <div class="text-h6 text-weight-bold q-mb-xs">Gestisci categorie</div>
            <div class="text-body2 opacity-80">
              Crea, modifica e organizza la struttura del catalogo.
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Prodotti -->
      <div class="col-12 col-sm-6 col-md-5 col-lg-4">
        <q-card
          class="cta-card cta-products"
          clickable
          bordered
          @click="goProducts"
          @keyup.enter.space="goProducts"
          tabindex="0"
          aria-label="Gestisci prodotti"
          role="button"
        >
          <q-card-section class="text-center q-pa-xl">
            <q-icon name="inventory_2" size="64px" class="q-mb-md" />
            <div class="text-h6 text-weight-bold q-mb-xs">Gestisci prodotti</div>
            <div class="text-body2 opacity-80">
              Aggiungi articoli, gestisci stock e varianti in un click.
            </div>
          </q-card-section>
        </q-card>
      </div>

    </div>

  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

function goCategories() {
  router.push({ name: 'cms.categories' })
}
function goProducts() {
  router.push({ name: 'cms.products' })
}
</script>

<style scoped>
/* Layout “hero”: centriamo verticalmente con respiro */
.cms-hero {
  min-height: calc(100vh - 56px); /* sottrai l’altezza header se c’è */
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 24px;
  padding: 24px;
}

/* Testata */
.hero-head {
  margin-top: 8vh;
}

/* Contenitore azioni */
.hero-actions {
  align-self: center;
}

/* Card base: grandi, morbide, con animazione */
.cta-card {
  border-radius: 18px;
  transition: transform 180ms ease, box-shadow 180ms ease, background 220ms ease, border-color 180ms ease;
  cursor: pointer;
  outline: none;
  position: relative;
  overflow: hidden;
}

/* Effetto hover/focus */
.cta-card:hover,
.cta-card:focus {
  transform: translateY(-4px);
  box-shadow: 0 14px 32px rgba(0,0,0,0.12);
}

/* Stato attivo (click) */
.cta-card:active {
  transform: translateY(-1px) scale(0.99);
}

/* Gradienti diversi per categoria/prodotto (rispettano dark mode) */
.cta-categories {
  background: linear-gradient(135deg, rgba(76,175,80,.12), rgba(0,150,136,.12));
  border: 1px solid rgba(0,150,136,.25);
}
.cta-products {
  background: linear-gradient(135deg, rgba(33,150,243,.12), rgba(156,39,176,.12));
  border: 1px solid rgba(156,39,176,.25);
}

/* Migliora contrasto icone e testi */
.cta-card .q-icon { opacity: 0.9; }
.opacity-80 { opacity: .8; }

/* Responsive fine-tuning */
@media (max-width: 599px) {
  .cms-hero {
    padding: 16px;
  }
  .hero-head { margin-top: 4vh; }
}
</style>
