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
          <q-toolbar-title class="hidden lt-lg">Anteprima</q-toolbar-title>
        </span>
        <span>
          <q-toggle v-model="onlyActive" label="Attivi" />
          <q-toggle v-model="includePrices" class="q-ml-md" label="Prezzi" />
          <q-toggle v-model="includeMarks" class="q-ml-md" label="Icone" />
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
            <q-input v-model.number="catScale" type="number" dense outlined label="Sezione (×)" :min="1.0" :max="1.8" step="0.1" />
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
              <q-btn flat round dense icon="palette" class="q-ml-sm" :title="'Apri tavolozza colori'" @click="paletteOpen = true" />
            </div>
          </div>

          <div class="col-6 col-sm-3 col-md-2 flex items-center">
            <q-toggle v-model="uppercaseSections" label="SEZ. maiuscolo" />
          </div>

          <!-- === Filtro categorie (nuovo) === -->
          <div class="col-12 col-sm-6 col-md-6">
            <q-select
              v-model="selectedCats"
              :options="catOptions"
              multiple
              emit-value
              map-options
              dense
              outlined
              use-chips
              label="Categorie da stampare (vuoto = tutte)"
              :hint="selectedCats?.length ? (selectedCats.length + ' selezionate') : 'Tutte'"
            />
            <div class="q-mt-xs">
              <q-btn flat dense size="sm" label="Tutte" @click="selectAllCats" />
              <q-btn flat dense size="sm" class="q-ml-sm" label="Nessuna" @click="selectedCats = []" />
            </div>
          </div>
          <!-- === /Filtro categorie === -->
        </div>
      </q-card-section>

      <q-separator />

      <!-- PREVIEW -->
      <q-card-section class="q-pt-none q-px-lg q-pb-lg" style="height: fit-content;">
        <div ref="previewRef" class="print-menu menu-columns" :data-cols="columns" :style="styleVars">
          <div class="page-frame">
            <div class="menu-header" :class="`ta-${titleAlign}`">
              <div class="menu-title">{{ title || 'Menù' }}</div>
            </div>

            <div class="page-body">
              <div v-for="sec in visibleSections" :key="sec.id" class="category-block">
                <div class="cat-header" :class="{'tt-up': uppercaseSections}">
                  {{ sec.title }}
                </div>

                <div v-for="it in sec.items" :key="it.id" class="item-row-print">
                  <div class="left">
                    <span class="name">{{ it.label }}</span>

                    <!-- Icone (es. allergeni) -->
                    <div v-if="includeMarks && (it.marks?.length)" class="marks-row">
                      <template v-for="(mk,i) in it.marks" :key="i">
                        <img v-if="mk.url" class="mark-img"
                             :src="mk.url"
                             :alt="mk.title || 'icon'"
                             crossorigin="anonymous"
                             decoding="async"
                             @error="(e)=>{ e.target.style.display='none' }" />
                        <q-icon v-else-if="mk.icon" :name="mk.icon" size="14px" />
                        <span v-else-if="mk.emoji" class="emoji">{{ mk.emoji }}</span>
                      </template>
                    </div>

                    <!-- Meta lines -->
                    <div v-for="(m,idx) in (it.metaLines || [])" :key="idx" class="meta-line">
                      {{ m }}
                    </div>
                  </div>

                  <!-- Prezzi -->
                  <div class="right" v-if="includePrices">
                    <template v-if="hasWine(it)">
                      <span v-if="isPositive(it.prices?.glass)" class="price-chip">
                        <q-icon name="wine_bar" class="abbr-icon" size="16px" />
                        {{ formatMoney(it.prices?.glass) }}
                      </span>
                      <span v-if="isPositive(it.prices?.bottle)" class="price-chip">
                        <q-icon name="liquor" class="abbr-icon" size="16px" />
                        {{ formatMoney(it.prices?.bottle) }}
                      </span>
                    </template>
                    <template v-else>
                      <span v-if="isPositive(it.prices?.price)">{{ formatMoney(it.prices?.price) }}</span>
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
      <div class="menu-header" :class="`ta-${titleAlign}`"><div class="menu-title">{{ title || 'Menù' }}</div></div>
      <div class="page-body">
        <div v-for="sec in visibleSections" :key="'p-'+sec.id" class="category-block">
          <div class="cat-header" :class="{'tt-up': uppercaseSections}">{{ sec.title }}</div>

          <div v-for="it in sec.items" :key="it.id" class="item-row-print">
            <div class="left">
              <span class="name">{{ it.label }}</span>

              <div v-if="includeMarks && (it.marks?.length)" class="marks-row">
                <template v-for="(mk,i) in it.marks" :key="i">
                  <img v-if="mk.url" class="mark-img"
                       :src="mk.url"
                       :alt="mk.title || 'icon'"
                       crossorigin="anonymous"
                       decoding="async"
                       @error="(e)=>{ e.target.style.display='none' }" />
                  <q-icon v-else-if="mk.icon" :name="mk.icon" size="14px" />
                  <span v-else-if="mk.emoji" class="emoji">{{ mk.emoji }}</span>
                </template>
              </div>

              <div v-for="(m,idx) in (it.metaLines || [])" :key="idx" class="meta-line">
                {{ m }}
              </div>
            </div>

            <div class="right" v-if="includePrices">
              <template v-if="hasWine(it)">
                <span v-if="isPositive(it.prices?.glass)" class="price-chip">
                  <q-icon name="wine_bar" class="abbr-icon" size="16px" />
                  {{ formatMoney(it.prices?.glass) }}
                </span>
                <span v-if="isPositive(it.prices?.bottle)" class="price-chip">
                  <q-icon name="liquor" class="abbr-icon" size="16px" />
                  {{ formatMoney(it.prices?.bottle) }}
                </span>
              </template>
              <template v-else>
                <span v-if="isPositive(it.prices?.price)">{{ formatMoney(it.prices?.price) }}</span>
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

  <!-- ===== Tavolozza colori ===== -->
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
              <q-btn class="swatch" :style="{ backgroundColor: tok.hex }" :title="`${tok.token} · ${tok.hex}`" @click="selectAccent(tok.token)" />
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
import html2pdfModule from 'html2pdf.js'
import html2canvas from 'html2canvas'

