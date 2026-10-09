// Génère les déclinaisons web des photographies (assets/photos/<slug>.jpg)
// → public/img/gen/<slug>-<largeur>.avif|webp + src/content/images.gen.json
// (dimensions, couleur dominante, aperçu flou). Lancé avant dev/build, avec cache.
import sharp from 'sharp'
import { mkdir, readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname, basename } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'assets', 'photos')
const OUT = join(ROOT, 'public', 'img', 'gen')
const MANIFEST = join(ROOT, 'src', 'content', 'images.gen.json')
const WIDTHS = [640, 1280, 2048]
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'])

await mkdir(OUT, { recursive: true })
const previous = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {}
const manifest = {}
const files = (await readdir(SRC)).filter(f => EXT.has(extname(f).toLowerCase())).sort()

const hex = n => n.toString(16).padStart(2, '0')

for (const file of files) {
  const slug = basename(file, extname(file))
  const path = join(SRC, file)
  const buf = await readFile(path)
  const hash = createHash('sha1').update(buf).digest('hex').slice(0, 12)
  const prev = previous[slug]
  const outputs = (prev?.widths ?? []).flatMap(w => [`${slug}-${w}.avif`, `${slug}-${w}.webp`])
  if (prev && prev.hash === hash && outputs.every(o => existsSync(join(OUT, o)))) {
    manifest[slug] = prev
    continue
  }

  const base = sharp(buf).rotate()
  const { width, height } = await base.metadata()
  const widths = WIDTHS.filter(w => w < width)
  if (!widths.includes(Math.min(width, WIDTHS[WIDTHS.length - 1]))) widths.push(Math.min(width, WIDTHS[WIDTHS.length - 1]))

  for (const w of widths) {
    const resized = sharp(buf).rotate().resize({ width: w, withoutEnlargement: true })
    await resized.clone().avif({ quality: 52, effort: 5, chromaSubsampling: '4:2:0' }).toFile(join(OUT, `${slug}-${w}.avif`))
    await resized.clone().webp({ quality: 78, effort: 5 }).toFile(join(OUT, `${slug}-${w}.webp`))
  }

  const { dominant } = await sharp(buf).rotate().resize(64).stats()
  const lqip = await sharp(buf).rotate().resize(24).blur(1.2).webp({ quality: 40 }).toBuffer()

  manifest[slug] = {
    w: width,
    h: height,
    widths,
    color: `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}`,
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
    hash,
  }
  const kb = (await stat(join(OUT, `${slug}-${widths[widths.length - 1]}.avif`))).size / 1024
  console.log(`+ ${slug} ${width}×${height} → ${widths.join('/')} (${kb.toFixed(0)} Ko avif max)`)
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
console.log(`images : ${files.length} sources, manifeste à jour`)
