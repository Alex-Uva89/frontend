<!-- /frontend/src/components/print/MenuPrintDialog.vue -->
<template>
  <!-- Dialog di ANTEPRIMA -->
  <q-dialog
    v-model="openLocal"
    :maximized="$q.screen.lt.md"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="q-pa-md q-pb-xl" style="width: 90vw; max-width: 1240px; height: 90vh;">
      <!-- TOOLBAR SUPERIORE -->
      <q-toolbar class="toolbar flex justify-between">
        <span>
          <q-btn flat round dense icon="arrow_back" @click="close" />
          <q-toolbar-title  class="hidden lt-lg">Anteprima menù</q-toolbar-title>
        </span>
        <span>
          <q-toggle v-model="onlyActive" label="attivi" />
          <q-toggle v-model="includePrices" class="q-ml-md" label="Prezzi" />
          <q-toggle v-model="includeAllergens" class="q-ml-md" label="Allergen" />
        </span>
      </q-toolbar>

      <!-- Barra stile -->
      <q-card-section class="stylebar q-gutter-sm">
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-sm-6 col-md-3">
            <q-select v-model="preset" :options="presetOptions" emit-value map-options dense outlined
                      label="Preset stile" @update:model-value="applyPreset" />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-select v-model="fontChoice" :options="fontOptions" emit-value map-options dense outlined label="Font" />
          </div>
          <div class="col-6 col-sm-3 col-md-2">
            <q-input v-model.number="baseSize" type="number" dense outlined label="Base (px)" :min="11" :max="22" />
          </div>
          <div class="col-6 col-sm-3 col-md-2">
            <q-input v-model.number="titleScale" type="number" dense outlined label="Titolo (×)" :min="1.2" :max="2.4" step="0.1" />
          </div>
          <div class="col-6 col-sm-3 col-md-2">
            <q-input v-model.number="catScale" type="number" dense outlined label="Categoria (×)" :min="1.0" :max="1.8" step="0.1" />
          </div>
          <div class="col-6 col-sm-3 col-md-2">
            <q-select v-model="columns" :options="[{label:'1 col',value:1},{label:'2 col',value:2}]"
                      emit-value map-options dense outlined label="Colonne" />
          </div>
          <div class="col-6 col-sm-3 col-md-2">
            <q-select v-model="titleAlign"
              :options="[{label:'Titolo sx',value:'left'},{label:'Titolo centro',value:'center'},{label:'Titolo dx',value:'right'}]"
              emit-value map-options dense outlined label="Titolo" />
          </div>

          <!-- Colore + bottone tavolozza -->
          <div class="col-12 col-sm-6 col-md-3">
            <div class="row items-center no-wrap">
              <q-input v-model="accent" dense outlined label="Colore" type="color" class="col" />
              <q-btn
                flat round dense icon="palette" class="q-ml-sm"
                :title="'Apri tavolozza colori'"
                @click="paletteOpen = true"
              />
            </div>
          </div>

          <div class="col-6 col-sm-3 col-md-2 flex items-center">
            <q-toggle v-model="uppercaseCategories" label="CAT. maiuscolo" />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-select v-model="langLocal" :options="langOptions" emit-value map-options dense outlined label="Lingua" />
          </div>

          <!-- ===== FILTRO CATEGORIE ===== -->
          <div class="col-12">
            <q-select
              v-model="selectedCategoryRoots"
              :options="categoryOptions"
              option-label="label" option-value="id"
              multiple use-chips emit-value map-options dense outlined clearable
              :hint="'Vuoto = tutte le categorie'"
              label="Categorie da includere"
              :popup-content-style="{ maxHeight: '50vh' }"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- PREVIEW -->
      <q-card-section class="q-pt-none q-px-lg q-pb-lg" style="height: fit-content;">
        <div ref="previewRef" class="print-menu menu-columns" :data-cols="columns" :style="styleVars">
          <div class="page-frame">
            <div class="menu-header" :class="`ta-${titleAlign}`">
              <div class="menu-title">{{ businessName || 'Menù' }}</div>
            </div>

            <div class="page-body">
              <div v-for="g in groups" :key="g.id" class="category-block">
                <div class="cat-header" :class="{'tt-up': uppercaseCategories}">
                  {{ g.label }}
                </div>

                <div v-for="it in g.items" :key="it.id" class="item-row-print">
                  <div class="left">
                    <span class="name">{{ it.label }}</span>

                    <!-- ICONCINE ALLERGENI (solo icone) -->
                    <div v-if="includeAllergens && it.allergenIcons?.length" class="allergen-icons">
                      <q-icon v-for="(ico,i) in it.allergenIcons" :key="i" :name="ico || 'emergency'" size="14px" />
                    </div>

                    <!-- Riga VITIGNO/PRODUTTORE (senza etichette) -->
                    <div v-if="it.hasGrapeOrProducer" class="meta-line">
                      <span v-if="it.grapesLabel">{{ it.grapesLabel }}</span>
                      <span v-if="it.grapesLabel && it.producersLabel" class="sep">·</span>
                      <span v-if="it.producersLabel">{{ it.producersLabel }}</span>
                    </div>
                  </div>

                  <!-- Prezzi testuali con cifre tabulari -->
                  <div class="right" v-if="includePrices">
                    <template v-if="it.hasWine">
                      <span v-if="isPositive(it.glass)" class="price-chip">
                        <q-icon name="wine_bar" size="16px" class="price-ico" />{{ formatMoney(it.glass) }}
                      </span>
                      <span v-if="isPositive(it.bottle)" class="price-chip">
                        <q-icon name="liquor" size="16px" class="price-ico" />{{ formatMoney(it.bottle) }}
                      </span>
                    </template>
                    <template v-else>
                      <span v-if="isPositive(it.price)">{{ formatMoney(it.price) }}</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Spacer per preview/stampa -->
            <div class="footer-spacer" :style="{ height: spacerPx + 'px' }" aria-hidden="true"></div>

            <!-- FOOTER (mostrato in preview/stampa) -->
            <div ref="footerRef" class="menu-footer" v-if="footerText || coverCharge != null">
              <div v-if="coverCharge != null" class="cover-line">
                {{ coverLabel }}: <b>{{ Number(coverCharge).toFixed(2) }}</b>
              </div>
              <div v-if="footerText" class="disclaimer">{{ footerText }}</div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />
      <q-card-actions class="footer-actions" align="stretch">
        <q-btn color="primary" icon="print" size="lg" unelevated class="full-width"
               label="Stampa / Salva PDF" @click="printNow" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- FALLBACK window.print -->
  <div v-show="printReady" class="print-area print-menu menu-columns" :data-cols="columns" :style="styleVars">
    <div class="page-frame">
      <div class="menu-header" :class="`ta-${titleAlign}`"><div class="menu-title">{{ businessName || 'Menù' }}</div></div>
      <div class="page-body">
        <div v-for="g in groups" :key="'p-'+g.id" class="category-block">
          <div class="cat-header" :class="{'tt-up': uppercaseCategories}">{{ g.label }}</div>
          <div v-for="it in g.items" :key="it.id" class="item-row-print">
            <div class="left">
              <span class="name">{{ it.label }}</span>

              <!-- ICONCINE ALLERGENI (solo icone) -->
              <div v-if="includeAllergens && it.allergenIcons?.length" class="allergen-icons">
                <q-icon v-for="(ico,i) in it.allergenIcons" :key="i" :name="ico || 'emergency'" size="14px" />
              </div>

              <!-- Riga VITIGNO/PRODUTTORE (senza etichette) -->
              <div v-if="it.hasGrapeOrProducer" class="meta-line">
                <span v-if="it.grapesLabel">{{ it.grapesLabel }}</span>
                <span v-if="it.grapesLabel && it.producersLabel" class="sep">·</span>
                <span v-if="it.producersLabel">{{ it.producersLabel }}</span>
              </div>
            </div>

            <!-- Stessa logica anche nel fallback -->
            <div class="right" v-if="includePrices">
              <template v-if="it.hasWine">
                <span v-if="isPositive(it.glass)" class="price-chip">
                  <q-icon name="wine_bar" size="16px" class="price-ico" />{{ formatMoney(it.glass) }}
                </span>
                <span v-if="isPositive(it.bottle)" class="price-chip">
                  <q-icon name="liquor" size="16px" class="price-ico" />{{ formatMoney(it.bottle) }}
                </span>
              </template>
              <template v-else>
                <span v-if="isPositive(it.price)">{{ formatMoney(it.price) }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
      <div class="footer-spacer" :style="{ height: spacerPx + 'px' }" aria-hidden="true"></div>
      <div class="menu-footer" v-if="footerText || coverCharge != null">
        <div v-if="coverCharge != null" class="cover-line">{{ coverLabel }}: <b>{{ Number(coverCharge).toFixed(2) }}</b></div>
        <div v-if="footerText" class="disclaimer">{{ footerText }}</div>
      </div>
    </div>
  </div>

  <!-- ===== Tavolozza colori (solo Material, 14 sfumature) ===== -->
  <q-dialog v-model="paletteOpen" persistent>
    <q-card style="width: 92vw; max-width: 780px;">
      <q-toolbar>
        <q-toolbar-title>Seleziona colore dalla tavolozza</q-toolbar-title>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>
      <q-separator />
      <q-card-section>
        <div v-for="grp in paletteList" :key="grp.group" class="q-mb-md">
          <div class="text-subtitle2 q-mb-xs">{{ grp.group }}</div>
          <div class="row q-col-gutter-xs">
            <div v-for="tok in grp.tokens" :key="tok.token" class="col-auto">
              <q-btn
                class="swatch"
                :style="{ backgroundColor: tok.hex }"
                :title="`${tok.token} · ${tok.hex}`"
                @click="selectAccent(tok.token)"
              />
            </div>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn flat label="Chiudi" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { colors } from 'quasar'
import { pickLocalized } from 'src/utils/i18n'
import html2pdfModule from 'html2pdf.js'
import html2canvas from 'html2canvas'

/* props */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  businessName: { type: String, default: '' },
  categoriesTree: { type: Array, default: () => [] },
  products: { type: Array, default: () => [] },
  attributes: { type: Array, default: () => [] },
  usePathInHeaders: { type: Boolean, default: false },
  language: { type: String, default: 'it' },
  footerI18n: {
    type: Object,
    default: () => ({
      it: 'Si prega di informarci di eventuali allergie alimentari. Il feedback è sempre benvenuto: condividilo con il tuo cameriere e online.',
      en: 'Please inform us of any food allergies. Feedback is always welcome: feel free to share it with your server and online.'
    })
  },
  coverCharge: { type: Number, default: null },
  coverLabelI18n: { type: Object, default: () => ({ it: 'Coperto', en: 'Cover charge' }) }
})
const emit = defineEmits(['update:modelValue'])

