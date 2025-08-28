<template>
  <q-page class="cms-hero">

    <!-- Background decorativo (non intrusivo) -->
    <div class="bg-decor" aria-hidden="true"></div>

    <!-- Header -->
    <header class="hero-head">
      <div class="title">Pannello CMS</div>
      <div class="subtitle">Scegli cosa gestire</div>
    </header>

    <!-- Cards: mobile-first (colonna), poi griglia fluida -->
    <section class="cards-grid">
      <!-- Categorie -->
      <article
        class="cta-card cta-categories"
        tabindex="0"
        role="button"
        aria-label="Gestisci categorie"
        v-ripple
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
            Gerarchie &nbsp;•&nbsp; Ordine
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
        v-ripple
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
            Drag & Drop
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
        v-ripple
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
            Emoji & Filtri
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

    <!-- Quick actions: sticky su mobile -->
    <nav class="quick-links lt-md">
      <q-btn color="primary" icon="category"  no-caps @click="goCategories"  label="Categorie"  />
      <q-btn color="primary" icon="inventory_2" no-caps @click="goProducts"   label="Prodotti"   />
      <q-btn color="primary" icon="sell"      no-caps @click="goAttributes" label="Attributi"  />
    </nav>

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
  min-height: 100%;
  padding: 16px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
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

/* ---------- Header: non fixed, mobile-first ---------- */
.hero-head {
  z-index: 1;
  text-align: center;
  padding-top: 4px;
}
.title {
  font-size: clamp(20px, 4.5vw, 28px);
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
  grid-template-columns: 1fr; /* mobile: una colonna */
  gap: 12px;
}

/* Tablet */
@media (min-width: 768px) {
  .cms-hero { padding: 24px; gap: 20px; }
  .cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
}

/* Desktop */
@media (min-width: 1200px) {
  .cards-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
}

/* ---------- Card ---------- */
.cta-card {
  position: relative;
  border-radius: 16px;
  height: fit-content;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 16px;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
  outline: none;
  cursor: pointer;
}
.body--dark .cta-card {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.10);
}

/* Hover solo su device con hover */
@media (hover: hover) and (pointer: fine) {
  .cta-card:hover,
  .cta-card:focus {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(0,0,0,0.12);
    border-color: rgba(0,0,0,0.12);
  }
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
  bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  background: transparent;
  padding-top: 4px;
}
.quick-links .q-btn {
  border-radius: 12px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* Desktop: quick links non sticky */
@media (min-width: 1024px) {
  .quick-links { position: static; margin-top: 4px; }
}

/* ---------- Motion preferenze ---------- */
@media (prefers-reduced-motion: reduce) {
  .cta-card,
  .cta-card:hover,
  .cta-card:focus { transition: none; transform: none; box-shadow: none; }
}
</style>
