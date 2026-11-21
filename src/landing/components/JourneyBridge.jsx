import { useEffect, useRef } from 'react'
import { MOTION } from '../lib/motion'
import s from './Journey.module.css'

const PERIOD = 7000 // ms for the light pulse to cross the deck

/**
 * Ambient bridge drawn on a canvas behind the journey steps: a suspension cable, hangers that
 * land on each step dot, light particles drifting along the cable and a pulse travelling the deck.
 * Loops on its own clock; pauses off screen; one still frame under ?static=1 / reduced motion.
 */
export default function JourneyBridge({ trackRef, dotSelector, litClass, lang }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    const canvas = canvasRef.current
    if (!track || !canvas) return
    const ctx = canvas.getContext('2d')
    let w = 0, h = 0, deckY = 0, dots = [], centers = [], raf = 0, running = false, visible = true
    const rtl = document.documentElement.dir === 'rtl'
    const particles = Array.from({ length: 34 }, (_, i) => ({
      u: Math.random(), speed: 0.012 + Math.random() * 0.03, r: 1.4 + Math.random() * 1.8,
      off: (Math.random() - 0.5) * 16, hue: i % 3, phase: Math.random() * Math.PI * 2,
    }))

    const apex = () => 18
    const cableY = (x) => { const p = x / w; return deckY - (deckY - apex()) * 4 * p * (1 - p) }

    function measure() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const tr = track.getBoundingClientRect()
      dots = [...track.querySelectorAll(dotSelector)]
      if (!dots.length) return
      const first = dots[0].getBoundingClientRect()
      deckY = Math.round(first.top - tr.top + first.height / 2)
      centers = dots.map((d) => { const r = d.getBoundingClientRect(); return r.left - tr.left + r.width / 2 })
      w = Math.round(tr.width); h = deckY + 14
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function grad() {
      const g = ctx.createLinearGradient(0, 0, w, 0)
      g.addColorStop(0, rtl ? '#9E51FA' : '#29A8FF')
      g.addColorStop(0.5, '#6C7CFF')
      g.addColorStop(1, rtl ? '#29A8FF' : '#9E51FA')
      return g
    }

    function cablePath() {
      ctx.beginPath()
      for (let x = 0; x <= w; x += 6) { const y = cableY(x); x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }
    }

    function draw(now) {
      if (!w) return
      ctx.clearRect(0, 0, w, h)
      const g = grad()
      const t = now / 1000
      const pulseP = (now % PERIOD) / PERIOD
      const pulseX = rtl ? w * (1 - pulseP) : w * pulseP

      // faint secondary hangers between the main ones
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(108, 124, 255, 0.12)'
      for (let x = 24; x < w; x += 24) {
        ctx.beginPath(); ctx.moveTo(x, cableY(x)); ctx.lineTo(x, deckY); ctx.stroke()
      }
      // main hangers, one per step dot; brighten as the pulse passes
      centers.forEach((cx) => {
        const near = Math.max(0, 1 - Math.abs(pulseX - cx) / 90)
        const lg = ctx.createLinearGradient(0, cableY(cx), 0, deckY)
        lg.addColorStop(0, `rgba(108, 124, 255, ${0.45 + near * 0.5})`)
        lg.addColorStop(1, `rgba(41, 168, 255, ${0.15 + near * 0.6})`)
        ctx.strokeStyle = lg; ctx.lineWidth = 1.5 + near
        ctx.beginPath(); ctx.moveTo(cx, cableY(cx)); ctx.lineTo(cx, deckY - 12); ctx.stroke()
      })

      // cable: soft base + travelling glow
      cablePath(); ctx.strokeStyle = g; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.55; ctx.stroke(); ctx.globalAlpha = 1
      ctx.save()
      cablePath(); ctx.setLineDash([140, w * 1.6]); ctx.lineDashOffset = rtl ? (t * 160) % (w * 1.6 + 140) : -((t * 160) % (w * 1.6 + 140))
      ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.shadowColor = 'rgba(108, 124, 255, 0.9)'; ctx.shadowBlur = 14; ctx.stroke()
      ctx.restore()

      // deck
      ctx.strokeStyle = 'rgba(108, 124, 255, 0.22)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(0, deckY); ctx.lineTo(w, deckY); ctx.stroke()
      const pg = ctx.createRadialGradient(pulseX, deckY, 0, pulseX, deckY, 120)
      pg.addColorStop(0, 'rgba(41, 168, 255, 0.95)'); pg.addColorStop(1, 'rgba(41, 168, 255, 0)')
      ctx.strokeStyle = pg; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(Math.max(0, pulseX - 120), deckY); ctx.lineTo(Math.min(w, pulseX + 120), deckY); ctx.stroke()

      // particles drifting along the cable: a crisp core with a small soft halo
      const colors = ['41,168,255', '108,124,255', '158,81,250']
      particles.forEach((p) => {
        const u = (p.u + t * p.speed) % 1
        const x = (rtl ? 1 - u : u) * w
        const y = cableY(x) + p.off * 0.35 * Math.sin(t * 0.7 + p.phase)
        const a = 0.45 + 0.5 * Math.sin(t * 1.3 + p.phase) ** 2
        const rg = ctx.createRadialGradient(x, y, 0, x, y, p.r * 3)
        rg.addColorStop(0, `rgba(${colors[p.hue]}, ${a * 0.45})`); rg.addColorStop(1, `rgba(${colors[p.hue]}, 0)`)
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, p.r * 3, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = `rgba(${colors[p.hue]}, ${a})`; ctx.beginPath(); ctx.arc(x, y, p.r * 0.75, 0, Math.PI * 2); ctx.fill()
      })

      // light up the step dot the pulse is passing
      dots.forEach((d, i) => d.classList.toggle(litClass, MOTION && Math.abs(pulseX - centers[i]) < 60))
    }

    const loop = (now) => { draw(now); raf = requestAnimationFrame(loop) }
    const start = () => { if (!running && MOTION && visible) { running = true; raf = requestAnimationFrame(loop) } }
    const stop = () => { running = false; cancelAnimationFrame(raf) }

    const ro = new ResizeObserver(() => { measure(); if (!running) draw(PERIOD * 0.42) })
    ro.observe(track)
    measure(); draw(PERIOD * 0.42)

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop() })
    io.observe(track)
    const onVis = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVis)
    document.fonts?.ready.then(() => { measure(); if (!running) draw(PERIOD * 0.42) })

    return () => { stop(); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [trackRef, dotSelector, litClass, lang])

  return <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />
}