/* dialog */
const openLocal = ref(props.modelValue)
watch(() => props.modelValue, v => (openLocal.value = v))
watch(openLocal, v => { emit('update:modelValue', v); if (v) nextTick(recalcSpacer) })
function close () { emit('update:modelValue', false) }

/* toggles */
const onlyActive = ref(true)
const includePrices = ref(true)
const includeAllergens = ref(true)

/* i18n */
const langLocal = ref(props.language)
watch(() => props.language, v => { if (v) langLocal.value = v })
const langOptions = [{ label:'Italiano', value:'it' }, { label:'English', value:'en' }]
const footerText = computed(() => props.footerI18n?.[langLocal.value] || props.footerI18n?.it || '')
const coverLabel = computed(() => props.coverLabelI18n?.[langLocal.value] || props.coverLabelI18n?.it || 'Coperto')

/* preset & stile */
const preset = ref('classic')
const presetOptions = [
  { label:'Classico (pulito)', value:'classic' },
  { label:'Bistrò (moderno)', value:'bistro' },
  { label:'Trattoria (elegante)', value:'trattoria' },
  { label:'Minimal (essenziale)', value:'minimal' },
  { label:'Personalizzato', value:'custom' }
]
function applyPreset(val){
  switch(val){
    case 'classic':  fontChoice.value='system'; baseSize.value=13; titleScale.value=1.7; catScale.value=1.25; columns.value=1; titleAlign.value='right'; uppercaseCategories.value=true;  accent.value='#eff1f7'; break
    case 'bistro':   fontChoice.value='sans';   baseSize.value=14; titleScale.value=1.6; catScale.value=1.3;  columns.value=1; titleAlign.value='center';uppercaseCategories.value=false; accent.value='#eaf6ff'; break
    case 'trattoria':fontChoice.value='garamond';baseSize.value=14; titleScale.value=1.8; catScale.value=1.35; columns.value=1; titleAlign.value='center';uppercaseCategories.value=true;  accent.value='#fbf3e5'; break
    case 'minimal':  fontChoice.value='serif';  baseSize.value=13; titleScale.value=1.5; catScale.value=1.2;  columns.value=1; titleAlign.value='left'; uppercaseCategories.value=false; accent.value='#f5f5f7'; break
    default: break
  }
}
const fontOptions = [
  { label:'Sistema (pulito)', value:'system' },
  { label:'Sans moderna (Poppins→fallback)', value:'sans' },
  { label:'Serif elegante (Georgia)', value:'serif' },
  { label:'Display classico (Garamond)', value:'garamond' },
  { label:'Decima Mono Pro (tuo)', value:'decimaMono' },
  { label:'Brand Sans (tuo)', value:'brandSans' },
  { label:'Brand Serif (tuo)', value:'brandSerif' }
]
const fontChoice = ref('system')
const baseSize = ref(13)
const titleScale = ref(1.6)
const catScale = ref(1.25)
const columns = ref(1)
const titleAlign = ref('right')
const uppercaseCategories = ref(true)
const accent = ref('#eff1f7')
const styleVars = computed(() => {
  const stacks={
    system:"system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
    sans:"Poppins, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
    serif:"Georgia, 'Times New Roman', Times, serif",
    garamond:"Garamond, 'EB Garamond', 'Times New Roman', serif",
    decimaMono:"'Decima Mono Pro', ui-monospace, SFMono-Regular, Menlo, Monaco, 'Courier New', monospace",
    brandSans:"'Brand Sans', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    brandSerif:"'Brand Serif', Georgia, 'Times New Roman', serif",
  }
  const base = Math.max(11, Math.min(22, Number(baseSize.value)||13))
  return {
    '--menu-font-family': stacks[fontChoice.value] || stacks.system,
    '--menu-base': `${base}px`,
    '--menu-title': `${Math.round(base*(Number(titleScale.value)||1.6))}px`,
    '--menu-cat': `${Math.round(base*(Number(catScale.value)||1.25))}px`,
    '--menu-price': `${Math.round(base*1.1)}px`,
    '--menu-accent': accent.value || '#eff1f7'
  }
})