/* ===================================
   PROPS: dati già PRONTI dal genitore
   =================================== */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title:      { type: String,  default: 'Menù' },
  sections:   { // [{ id, title, items:[{ id, label, active?, marks?, metaLines?, prices? }] }]
    type: Array, default: () => []
  },
  // Footer
  footerText:    { type: String, default: '' },
  coverCharge:   { type: Number, default: null },
  coverLabel:    { type: String, default: 'Coperto' }
})
const emit = defineEmits(['update:modelValue'])

/* dialog */
const openLocal = ref(props.modelValue)
watch(() => props.modelValue, v => (openLocal.value = v))
watch(openLocal, v => { emit('update:modelValue', v); if (v) nextTick(recalcSpacer) })
function close () { emit('update:modelValue', false) }

/* toggles */
const onlyActive   = ref(true)
const includePrices= ref(true)
const includeMarks = ref(true)

/* ===== Stile ===== */
const preset = ref('custom')
const presetOptions = [
  { label:'Classico (pulito)', value:'classic' },
  { label:'Bistrò (moderno)',  value:'bistro' },
  { label:'Trattoria (elegante)', value:'trattoria' },
  { label:'Minimal (essenziale)', value:'minimal' },
  { label:'Personalizzato', value:'custom' }
]
function applyPreset(val){
  switch(val){
    case 'classic':  fontChoice.value='system';    baseSize.value=13; titleScale.value=1.7; catScale.value=1.25; columns.value=1; titleAlign.value='right'; uppercaseSections.value=true;  accent.value='#eff1f7'; break
    case 'bistro':   fontChoice.value='sans';      baseSize.value=14; titleScale.value=1.6; catScale.value=1.3;  columns.value=1; titleAlign.value='center';uppercaseSections.value=false; accent.value='#eaf6ff'; break
    case 'trattoria':fontChoice.value='garamond';  baseSize.value=14; titleScale.value=1.8; catScale.value=1.35; columns.value=1; titleAlign.value='center';uppercaseSections.value=true;  accent.value='#fbf3e5'; break
    case 'minimal':  fontChoice.value='serif';     baseSize.value=13; titleScale.value=1.5; catScale.value=1.2;  columns.value=1; titleAlign.value='left'; uppercaseSections.value=false; accent.value='#f5f5f7'; break
    case 'custom': default: break
  }
}
const fontOptions = [
  { label:'Decima Mono Pro (tuo)', value:'decimaMono' },
  { label:'Sistema (pulito)', value:'system' },
  { label:'Sans moderna (Poppins→fallback)', value:'sans' },
  { label:'Serif elegante (Georgia)', value:'serif' },
  { label:'Display classico (Garamond)', value:'garamond' },
  { label:'Brand Sans (tuo)', value:'brandSans' },
  { label:'Brand Serif (tuo)', value:'brandSerif' }
]
const fontChoice = ref('decimaMono')
const baseSize   = ref(13)
const titleScale = ref(1.6)
const catScale   = ref(1.25)
const columns    = ref(1)
const titleAlign = ref('right')
const uppercaseSections = ref(true)
const accent     = ref('#eff1f7')
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
    '--menu-font-family': stacks[fontChoice.value] || stacks.decimaMono,
    '--menu-base': `${base}px`,
    '--menu-title': `${Math.round(base*(Number(titleScale.value)||1.6))}px`,
    '--menu-cat': `${Math.round(base*(Number(catScale.value)||1.25))}px`,
    '--menu-price': `${Math.round(base*1.1)}px`,
    '--menu-accent': accent.value || '#eff1f7'
  }
})

/* ===== Filtro categorie (nuovo) ===== */
const selectedCats = ref([])

function sectionId (sec, idx) {
  if (sec?.id) return String(sec.id)
  const base = (sec?.title || `Sezione ${idx + 1}`).toLowerCase().replace(/[^\w]+/g, '-')
  return `sec-${idx}-${base}`
}

