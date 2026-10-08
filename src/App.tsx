import { useEffect, useMemo, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useReducedMotion, useMotionValue, type MotionValue } from 'motion/react'
import Lenis from 'lenis'
import { artworks, artists, journal, hours, expo, manifesto, stats, openState, IMG, type Artwork } from './data'

/* ============================== utils ============================== */

function useLenis(enabled: boolean) {
  const ref = useRef<Lenis | null>(null)
  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.05,
      lerp: 0.09,
    })
    ref.current = lenis
    let raf = 0
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); lenis.destroy(); ref.current = null }
  }, [enabled])
  return ref
}

function useJacmelTime() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const time = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'America/Port-au-Prince', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(now)
  return { now, time, state: openState(now) }
}

function useInViewOnce(ref: React.RefObject<HTMLElement | null>, margin = '-10% 0px -10% 0px') {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setOn(true); return }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setOn(true); io.disconnect() }
    }, { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return on
}

/* ============================== icons ============================== */

const IcoNE = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M2.2 9.8 9.8 2.2M3.6 2.2h6.2v6.2" />
  </svg>
)
const IcoArr = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M0 6h14M9.5 1 15 6l-5.5 5" />
  </svg>
)
const IcoX = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M1 1l12 12M13 1 1 13" />
  </svg>
)
const IcoUp = () => (
  <svg width="12" height="13" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M6 13V1M1 6.2 6 1l5 5.2" />
  </svg>
)
const ArchMark = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size + 2} viewBox="0 0 18 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
    <path d="M2 19V9a7 7 0 0 1 14 0v10" /><path d="M2 19h14" /><path d="M9 2v4" strokeWidth="1.2" />
  </svg>
)

/* ============================== primitives ============================== */

function Magnetic({ children, strength = 0.32 }: { children: ReactNode, strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el || window.matchMedia('(pointer:coarse)').matches) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2)
    const y = e.clientY - (r.top + r.height / 2)
    el.style.transform = `translate3d(${(x * strength).toFixed(1)}px,${(y * strength).toFixed(1)}px,0)`
  }
  const onLeave = () => { if (ref.current) ref.current.style.transform = 'translate3d(0,0,0)' }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ display: 'inline-block', transition: 'transform .45s cubic-bezier(.16,1,.3,1)' }}>
      {children}
    </div>
  )
}

function Rise({ children, delay = 0 }: { children: ReactNode, delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const on = useInViewOnce(ref)
  return (
    <span style={{ display: 'block', overflow: 'hidden' }}>
      <span ref={ref} style={{
        display: 'block',
        transform: on ? 'translateY(0%)' : 'translateY(112%)',
        transition: `transform .9s cubic-bezier(.76,0,.24,1) ${delay}s`,
        willChange: 'transform',
      }}>{children}</span>
    </span>
  )
}

function Clip({ children, delay = 0, scale = 1.14 }: { children: ReactNode, delay?: number, scale?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const on = useInViewOnce(ref)
  return (
    <div ref={ref} style={{ overflow: 'hidden' }}>
      <div style={{
        clipPath: on ? 'inset(0% 0% 0% 0%)' : 'inset(6% 4% 94% 4%)',
        transform: on ? 'scale(1)' : `scale(${scale})`,
        transition: `clip-path 1.05s cubic-bezier(.76,0,.24,1) ${delay}s, transform 1.3s cubic-bezier(.16,1,.3,1) ${delay}s`,
        willChange: 'clip-path, transform',
      }}>{children}</div>
    </div>
  )
}

function Letters({ t, base, play }: { t: string, base: number, play: boolean }) {
  return (
    <>
      {t.split('').map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          style={{ display: 'inline-block', willChange: 'transform' }}
          initial={{ y: '118%', rotate: 4 }}
          animate={{ y: play ? '0%' : '118%', rotate: play ? 0 : 4 }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: base + i * 0.028 }}
        >{ch === ' ' ? ' ' : ch}</motion.span>
      ))}
    </>
  )
}