/* ======= DATI & MAPPING ======= */
function toId(x){ if(!x)return null; if(typeof x==='string')return x; if(x._ref)return x._ref; if(x._id)return x._id; if(x?._type==='reference'&&x?.ref)return x.ref; return null }

const catById = computed(()=>{
  const m=new Map(); const walk=n=>{ m.set(n._id,n); (n.children||[]).forEach(walk) }
  ;(props.categoriesTree||[]).forEach(walk); return m
})

function categoryPathLabel(id){
  if(!id) return ''
  const parts=[]; let cur=id
  while(cur){
    const n=catById.value.get(cur); if(!n) break
    const t = pickLocalized(n,'translations.title',langLocal.value) || n.title
    parts.push(t)
    let parent=null
    for(const [k,v] of catById.value.entries()){ if((v.children||[]).some(c=>toId(c)===cur)){ parent=k; break } }
    cur=parent
  }
  return parts.reverse().join(' / ')
}

const treeOrderIndex = computed(()=>{
  let idx=0; const m=new Map(); const walk=n=>{ m.set(n._id,idx++); (n.children||[]).forEach(walk) }
  ;(props.categoriesTree||[]).forEach(walk); return m
})

/* Opzioni per il filtro categorie (mostro il path completo) */
const categoryOptions = computed(() => {
  const out=[]
  const walk=(n, path='')=>{
    const labelBase = pickLocalized(n,'translations.title',langLocal.value) || n.title || ''
    const label = path ? `${path} / ${labelBase}` : labelBase
    out.push({ id:n._id, label })
    ;(n.children||[]).forEach(c=>walk(c, label))
  }
  ;(props.categoriesTree||[]).forEach(r=>walk(r,''))
  return out
})

