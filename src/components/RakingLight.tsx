// « Lumière rasante » : comme le restaurateur qui promène une lampe au ras de la toile.
// Le relief (empâtements, papier-mâché, tôle martelée) est déduit de la luminance de l’image.
import { useEffect, useRef, useState } from 'react'
import type { Artwork } from '../content/artworks'
import { image, src } from '../content/images'
import { reducedMotion } from '../lib/motion'

const VERT = `
attribute vec2 p;
varying vec2 uv;
void main() {
  uv = vec2(p.x * .5 + .5, .5 - p.y * .5);
  gl_Position = vec4(p, 0., 1.);
}`

const FRAG = `
precision mediump float;
uniform sampler2D img;
uniform vec2 texel;
uniform vec3 light;
uniform float relief;
varying vec2 uv;
float lum(vec2 o) { return dot(texture2D(img, uv + o * texel).rgb, vec3(.299, .587, .114)); }
void main() {
  vec3 base = texture2D(img, uv).rgb;
  float tl = lum(vec2(-1., -1.)), t = lum(vec2(0., -1.)), tr = lum(vec2(1., -1.));
  float l = lum(vec2(-1., 0.)), r = lum(vec2(1., 0.));
  float bl = lum(vec2(-1., 1.)), b = lum(vec2(0., 1.)), br = lum(vec2(1., 1.));
  float dx = (tr + 2. * r + br) - (tl + 2. * l + bl);
  float dy = (bl + 2. * b + br) - (tl + 2. * t + tr);
  vec3 n = normalize(vec3(-dx * relief, dy * relief, 1.));
  vec3 L = normalize(light);
  float diff = max(dot(n, L), 0.);
  vec3 h = normalize(L + vec3(0., 0., 1.));
  float spec = pow(max(dot(n, h), 0.), 28.) * .28;
  vec2 side = normalize(light.xy + 1e-4);
  float fall = .72 + .28 * dot((uv - .5) * vec2(2., -2.), side);
  vec3 warm = vec3(1., .93, .82);
  gl_FragColor = vec4(base * (.16 + 1.12 * diff) * fall * warm + spec * warm, 1.);
}`

function shader(gl: WebGLRenderingContext, type: number, code: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, code)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
  return s
}

export default function RakingLight({ a }: { a: Artwork }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)
  const [moved, setMoved] = useState(false)
  const meta = image(a.image)

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const gl = c.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false })
    if (!gl) {
      setFailed(true)
      return
    }
    let raf = 0
    let alive = true
    try {
      const prog = gl.createProgram()!
      gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link')
      gl.useProgram(prog)
      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, 'p')
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
      const uTexel = gl.getUniformLocation(prog, 'texel')
      const uLight = gl.getUniformLocation(prog, 'light')
      const uRelief = gl.getUniformLocation(prog, 'relief')

      const target = { x: -0.8, y: 0.35 }
      const cur = { x: -0.8, y: 0.35 }
      let lastMove = 0
      let angle = Math.PI * 0.85
      let texW = 1
      let texH = 1
      let ready = false

      const img = new Image()
      img.decoding = 'async'
      img.src = src(a.image, 1280)
      img.onload = () => {
        if (!alive) return
        const tex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img)
        texW = img.naturalWidth
        texH = img.naturalHeight
        ready = true
      }
      img.onerror = () => setFailed(true)

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        c.width = Math.round(c.clientWidth * dpr)
        c.height = Math.round(c.clientHeight * dpr)
        gl.viewport(0, 0, c.width, c.height)
      }
      const ro = new ResizeObserver(resize)
      ro.observe(c)
      resize()

      const onMove = (e: PointerEvent) => {
        const r = c.getBoundingClientRect()
        target.x = ((e.clientX - r.left) / r.width - 0.5) * 2.4
        target.y = (0.5 - (e.clientY - r.top) / r.height) * 2.4
        lastMove = performance.now()
        setMoved(true)
      }
      c.addEventListener('pointermove', onMove)
      c.addEventListener('pointerdown', onMove)

      const still = reducedMotion()
      const frame = (now: number) => {
        if (!alive) return
        if (!still && now - lastMove > 2200) {
          angle += 0.006
          target.x = Math.cos(angle) * 1.05
          target.y = Math.sin(angle) * 0.75
        }
        cur.x += (target.x - cur.x) * 0.12
        cur.y += (target.y - cur.y) * 0.12
        if (ready) {
          gl.uniform2f(uTexel, 1.4 / texW, 1.4 / texH)
          gl.uniform3f(uLight, cur.x, cur.y, 0.42)
          gl.uniform1f(uRelief, 3.2)
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        }
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)

      return () => {
        alive = false
        cancelAnimationFrame(raf)
        ro.disconnect()
        c.removeEventListener('pointermove', onMove)
        c.removeEventListener('pointerdown', onMove)
        gl.getExtension('WEBGL_lose_context')?.loseContext()
      }
    } catch {
      setFailed(true)
      return () => {
        alive = false
        cancelAnimationFrame(raf)
      }
    }
  }, [a.image])

  return (
    <div className="raking" style={{ '--ratio': meta.ratio } as React.CSSProperties}>
      <div className="raking__frame">
        {failed ? (
          <div className="raking__fallback" style={{ backgroundImage: `url(${src(a.image, 1280)})` }} />
        ) : (
          <canvas ref={canvas} className="raking__canvas" aria-label={`« ${a.titre} » sous une lumière rasante`} role="img" />
        )}
      </div>
      <p className={`raking__hint label ${moved ? 'is-faded' : ''}`}>Promenez la lampe : glissez sur l’œuvre pour révéler son relief.</p>
    </div>
  )
}