const catOptions = computed(() => {
  return (props.sections || []).map((sec, idx) => ({
    label: sec?.title || `Sezione ${idx + 1}`,
    value: sectionId(sec, idx)
  }))
})

function selectAllCats () {
  selectedCats.value = catOptions.value.map(o => o.value)
}

/* ====== Dati visibili (con filtro categorie) ====== */
const visibleSections = computed(() => {
  const chosen = new Set(selectedCats.value || [])
  const out = []
  ;(props.sections || []).forEach((sec, idx) => {
    if (!sec || !Array.isArray(sec.items)) return

    const sid = sectionId(sec, idx)
    if (chosen.size > 0 && !chosen.has(sid)) return

    const items = onlyActive.value
      ? sec.items.filter(it => it?.active !== false)
      : sec.items.slice()

    if (!items.length) return
    out.push({ id: sid, title: sec.title || '', items })
  })
  return out
})

/* ====== Prezzi ====== */
function isPositive (v) { const n = Number(v); return Number.isFinite(n) && n > 0 }
function hasWine (it) { return isPositive(it?.prices?.glass) && isPositive(it?.prices?.bottle) }
function formatMoney (n) { return isPositive(n) ? Number(n).toFixed(2) : '' }

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
  visibleSections, onlyActive, includePrices, includeMarks,
  fontChoice, baseSize, titleScale, catScale, columns, titleAlign, uppercaseSections, accent,
  selectedCats // <— ricalcola quando cambia il filtro
], () => nextTick(recalcSpacer), { deep:true })
onMounted(()=>{ if (preset.value !== 'custom') applyPreset(preset.value); recalcSpacer(); window.addEventListener('resize', recalcSpacer) })
onUnmounted(()=> window.removeEventListener('resize', recalcSpacer))

/* ===== PDF ===== */
async function downloadPdf(){
  await recalcSpacer()

  const rootEl = previewRef.value?.querySelector('.page-frame')
  if(!rootEl) return
  const html2pdf = (html2pdfModule?.default || html2pdfModule || window.html2pdf)
  if(!html2pdf) return

  rootEl.classList.add('pdf-mode')
  const prevSpacer = spacerPx.value
  spacerPx.value = 0
  await nextTick()

  let footerImg = null, footerRatio = 0
  if (footerRef.value) {
    try {
      const canvas = await html2canvas(footerRef.value, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 5000
      })
      footerImg = canvas.toDataURL('image/png', 0.95)
      footerRatio = canvas.height / canvas.width
    } catch (e) {
      console.warn('html2canvas footer failed, fallback to text', e)
    }
  }

  const stamp = new Date(); const pad = n => String(n).padStart(2,'0')
  const nameSafe = (props.title || 'menu').toLowerCase().replace(/[^\w]+/g, '-')
  const fname = `${nameSafe}-${stamp.getFullYear()}${pad(stamp.getMonth()+1)}${pad(stamp.getDate())}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}.pdf`
  const opt = {
    margin: [12,10,12,10],
    filename: fname,
    image: { type:'jpeg', quality:0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      imageTimeout: 8000,
      backgroundColor: '#ffffff',
      scrollY: 0, scrollX: 0,
      windowWidth: rootEl.scrollWidth
    },
    jsPDF: { unit:'mm', format:'a4', orientation:'portrait', compress:true, putOnlyUsedFonts:true },
    pagebreak: { mode:['css','legacy'], avoid: ['.category-block'] }
  }

  await html2pdf().set(opt).from(rootEl).toPdf().get('pdf').then((pdf)=>{
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
      const line1 = (props.coverCharge != null) ? `${props.coverLabel}: ${Number(props.coverCharge).toFixed(2)}` : ''
      const line2 = props.footerText || ''
      pdf.setFontSize(9)
      const y = pageH - bottom + 2
      if (line1) pdf.text(line1, left, y - 6)
      if (line2) pdf.text(line2, left, y)
    }
  }).save()

  rootEl.classList.remove('pdf-mode')
  spacerPx.value = prevSpacer
}

/* STAMPA: PDF prioritario, fallback a window.print */
async function printNow(){
  const html2pdf = (html2pdfModule?.default || html2pdfModule || window.html2pdf)
  if (html2pdf) { await downloadPdf(); return }
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

/* Sezioni */
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

/* meta */
.meta-line{ font-size:calc(var(--_base) * 0.9); line-height:1.25; color:#3b3e46; }
.sep{ opacity:.5; margin:0 6px; }

/* Icone (es. allergeni) */
.marks-row{ display:flex; gap:6px; margin-top:2px; align-items:center; }
.mark-img{ width:14px; height:14px; object-fit:contain; display:inline-block; vertical-align:middle; }
.emoji{ font-size:14px; line-height:1; }

/* Prezzi */
.item-row-print .right{
  font-size:var(--_price);
  font-weight:700;
  text-align:right;
  white-space:nowrap;
  display:flex;
  align-items:baseline;
  justify-content:flex-end;
  gap:10px;
  font-variant-numeric: tabular-nums;
}
.price-chip{ display:inline-flex; align-items:center; gap:6px; }
.abbr-icon{ opacity:.75; }

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
