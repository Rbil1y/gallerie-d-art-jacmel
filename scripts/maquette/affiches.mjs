// Tire les deux affiches de la maquette (jour, nuit) : l’image montrée pendant que la 3D se charge,
// et sur les appareils qui ne la font pas tourner. Le serveur de développement doit tourner.
// npm run dev, puis : npm run maquette:affiches [port]
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const PORT_DEV = process.argv[2] ?? '5177'
const T = 2048
// le socle occupe 75 % de l’affiche, pour que son ombre tienne dedans ; à reporter dans seuil.css
const E = 1.12
const SORTIE = join(ROOT, 'assets', 'photos')
mkdirSync(SORTIE, { recursive: true })

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(c => c && existsSync(c))
if (!CHROME) throw new Error('Chrome introuvable : définissez CHROME=/chemin/vers/chrome')
const port = 9600 + Math.floor(Math.random() * 300)
const profil = join(tmpdir(), `maquette-${port}`)
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profil}`, '--no-first-run', '--hide-scrollbars', '--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11', 'about:blank'], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let cible
for (let i = 0; i < 80 && !cible; i++) {
  await sleep(200)
  try {
    cible = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page')
  } catch {}
}
const ws = new WebSocket(cible.webSocketDebuggerUrl)
await new Promise(r => (ws.onopen = r))
let id = 0
const attente = new Map()
ws.onmessage = e => {
  const m = JSON.parse(e.data)
  if (m.id && attente.has(m.id)) {
    attente.get(m.id)(m)
    attente.delete(m.id)
  }
  if (m.method === 'Runtime.exceptionThrown') console.log('ERREUR', m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text)
}
const send = (method, params = {}) => new Promise(r => { const i = ++id; attente.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: T, height: T, deviceScaleFactor: 1, mobile: false })
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
let point
for (const [nom, q] of [
  ['jacmel-maquette.png', ''],
  ['jacmel-maquette-nuit.png', '&nuit'],
]) {
  await send('Page.navigate', { url: `http://localhost:${PORT_DEV}/scripts/maquette/atelier.html?e=${E}${q}` })
  await sleep(600)
  for (let i = 0; i < 400; i++) {
    await sleep(150)
    if (await ev('!!window.__pret')) break
  }
  await sleep(1200)
  await ev('__m.rendre()')
  point = JSON.parse(await ev(`JSON.stringify(__m.pointGalerie())`))
  await sleep(300)
  const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(join(SORTIE, nom), Buffer.from(s.result.data, 'base64'))
  console.log(nom, 'tirée')
}
// repère du point rouge, en fraction de l’affiche
const gen = join(ROOT, 'src', 'content', 'maquette.gen.json')
const d = JSON.parse(readFileSync(gen, 'utf8'))
writeFileSync(gen, JSON.stringify({ ...d, point: [+(point.x / T).toFixed(4), +(point.y / T).toFixed(4)] }) + String.fromCharCode(10))
console.log('point rouge', point)
ws.close()
proc.kill()
await sleep(400)
try {
  rmSync(profil, { recursive: true, force: true })
} catch {}
process.exit(0)
