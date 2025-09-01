<!-- /frontend/src/apps/cms/pages/ProductsCms.vue -->
<template>
  <q-page class="q-pa-md">
    <!-- ====== HERO ====== -->
    <div class="text-h5 q-mb-md">Prodotti</div>
    <q-card flat class="hero q-pa-md q-mb-md rounded-borders shadow-2">
      <div class="column q-gutter-sm">
        <div class="row items-center justify-between no-wrap">
          <q-chip v-if="businessName" color="white" text-color="primary" icon="storefront" class="q-ml-sm">
            {{ businessName }}
          </q-chip>

          <q-select
            v-if="canSeeAllBusinesses"
            dense filled behavior="menu" emit-value map-options class="hero-input"
            :options="(businessStore.businesses || []).map(b => ({ label: b.name, value: b._id }))"
            v-model="usersStore.selectedBusinessId"
            placeholder="Seleziona locale"
            style="width: fit-content"
          >
            <template #prepend><q-icon name="storefront" class="text-white" /></template>
          </q-select>
        </div>

        <div class="text-caption text-white opacity-80">Gestione per categoria & ordine</div>

        <q-banner v-if="!businessId" dense class="bg-amber-3 text-amber-10 q-mt-sm rounded-borders">
          <q-icon name="info" class="q-mr-sm" />Nessun locale attivo. Associa un <b>business</b> all'utente o seleziona un locale.
        </q-banner>

        <div class="row q-col-gutter-sm items-center q-mt-xs">
          <q-select
            v-model="selectedCategoryId"
            :options="categoryOptionsWithAll"
            option-label="label" option-value="id"
            emit-value map-options dense filled clearable
            class="col-12 col-md-4 hero-input"
            label="Categoria"
            :disable="!businessId || !categoriesTree.length"
          >
            <template #prepend><q-icon name="category" class="text-white" /></template>
          </q-select>

          <q-input
            v-model="search" dense filled clearable debounce="200"
            placeholder="Cerca prodotto…" class="col-12 col-md hero-input"
            input-class="text-white" :disable="!businessId"
          >
            <template #prepend><q-icon name="search" class="text-white" /></template>
          </q-input>

          <q-btn color="white" text-color="primary" icon="print" class="q-ml-sm"
                 label="Anteprima menù" :disable="!businessId" @click="openPrint" />
        </div>

        <div v-if="search" class="row items-center q-gutter-sm q-mt-xs">
          <q-chip dense color="amber-4" text-color="black" icon="info">Filtro attivo: drag & drop disabilitato</q-chip>
        </div>
      </div>
    </q-card>

    <!-- ====== STATI ====== -->
    <q-skeleton v-if="loading" type="rect" height="220px" class="rounded-borders" />
    <q-banner v-else-if="error" type="negative" dense class="q-mb-md">{{ error }}</q-banner>

    <!-- ====== CONTENUTO ====== -->
    <div v-else>
      <q-banner v-if="!canReadProducts" class="q-mb-md" type="warning" dense>
        Non hai i permessi per visualizzare i prodotti.
      </q-banner>

      <q-banner v-else-if="!businessId" class="q-mb-md" type="warning" dense>
        Seleziona/associa un locale per visualizzare categorie e prodotti.
      </q-banner>

      <q-banner v-else-if="!categoriesTree.length" class="q-mb-md" type="warning" dense>
        Nessuna categoria disponibile per questo locale.
      </q-banner>

      <div v-else>
        <q-expansion-item
          v-for="cat in visibleCategories" :key="cat._id"
          expand-separator class="rounded-borders q-mb-sm bg-white"
        >
          <template #header="props">
            <q-item clickable v-ripple :class="props.headerClass" @click="props.toggle" :title="cat.fullPath" style="width: 100%;">
              <q-item-section avatar><q-icon name="category" /></q-item-section>
              <q-item-section>
                <div class="row items-center no-wrap">
                  <div class="col ellipsis">{{ cat.title }}</div>
                  <q-chip dense color="primary" text-color="white" icon="inventory_2" class="q-ml-sm">
                    {{ (listsByCat[cat._id] || []).length }}
                  </q-chip>
                </div>
              </q-item-section>
            </q-item>
          </template>

          <div class="row items-center q-gutter-sm q-pa-sm">
            <q-space />
            <q-badge v-if="savingOrder" color="grey-6" outline>salvataggio…</q-badge>
          </div>
          <q-separator />

          <div class="q-pa-sm">
            <Draggable
              :list="listsByCat[cat._id]" item-key="_id" handle=".drag-handle"
              :disabled="disableDrag" @end="onDragEnd(cat._id)" class="comfy-list"
            >
              <template #item="{ element: prod }">
                <div v-show="matchesSearch(prod)" class="row items-start justify-between q-pa-sm q-mb-xs rounded-borders item-row">
                  <div class="column col">
                    <div class="row items-center">
                      <q-icon name="drag_indicator" class="q-mr-sm drag-handle" v-if="!disableDrag" />
                      <q-avatar square size="64px" class="thumb q-mr-sm">
                        <img v-if="prod.imageUrl" :src="prod.imageUrl" :alt="prod.name" loading="lazy" />
                        <q-icon v-else name="image_not_supported" />
                      </q-avatar>
                      <div class="column col">
                        <!-- Nome -->
                        <div class="title text-body1 line-clamp-2">{{ prod.name }}</div>

                        <!-- Riga allergeni (chip), se presenti) -->
                        <div
                          v-if="allergenList(prod).length"
                          class="row items-center no-wrap q-mt-xs meta-row"
                        >
                          <div class="row items-center wrap q-gutter-xs">
                            <q-chip
                              v-for="a in allergenList(prod)"
                              :key="a._id"
                              dense outline
                              color="amber-10" text-color="black"
                              class="q-pa-md"
                              :title="pickAttrName(a)"
                            >
                              <q-avatar v-if="a.iconUrl" square size="30px" class="chip-avatar q-mr-xs">
                                <img :src="a.iconUrl" :alt="pickAttrName(a)" />
                              </q-avatar>
                              <q-icon v-else :name="a.icon || 'warning'" class="q-mr-xs" />
                              {{ pickAttrName(a) }}
                            </q-chip>
                          </div>
                        </div>

                        <!-- Riga vitigno / produttore, se presenti -->
                        <div
                          v-if="hasGrapeOrProducer(prod)"
                          class="row items-center no-wrap q-mt-xs meta-row"
                        >
                          <q-icon name="wine_bar" size="16px" class="q-mr-xs text-deep-purple-7" />
                          <span class="meta-value">{{ listToLabel(kindList(prod,'vitigno')) || '—' }}</span>

                          <q-separator vertical inset class="q-mx-sm" />

                          <q-icon name="store" size="16px" class="q-mr-xs text-blue-grey-7" />
                          <span class="meta-value">{{ listToLabel(kindList(prod,'produttore')) || '—' }}</span>
                        </div>

                        <!-- SKU + Prezzi -->
                        <div class="row items-center no-wrap q-mt-xs">
                          <div class="text-caption text-grey-7 caption-ellipsis">
                            <template v-if="prod.sku">
                              {{ prod.sku }}
                              <span class="q-mx-xs" v-if="hasAnyPrice(prod)">·</span>
                            </template>

                            <template v-if="hasWinePrices(prod)">
                              <span v-if="isNumber(getGlassPrice(prod))">
                                {{ formatMoney(getGlassPrice(prod)) }}
                              </span>
                              <span v-if="isNumber(getBottlePrice(prod))" class="q-ml-xs">
                                <span class="q-mx-xs" v-if="isNumber(getGlassPrice(prod)) && isNumber(getBottlePrice(prod))">·</span>
                                {{ formatMoney(getBottlePrice(prod)) }}
                              </span>
                            </template>
                            <template v-else>
                              <span v-if="isNumber(prod.price)">{{ formatMoney(prod.price) }}</span>
                              <span v-else>prezzo n/d</span>
                            </template>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="row items-center q-gutter-xs actions-col">
                    <q-toggle
                      dense :model-value="prod.active !== false"
                      :disable="!canUpdateProducts || busyToggle.has(prod._id)"
                      @update:model-value="val => onToggleActive(prod._id, val)"
                    />
                    <q-btn dense flat round icon="edit" :disable="!canUpdateProducts" @click="openEdit(prod._id)" />
                    <q-btn dense flat round icon="delete" color="negative" :disable="!canDeleteProducts" @click="confirmDelete(prod._id, prod.name)" />
                  </div>
                </div>
              </template>
            </Draggable>

            <div v-if="(listsByCat[cat._id] || []).filter(matchesSearch).length === 0" class="q-pa-sm text-grey-7">
              Nessun prodotto in questa categoria{{ search ? ' (con il filtro attivo)' : '' }}.
            </div>
          </div>
        </q-expansion-item>
      </div>
    </div>

    <!-- ====== DIALOG EDIT ====== -->
    <q-dialog v-model="editor.open" persistent :maximized="$q.screen.lt.md">
      <q-card style="width: 820px; max-width: 95vw">
        <q-toolbar>
          <q-btn flat round dense icon="arrow_back" v-close-popup />
          <q-toolbar-title>Modifica prodotto</q-toolbar-title>
          <q-btn flat dense icon="save" color="primary" :loading="editor.saving" :disable="!canUpdateProducts" @click="saveEdit" />
        </q-toolbar>
        <q-separator />
        <q-card-section>
          <!-- BASE -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8">
              <q-input v-model="editor.form.name" label="Nome (base) *" dense outlined :rules="[rRequired]" />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="editor.form.sku" label="SKU" dense outlined />
            </div>

            <div class="col-12 col-md-4">
              <q-input v-model.number="editor.form.price" type="number" step="0.01" label="Prezzo" dense outlined />
            </div>
            <div class="col-6 col-md-4">
              <q-input v-model.number="editor.form.priceGlass" type="number" step="0.01" label="Prezzo calice" dense outlined />
            </div>
            <div class="col-6 col-md-4">
              <q-input v-model.number="editor.form.priceBottle" type="number" step="0.01" label="Prezzo bottiglia" dense outlined />
            </div>

            <div class="col-12 col-md-4 flex items-center">
              <q-toggle v-model="editor.form.active" label="Attivo" />
            </div>
          </div>

          <!-- TRADUZIONI -->
          <div class="q-mt-lg">
            <div class="text-subtitle1 q-mb-sm">Traduzioni nome</div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input v-model="editor.form.t_name_it" label="Italiano (it)" dense outlined />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-model="editor.form.t_name_en" label="English (en)" dense outlined />
              </div>
            </div>
          </div>

          <!-- ATTRIBUTI -->
          <div class="q-mt-lg">
            <div class="text-subtitle1 q-mb-sm">Attributi</div>
            <div class="row q-col-gutter-md">
              <!-- Allergeni -->
              <div class="col-12 col-md-6">
                <q-select
                  v-model="editor.form.attrAllergenIds"
                  :options="allergenOptions"
                  option-value="id" option-label="label" emit-value map-options
                  multiple use-chips dense outlined clearable
                  label="Allergeni"
                >
                  <!-- opzioni con avatar -->
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-avatar v-if="scope.opt.iconUrl" square size="20px" class="chip-avatar">
                          <img :src="scope.opt.iconUrl" :alt="scope.opt.label" />
                        </q-avatar>
                        <q-icon v-else-if="scope.opt.icon" :name="scope.opt.icon" />
                        <q-icon v-else name="image" />
                      </q-item-section>
                      <q-item-section>{{ scope.opt.label }}</q-item-section>
                    </q-item>
                  </template>
                  <!-- chip selezionati con avatar -->
                  <template #selected-item="scope">
                    <q-chip square dense removable
                            @remove="scope.removeAtIndex(scope.index)"
                            :tabindex="scope.tabindex"
                            class="q-ma-xs">
                      <q-avatar v-if="scope.opt.iconUrl" square size="18px" class="chip-avatar q-mr-xs">
                        <img :src="scope.opt.iconUrl" :alt="scope.opt.label" />
                      </q-avatar>
                      <q-icon v-else-if="scope.opt.icon" :name="scope.opt.icon" class="q-mr-xs" />
                      <q-icon v-else name="image" class="q-mr-xs" />
                      {{ scope.opt.label }}
                    </q-chip>
                  </template>
                </q-select>
              </div>

              <!-- Vitigno -->
              <div class="col-12 col-md-6">
                <q-select
                  v-model="editor.form.attrGrapeIds"
                  :options="grapeOptions"
                  option-value="id" option-label="label" emit-value map-options
                  multiple use-chips dense outlined clearable
                  label="Vitigno"
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-avatar v-if="scope.opt.iconUrl" square size="20px" class="chip-avatar">
                          <img :src="scope.opt.iconUrl" :alt="scope.opt.label" />
                        </q-avatar>
                        <q-icon v-else-if="scope.opt.icon" :name="scope.opt.icon" />
                        <q-icon v-else name="image" />
                      </q-item-section>
                      <q-item-section>{{ scope.opt.label }}</q-item-section>
                    </q-item>
                  </template>
                  <template #selected-item="scope">
                    <q-chip square dense removable
                            @remove="scope.removeAtIndex(scope.index)"
                            :tabindex="scope.tabindex"
                            class="q-ma-xs">
                      <q-avatar v-if="scope.opt.iconUrl" square size="18px" class="chip-avatar q-mr-xs">
                        <img :src="scope.opt.iconUrl" :alt="scope.opt.label" />
                      </q-avatar>
                      <q-icon v-else-if="scope.opt.icon" :name="scope.opt.icon" class="q-mr-xs" />
                      <q-icon v-else name="image" class="q-mr-xs" />
                      {{ scope.opt.label }}
                    </q-chip>
                  </template>
                </q-select>
              </div>

              <!-- Produttore -->
              <div class="col-12 col-md-6">
                <q-select
                  v-model="editor.form.attrProducerIds"
                  :options="producerOptions"
                  option-value="id" option-label="label" emit-value map-options
                  multiple use-chips dense outlined clearable
                  label="Produttore"
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-avatar v-if="scope.opt.iconUrl" square size="20px" class="chip-avatar">
                          <img :src="scope.opt.iconUrl" :alt="scope.opt.label" />
                        </q-avatar>
                        <q-icon v-else-if="scope.opt.icon" :name="scope.opt.icon" />
                        <q-icon v-else name="image" />
                      </q-item-section>
                      <q-item-section>{{ scope.opt.label }}</q-item-section>
                    </q-item>
                  </template>
                  <template #selected-item="scope">
                    <q-chip square dense removable
                            @remove="scope.removeAtIndex(scope.index)"
                            :tabindex="scope.tabindex"
                            class="q-ma-xs">
                      <q-avatar v-if="scope.opt.iconUrl" square size="18px" class="chip-avatar q-mr-xs">
                        <img :src="scope.opt.iconUrl" :alt="scope.opt.label" />
                      </q-avatar>
                      <q-icon v-else-if="scope.opt.icon" :name="scope.opt.icon" class="q-mr-xs" />
                      <q-icon v-else name="image" class="q-mr-xs" />
                      {{ scope.opt.label }}
                    </q-chip>
                  </template>
                </q-select>
              </div>

              <!-- Altri -->
              <div class="col-12 col-md-6">
                <q-select
                  v-model="editor.form.attrOtherIds"
                  :options="otherAttrOptions"
                  option-value="id" option-label="label" emit-value map-options
                  multiple use-chips dense outlined clearable
                  label="Altri attributi"
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-avatar v-if="scope.opt.iconUrl" square size="20px" class="chip-avatar">
                          <img :src="scope.opt.iconUrl" :alt="scope.opt.label" />
                        </q-avatar>
                        <q-icon v-else-if="scope.opt.icon" :name="scope.opt.icon" />
                        <q-icon v-else name="image" />
                      </q-item-section>
                      <q-item-section>{{ scope.opt.label }}</q-item-section>
                    </q-item>
                  </template>
                  <template #selected-item="scope">
                    <q-chip square dense removable
                            @remove="scope.removeAtIndex(scope.index)"
                            :tabindex="scope.tabindex"
                            class="q-ma-xs">
                      <q-avatar v-if="scope.opt.iconUrl" square size="18px" class="chip-avatar q-mr-xs">
                        <img :src="scope.opt.iconUrl" :alt="scope.opt.label" />
                      </q-avatar>
                      <q-icon v-else-if="scope.opt.icon" :name="scope.opt.icon" class="q-mr-xs" />
                      <q-icon v-else name="image" class="q-mr-xs" />
                      {{ scope.opt.label }}
                    </q-chip>
                  </template>
                </q-select>
              </div>
            </div>

            <!-- ========== ANTEPRIMA ATTRIBUTI ========== -->
            <div class="q-mt-md">
              <div class="text-subtitle2 q-mb-xs">Anteprima attributi</div>

              <!-- Attuali (originali) -->
              <div class="row items-center q-gutter-xs q-mb-xs">
                <q-badge color="grey-7" outline>Attuali</q-badge>
                <q-chip
                  v-for="o in previewOriginal"
                  :key="'orig-'+o.id"
                  dense
                  color="grey-3"
                  text-color="grey-10"
                  class="q-px-sm"
                  :title="o.label"
                >
                  <q-avatar v-if="o.iconUrl" square size="18px" class="chip-avatar q-mr-xs">
                    <img :src="o.iconUrl" :alt="o.label" />
                  </q-avatar>
                  <q-icon v-else-if="o.icon" :name="o.icon" class="q-mr-xs" />
                  <q-icon v-else name="image" class="q-mr-xs" />
                  {{ o.label }}
                </q-chip>
                <span v-if="!previewOriginal.length" class="text-grey-7">Nessuno</span>
              </div>

              <!-- Dopo modifiche -->
              <div class="row items-center q-gutter-xs q-mb-xs">
                <q-badge color="primary" outline>Dopo modifiche</q-badge>
                <q-chip
                  v-for="o in previewSelected"
                  :key="'sel-'+o.id"
                  dense
                  color="primary"
                  text-color="white"
                  class="q-px-sm"
                  :title="o.label"
                >
                  <q-avatar v-if="o.iconUrl" square size="18px" class="chip-avatar q-mr-xs">
                    <img :src="o.iconUrl" :alt="o.label" />
                  </q-avatar>
                  <q-icon v-else-if="o.icon" :name="o.icon" class="q-mr-xs" />
                  <q-icon v-else name="image" class="q-mr-xs" />
                  {{ o.label }}
                </q-chip>
                <span v-if="!previewSelected.length" class="text-grey-7">Nessuno</span>
              </div>

              <!-- Nuovi -->
              <div v-if="previewAdded.length" class="row items-center q-gutter-xs q-mb-xs">
                <q-badge color="positive" outline>Nuovi</q-badge>
                <q-chip
                  v-for="o in previewAdded"
                  :key="'add-'+o.id"
                  dense
                  color="positive"
                  text-color="white"
                  class="q-px-sm"
                  :title="o.label"
                >
                  <q-avatar v-if="o.iconUrl" square size="18px" class="chip-avatar q-mr-xs">
                    <img :src="o.iconUrl" :alt="o.label" />
                  </q-avatar>
                  <q-icon v-else-if="o.icon" :name="o.icon" class="q-mr-xs" />
                  <q-icon v-else name="image" class="q-mr-xs" />
                  {{ o.label }}
                </q-chip>
              </div>

              <!-- Rimossi -->
              <div v-if="previewRemoved.length" class="row items-center q-gutter-xs">
                <q-badge color="negative" outline>Rimossi</q-badge>
                <q-chip
                  v-for="o in previewRemoved"
                  :key="'rem-'+o.id"
                  dense
                  outline
                  color="negative"
                  text-color="negative"
                  class="q-px-sm chip-removed"
                  :title="o.label"
                >
                  <q-avatar v-if="o.iconUrl" square size="18px" class="chip-avatar q-mr-xs">
                    <img :src="o.iconUrl" :alt="o.label" />
                  </q-avatar>
                  <q-icon v-else-if="o.icon" :name="o.icon" class="q-mr-xs" />
                  <q-icon v-else name="image" class="q-mr-xs" />
                  {{ o.label }}
                </q-chip>
              </div>

              <div v-if="!previewAdded.length && !previewRemoved.length && !previewOriginal.length && !previewSelected.length" class="text-grey-7">
                Nessun attributo selezionato.
              </div>
            </div>
            <!-- ========== /ANTEPRIMA ATTRIBUTI ========== -->
          </div>

          <!-- TESTI -->
          <q-input v-model="editor.form.description" type="textarea" autogrow dense outlined label="Descrizione" class="q-mt-md" />
          <q-input v-model="editor.form.notes" type="textarea" autogrow dense outlined label="Note interne" class="q-mt-sm" />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Annulla" v-close-popup />
          <q-btn color="primary" label="Salva" :loading="editor.saving" :disable="!canUpdateProducts" @click="saveEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <MenuPrintDialog
      v-model="menuPrintOpen"
      :title="printTitle"
      :sections="printSections"
      :footerText="''"
      :coverCharge="null"
    />
  </q-page>