/* Filtro categorie selezionate: se vuoto => tutte */
const selectedCategoryRoots = ref([])

/* Raccoglie discendenti (incluso il nodo) */
function collectDescendants(startId, out){
  if(!startId || out.has(startId)) return
  out.add(startId)
  const node = catById.value.get(startId)
  const kids = (node?.children||[]).map(toId).filter(Boolean)
  for(const k of kids) collectDescendants(k, out)
}

const allowedCategorySet = computed(()=>{
  const ids = (selectedCategoryRoots.value||[]).filter(Boolean)
  if(!ids.length) return null // null = nessun filtro
  const set = new Set()
  for(const id of ids) collectDescendants(id, set)
  return set
})

/* ===== Attributi ===== */
const attrById = computed(()=>{ const m=new Map(); for(const a of (props.attributes||[])) m.set(a._id,a); return m })
function pickAttrName (a) {
  const loc = a?.translations?.name?.[langLocal.value]
  return (loc && String(loc).trim()) || a?.name || ''
}
/** Normalizza il tipo attributo (stringa o reference) in token */
function kindToken (a) {
  const k = a?.kind
  let raw = ''
  if (!k) raw = ''
  else if (typeof k === 'string') raw = k
  else if (typeof k === 'object') raw = k.value || k.title || k.name || ''
  const s = String(raw).toLowerCase().trim()
  if (!s) return ''
  if (s.includes('allerg')) return 'allergen'
  if (['vitigno','grape','uva'].includes(s)) return 'vitigno'
  if (['produttore','producer','cantina','winery'].includes(s)) return 'produttore'
  return s
}
function kindListFromProd (p, target) {
  const ids=(p.attributes||[]).map(toId).filter(Boolean)
  const out=[]
  for(const id of ids){
    const a=attrById.value.get(id)
    if(!a) continue
    if (kindToken(a) === target) out.push(a)
  }
  return out
}
function listToLabel (arr) { return (arr||[]).map(pickAttrName).filter(Boolean).join(', ') }
function listToIcons (arr) { return (arr||[]).map(a => (a?.icon || '').trim()).filter(Boolean) }