/** Manifesto word scrub — opacity driven by scroll through the block. */
function ScrubWords({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.82', 'end 0.42'] })
  const words = useMemo(() => text.split(' '), [text])
  return (
    <p ref={ref} className="scrub">
      {words.map((w, i) => <Word key={i} prog={scrollYProgress} i={i} total={words.length} w={w} />)}
    </p>
  )
}
function Word({ prog, i, total, w }: { prog: MotionValue<number>, i: number, total: number, w: string }) {
  const start = i / total
  const end = Math.min(1, start + 1.5 / total)
  const o = useTransform(prog, [start, end], [0.13, 1])
  const y = useTransform(prog, [start, end], [8, 0])
  return <motion.span style={{ opacity: o, y, display: 'inline-block' }}>{w}&nbsp;</motion.span>
}

/* ============================== preloader ============================== */

const PRE_WORDS = ['Pigment', 'Sel', 'Lumière', 'Kanaval', 'Registre']

function Preloader({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0)
  const [wi, setWi] = useState(0)
  const doneRef = useRef(false)
  const timers = useRef<{ wid?: ReturnType<typeof setInterval>, raf?: number }>({})
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    if (timers.current.wid) clearInterval(timers.current.wid)
    if (timers.current.raf) cancelAnimationFrame(timers.current.raf)
    setN(100)
    setTimeout(() => onDoneRef.current(), 450)
  }
  useEffect(() => {
    /* fire-and-forget: images warm the cache but NEVER block the counter */
    ;[IMG + 'hero-salle.jpg', IMG + 'art-baie.jpg', IMG + 'k6.jpg', IMG + 'art-totem.jpg', IMG + 'art-femme.jpg', IMG + 'k4.jpg'].forEach(s => {
      const im = new Image()
      im.src = s
    })
    const t0 = performance.now()
    const DUR = 1900
    timers.current.wid = setInterval(() => setWi(v => (v + 1) % PRE_WORDS.length), 340)
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / DUR)
      setN(Math.floor((1 - Math.pow(1 - p, 3)) * 100))
      if (p >= 1) { finish(); return }
      timers.current.raf = requestAnimationFrame(tick)
    }
    timers.current.raf = requestAnimationFrame(tick)
    const safety = setTimeout(finish, 4500)
    return () => {
      if (timers.current.wid) clearInterval(timers.current.wid)
      if (timers.current.raf) cancelAnimationFrame(timers.current.raf)
      clearTimeout(safety)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <motion.div
      className="pre"
      exit={{ y: '-100%' }}
      transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1] }}
      onClick={finish}
    >
      <div className="pre-top mono"><span>Registre № 1987 — J</span><span>Jacmel · Haïti</span></div>
      <div className="pre-mid">
        <AnimatePresence mode="wait">
          <motion.span
            key={wi}
            className="pre-word"
            initial={{ y: '110%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }} exit={{ y: '-110%', opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >{PRE_WORDS[wi]}</motion.span>
        </AnimatePresence>
      </div>
      <div className="pre-bot">
        <div className="pre-bar"><div className="pre-fill" style={{ transform: `scaleX(${n / 100})` }} /></div>
        <div className="pre-meta mono"><span>Ouverture du registre</span><span>{String(n).padStart(3, '0')} / 100</span></div>
      </div>
      <div className="pre-count" aria-hidden>{String(n).padStart(3, '0')}</div>
    </motion.div>
  )
}

/* ============================== section head ============================== */

function SHead({ no, label, right, children }: { no: string, label: string, right?: string, children: ReactNode }) {
  return (
    <div className="shead">
      <div className="shead-top mono">
        <span><span className="idx">({no})</span>&ensp;{label}</span>
        {right && <span className="shead-right">{right}</span>}
      </div>
      <h2 className="shead-title">{children}</h2>
    </div>
  )
}

/* ============================== exposition card ============================== */

function ExhCard({ a, prog, i, onOpen, total }: { a: Artwork, prog: MotionValue<number>, i: number, onOpen: () => void, total: number }) {
  const x = useTransform(prog, [0, 1], [(i % 3) * 30 - 30, (i % 3) * -30 + 30])
  return (
    <article className="exh-card" data-cursor="Voir" onClick={onOpen} tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onOpen() }} aria-label={`${a.title}, ${a.artist}`}>
      <div className="exh-media">
        <span className="exh-idx mono">{String(i + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
        {a.status === 'Réservée' && <span className="exh-flag mono">Réservée</span>}
        <motion.img src={a.img} alt={`${a.title}, ${a.artist}`} loading="lazy" style={{ x, scale: 1.08 }} />
      </div>
      <div className="exh-cap">
        <div>
          <div className="exh-no mono">№ {a.id} · {a.salle}</div>
          <div className="exh-title">{a.title}</div>
          <div className="exh-artist">{a.artist} · {a.year}</div>
        </div>
        <span className="exh-price">{a.price}</span>
      </div>
    </article>
  )
}

/* ============================== app ============================== */

const NAV = [
  { id: '#collection', label: 'Collection', no: '01' },
  { id: '#exposition', label: 'Exposition', no: '02' },
  { id: '#artistes', label: 'Artistes', no: '03' },
  { id: '#journal', label: 'Journal', no: '04' },
]