</template>

<script setup>
// Vue & Quasar
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import MenuPrintDialog from 'src/components/print/MenuPrintDialog.vue'

// DnD
import Draggable from 'vuedraggable'

// App
import { api } from 'boot/axios'
import { useUsersStore } from 'src/stores/usersStore'
import { useBusinessStore } from 'src/stores/businessStore'
import { PERM } from 'src/auth/perm'

/* ====== HELPERS ID ATTRIBUTI ====== */
function normAttrId (v) {
  // Ritorna sempre una stringa id, oppure null
  if (!v) return null
  if (typeof v === 'string') return v
  if (typeof v === 'object') return v._id || v._ref || v.id || v.value || null
  return null
}
function asIdList (list) {
  return (list || []).map(normAttrId).filter(Boolean)
}
function shortId (s) {
  const id = String(s || '')
  if (id.length <= 10) return id || '?'
  return id.slice(0, 4) + '…' + id.slice(-4)
}
function unknownLabel (id) {
  const sid = normAttrId(id) || '?'
  return `Non catalogato (${shortId(sid)})`
}

const $q = useQuasar()
const API = import.meta.env.VITE_API_URL

const menuPrintOpen = ref(false)
const menuLang = ref('it')
const printAttributes = ref([]) // attributi per stampa & editor