/* ------- Prezzi: mostra SOLO valori > 0 ------- */
function toMoney (v) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}
function isPositive (v) {
  return Number.isFinite(v) && v > 0
}
function readGlass (p) {
  return toMoney(p?.priceGlass) ?? toMoney(p?._priceGlass) ?? toMoney(p?.prices?.glass)
}
function readBottle (p) {
  return toMoney(p?.priceBottle) ?? toMoney(p?._priceBottle) ?? toMoney(p?.prices?.bottle)
}
function formatMoney (n) { return isPositive(n) ? n.toFixed(2) : '' }

function productToRow(p){
  const label = pickLocalized(p,'translations.name',langLocal.value) || p.name
  const glass = readGlass(p)
  const bottle = readBottle(p)
  const wine = isPositive(glass) && isPositive(bottle)

  // attributi
  const allergenAttrs = kindListFromProd(p,'allergen')
  const grapes        = kindListFromProd(p,'vitigno')
  const producers     = kindListFromProd(p,'produttore')

  return {
    id: p._id,
    label,
    active: p.active !== false,

    // righe meta
    allergenIcons: listToIcons(allergenAttrs),
    grapesLabel:   listToLabel(grapes),
    producersLabel:listToLabel(producers),
    hasGrapeOrProducer: (grapes?.length||0) > 0 || (producers?.length||0) > 0,

    // prezzi
    hasWine: wine,
    glass: wine ? glass : null,
    bottle: wine ? bottle : null,
    price: wine ? null : toMoney(p.price)
  }
}

