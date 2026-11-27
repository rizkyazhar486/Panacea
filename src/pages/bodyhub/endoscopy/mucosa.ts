import * as THREE from 'three'
import type { LumenKind } from './scopeRoutes'

// Procedural mucosa: a seeded canvas painting of base tissue colour, mottling
// and a branching submucosal vessel network, plus a matching bump map. It is
// an illustration of surface appearance; the route geometry is the atlas.

function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

const PALETTE: Record<'gi' | 'gastric' | 'airway', { base: string; mottle: string[]; vessel: string }> = {
  gi: { base: '#e3978a', mottle: ['rgba(242,176,160,.35)', 'rgba(196,96,88,.25)', 'rgba(250,196,176,.25)'], vessel: 'rgba(140,28,40,' },
  gastric: { base: '#d0624f', mottle: ['rgba(232,128,104,.35)', 'rgba(168,52,44,.3)', 'rgba(240,150,120,.25)'], vessel: 'rgba(120,18,28,' },
  airway: { base: '#eab3aa', mottle: ['rgba(250,214,206,.4)', 'rgba(214,140,132,.25)', 'rgba(255,230,222,.3)'], vessel: 'rgba(160,40,52,' },
}

function family(kind: LumenKind) {
  if (kind === 'gastric') return 'gastric'
  if (kind === 'trachea' || kind === 'bronchus') return 'airway'
  return 'gi'
}

const textures = new Map<string, { map: THREE.CanvasTexture; bump: THREE.CanvasTexture }>()

export function mucosaTextures(kind: LumenKind) {
  const key = family(kind)
  const hit = textures.get(key)
  if (hit) return hit
  const size = 1024
  const color = document.createElement('canvas')
  const bump = document.createElement('canvas')
  color.width = color.height = bump.width = bump.height = size
  const c = color.getContext('2d')!
  const b = bump.getContext('2d')!
  const pal = PALETTE[key]
  const rand = rng(key.length * 7919)

  c.fillStyle = pal.base
  c.fillRect(0, 0, size, size)
  b.fillStyle = '#808080'
  b.fillRect(0, 0, size, size)

  // Mottling: soft blotches, drawn wrapped so the texture tiles seamlessly.
  for (let i = 0; i < 900; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 6 + rand() * 38
    const fill = pal.mottle[Math.floor(rand() * pal.mottle.length)]!
    for (const [dx, dy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]] as const) {
      const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r)
      g.addColorStop(0, fill)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      c.fillStyle = g
      c.beginPath(); c.arc(x + dx, y + dy, r, 0, Math.PI * 2); c.fill()
    }
    b.fillStyle = `rgba(${rand() > 0.5 ? 255 : 0},${rand() > 0.5 ? 255 : 0},128,0.04)`
    b.beginPath(); b.arc(x, y, r * 0.5, 0, Math.PI * 2); b.fill()
  }

  // Vessels: random-walk branches that thin as they divide.
  const branch = (x: number, y: number, angle: number, width: number, depth: number) => {
    let px = x
    let py = y
    let a = angle
    const steps = 20 + Math.floor(rand() * 40)
    for (let i = 0; i < steps; i++) {
      a += (rand() - 0.5) * 0.5
      const nx = px + Math.cos(a) * 6
      const ny = py + Math.sin(a) * 6
      c.strokeStyle = `${pal.vessel}${0.18 + width * 0.12})`
      c.lineWidth = width
      c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke()
      b.strokeStyle = 'rgba(40,40,40,.35)'
      b.lineWidth = width
      b.beginPath(); b.moveTo(px, py); b.lineTo(nx, ny); b.stroke()
      px = ((nx % size) + size) % size
      py = ((ny % size) + size) % size
      if (Math.abs(nx - px) > 1 || Math.abs(ny - py) > 1) break
      if (depth < 4 && rand() < 0.07) branch(px, py, a + (rand() > 0.5 ? 0.7 : -0.7), width * 0.65, depth + 1)
    }
  }
  for (let i = 0; i < 46; i++) branch(rand() * size, rand() * size, rand() * Math.PI * 2, 1.6 + rand() * 1.8, 0)

  const map = new THREE.CanvasTexture(color)
  map.colorSpace = THREE.SRGBColorSpace
  const bumpMap = new THREE.CanvasTexture(bump)
  for (const t of [map, bumpMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 8
  }
  const out = { map, bump: bumpMap }
  textures.set(key, out)
  return out
}