/* ================== STORE & PERMESSI ================== */
const usersStore = useUsersStore()
const businessStore = useBusinessStore()

const canSeeAllBusinesses = computed(() => {
  const perm = usersStore.currentUser?.perm ?? 0
  return (perm & PERM.MANAGE_ALL_BUSINESSES) !== 0
})
const businessId = computed(() => {
  if (canSeeAllBusinesses.value) {
    return usersStore.selectedBusinessId || usersStore.currentUser?.primaryBusinessId || null
  }
  return usersStore.currentUser?.primaryBusinessId || usersStore.currentUser?.business?._id || null
})
const businessName = computed(() => {
  const id = businessId.value
  const found = (businessStore.businesses || []).find(b => b._id === id)
  return found?.name || usersStore.currentUser?.business?.name || (businessStore.currentBusiness?.name) || ''
})

const canReadProducts = computed(() => {
  const p = usersStore.currentUser?.perm ?? 0
  return !!(p & (PERM.PRODUCTS_READ | PERM.PRODUCTS_CREATE | PERM.PRODUCTS_UPDATE | PERM.PRODUCTS_DELETE | PERM.PRODUCTS_WRITE))
})
const canUpdateProducts = computed(() => {
  const p = usersStore.currentUser?.perm ?? 0
  return !!(p & (PERM.PRODUCTS_UPDATE | PERM.PRODUCTS_WRITE))
})
const canDeleteProducts = computed(() => {
  const p = usersStore.currentUser?.perm ?? 0
  return !!(p & (PERM.PRODUCTS_DELETE | PERM.PRODUCTS_WRITE))
})