export default function App() {
  const reduce = useReducedMotion()
  const [loading, setLoading] = useState(true)
  const lenisRef = useLenis(!loading)
  const { time, state } = useJacmelTime()
  const [cat, setCat] = useState<'all' | Artwork['cat']>('all')
  const [view, setView] = useState<'registre' | 'cimaise'>('registre')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)
  const [roomNav, setRoomNav] = useState(0)
  const [artistOpen, setArtistOpen] = useState<number | null>(0)

  const active = useMemo(
    () => artworks.find(a => a.id === activeId) ?? null,
    [activeId]
  )
  const activeIndex = useMemo(
    () => (active ? artworks.findIndex(a => a.id === active.id) : -1),
    [active]
  )

  /* header hide */
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > 260 && y > last)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* scroll lock */
  const overlayOpen = menuOpen || !!active
  useEffect(() => {
    if (overlayOpen) {
      lenisRef.current?.stop()
      document.documentElement.style.overflow = 'hidden'
      return () => { lenisRef.current?.start(); document.documentElement.style.overflow = '' }
    }
  }, [overlayOpen, lenisRef])

  /* esc + arrows */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); setActiveId(null) }
      if (active) {
        if (e.key === 'ArrowRight') setActiveId(artworks[(activeIndex + 1) % artworks.length].id)
        if (e.key === 'ArrowLeft') setActiveId(artworks[(activeIndex - 1 + artworks.length) % artworks.length].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, activeIndex])

  /* focus management */
  const lastFocus = useRef<HTMLElement | null>(null)
  const menuCloseRef = useRef<HTMLButtonElement>(null)
  const roomCloseRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (menuOpen) { lastFocus.current = document.activeElement as HTMLElement | null; setTimeout(() => menuCloseRef.current?.focus(), 90) }
    else if (active) { lastFocus.current = document.activeElement as HTMLElement | null; setTimeout(() => roomCloseRef.current?.focus(), 90) }
    else if (lastFocus.current) { lastFocus.current.focus(); lastFocus.current = null }
  }, [menuOpen, active])

  /* custom cursor */
  const cursorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(pointer:coarse)').matches) return
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }
    const tgt = { x: pos.x, y: pos.y }
    let raf = 0
    const onMove = (e: MouseEvent) => { tgt.x = e.clientX; tgt.y = e.clientY }
    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest?.('[data-cursor]') as HTMLElement | null
      const c = cursorRef.current
      if (!c) return
      if (el) { c.classList.add('hover'); c.querySelector('.cursor-label')!.textContent = el.dataset.cursor || '' }
      else c.classList.remove('hover')
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    const loop = () => {
      pos.x += (tgt.x - pos.x) * 0.2
      pos.y += (tgt.y - pos.y) * 0.2
      if (cursorRef.current) cursorRef.current.style.transform = `translate3d(${pos.x - 40}px,${pos.y - 40}px,0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseover', onOver); cancelAnimationFrame(raf) }
  }, [])

  /* floating preview */
  const floatRef = useRef<HTMLDivElement>(null)
  const [floatImg, setFloatImg] = useState<string | null>(null)
  const lastImg = useRef<string>('')
  if (floatImg) lastImg.current = floatImg
  useEffect(() => {
    if (window.matchMedia('(pointer:coarse)').matches) return
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }
    const tgt = { x: pos.x, y: pos.y }
    let s = 0, raf = 0
    const onMove = (e: MouseEvent) => { tgt.x = e.clientX; tgt.y = e.clientY }
    window.addEventListener('mousemove', onMove)
    const loop = () => {
      pos.x += (tgt.x - pos.x) * 0.13
      pos.y += (tgt.y - pos.y) * 0.13
      s += ((floatImg ? 1 : 0) - s) * 0.15
      const rot = Math.max(-8, Math.min(8, (tgt.x - pos.x) * 0.08))
      if (floatRef.current) {
        floatRef.current.style.transform = `translate3d(${pos.x + 30}px,${pos.y - 200}px,0) rotate(${rot}deg) scale(${s.toFixed(3)})`
        floatRef.current.style.opacity = s.toFixed(3)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [floatImg])

  /* progress */
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  /* velocity marquee */
  const marqRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = marqRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let x = 0, raf = 0, last = window.scrollY, vel = 0
    const loop = () => {
      const y = window.scrollY
      vel += ((y - last) - vel) * 0.08
      last = y
      x -= 0.6 + Math.min(Math.abs(vel) * 0.1, 5.5)
      const w = el.scrollWidth / 2
      if (w > 0 && x <= -w) x += w
      el.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* hero parallax + mouse drift */
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress: heroProg } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroImgY = useTransform(heroProg, [0, 1], ['-6%', '12%'])
  const heroTitleY = useTransform(heroProg, [0, 1], ['0%', '26%'])
  const heroFade = useTransform(heroProg, [0, 0.72], [1, 0])
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const driftX = useSpring(useTransform(mx, v => v * 34), { stiffness: 55, damping: 18 })
  const driftY = useSpring(useTransform(my, v => v * 22), { stiffness: 55, damping: 18 })
  const driftX2 = useSpring(useTransform(mx, v => v * -26), { stiffness: 55, damping: 18 })
  const driftY2 = useSpring(useTransform(my, v => v * -16), { stiffness: 55, damping: 18 })
  const onHeroMouse = (e: React.MouseEvent) => {
    if (window.matchMedia('(pointer:coarse)').matches) return
    mx.set(e.clientX / window.innerWidth - 0.5)
    my.set(e.clientY / window.innerHeight - 0.5)
  }

  /* pinned exposition */
  const pinRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: pinProg } = useScroll({ target: pinRef, offset: ['start start', 'end end'] })
  const [maxX, setMaxX] = useState(0)
  useEffect(() => {
    const calc = () => {
      if (!trackRef.current || !pinRef.current) return
      setMaxX(Math.max(0, trackRef.current.scrollWidth - pinRef.current.clientWidth + 48))
    }
    calc()
    window.addEventListener('resize', calc)
    const t = setTimeout(calc, 600)
    return () => { window.removeEventListener('resize', calc); clearTimeout(t) }
  }, [])
  const px = useTransform(pinProg, [0, 1], [0, -maxX])
  const pxSpring = useSpring(px, { stiffness: 82, damping: 27, mass: 0.7 })
  const pinCount = useTransform(pinProg, [0, 1], [1, artworks.length])
  const [pinN, setPinN] = useState(1)
  useEffect(() => pinCount.on('change', v => setPinN(Math.round(v))), [pinCount])

  /* footer giant scrub */
  const footRef = useRef<HTMLElement>(null)
  const { scrollYProgress: footProg } = useScroll({ target: footRef, offset: ['start end', 'end end'] })
  const footY = useTransform(footProg, [0, 1], ['34%', '0%'])

  const filtered = useMemo(() => (cat === 'all' ? artworks : artworks.filter(a => a.cat === cat)), [cat])

  const navTo = (hash: string) => {
    setMenuOpen(false)
    setTimeout(() => {
      const l = lenisRef.current
      if (l) l.scrollTo(hash, { offset: -64, duration: 1.4 })
      else document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    }, menuOpen ? 350 : 0)
  }
  const toTop = () => {
    const l = lenisRef.current
    if (l) l.scrollTo(0, { duration: 1.5 })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const copyMail = () => {
    Promise.resolve(navigator.clipboard?.writeText('bonjour@gallerie.ht')).catch(() => {}).finally(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  const openRoom = (a: Artwork) => { setRoomNav(0); setActiveId(a.id) }

  const todayIdx = useMemo(() => {
    const d = new Intl.DateTimeFormat('fr-FR', { timeZone: 'America/Port-au-Prince', weekday: 'long' }).format(new Date()).toLowerCase()
    if (d.startsWith('lun')) return 3
    if (d.startsWith('sam')) return 1
    if (d.startsWith('dim')) return 2
    return 0
  }, [])

  return (
    <>
      <AnimatePresence>{loading && <Preloader onDone={() => setLoading(false)} />}</AnimatePresence>

      <a className="skip" href="#main">Aller au contenu</a>
      <div className="grain" aria-hidden />
      <div ref={cursorRef} className="cursor" aria-hidden><span className="cursor-label" /></div>
      <motion.div className="progress" style={{ scaleX }} aria-hidden />

      <div inert={overlayOpen}>
        {/* ======================= header ======================= */}
        <header className={`header ${hidden && !menuOpen ? 'hide' : ''}`} role="banner">
          <a className="brand" href="#" aria-label="Retour en haut" onClick={e => { e.preventDefault(); toTop() }}>
            <ArchMark />
            <span className="brand-name">Gallerie d’art <i>de Jacmel</i></span>
          </a>
          <div className="header-mid mono" aria-live="off">
            <span className={`dot ${state.open ? 'on' : ''}`} />
            <span className="hide-s">{state.label}</span>
            <span className="hide-s sep">·</span>
            <span>Jacmel {time}</span>
          </div>
          <div className="header-right">
            <nav className="nav" aria-label="Principale">
              {NAV.map(n => (
                <a key={n.id} href={n.id} onClick={e => { e.preventDefault(); navTo(n.id) }}>
                  <span className="roll"><span>{n.label}</span><span aria-hidden>{n.label}</span></span><sup>{n.no}</sup>
                </a>
              ))}
            </nav>
            <Magnetic><a className="header-cta" href="#visiter" onClick={e => { e.preventDefault(); navTo('#visiter') }}>Visiter</a></Magnetic>
            <button className={`burger ${menuOpen ? 'is-open' : ''}`} aria-label={menuOpen ? 'Fermer' : 'Ouvrir le menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>
              <span className="burger-lines"><span /><span /></span>
              <span className="burger-txt mono">{menuOpen ? 'Fermer' : 'Menu'}</span>
            </button>
          </div>
        </header>

        {/* ======================= menu ======================= */}
        <div id="menu" role="dialog" aria-modal="true" aria-label="Menu" className={`menu ${menuOpen ? 'is-open' : ''}`}>
          <div className="menu-top">
            <span className="mono dim">Registre № 1987 — J</span>
            <button ref={menuCloseRef} className="menu-close" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"><IcoX /></button>
          </div>
          <nav className="menu-links" aria-label="Menu complet">
            {[...NAV, { id: '#visiter', label: 'Visiter', no: '05' }].map((n, i) => (
              <a key={n.id} className="menu-link" href={n.id} onClick={e => { e.preventDefault(); navTo(n.id) }}
                onMouseEnter={() => setFloatImg(i < artworks.length ? artworks[i * 2 % artworks.length].img : null)}
                onMouseLeave={() => setFloatImg(null)}>
                <span className="no mono">0{n.no}</span>
                <span className="ml-t">{n.label}</span>
                <span className="ml-arr"><IcoArr /></span>
              </a>
            ))}
          </nav>
          <div className="menu-foot mono">
            <span>Rue Barranquilla · Mar–Dim 10 h–18 h</span>
            <span className="menu-socials">
              <a href="#" onClick={e => e.preventDefault()}>Instagram</a>
              <a href="#" onClick={e => e.preventDefault()}>Are.na</a>
              <a href="mailto:bonjour@gallerie.ht">bonjour@gallerie.ht</a>
            </span>
          </div>
        </div>

        {/* ======================= hero ======================= */}
        <section className="hero" ref={heroRef} aria-label="La maison" onMouseMove={onHeroMouse}>
          <div className="wrap hero-wrap">
            <h1 className="hero-awww" aria-label="Gallerie d’art — Jacmel, l’art haïtien à l’état brut">
              <motion.span className="ha-line ha-l1" style={{ y: heroTitleY, opacity: heroFade }} aria-hidden>
                <span className="ha-overflow">{reduce ? <span>GALLERIE</span> : <Letters t="GALLERIE" base={0.5} play={!loading} />}</span>
                <motion.span className="ha-chip" style={{ x: driftX, y: driftY }}
                  initial={{ opacity: 0, scale: 0.7, rotate: -8 }} animate={{ opacity: loading ? 0 : 1, scale: loading ? 0.7 : 1, rotate: loading ? -8 : 0 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 1.1 }}>
                  <img src={IMG + 'k6.jpg'} alt="" />
                  <span className="ha-chip-cap mono">Kanaval ’14</span>
                </motion.span>
              </motion.span>
              <motion.span className="ha-line ha-l2" style={{ y: heroTitleY, opacity: heroFade }} aria-hidden>
                <span className="ha-serif">{reduce ? 'd’art —' : <Letters t="d’art —" base={0.78} play={!loading} />}</span>
                <motion.span className="ha-inimg" style={{ x: driftX2, y: driftY2 }}
                  initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: loading ? 0 : 1, scaleX: loading ? 0 : 1 }}
                  transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 1.05 }}>
                  <img src={IMG + 'art-baie.jpg'} alt="" />
                </motion.span>
              </motion.span>
              <motion.span className="ha-line ha-l3" style={{ y: heroTitleY, opacity: heroFade }} aria-hidden>
                <motion.span className="ha-sub mono"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: loading ? 0 : 1, y: loading ? 16 : 0 }}
                  transition={{ duration: 0.7, delay: 1.2 }}>
                  L’art haïtien à l’état brut.<br />Pas de folklore — du<br />contemporain ancré.
                </motion.span>
                <span className="ha-overflow ha-jac">{reduce ? <span>JACMEL<i>.</i></span> : <><Letters t="JACMEL" base={0.95} play={!loading} /><motion.i style={{ display: 'inline-block', color: 'var(--ember)', fontStyle: 'normal' }} initial={{ y: '118%' }} animate={{ y: !loading ? '0%' : '118%' }} transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 0.95 + 6 * 0.028 }} aria-hidden>.</motion.i></>}</span>
              </motion.span>
            </h1>

            <motion.div className="ha-cta-row"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: loading ? 0 : 1, y: loading ? 18 : 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 1.35 }}>
              <Magnetic><a className="btn" href="#collection" onClick={e => { e.preventDefault(); navTo('#collection') }}>Explorer le registre <IcoArr /></a></Magnetic>
              <Magnetic><a className="ha-link" href="#visiter" onClick={e => { e.preventDefault(); navTo('#visiter') }}>Planifier une visite <span>↗</span></a></Magnetic>
            </motion.div>

            <motion.div className="hero-fig"
              initial={{ opacity: 0 }} animate={{ opacity: loading ? 0 : 1 }} transition={{ duration: 0.5, delay: 1.1 }}>
              <Clip delay={0.15}>
                <div className="hero-media">
                  <motion.img src={IMG + 'hero-salle.jpg'} alt="Salle d’exposition de la maison, rue Barranquilla"
                    style={{ y: heroImgY, scale: 1.18 }} />
                  <div className="hero-stamp" aria-hidden>
                    <svg viewBox="0 0 100 100"><defs><path id="circ" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
                      <text><textPath href="#circ">Registre ouvert · depuis 1987 · Jacmel ·</textPath></text>
                    </svg>
                    <span className="stamp-core">✳</span>
                  </div>
                </div>
              </Clip>
              <div className="hero-cap mono">
                <span>La maison, salle nord — lumière de 7 h</span>
                <span>Fig. 01 — {expo.dates}</span>
              </div>
            </motion.div>

            <motion.div className="hero-meta"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: loading ? 0 : 1, y: loading ? 20 : 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 1.4 }}>
              <div>
                <span className="mut mono">Exposition en cours</span>
                <b className="hm-title">{expo.title}</b>
                <span className="hm-sub">8 pièces · {expo.dates}</span>
              </div>
              <div>
                <span className="mut mono">Horaires</span>
                <b>Mar–Dim · 10 h–18 h</b>
                <span className="hm-sub">Lundi fermé · entrée libre</span>
              </div>
              <div>
                <span className="mut mono">Adresse</span>
                <b>Rue Barranquilla</b>
                <span className="hm-sub">Jacmel, Sud d’Haïti</span>
              </div>
              <div className="hm-scroll mono">
                <span>Défiler</span>
                <span className="scroll-line"><span /></span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ======================= marquee ======================= */}
        <div className="marquee" aria-hidden>
          <div className="marquee-inner" ref={marqRef}>
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k} style={{ display: 'contents' }}>
                {['Peinture', 'Papier-mâché', 'Sculpture', 'Photographie', 'Fer forgé', 'Kanaval', 'Depuis 1987', 'Terre / Mer'].map(w => (
                  <span key={w} className="mq-chunk"><em>{w}</em><i>✳</i></span>
                ))}
              </span>
            ))}
          </div>
        </div>

        <main id="main">
          {/* ======================= 01 manifeste ======================= */}
          <section className="sec mani">
            <div className="wrap">
              <SHead no="01" label="Manifeste" right="1987 → 2026">
                <Rise>Jacmel ne s’explique pas.</Rise>
                <Rise delay={0.08}><span className="it">Elle se traverse.</span></Rise>
              </SHead>
              <ScrubWords text={manifesto} />
              <div className="stats">
                {stats.map((s, i) => (
                  <div key={s.l} className="stat">
                    <span className="stat-n">{s.n}</span>
                    <span className="stat-l mono">{s.l}</span>
                    {i < stats.length - 1 && <span className="stat-sep" aria-hidden />}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ======================= 02 collection ======================= */}
          <section id="collection" className="sec coll">
            <div className="wrap">
              <SHead no="02" label="Collection" right={`${filtered.length} pièce${filtered.length > 1 ? 's' : ''} — ${view === 'registre' ? 'registre' : 'cimaise'}`}>
                <Rise>Huit pièces,</Rise>
                <Rise delay={0.08}><span className="it">sorties du stock.</span></Rise>
              </SHead>
              <p className="coll-lede">Technique, dimensions et prix, sans cérémonie. Survolez une ligne pour voir la pièce — cliquez pour l’entrer dans la lumière.</p>

              <div className="reg-tools">
                <div className="seg" role="group" aria-label="Mode d’affichage">
                  <button aria-pressed={view === 'registre'} onClick={() => setView('registre')}>Registre</button>
                  <button aria-pressed={view === 'cimaise'} onClick={() => setView('cimaise')}>Cimaise</button>
                </div>
                <div className="filters" role="group" aria-label="Filtrer par matière">
                  {(['all', 'peinture', 'sculpture', 'papier-mâché', 'photographie'] as const).map(c => (
                    <button key={c} className="fbtn mono" aria-pressed={cat === c} onClick={() => setCat(c)}>
                      {c === 'all' ? 'Tout' : c}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {view === 'registre' ? (
                  <motion.div key={`reg-${cat}`} className="rows"
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
                    {filtered.map((a, i) => (
                      <motion.button
                        key={a.id}
                        className="row"
                        data-cursor="Voir"
                        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
                        onMouseEnter={() => setFloatImg(a.img)}
                        onMouseLeave={() => setFloatImg(null)}
                        onFocus={() => setFloatImg(a.img)}
                        onBlur={() => setFloatImg(null)}
                        onClick={() => openRoom(a)}
                      >
                        <span className="row-no mono">№ {a.id}</span>
                        <img className="row-thumb" src={a.img} alt="" loading="lazy" />
                        <span className="row-title">{a.title}{a.status === 'Réservée' && <em className="row-flag">Réservée</em>}</span>
                        <span className="row-artist">{a.artist}</span>
                        <span className="row-cat mono">{a.cat}</span>
                        <span className="row-year mono">{a.year}</span>
                        <span className="row-price">{a.price}</span>
                        <span className="row-arr"><IcoNE /></span>
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div key={`cim-${cat}`} className="cimaise"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.32 }}>
                    {filtered.map((a, i) => (
                      <motion.figure
                        key={a.id}
                        className={`ci ci-${(i % 4) + 1} lift`}
                        data-cursor="Voir"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.7, delay: (i % 2) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => openRoom(a)}
                        onMouseEnter={() => setFloatImg(null)}
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter') openRoom(a) }}
                      >
                        <Clip delay={(i % 2) * 0.08}>
                          <div className="ci-media">
                            <img src={a.img} alt={`${a.title}, ${a.artist}, ${a.year}`} loading="lazy" />
                            {a.status === 'Réservée' && <span className="ci-flag mono">Réservée</span>}
                          </div>
                        </Clip>
                        <figcaption className="ci-cap mono">
                          <span><b>№ {a.id}</b>&ensp;{a.title}</span>
                          <span>{a.price}</span>
                        </figcaption>
                      </motion.figure>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* ======================= 03 exposition ======================= */}
          <div id="exposition" ref={pinRef} className="pinned">
            <div className="pinned-sticky">
              <div className="pinned-head">
                <div>
                  <div className="mono dim-night"><span className="terra">(03)</span>&ensp;Exposition · {expo.title} · {expo.dates}</div>
                  <h3 className="pinned-title">Une traversée <em>horizontale.</em></h3>
                </div>
                <p className="pinned-note">{expo.line} Défiler — la salle avance seule.</p>
              </div>
              <div className="pinned-count mono">
                <span>{String(pinN).padStart(2, '0')} / {String(artworks.length).padStart(2, '0')}</span>
                <span className="pinned-bar"><span style={{ transform: `scaleX(${pinN / artworks.length})` }} /></span>
                <span>Terre → Mer</span>
              </div>
              <div className="pinned-viewport">
                <motion.div ref={trackRef} className="pinned-track" style={{ x: pxSpring }}>
                  {artworks.map((a, i) => (
                    <ExhCard key={`exh-${a.id}`} a={a} prog={pinProg} i={i} total={artworks.length} onOpen={() => openRoom(a)} />
                  ))}
                  <div className="exh-end">
                    <span className="mono">Fin de la traversée</span>
                    <h4>Venir voir<br />à Jacmel.</h4>
                    <Magnetic><a href="#visiter" className="btn btn-paper-solid btn-sm" onClick={e => { e.preventDefault(); navTo('#visiter') }}>Réserver — gratuit <IcoArr /></a></Magnetic>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* ======================= 04 artistes ======================= */}
          <section id="artistes" className="sec">
            <div className="wrap">
              <SHead no="04" label="Artistes" right="3 maisons — depuis 1972">
                <Rise>Jacmel <span className="it">fabrique</span></Rise>
                <Rise delay={0.08}>ses maîtres.</Rise>
              </SHead>
              <p className="coll-lede">Peintres, papetiers, photographes. La maison ne les représente pas — elle les accueille, les documente, les transmet.</p>
              <div className="roster">
                {artists.map((ar, i) => {
                  const open = artistOpen === i
                  return (
                    <div key={ar.name} className={`art ${open ? 'open' : ''}`}>
                      <button
                        className="art-row"
                        aria-expanded={open}
                        data-cursor={open ? 'Fermer' : 'Lire'}
                        onMouseEnter={() => setFloatImg(ar.img)}
                        onMouseLeave={() => setFloatImg(null)}
                        onClick={() => setArtistOpen(open ? null : i)}
                      >
                        <span className="row-no mono">№ 0{i + 1}</span>
                        <img className="art-thumb" src={ar.img} alt="" loading="lazy" />
                        <span className="art-name">{ar.name}</span>
                        <span className="art-detail">{ar.role} · {ar.detail}</span>
                        <span className="art-since mono">dep. {ar.since}</span>
                        <span className={`art-plus ${open ? 'x' : ''}`} aria-hidden><IcoX /></span>
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            className="art-body"
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                          >
                            <div className="art-grid">
                              <div className="art-media"><img src={ar.img} alt={ar.name} loading="lazy" /></div>
                              <div>
                                <p className="art-bio">{ar.bio}</p>
                                <div className="art-meta mono"><span>{ar.works}</span><span>{ar.role}</span><span>depuis {ar.since}</span></div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ======================= 05 journal ======================= */}
          <section id="journal" className="sec journal-sec">
            <div className="wrap">
              <SHead no="05" label="Journal" right="Carnets d’atelier">
                <Rise>Ce qui se passe</Rise>
                <Rise delay={0.08}><span className="it">avant l’accrochage.</span></Rise>
              </SHead>
              <div className="jgrid">
                {journal.map((j, i) => (
                  <motion.article
                    key={j.no}
                    className={`jcard ${i === 0 ? 'jcard-big' : ''} lift`}
                    data-cursor="Lire"
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.7, delay: (i % 2) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Clip delay={(i % 2) * 0.06}>
                      <div className="jcard-media"><img src={j.img} alt="" loading="lazy" /></div>
                    </Clip>
                    <div className="jcard-body">
                      <div className="jf-no" aria-hidden>№ {j.no}</div>
                      <h3 className="jcard-title">{j.title}</h3>
                      <p className="jcard-dek">{j.dek}</p>
                      <div className="jf-meta mono"><span>{j.meta}</span><span>{j.read}</span><span>{j.date}</span></div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </section>

          {/* ======================= 06 visiter ======================= */}
          <section id="visiter" className="sec visit-sec">
            <div className="wrap">
              <SHead no="06" label="Visiter" right={state.open ? 'Ouvert — entrée libre' : 'Entrée libre'}>
                <Rise>La porte est <span className="it">ouverte.</span></Rise>
              </SHead>
              <div className="visit-grid">
                <motion.div
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                  <span className="v-label mono">La maison</span>
                  <p className="lead visit-lede">Rue Barranquilla, ancienne comptoir à café aux volets turquoise. Sonnez — on vient ouvrir.</p>
                  <div className={`open-banner mono ${state.open ? 'on' : ''}`}>
                    <span className={`dot ${state.open ? 'on' : ''}`} />{state.label}&ensp;·&ensp;Jacmel {time}
                  </div>
                  <span className="v-label mono">Heures d’ouverture</span>
                  <div className="hours mono">
                    {hours.map((h, i) => (
                      <div key={h.d} className={i === todayIdx ? 'today' : ''}>
                        <span className={i === todayIdx ? '' : 'mut'}>{h.d}{i === todayIdx && <em> — aujourd’hui</em>}</span><b>{h.h}</b>
                      </div>
                    ))}
                  </div>
                  <div className="contact-lines">
                    <div className="cline">
                      <span className="mono mut">Écrire</span>
                      <span>bonjour@gallerie.ht</span>
                      <button className={`copy-btn mono ${copied ? 'done' : ''}`} onClick={copyMail}>{copied ? 'Copié ✓' : 'Copier'}</button>
                    </div>
                    <div className="cline">
                      <span className="mono mut">Appeler</span>
                      <a href="tel:+50937000000">+509 37 00 00 00</a>
                      <span className="mono mut">Haïti</span>
                    </div>
                    <div className="cline">
                      <span className="mono mut">Suivre</span>
                      <span className="cline-links"><a href="#" onClick={e => e.preventDefault()}>Instagram</a><a href="#" onClick={e => e.preventDefault()}>Are.na</a></span>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
                  {sent ? (
                    <div className="form-ok">
                      <span className="mono terra">Registre — reçu ✓</span>
                      <h3>À très vite.</h3>
                      <p className="lead">Votre demande est dans le registre. Réponse sous deux heures en journée, depuis la maison.</p>
                      <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={() => setSent(false)}>Écrire un autre mot</button>
                    </div>
                  ) : (
                    <form className="form" onSubmit={(e: React.FormEvent) => { e.preventDefault(); setSent(true) }}>
                      <div className="form-head mono"><span>Demande de visite</span><span>Gratuit</span></div>
                      <div className="field">
                        <label className="mono" htmlFor="f-nom">Votre nom</label>
                        <input id="f-nom" className="input" name="nom" placeholder="Marie-Claire Dupont" required autoComplete="name" />
                      </div>
                      <div className="field">
                        <label className="mono" htmlFor="f-email">Email</label>
                        <input id="f-email" className="input" name="email" type="email" placeholder="vous@exemple.com" required autoComplete="email" />
                      </div>
                      <div className="field">
                        <label className="mono" htmlFor="f-msg">Votre demande</label>
                        <textarea id="f-msg" className="input" name="message" rows={3} placeholder="Une pièce du registre, un budget, une question…" />
                      </div>
                      <Magnetic><button className="btn" type="submit">Envoyer la demande <IcoArr /></button></Magnetic>
                      <p className="form-note mono">Réponse sous 2 h en journée. Pas de liste, pas de spam.</p>
                    </form>
                  )}
                </motion.div>
              </div>
            </div>
          </section>
        </main>

        {/* ======================= footer ======================= */}
        <footer className="footer" ref={footRef}>
          <div className="wrap">
            <div className="foot-base mono">
              <span>© 2026 Gallerie d’art de Jacmel</span>
              <span className="fb-reg">Registre № 1987 — J · Terre / Mer</span>
              <span className="fb-right">
                <a className="fb-made" href="https://aylab.co" target="_blank" rel="noreferrer">Created by Aylab.co</a>
                <button className="top-btn mono" onClick={toTop}>Remonter <IcoUp /></button>
              </span>
            </div>
            <motion.div className="foot-giant" style={{ y: footY }} aria-hidden data-cursor="Remonter" onClick={toTop}>
              <span>Jacmel<i>.</i></span>
            </motion.div>
          </div>
        </footer>
      </div>

      {/* floating preview */}
      <div ref={floatRef} className="floatprev" aria-hidden>
        <img src={floatImg ?? lastImg.current} alt="" />
      </div>

      {/* ======================= room ======================= */}
      <AnimatePresence>
        {active && (
          <motion.div className="room" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }} onClick={() => setActiveId(null)}>
            <motion.div
              className="room-panel" role="dialog" aria-modal="true" aria-label={`${active.title}, ${active.artist}`}
              onClick={e => e.stopPropagation()}
              initial={{ y: '102%' }} animate={{ y: '0%' }} exit={{ y: '102%' }}
              transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}>
              <div className="room-media" style={{ background: active.color } as CSSProperties}>
                <motion.img
                  key={active.id + roomNav}
                  src={active.img}
                  alt={`${active.title}, ${active.artist}, ${active.year}`}
                  initial={{ clipPath: 'inset(8% 6% 8% 6%)', scale: 1.06, opacity: 0.4 }}
                  animate={{ clipPath: 'inset(0% 0% 0% 0%)', scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                />
                <span className="room-no mono">Pièce № {active.id} — {activeIndex + 1} / {artworks.length}</span>
                <div className="room-arrows">
                  <button aria-label="Pièce précédente" onClick={() => setActiveId(artworks[(activeIndex - 1 + artworks.length) % artworks.length].id)}>←</button>
                  <button aria-label="Pièce suivante" onClick={() => setActiveId(artworks[(activeIndex + 1) % artworks.length].id)}>→</button>
                </div>
              </div>
              <div className="room-ledger">
                <button ref={roomCloseRef} className="room-close" onClick={() => setActiveId(null)} aria-label="Retour au registre"><IcoX /></button>
                <span className="mono mut">{active.cat} · {active.year} · {active.salle}</span>
                <h3 className="room-title">{active.title}</h3>
                <div className="room-artist">{active.artist} — <span className={`pill ${active.status === 'Réservée' ? 'res' : ''}`}>{active.status}</span></div>
                <p className="room-prov">« {active.provenance} »</p>
                <div className="ledger mono">
                  <div><span>Technique</span><b>{active.medium}</b></div>
                  <div><span>Dimensions</span><b>{active.dims}</b></div>
                  <div><span>Année</span><b>{active.year}</b></div>
                  <div><span>Provenance</span><b>Atelier, Jacmel</b></div>
                </div>
                <div className="room-price">
                  <span className="mono mut">Prix, certificat compris</span>
                  <b>{active.price}</b>
                </div>
                <div className="room-actions">
                  <a href="#visiter" className="btn" onClick={() => { setActiveId(null); navTo('#visiter') }}>Demander cette pièce <IcoArr /></a>
                  <button className="btn btn-ghost" onClick={() => setActiveId(null)}>Retour</button>
                </div>
                <div className="room-hint mono mut">← → pour naviguer · Échap pour fermer</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