const directByCategory = computed(()=>{
  const m=new Map()
  const push=(cid,row)=>{ const cur=m.get(cid); if(Array.isArray(cur)) cur.push(row); else m.set(cid,[row]) }
  for(const p of (props.products||[])){
    const row=productToRow(p)
    const catIds=(p.categories||[]).map(toId).filter(Boolean)
    for(const c of catIds){ if(catById.value.has(c)) push(c,row) }
  }
  for(const [k,arr] of m.entries()){
    if(Array.isArray(arr)) arr.sort((a,b)=>(a.label||'').localeCompare(b.label||''))
    else m.set(k,[])
  }
  return m
})

const orderedCategoryIds = computed(()=>{
  const ids=Array.from(directByCategory.value.keys())
  const idx=treeOrderIndex.value
  ids.sort((a,b)=>(idx.get(a)??1e9)-(idx.get(b)??1e9))
  return ids
})

const groups = computed(()=>{
  const out=[]
  for(const cid of orderedCategoryIds.value){
    // filtro categorie: se ho un set di consentite e il cid non è incluso, salto
    if (allowedCategorySet.value && !allowedCategorySet.value.has(cid)) continue

    const base=directByCategory.value.get(cid)||[]
    const filtered=onlyActive.value? base.filter(it=>it.active): base
    if(!filtered.length) continue
    const title = props.usePathInHeaders
      ? categoryPathLabel(cid)
      : (pickLocalized(catById.value.get(cid),'translations.title',langLocal.value) || catById.value.get(cid)?.title || categoryPathLabel(cid))
    const items = includePrices.value
      ? filtered
      : filtered.map(it => ({ ...it, price:null, glass:null, bottle:null, hasWine:false }))
    out.push({ id:cid, label:title, items })
  }
  return out
})

/* ===== Footer sempre in basso (preview/stampa) ===== */
const previewRef = ref(null)
const footerRef  = ref(null)
const printReady = ref(false)

const MM_TO_PX = 96 / 25.4
const PAGE_HEIGHT_PX = 297 * MM_TO_PX
const PAGE_MARGIN_V_PX = 24 * MM_TO_PX // 12+12mm
const PAGE_CONTENT_PX = PAGE_HEIGHT_PX - PAGE_MARGIN_V_PX

const spacerPx = ref(0)
async function recalcSpacer(){
  await nextTick()
  const frame = previewRef.value?.querySelector('.page-frame'); if(!frame){ spacerPx.value=0; return }
  spacerPx.value = 0
  await nextTick()
  const total = frame.scrollHeight
  const rem = total % PAGE_CONTENT_PX
  const need = (PAGE_CONTENT_PX - rem) % PAGE_CONTENT_PX
  spacerPx.value = Math.round(need)
}
watch([
  groups, onlyActive, includePrices, includeAllergens,
  fontChoice, baseSize, titleScale, catScale, columns, titleAlign, uppercaseCategories, accent, langLocal,
  selectedCategoryRoots
], () => nextTick(recalcSpacer), { deep:true })
onMounted(()=>{ recalcSpacer(); window.addEventListener('resize', recalcSpacer) })
onUnmounted(()=> window.removeEventListener('resize', recalcSpacer))