/* ================== STATE ================== */
const loading = ref(false)
const error = ref(null)
const search = ref('')
const selectedCategoryId = ref(null)

const categoriesTree = ref([])
const allProducts = ref([])
const listsByCat = ref({})

const savingOrder = ref(false)
const busyToggle = ref(new Set())

/* ================== EDITOR ================== */
const editor = ref({
  open: false,
  saving: false,
  id: null,
  originalAttrIds: [],   // per "Attuali"
  unknownAttrIds: [],    // non presenti nel catalogo, preservati
  form: {
    name: '', sku: '', price: null, priceGlass: null, priceBottle: null,
    active: true, description: '', notes: '',
    t_name_it: '', t_name_en: '',
    attrAllergenIds: [], attrGrapeIds: [], attrProducerIds: [], attrOtherIds: []
  }
})

/* ================== BOOTSTRAP ================== */
onMounted(async () => {
  if (!usersStore.currentUser && usersStore.token) {
    try { await usersStore.fetchCurrentUser() } catch (e) { console.log(e) }
  }
  if (!businessStore.businesses?.length) {
    try { await businessStore.fetchBusinesses() } catch (e) { console.log(e) }
  }
  await initialLoad()
})
watch(businessId, async () => {
  selectedCategoryId.value = null
  await initialLoad()
})
async function initialLoad () {
  if (!canReadProducts.value || !businessId.value) return
  loading.value = true; error.value = null
  try {
    await Promise.all([loadCategories(), loadProducts(), loadAttributes()])
    rebuildLists()
  } catch (e) {
    error.value = e?.message || 'Errore di caricamento'
  } finally {
    loading.value = false
  }
}

