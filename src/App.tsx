// Gallerie d’art de Jacmel — « La maison aux persiennes ».
// On ouvre les persiennes, la lumière réelle de Jacmel entre, les œuvres sont au mur.
import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { LightProvider } from './state/light'
import { RouteProvider, useRoute } from './state/route'
import { ScrollProvider, useScrollApi } from './state/scroll'
import { ExpoProvider } from './state/expo'
import { SelectionProvider } from './state/selection'
import { Intro } from './components/Intro'
import { Header, Dock } from './components/Header'
import { Viewer } from './components/Viewer'
import { Reader } from './components/Reader'
import { PlanOverlay, SelectionDrawer } from './components/Overlays'
import { Seuil } from './sections/Seuil'
import { Maison } from './sections/Maison'
import { Exposition } from './sections/Exposition'
import { Ateliers } from './sections/Ateliers'
import { Carnets } from './sections/Carnets'
import { Comptoir } from './sections/Comptoir'
import { Fermeture } from './sections/Fermeture'

const SECTION_HASHES = ['maison', 'exposition', 'ateliers', 'carnets', 'comptoir', 'fermeture']

function Site() {
  const { route } = useRoute()
  const { scrollTo } = useScrollApi()
  const [entered, setEntered] = useState(false)
  const overlay = route.kind !== 'none'

  // lien direct vers une section (#comptoir…) : on y descend une fois les persiennes ouvertes
  useEffect(() => {
    if (!entered) return
    const h = location.hash.slice(1)
    if (SECTION_HASHES.includes(h)) requestAnimationFrame(() => scrollTo(`#${h}`, { immediate: true }))
  }, [entered, scrollTo])

  return (
    <>
      <a className="skip" href="#exposition">
        Aller à l’exposition
      </a>
      <Intro onOpen={() => setEntered(true)} onDone={() => undefined} />
      <div className="site" inert={overlay}>
        <Header />
        <main id="main">
          <Seuil entered={entered} />
          <Maison />
          <Exposition />
          <Ateliers />
          <Carnets />
          <Comptoir />
        </main>
        <Fermeture />
        <Dock />
      </div>
      <AnimatePresence>
        {route.kind === 'oeuvre' && <Viewer key="viewer" id={route.id} />}
        {route.kind === 'carnet' && <Reader key="reader" no={route.no} />}
        {route.kind === 'plan' && <PlanOverlay key="plan" />}
        {route.kind === 'selection' && <SelectionDrawer key="selection" />}
      </AnimatePresence>
    </>
  )
}

export default function App() {
  return (
    <LightProvider>
      <RouteProvider>
        <ScrollProvider>
          <ExpoProvider>
            <SelectionProvider>
              <Site />
            </SelectionProvider>
          </ExpoProvider>
        </ScrollProvider>
      </RouteProvider>
    </LightProvider>
  )
}