/* ===== PDF: footer “fixed” disegnato sull’ULTIMA pagina ===== */
async function downloadPdf(){
  await recalcSpacer()

  const el = previewRef.value
  if(!el) return
  const html2pdf = (html2pdfModule?.default || html2pdfModule || window.html2pdf)
  if(!html2pdf) return

  el.classList.add('pdf-mode')
  const prevSpacer = spacerPx.value
  spacerPx.value = 0
  await nextTick()

  let footerImg = null, footerRatio = 0
  if (footerRef.value) {
    try {
      const canvas = await html2canvas(footerRef.value, { scale: 2, backgroundColor: null, useCORS: true })
      footerImg = canvas.toDataURL('image/png', 0.95)
      footerRatio = canvas.height / canvas.width
    } catch (e) {
      console.warn('html2canvas footer failed, fallback to text', e)
    }
  }

  const stamp = new Date(); const pad = n => String(n).padStart(2,'0')
  const nameSafe = (props.businessName || 'menu').toLowerCase().replace(/[^\w]+/g, '-')
  const fname = `${nameSafe}-${langLocal.value}-${stamp.getFullYear()}${pad(stamp.getMonth()+1)}${pad(stamp.getDate())}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}.pdf`
  const opt = {
    margin: [12,10,12,10],
    filename: fname,
    image: { type:'jpeg', quality:0.95 },
    html2canvas: { scale:2, useCORS:true, scrollY:0, scrollX:0, windowWidth: el.scrollWidth },
    jsPDF: { unit:'mm', format:'a4', orientation:'portrait', compress:true, putOnlyUsedFonts:true },
    pagebreak: { mode:['css','legacy'] }
  }

  await html2pdf().set(opt).from(el).toPdf().get('pdf').then((pdf)=>{
    const total = pdf.getNumberOfPages()
    pdf.setPage(total)
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const left  = opt.margin[3], right = opt.margin[1], bottom = opt.margin[2]
    const usableW = pageW - left - right

    if (footerImg && footerRatio > 0) {
      const h = usableW * footerRatio
      const x = left
      const y = pageH - bottom - h
      pdf.addImage(footerImg, 'PNG', x, y, usableW, h, undefined, 'FAST')
    } else {
      const line1 = (props.coverCharge != null) ? `${coverLabel.value}: ${Number(props.coverCharge).toFixed(2)}` : ''
      const line2 = footerText.value || ''
      pdf.setFontSize(9)
      const y = pageH - bottom + 2
      if (line1) pdf.text(line1, left, y - 6)
      if (line2) pdf.text(line2, left, y)
    }
  }).save()

  el.classList.remove('pdf-mode')
  spacerPx.value = prevSpacer
}

/* STAMPA: PDF prioritario, poi printThis, poi window.print */
async function printNow(){
  const html2pdf = (html2pdfModule?.default || html2pdfModule || window.html2pdf)
  if (html2pdf) { await downloadPdf(); return }
  if (window.$ && window.$.fn && typeof window.$.fn.printThis === 'function' && previewRef.value) {
    window.$(previewRef.value).printThis({ importCSS:true, importStyle:true, pageTitle:'', header:null, footer:null })
    return
  }
  printReady.value = true
  await nextTick(); window.print()
  setTimeout(()=>{ printReady.value=false }, 400)
}

/* ===== Tavolozza colori ===== */
const MATERIAL_TOKENS = ['red','pink','purple','deep-purple','indigo','blue','light-blue','cyan','teal','green','light-green','lime','yellow','amber','orange','deep-orange','brown','blue-grey','grey']
const SHADES = Array.from({ length: 14 }, (_, i) => i + 1)
const paletteOpen = ref(false)
function paletteHex(token){ try { return colors.getPaletteColor(token) || null } catch { return null } }
function selectAccent(token){
  const hx = paletteHex(token)
  if (hx) accent.value = hx
  paletteOpen.value = false
}
const paletteList = computed(() => MATERIAL_TOKENS.map(base => ({
  group: base,
  tokens: SHADES.map(n => {
    const token = `${base}-${n}`
    return { token, hex: paletteHex(token) }
  })
})))

/* preset iniziale */
applyPreset(preset.value)

/* export helpers to template */
defineExpose({ isPositive, formatMoney })
</script>

<style>
/* ====== Dialog responsive ====== */
.toolbar { padding:0 8px; }