/* ========== PRINT ========== */

const printTitle = computed(() => businessName.value || 'Menù')

const printSections = computed(() => {
  const secs = []
  const cats = visibleCategories.value // stampa le foglie (rispetta eventuale filtro categoria)

  for (const cat of cats) {
    const products = listsByCat.value[cat._id] || []
    const items = products.map(p => {
      // marks: solo allergeni con icona/emoji/url
      const marks = allergenList(p).map(a => ({
        url: a.iconUrl || null,
        icon: (!a.iconUrl && a.icon) ? a.icon : null,
        emoji: '', // aggiungi qui se ne hai
        title: pickAttrName(a)
      }))

      // meta lines: vitigno e produttore se presenti
      const grapes = kindList(p, 'vitigno').map(pickAttrName).filter(Boolean)
      const producers = kindList(p, 'produttore').map(pickAttrName).filter(Boolean)
      const metaLines = []
      if (grapes.length) metaLines.push(`Vitigno: ${grapes.join(', ')}`)
      if (producers.length) metaLines.push(`Produttore: ${producers.join(', ')}`)

      // prezzi (vino: calice+bottiglia; altrimenti prezzo singolo)
      const g = getGlassPrice(p)
      const b = getBottlePrice(p)
      const prices = {}
      if (isPositive(g) && isPositive(b)) {
        prices.glass = g; prices.bottle = b
      } else if (isNumber(p.price)) {
        prices.price = p.price
      }

      // label preferendo la traduzione
      const label =
        (p?.translations?.name?.[menuLang.value] || '').toString().trim() || p.name || ''

      return {
        id: p._id,
        label,
        active: p.active !== false,
        marks,
        metaLines,
        prices
      }
    })

    if (items.length) {
      secs.push({ id: cat._id, title: cat.title, items })
    }
  }

  return secs
})


/* ========== Ricarico prima di aprire la stampa ========== */
async function openPrint () {
  try {
    await Promise.all([loadProducts(), loadAttributes()])
    rebuildLists()
  } catch (e) {
    console.warn('refresh before print failed', e)
  }
  menuPrintOpen.value = true
}

/* ================== API LOAD ================== */
async function loadCategories () {
  const { data: json } = await api.get(`${API}/cms/categories`, {
    params: { includeHidden: 1, businessId: businessId.value }
  })
  if (!json?.ok) throw new Error(json?.error || 'Errore categorie')
  categoriesTree.value = json.data || []
}
// coercizione a numero monetario positivo: 0 o valori non validi -> null
function toMoney (v) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}
async function loadProducts () {
  const { data: json } = await api.get(`${API}/cms/products`, {
    params: { businessId: businessId.value }
  })
  if (!json?.ok) throw new Error(json?.error || 'Errore prodotti')
  // Normalizzo per UI
  const rows = (json.data || []).map(p => {
    const glass  = (typeof p.priceGlass  !== 'undefined') ? p.priceGlass  : (p?.prices?.glass  ?? null)
    const bottle = (typeof p.priceBottle !== 'undefined') ? p.priceBottle : (p?.prices?.bottle ?? null)
    return {
      ...p,
      _priceGlass: toMoney(glass),
      _priceBottle: toMoney(bottle),
      price: toMoney(p.price)
    }
  })
  allProducts.value = rows
}
async function loadAttributes () {
  const { data: json } = await api.get(`${API}/cms/attributes`)
  if (!json?.ok) throw new Error(json?.error || 'Errore attributi')
  printAttributes.value = json.data || []
}

