// scripts/gen-material-icons-twotone.js
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Uscita dedicata twotone
const OUTPUT = path.resolve(process.cwd(), 'src/assets/icons/material-icons.twotone.json')

// Localizza il pacchetto svg
const pkgPath = require.resolve('@material-design-icons/svg/package.json')
const baseDir = path.join(path.dirname(pkgPath))

// Solo la variante two-tone (attenzione al trattino!)
const VARIANT_DIR = path.join(baseDir, 'two-tone')

async function walk(dir) {
  const out = []
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...await walk(full))
    } else if (entry.isFile() && entry.name.endsWith('.svg')) {
      out.push(full)
    }
  }
  return out
}

async function main () {
  const names = new Set()

  try {
    // Struttura: two-tone/<category>/*.svg
    const svgFiles = await walk(VARIANT_DIR)
    for (const f of svgFiles) {
      const base = path.basename(f, '.svg') // es. "inventory_2"
      names.add(base)
    }
  } catch (e) {
    console.error('Impossibile leggere la variante two-tone:', e)
    process.exit(1)
  }

  const list = Array.from(names).sort((a, b) => a.localeCompare(b, 'en'))
  await fs.mkdir(path.dirname(OUTPUT), { recursive: true })
  await fs.writeFile(OUTPUT, JSON.stringify(list, null, 2), 'utf8')

  console.log(`✅ Generato ${list.length} icone (two-tone) in: ${OUTPUT}`)
}

main().catch(err => {
  console.error('Errore generazione elenco icone:', err)
  process.exit(1)
})
