<template>
  <q-page class="cms-hero">

    <!-- Background decorativo (non intrusivo) -->
    <div class="bg-decor" aria-hidden="true"></div>

    <!-- Header -->
    <header class="hero-head bg-secondary q-py-md">
      <div class="title text-white">Pannello CMS</div>
      <div class="subtitle text-white">Scegli cosa gestire</div>
    </header>

    <!-- Cards: mobile-first (colonna), poi griglia fluida -->
    <section class="cards-grid">
      <!-- Categorie -->
      <article
        class="cta-card cta-categories"
        tabindex="0"
        role="button"
        aria-label="Gestisci categorie"
        @click="goCategories"
        @keyup.enter="goCategories"
        @keyup.space.prevent="goCategories"
      >
        <div class="cta-icon-wrap">
          <q-icon name="category" class="cta-icon" />
        </div>
        <h2 class="cta-title">Gestisci categorie</h2>
        <p class="cta-desc">Crea, modifica e organizza la struttura del catalogo.</p>
        <div class="cta-actions">
          <q-chip dense outline color="teal-6" text-color="teal-10" icon="account_tree">
            Gerarchie & ordinamento
          </q-chip>
          <q-btn
            color="primary"
            label="Entra"
            icon-right="arrow_forward"
            class="cta-btn"
            unelevated
          />
        </div>
      </article>

      <!-- Prodotti -->
      <article
        class="cta-card cta-products"
        tabindex="0"
        role="button"
        aria-label="Gestisci prodotti"
        @click="goProducts"
        @keyup.enter="goProducts"
        @keyup.space.prevent="goProducts"
      >
        <div class="cta-icon-wrap">
          <q-icon name="inventory_2" class="cta-icon" />
        </div>
        <h2 class="cta-title">Gestisci prodotti</h2>
        <p class="cta-desc">Aggiungi articoli, imposta prezzi, immagini e categorie.</p>
        <div class="cta-actions">
          <q-chip dense outline color="purple-6" text-color="purple-10" icon="touch_app">
            Drag & drop ordinamento
          </q-chip>
          <q-btn
            color="primary"
            label="Entra"
            icon-right="arrow_forward"
            class="cta-btn"
            unelevated
          />
        </div>
      </article>

      <!-- Attributi -->
      <article
        class="cta-card cta-attributes"
        tabindex="0"
        role="button"
        aria-label="Gestisci attributi"
        @click="goAttributes"
        @keyup.enter="goAttributes"
        @keyup.space.prevent="goAttributes"
      >
        <div class="cta-icon-wrap">
          <q-icon name="sell" class="cta-icon" />
        </div>
        <h2 class="cta-title">Gestisci attributi</h2>
        <p class="cta-desc">Allergeni, stagionalità, promo e tag con emoji/icona.</p>
        <div class="cta-actions">
          <q-chip dense outline color="amber-7" text-color="brown-10" icon="auto_awesome">
            Emoji & filtri smart
          </q-chip>
          <q-btn
            color="primary"
            label="Entra"
            icon-right="arrow_forward"
            class="cta-btn"
            unelevated
          />
        </div>
      </article>
    </section>

  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

function goCategories() { router.push({ name: 'cms.categories' }) }
function goProducts()   { router.push({ name: 'cms.products' }) }
function goAttributes() { router.push({ name: 'cms.attributes' }) }
</script>

<style scoped>
/* ---------- Layout base (mobile-first) ---------- */
.cms-hero {
  position: relative;
  height: fit-content;
  padding: 16px;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 16px;
  margin-top: 90px;
}

/* ---------- Background “wow” ma leggero ---------- */
.bg-decor {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1200px 500px at 80% -10%, rgba(123,104,238,.18), transparent 60%),
    radial-gradient(900px 400px at -10% 20%, rgba(0,188,212,.18), transparent 55%);
  pointer-events: none;
  z-index: 0;
  filter: saturate(110%);
}
:root[data-theme="dark"] .bg-decor,
.body--dark .bg-decor {
  filter: saturate(120%) brightness(90%);
}

/* ---------- Header ---------- */
.hero-head {
  position: fixed;
  width: 100%;
  top: 42px;
  left: 0;
  right: 0;
  z-index: 80000;
  text-align: center;
  margin-top: 8px;
}
.title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.2px;
}
.subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--q-grey-6);
}

/* ---------- Cards grid ---------- */
.cards-grid {
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr;            /* mobile: una colonna */
  gap: 14px;
  margin-top: 8px;
}

/* Tablet */
@media (min-width: 768px) {
  .cms-hero { padding: 24px; gap: 20px; }
  .cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
  .title { font-size: 28px; }
}

/* Desktop */
@media (min-width: 1200px) {
  .cards-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
  .title { font-size: 32px; }
}

/* ---------- Card ---------- */
.cta-card {
  position: relative;
  border-radius: 18px;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 18px;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
  outline: none;
  cursor: pointer;
}
.body--dark .cta-card {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.10);
}

.cta-card:hover,
.cta-card:focus {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(0,0,0,0.12);
  border-color: rgba(0,0,0,0.12);
}
.cta-card:active { transform: translateY(-1px) scale(.99); }

/* Icona grande “soft” */
.cta-icon-wrap {
  width: 56px; height: 56px;
  border-radius: 14px;
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
}
.cta-icon { font-size: 28px; opacity: .92; }

/* Titolo/descrizione */
.cta-title {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 800;
}
.cta-desc {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--q-grey-7);
}

/* Azioni */
.cta-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.cta-btn { margin-left: auto; }

/* Varianti cromatiche */
.cta-categories { background-image: linear-gradient(180deg, rgba(76,175,80,.08), rgba(0,150,136,.06)); }
.cta-products   { background-image: linear-gradient(180deg, rgba(33,150,243,.08), rgba(156,39,176,.06)); }
.cta-attributes { background-image: linear-gradient(180deg, rgba(255,193,7,.12), rgba(233,30,99,.06)); }

.cta-categories .cta-icon-wrap { background: rgba(0,150,136,.12); }
.cta-products   .cta-icon-wrap { background: rgba(156,39,176,.12); }
.cta-attributes .cta-icon-wrap { background: rgba(255,87,34,.12); }

/* ---------- Quick links (sticky su mobile) ---------- */
.quick-links {
  position: sticky;
  bottom: 8px;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  background: transparent;
}
.quick-links .q-btn {
  border-radius: 12px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* Spazio dal fondo su desktop (niente sticky) */
@media (min-width: 1024px) {
  .quick-links { position: static; margin-top: 8px; }
}

/* ---------- Motion preferenze ---------- */
@media (prefers-reduced-motion: reduce) {
  .cta-card,
  .cta-card:hover,
  .cta-card:focus { transition: none; transform: none; box-shadow: none; }
}
</style>