/* ================== CATEGORIE: util & visibilità ================== */
function cmpOrderTitle(a, b) {
  const ao = (a?.order ?? 0)
  const bo = (b?.order ?? 0)
  if (ao !== bo) return ao - bo
  return (a?.title || '').localeCompare(b?.title || '')
}
function sortKids(arr) { return [...(arr || [])].sort(cmpOrderTitle) }

function buildParentMap (tree) {
  const map = new Map()
  const walk = (n) => { sortKids(n.children).forEach(c => { map.set(c._id, n._id); walk(c) }) }
  ;(tree || []).forEach(walk)
  return map
}
const parentOf = computed(() => buildParentMap(categoriesTree.value))

const catById = computed(() => {
  const m = new Map()
  const walk = (n) => { m.set(n._id, n); sortKids(n.children).forEach(walk) }
  ;(categoriesTree.value || []).forEach(walk)
  return m
})
function categoryPathLabel (id) {
  const parts = []; let cur = id
  while (cur) { const n = catById.value.get(cur); if (!n) break; parts.push(n.title); cur = parentOf.value.get(cur) }
  return parts.reverse().join(' / ')
}

const categoryOptions = computed(() => {
  const out = []
  const walk = (n, path) => {
    const label = path ? `${path} / ${n.title}` : n.title
    out.push({ id: n._id, label, order: n.order ?? 0 })
    sortKids(n.children).forEach(c => walk(c, label))
  }
  ;(categoriesTree.value || []).forEach(r => walk(r, ''))
  out.sort(cmpOrderTitle)
  return out
})
const categoryOptionsWithAll = computed(() => [{ id: null, label: '— Tutte le categorie —' }, ...categoryOptions.value])

function leafIdsUnder (rootId = null) {
  const ids = []
  const startNodes = rootId ? [catById.value.get(rootId)].filter(Boolean) : (categoriesTree.value || [])
  const walk = (n) => {
    if (!n) return
    const children = sortKids(n.children)
    if (children.length === 0) ids.push(n._id); else children.forEach(walk)
  }
  startNodes.forEach(walk)
  return ids
}

const visibleCategories = computed(() => {
  const targetId = selectedCategoryId.value
  const leafIds = targetId ? leafIdsUnder(targetId) : leafIdsUnder(null)
  return leafIds.map(id => ({
    _id: id,
    title: catById.value.get(id)?.title || '',
    fullPath: categoryPathLabel(id)
  }))
})

/* ================== ATTRIBUTI (supporto UI & editor) ================== */
const attrById = computed(() => {
  const m = new Map()
  for (const a of (printAttributes.value || [])) m.set(a._id, a)
  return m
})
function pickAttrName (a) {
  const t = a?.translations?.name?.[menuLang.value]
  return (t && String(t).trim()) || a?.name || ''
}
/** Normalizza il "tipo" di attributo (stringa o oggetto reference) in un token */
function kindToken (a) {
  const k = a?.kind
  let raw = ''
  if (!k) raw = ''
  else if (typeof k === 'string') raw = k
  else if (typeof k === 'object') raw = k.value || k.title || k.name || ''
  const s = String(raw).toLowerCase().trim()
  if (!s) return ''
  // Sinonimi comuni
  if (s.includes('allerg')) return 'allergen'
  if (['vitigno', 'grape', 'uva'].includes(s)) return 'vitigno'
  if (['produttore', 'producer', 'cantina', 'winery'].includes(s)) return 'produttore'
  return s
}
function kindList (prod, target) {
  const ids = asIdList(prod?.attributes)
  const out = []
  for (const id of ids) {
    const a = attrById.value.get(id)
    if (!a) continue
    if (kindToken(a) === target) out.push(a)
  }
  return out
}
function allergenList (prod) { return kindList(prod, 'allergen') }
function hasGrapeOrProducer (prod) {
  return kindList(prod, 'vitigno').length > 0 || kindList(prod, 'produttore').length > 0
}
function listToLabel (arr) { return (arr || []).map(pickAttrName).filter(Boolean).join(', ') }

/* ====== Opzioni per editor ====== */
const attributeOptions = computed(() => (printAttributes.value || []).map(a => ({
  id: a._id,
  label: pickAttrName(a),
  icon: a.icon || '',
  iconUrl: a.iconUrl || '',  // << preferisci questa se presente
  color: a.color || '',
  kind: kindToken(a)
})))
const attrOptionById = computed(() => {
  const m = new Map()
  attributeOptions.value.forEach(o => m.set(o.id, o))
  return m
})
const allergenOptions  = computed(() => attributeOptions.value.filter(o => o.kind === 'allergen'))
const grapeOptions     = computed(() => attributeOptions.value.filter(o => o.kind === 'vitigno'))
const producerOptions  = computed(() => attributeOptions.value.filter(o => o.kind === 'produttore'))
const otherAttrOptions = computed(() => attributeOptions.value.filter(o => !['allergen','vitigno','produttore'].includes(o.kind)))

/* ====== Anteprima attributi (diff: include non catalogati) ====== */
const selectedKnownSet = computed(() => new Set([
  ...(editor.value.form.attrAllergenIds || []),
  ...(editor.value.form.attrGrapeIds || []),
  ...(editor.value.form.attrProducerIds || []),
  ...(editor.value.form.attrOtherIds || [])
]))
const carryUnknownSet = computed(() => new Set(editor.value.unknownAttrIds || []))
const effectiveSelectedSet = computed(() => new Set([...selectedKnownSet.value, ...carryUnknownSet.value]))
const originalAttrIdSet = computed(() => new Set(editor.value.originalAttrIds || []))

