// Télécharge les photographies Wikimedia Commons retenues dans assets/photos/.
// Licences et auteurs : src/content/credits.ts.
// Relancer : npm run photos:fetch [-- --force] [slug…]
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'assets', 'photos')
const UA = 'gallerie-jacmel/1.0 (https://github.com/Rbil1y/gallerie-d-art-jacmel)'
const MAX = 2560

/** crop : fractions retirées sur chaque bord (filigranes, bords parasites). */
const PHOTOS = [
  { slug: 'maison-boucard', file: 'Maison Boucard à Jacmel.jpg', crop: { bottom: 0.2 } },
  { slug: 'rue-conti', file: 'Jacmel-haiti.jpg' },
  { slug: 'jacmel-1904', file: "Collectie Nationaal Museum van Wereldculturen RV-A103-1-246 'Straat te Jacmel (20 December)' Jacmel G. M. (Gerard Martinus) Versteeg (Fotograaf).jpg" },
  { slug: 'rade', file: 'Rade de Jacmel.jpg' },
  { slug: 'horizons', file: 'Mer plage Raymond-les-bains.jpg' },
  { slug: 'canot', file: 'Canot de pêche - Jacmel.jpg' },
  { slug: 'masques-mur', file: "Oeuvres d'art - Jacmel.jpg" },
  { slug: 'galerie-masques', file: "Gallérie d'œuvre.jpg" },
  { slug: 'lasiren', file: 'Haitian Metal Art (8321093754).jpg' },
  { slug: 'kochon', file: 'Kanaval in Jacmel Haiti 2014 10.jpg' },
]

async function originalUrl(file) {
  const params = new URLSearchParams({ action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url', format: 'json' })
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } })
  const data = await res.json()
  const page = Object.values(data.query.pages)[0]
  if (!page.imageinfo) throw new Error(`Introuvable sur Commons : ${file}`)
  return page.imageinfo[0].url
}

await mkdir(OUT, { recursive: true })
const force = process.argv.includes('--force')
const only = process.argv.slice(2).filter(a => !a.startsWith('--'))

for (const p of PHOTOS) {
  if (only.length && !only.includes(p.slug)) continue
  const dest = join(OUT, `${p.slug}.jpg`)
  if (existsSync(dest) && !force) { console.log(`= ${p.slug} (déjà là)`); continue }
  const url = await originalUrl(p.file)
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  let img = sharp(buf).rotate()
  if (p.crop) {
    const { width, height } = await sharp(buf).rotate().metadata()
    const c = { top: 0, right: 0, bottom: 0, left: 0, ...p.crop }
    img = img.extract({
      left: Math.round(width * c.left),
      top: Math.round(height * c.top),
      width: Math.round(width * (1 - c.left - c.right)),
      height: Math.round(height * (1 - c.top - c.bottom)),
    })
  }
  const out = await img
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer()
  await writeFile(dest, out)
  console.log(`+ ${p.slug} ${(buf.length / 1024 / 1024).toFixed(1)} Mo → ${(out.length / 1024).toFixed(0)} Ko`)
}