/* ====== Base look (MOBILE FIRST) ====== */
.print-menu{
  --_font: var(--menu-font-family, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif);
  --_base: var(--menu-base, 13px);
  --_title: var(--menu-title, 22px);
  --_cat: var(--menu-cat, 16px);
  --_price: var(--menu-price, 14px);
  --_accent: var(--menu-accent, #eff1f7);
  font-family: var(--_font);
  color:#101114; line-height:1.35;
}

/* Simula A4 anche in preview */
.page-frame{ display:flex; flex-direction:column; min-height:calc(297mm - 24mm); }
.page-body{ flex:1 1 auto; overflow:visible; }

/* colonne preview */
.menu-columns{ column-gap:24px; }
.menu-columns[data-cols="2"]{ column-count:1; }

/* Header */
.menu-header{ margin:8px 0 16px; }
.menu-header.ta-left{ text-align:left; }
.menu-header.ta-center{ text-align:center; }
.menu-header.ta-right{ text-align:right; }
.menu-title{ font-size:var(--_title); font-weight:800; letter-spacing:.3px; }

/* Categorie */
.category-block{ break-inside:avoid; margin:18px 0 12px; padding:0; }
.cat-header{ display:inline-block; background:var(--_accent); padding:6px 10px; border-radius:10px;
  font-weight:800; font-size:var(--_cat); letter-spacing:.3px; margin-bottom:10px; }
.cat-header.tt-up{ text-transform:uppercase; }

/* Riga */
.item-row-print{
  display:grid;
  grid-template-columns: 1fr auto;
  align-items:baseline;
  gap:8px 12px;
  padding:6px 2px;
  border-bottom:1px dotted rgba(0,0,0,.12);
}
.item-row-print .name{ font-size:var(--_base); font-weight:600; }

/* meta (allergeni, vitigno/produttore) */
.meta-line{ font-size:calc(var(--_base) * 0.9); line-height:1.25; color:#3b3e46; }
.sep{ opacity:.5; margin:0 6px; }

/* Allergeni: solo icone */
.allergen-icons{
  display:flex;
  gap:6px;
  margin-top:2px;
  align-items:center;
}
.allergen-icons .q-icon{ opacity:.9; }

/* Prezzi a destra: cifre tabulari per allineamento stabile */
.item-row-print .right{
  font-size:var(--_price);
  font-weight:700;
  text-align:right;
  white-space:nowrap;
  display:flex;
  align-items:baseline;
  justify-content:flex-end;
  gap:8px;
  font-variant-numeric: tabular-nums;
}
.price-chip{ display:inline-flex; align-items:baseline; gap:6px; }

/* Icone prezzo (calice/bottiglia) */
.price-ico{ opacity:.8; margin-right:6px; line-height:1; transform: translateY(1px); }
.price-chip .abbr{ display:none; } /* non più usato */

/* Footer (preview/print) */
.menu-footer{ margin-top:auto; padding-top:10px; border-top:1px solid rgba(0,0,0,.08);
  font-size:calc(var(--_base)*0.9); color:#3b3e46; }
.menu-footer .cover-line{ margin-bottom:6px; }
.menu-footer .disclaimer{ opacity:.85; }

/* In modalità PDF nascondo solo gli elementi non necessari */
.pdf-mode .menu-footer,
.pdf-mode .footer-spacer { display:none !important; }

/* Barra stile */
.stylebar{ background:rgba(0,0,0,.02); }

/* Footer azione */
.footer-actions{ position:sticky; bottom:0; z-index:1; background:#fff; padding:12px 16px; }

/* Fallback area print */
.print-area{ display:none; }

/* Swatch */
.swatch {
  width: 26px;
  height: 26px;
  min-width: 26px;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.12);
}

/* Desktop */
@media (min-width:900px){ .menu-columns[data-cols="2"]{ column-count:2; } }

/* Stampa fallback */
@media print{
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .q-dialog, .q-layout, .q-page-container, .q-page, .q-dialog__inner, .q-dialog__backdrop { display:none !important; }
  .print-area{ display:block !important; padding:0 10mm; }
  @page{ margin:12mm 10mm; }
  .page-frame{ min-height:calc(297mm - 24mm); display:flex; flex-direction:column; }
  .page-body{ flex:1 1 auto; }
  .footer-actions{ display:none !important; }
}
</style>