function toDisplayOption (id) {
  const o = attrOptionById.value.get(id)
  return o || { id, label: unknownLabel(id), icon: '', iconUrl: '' }
}
function mapIdsToOptions (ids = []) { return ids.map(toDisplayOption) }

const previewOriginal = computed(() => mapIdsToOptions(Array.from(originalAttrIdSet.value)))
const previewSelected = computed(() => mapIdsToOptions(Array.from(effectiveSelectedSet.value)))
const previewAdded    = computed(() => mapIdsToOptions(Array.from(effectiveSelectedSet.value).filter(id => !originalAttrIdSet.value.has(id))))
const previewRemoved  = computed(() => mapIdsToOptions(Array.from(originalAttrIdSet.value).filter(id => !effectiveSelectedSet.value.has(id))))

/* ================== LISTE PER CATEGORIA ================== */
function rebuildLists () {
  const map = {}
  for (const c of categoryOptions.value) map[c.id] = []
  for (const p of (allProducts.value || [])) {
    const cats = (p.categories || []).map(c => c?._id).filter(Boolean)
    for (const cid of cats) {
      if (!map[cid]) map[cid] = []
      map[cid].push(p)
    }
  }
  listsByCat.value = map
}

function matchesSearch (p) {
  const term = String(search.value || '').trim().toLowerCase()
  if (!term) return true
  return (p.name || '').toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term)
}

/* ================== PREZZI ================== */
function isNumber (v) { return typeof v === 'number' && Number.isFinite(v) }
function isPositive (v) { return typeof v === 'number' && Number.isFinite(v) && v > 0 }
function getGlassPrice (p) {
  if (isPositive(p._priceGlass)) return p._priceGlass
  if (isPositive(p?.prices?.glass)) return p.prices.glass
  if (isPositive(p?.priceGlass)) return p.priceGlass
  return null
}
function getBottlePrice (p) {
  if (isPositive(p._priceBottle)) return p._priceBottle
  if (isPositive(p?.prices?.bottle)) return p.prices.bottle
  if (isPositive(p?.priceBottle)) return p.priceBottle
  return null
}
function hasWinePrices (p) {
  const g = getGlassPrice(p); const b = getBottlePrice(p)
  return isPositive(g) && isPositive(b)
}
function hasAnyPrice (p) { return hasWinePrices(p) || isPositive(p.price) }
function formatMoney (n) { return isNumber(n) ? n.toFixed(2) : '' }

/* ================== DnD & SALVATAGGIO ================== */
const disableDrag = computed(() => !canUpdateProducts.value || !!search.value || savingOrder.value)
async function saveGlobalOrderFromGroup (groupList) {
  if (savingOrder.value) return
  savingOrder.value = true
  try {
    const global = (allProducts.value || []).slice()
    const setIds = new Set((groupList || []).map(p => p._id))
    const slots = []
    for (let i = 0; i < global.length; i++) { if (setIds.has(global[i]._id)) slots.push(i) }
    if (!slots.length) { savingOrder.value = false; return }
    ;(groupList || []).forEach((p, idx) => { global[slots[idx]] = p })
    const productIds = global.map(p => p._id)
    const { data: json } = await api.put(`${API}/cms/products/order`, { productIds })
    if (!json?.ok) throw new Error(json?.error || 'save order failed')
    allProducts.value = global
    rebuildLists()
    $q.notify({ type: 'positive', message: 'Ordine salvato' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'Impossibile salvare ordine' })
    rebuildLists()
  } finally {
    savingOrder.value = false
  }
}
function onDragEnd (catId) {
  const list = listsByCat.value[catId] || []
  saveGlobalOrderFromGroup(list)
}

/* ================== AZIONI PRODOTTO ================== */
async function onToggleActive (id, nextVal) {
  if (!canUpdateProducts.value || !id) return
  busyToggle.value.add(id)
  try {
    const { data: json } = await api.put(`${API}/cms/products/${encodeURIComponent(id)}`, { active: !!nextVal })
    if (!json?.ok) throw new Error(json?.error || 'update failed')
    const idx = (allProducts.value || []).findIndex(p => p._id === id)
    if (idx >= 0) allProducts.value[idx] = { ...allProducts.value[idx], active: !!nextVal }
    for (const arr of Object.values(listsByCat.value)) {
      const i = (arr || []).findIndex(p => p._id === id)
      if (i >= 0) arr[i] = { ...arr[i], active: !!nextVal }
    }
    $q.notify({ type: 'positive', message: nextVal ? 'Prodotto attivato' : 'Prodotto disattivato' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'Impossibile aggiornare' })
  } finally {
    busyToggle.value.delete(id)
  }
}

function openEdit (id) {
  editor.value = {
    open: true, saving: false, id,
    originalAttrIds: [], unknownAttrIds: [],
    form: {
      name: '', sku: '', price: null, priceGlass: null, priceBottle: null,
      active: true, description: '', notes: '',
      t_name_it: '', t_name_en: '',
      attrAllergenIds: [], attrGrapeIds: [], attrProducerIds: [], attrOtherIds: []
    }
  }
  loadOneForEdit(id)
}

async function loadOneForEdit (id) {
  try {
    const { data: json } = await api.get(`${API}/cms/products/${encodeURIComponent(id)}`)
    if (!json?.ok || !json?.data) throw new Error('fetch failed')
    const p = json.data

    const ids = asIdList(p.attributes)
    const allergens = [], grapes = [], producers = [], others = [], unknown = []

    for (const aid of ids) {
      const a = attrById.value.get(aid)
      if (!a) { unknown.push(aid); continue }
      const k = kindToken(a)
      if (k === 'allergen') allergens.push(aid)
      else if (k === 'vitigno') grapes.push(aid)
      else if (k === 'produttore') producers.push(aid)
      else others.push(aid)
    }

    editor.value.originalAttrIds = ids.slice()
    editor.value.unknownAttrIds  = unknown.slice()
    editor.value.form = {
      name: p.name || '',
      sku: p.sku || '',
      price: toMoney(p.price),
      priceGlass: toMoney(p?.priceGlass ?? p?.prices?.glass),
      priceBottle: toMoney(p?.priceBottle ?? p?.prices?.bottle),
      active: p.active !== false,
      description: p.description || '',
      notes: p.notes || '',
      t_name_it: (p?.translations?.name?.it || ''),
      t_name_en: (p?.translations?.name?.en || ''),
      attrAllergenIds: allergens,
      attrGrapeIds: grapes,
      attrProducerIds: producers,
      attrOtherIds: others
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'Impossibile caricare il prodotto' })
    editor.value.open = false
  }
}

