// Procedural, tileable mucosa textures drawn once on a canvas: a submucosal vessel network (albedo) and a fine
// glandular/pit relief (normal map) that breaks the wet specular into the small highlights seen through a scope.
// Illustrative surface only — no real patient's mucosa, no lesion, no pathology is depicted.
import * as THREE from 'three'

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Tileable value noise, sum of octaves, values 0..1. */
function fbm(size: number, rnd: () => number, octaves: number, base: number): Float32Array {
  const out = new Float32Array(size * size)
  let amp = 0.5, total = 0
  for (let o = 0; o < octaves; o++) {
    const g = base << o
    const lat = new Float32Array(g * g).map(() => rnd())
    for (let y = 0; y < size; y++) {
      const fy = (y / size) * g, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty)
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * g, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx)
        const a = lat[(y0 % g) * g + (x0 % g)], b = lat[(y0 % g) * g + ((x0 + 1) % g)]
        const c = lat[((y0 + 1) % g) * g + (x0 % g)], d = lat[((y0 + 1) % g) * g + ((x0 + 1) % g)]
        out[y * size + x] += amp * (a + (b - a) * sx + (c - a + (a - b - c + d) * sx) * sy)
      }
    }
    total += amp
    amp *= 0.5
  }
  for (let i = 0; i < out.length; i++) out[i] /= total
  return out
}

/** Branching vessel strokes, drawn with wrap-around copies only near tile edges and zero ctx.filter GPU passes. */
function vessels(ctx: CanvasRenderingContext2D, size: number, rnd: () => number, colour: string, haloColour: string, roots: number, width: number) {
  const stroke = (x: number, y: number, ang: number, w: number, depth: number) => {
    let px = x, py = y
    const steps = 18 + Math.floor(rnd() * 26)
    ctx.lineCap = 'round'
    for (let i = 0; i < steps && w > 0.25; i++) {
      ang += (rnd() - 0.5) * 0.7
      const nx = px + Math.cos(ang) * 6, ny = py + Math.sin(ang) * 6
      const pad = w * 2.4
      const nearX = px < pad || nx < pad || px > size - pad || nx > size - pad
      const nearY = py < pad || ny < pad || py > size - pad || ny > size - pad
      const oxList = nearX ? [-size, 0, size] : [0]
      const oyList = nearY ? [-size, 0, size] : [0]
      // Soft halo + crisp core reproduces submucosal blur without ctx.filter (which crashes Chrome's Metal GPU process).
      ctx.strokeStyle = haloColour
      ctx.lineWidth = w * 2.1
      for (const ox of oxList) for (const oy of oyList) {
        ctx.beginPath(); ctx.moveTo(px + ox, py + oy); ctx.lineTo(nx + ox, ny + oy); ctx.stroke()
      }
      ctx.strokeStyle = colour
      ctx.lineWidth = w
      for (const ox of oxList) for (const oy of oyList) {
        ctx.beginPath(); ctx.moveTo(px + ox, py + oy); ctx.lineTo(nx + ox, ny + oy); ctx.stroke()
      }
      px = nx; py = ny
      w *= 0.975
      if (depth < 4 && rnd() < 0.09) stroke(px, py, ang + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.7), w * 0.7, depth + 1)
    }
  }
  for (let i = 0; i < roots; i++) stroke(rnd() * size, rnd() * size, rnd() * Math.PI * 2, width * (0.6 + rnd() * 0.6), 0)
}

export interface MucosaTextures { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture; dispose(): void }

export function mucosaTextures(seed: number, vesselTone: string, size = 512): MucosaTextures | null {
  const c = document.createElement('canvas')
  c.width = c.height = size
  // CPU-backed canvases without ctx.filter: a GPU blur filter followed by getImageData crashed Chrome's Metal GPU
  // process on Apple Silicon, causing Chrome to block WebGL across the whole origin.
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  const rnd = mulberry32(seed)
  // Albedo: near-white (the vertex colour carries the regional tint), mottled, with vessels at two depths.
  const mott = fbm(size, rnd, 4, 6)
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < size * size; i++) {
    const m = 0.9 + 0.1 * mott[i]
    img.data[i * 4] = 255 * m; img.data[i * 4 + 1] = 236 * m; img.data[i * 4 + 2] = 232 * m; img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  vessels(ctx, size, rnd, `${vesselTone}48`, `${vesselTone}1c`, 7, 4.2)
  vessels(ctx, size, rnd, `${vesselTone}72`, `${vesselTone}28`, 22, 1.6)

  // Relief: fine pits/glands plus vessels slightly raised, converted to a tangent-space normal map.
  const h = fbm(size, rnd, 3, 48)
  const vd = ctx.getImageData(0, 0, size, size).data
  const height = new Float32Array(size * size)
  for (let i = 0; i < size * size; i++) height[i] = h[i] * 0.8 + (1 - vd[i * 4 + 1] / 255) * 0.6
  const n = document.createElement('canvas')
  n.width = n.height = size
  const nctx = n.getContext('2d', { willReadFrequently: true })
  if (!nctx) return null
  const nimg = nctx.createImageData(size, size)
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * 3, dy = (at(x, y + 1) - at(x, y - 1)) * 3
    const l = Math.hypot(dx, dy, 1)
    const i = (y * size + x) * 4
    nimg.data[i] = (0.5 - dx / l / 2) * 255; nimg.data[i + 1] = (0.5 - dy / l / 2) * 255; nimg.data[i + 2] = (0.5 + 0.5 / l) * 255; nimg.data[i + 3] = 255
  }
  nctx.putImageData(nimg, 0, 0)

  const map = new THREE.CanvasTexture(c)
  map.colorSpace = THREE.SRGBColorSpace
  const normalMap = new THREE.CanvasTexture(n)
  for (const t of [map, normalMap]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8 }
  return { map, normalMap, dispose() { map.dispose(); normalMap.dispose() } }
}