function trimOrNull (s) {
  const t = (s ?? '').toString().trim()
  return t.length ? t : null
}

async function saveEdit () {
  if (!canUpdateProducts.value) return
  if (!editor.value.id || !editor.value.form.name) {
    $q.notify({ type: 'warning', message: 'Nome obbligatorio' }); return
  }
  editor.value.saving = true
  try {
    // unione: selezionati noti + unknown (preservati)
    const attrIds = Array.from(new Set([
      ...(editor.value.form.attrAllergenIds || []),
      ...(editor.value.form.attrGrapeIds || []),
      ...(editor.value.form.attrProducerIds || []),
      ...(editor.value.form.attrOtherIds || []),
      ...(editor.value.unknownAttrIds || [])
    ]))

    const payload = {
      name: editor.value.form.name,
      sku: editor.value.form.sku || '',
      price: editor.value.form.price ?? null,
      priceGlass: editor.value.form.priceGlass ?? null,
      priceBottle: editor.value.form.priceBottle ?? null,
      active: !!editor.value.form.active,
      description: editor.value.form.description || '',
      notes: editor.value.form.notes || '',
      attributes: attrIds,
      translations: {
        name: {
          it: trimOrNull(editor.value.form.t_name_it),
          en: trimOrNull(editor.value.form.t_name_en)
        }
      }
    }

    const { data: json } = await api.put(`${API}/cms/products/${encodeURIComponent(editor.value.id)}`, payload)
    if (!json?.ok) throw new Error(json?.error || 'update failed')

    // Aggiorna gli array locali
    const id = editor.value.id
    const mergeLocal = (obj) => {
      const idx = (allProducts.value || []).findIndex(p => p._id === id)
      if (idx >= 0) {
        allProducts.value[idx] = { ...allProducts.value[idx], ...obj, attributes: attrIds }
      }
      for (const arr of Object.values(listsByCat.value)) {
        const i = (arr || []).findIndex(p => p._id === id)
        if (i >= 0) arr[i] = { ...arr[i], ...obj, attributes: attrIds }
      }
    }
    mergeLocal({
      name: payload.name,
      sku: payload.sku,
      price: toMoney(payload.price),
      priceGlass: payload.priceGlass,
      priceBottle: payload.priceBottle,
      translations: payload.translations
    })

    // aggiorno stato editor per prossime modifiche
    editor.value.originalAttrIds = attrIds.slice()
    editor.value.unknownAttrIds  = attrIds.filter(aid => !attrById.value.has(aid))

    $q.notify({ type: 'positive', message: 'Prodotto aggiornato' })
    editor.value.open = false
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'Salvataggio fallito' })
  } finally {
    editor.value.saving = false
  }
}

function confirmDelete (id, name = '') {
  if (!canDeleteProducts.value) return
  $q.dialog({
    title: 'Elimina prodotto',
    message: `Confermi l'eliminazione definitiva di <b>${name || 'prodotto'}</b>?`,
    html: true, cancel: true, persistent: true,
    ok: { label: 'Elimina', color: 'negative' }
  }).onOk(() => doDelete(id))
}
async function doDelete (id) {
  try {
    const { data: json } = await api.delete(`${API}/cms/products/${encodeURIComponent(id)}`)
    if (!json?.ok) throw new Error(json?.error || 'delete failed')
    allProducts.value = (allProducts.value || []).filter(p => p._id !== id)
    for (const key of Object.keys(listsByCat.value)) {
      listsByCat.value[key] = (listsByCat.value[key] || []).filter(p => p._id !== id)
    }
    $q.notify({ type: 'positive', message: 'Prodotto eliminato' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || 'Eliminazione fallita' })
  }
}

/* ================== VALIDAZIONI ================== */
const rRequired = v => (v && String(v).trim().length > 0) || 'Obbligatorio'
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #6a5acd, #7b68ee, #00bcd4);
}
.hero-input :deep(.q-field__native),
.hero-input :deep(.q-field__prefix),
.hero-input :deep(.q-field__suffix),
.hero-input :deep(.q-field__input) { color: #fff !important; }
.hero-input :deep(.q-field__control) {
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(6px);
  border-radius: 12px;
}

.item-row { background: var(--q-surface, #fff); border: 1px solid rgba(0,0,0,0.06); }
.body--dark .item-row { background: rgba(255,255,255,0.04); border-color: rgba(0,0,0,0.08); }

.thumb { background: #f5f5f5; border-radius: 10px; overflow: hidden; }
.item-row :deep(.q-avatar img) { width: 100%; height: 100%; object-fit: cover; }

.line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.caption-ellipsis { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* mini meta-row testuale sotto al nome */
.meta-row { font-size: 12px; line-height: 1.2; color: #4a4f58; }
.meta-label { font-weight: 600; margin-right: 4px; }
.meta-value { opacity: 0.95; }

.actions-col { flex: 0 0 auto; }

.comfy-list :deep(.q-item) { min-height: 64px; }

.drag-handle { cursor: grab; }
.drag-handle:active { cursor: grabbing; }

/* Chip rimossi (anteprima) */
.chip-removed {
  text-decoration: line-through;
  opacity: .8;
}

/* Avatar/immagini nelle chip/opzioni: forzo il fit */
.chip-avatar :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
