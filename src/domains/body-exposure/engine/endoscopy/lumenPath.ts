// Centre line of a hollow organ, computed from its own reference mesh, so a virtual scope can travel inside the real
// Z-Anatomy / BodyParts3D geometry instead of a drawn tunnel. Pure and deterministic: input is vertex positions in
// metres, output is an ordered list of slices (centre + mean lumen radius). No three.js, no DOM.
//
// Method: principal axis of the segment's vertices (power iteration on the covariance), vertices binned along that
// axis, centroid and mean perpendicular distance per bin. That is exact for straight segments and a fair centre for
// gently curved ones (ascending, transverse, sigmoid colon; oesophagus; trachea). It is a reference-anatomy
// approximation: it says nothing about any patient's lumen, insertion depth or a safe trajectory.

export interface LumenSlice {
  x: number
  y: number
  z: number
  /** Mean distance of the bin's vertices from its centre, perpendicular to the axis (metres). */
  r: number
}

export interface LumenSegmentInput {
  label: string
  /** Flat xyz triples in metres (world space). */
  positions: ArrayLike<number>
}

export type LumenPathResult =
  | { ok: true; slices: LumenSlice[]; landmarks: { label: string; t: number }[]; length: number }
  | { ok: false; reason: 'no-segments' | 'segment-too-small' | 'non-finite'; label?: string }

const MIN_VERTICES = 24
const REFINE_ITERATIONS = 6

function principalAxis(pts: ArrayLike<number>, n: number, cx: number, cy: number, cz: number): [number, number, number] {
  let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0
  for (let i = 0; i < n; i++) {
    const dx = pts[i * 3] - cx, dy = pts[i * 3 + 1] - cy, dz = pts[i * 3 + 2] - cz
    xx += dx * dx; xy += dx * dy; xz += dx * dz; yy += dy * dy; yz += dy * dz; zz += dz * dz
  }
  // Deterministic start that is never orthogonal to a real axis in practice; 40 iterations converge for 3x3.
  let ax = 0.577, ay = 0.578, az = 0.576
  for (let k = 0; k < 40; k++) {
    const nx = xx * ax + xy * ay + xz * az
    const ny = xy * ax + yy * ay + yz * az
    const nz = xz * ax + yz * ay + zz * az
    const len = Math.hypot(nx, ny, nz) || 1
    ax = nx / len; ay = ny / len; az = nz / len
  }
  return [ax, ay, az]
}

/** Centre line of one segment, ordered along its principal axis. Fails closed on too few or non-finite vertices. */
export function segmentCentreline(positions: ArrayLike<number>, bins: number): LumenSlice[] | null {
  const n = Math.floor(positions.length / 3)
  if (n < MIN_VERTICES || !Number.isInteger(bins) || bins < 2) return null
  let cx = 0, cy = 0, cz = 0
  for (let i = 0; i < n * 3; i++) if (!Number.isFinite(positions[i])) return null
  for (let i = 0; i < n; i++) { cx += positions[i * 3]; cy += positions[i * 3 + 1]; cz += positions[i * 3 + 2] }
  cx /= n; cy /= n; cz /= n
  const [ax, ay, az] = principalAxis(positions, n, cx, cy, cz)
  let lo = Infinity, hi = -Infinity
  const proj = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const p = (positions[i * 3] - cx) * ax + (positions[i * 3 + 1] - cy) * ay + (positions[i * 3 + 2] - cz) * az
    proj[i] = p
    if (p < lo) lo = p
    if (p > hi) hi = p
  }
  const span = hi - lo
  if (!(span > 0)) return null
  const sx = new Float64Array(bins), sy = new Float64Array(bins), sz = new Float64Array(bins), cnt = new Float64Array(bins)
  const asg = new Int32Array(n)
  for (let i = 0; i < n; i++) asg[i] = Math.min(bins - 1, Math.floor(((proj[i] - lo) / span) * bins))
  const tally = () => {
    sx.fill(0); sy.fill(0); sz.fill(0); cnt.fill(0)
    for (let i = 0; i < n; i++) { const b = asg[i]; sx[b] += positions[i * 3]; sy[b] += positions[i * 3 + 1]; sz[b] += positions[i * 3 + 2]; cnt[b]++ }
  }
  tally()
  // Curved organs (J-shaped stomach, U-shaped transverse colon): flat slabs cut across the bend, so their centroids
  // fall outside the lumen. Principal-curve refinement (Hastie & Stuetzle 1989): project every vertex onto the current
  // centre polyline, re-bin by arc length along it, take bin centroids as the new polyline. A straight tube is already
  // a fixed point, so its result is unchanged.
  for (let it = 0; it < REFINE_ITERATIONS; it++) {
    const px: number[] = [], py: number[] = [], pz: number[] = []
    for (let b = 0; b < bins; b++) if (cnt[b] > 0) { px.push(sx[b] / cnt[b]); py.push(sy[b] / cnt[b]); pz.push(sz[b] / cnt[b]) }
    const m = px.length
    if (m < 2) break
    smooth3(px); smooth3(py); smooth3(pz)
    const cum = [0]
    for (let k = 1; k < m; k++) cum.push(cum[k - 1] + Math.hypot(px[k] - px[k - 1], py[k] - py[k - 1], pz[k] - pz[k - 1]))
    const total = cum[m - 1]
    if (!(total > 0)) break
    let moved = 0
    for (let i = 0; i < n; i++) {
      const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2]
      let bd = Infinity, bs = 0
      for (let k = 0; k < m - 1; k++) {
        const ex = px[k + 1] - px[k], ey = py[k + 1] - py[k], ez = pz[k + 1] - pz[k]
        const len2 = ex * ex + ey * ey + ez * ez || 1
        const u = Math.max(0, Math.min(1, ((x - px[k]) * ex + (y - py[k]) * ey + (z - pz[k]) * ez) / len2))
        const dx = x - px[k] - ex * u, dy = y - py[k] - ey * u, dz = z - pz[k] - ez * u
        const d = dx * dx + dy * dy + dz * dz
        if (d < bd) { bd = d; bs = cum[k] + (cum[k + 1] - cum[k]) * u }
      }
      const nb = Math.min(bins - 1, Math.floor((bs / total) * bins))
      if (nb !== asg[i]) { asg[i] = nb; moved++ }
    }
    tally()
    if (!moved) break
  }
  const keep: number[] = []
  for (let b = 0; b < bins; b++) if (cnt[b] >= 3) keep.push(b) // a nearly empty bin is an edge artefact, not lumen
  if (keep.length < 2) return null
  const cx2 = keep.map((b) => sx[b] / cnt[b]), cy2 = keep.map((b) => sy[b] / cnt[b]), cz2 = keep.map((b) => sz[b] / cnt[b])
  smooth3(cx2); smooth3(cy2); smooth3(cz2)
  const slot = new Int32Array(bins).fill(-1)
  keep.forEach((b, k) => { slot[b] = k })
  // Mean wall distance perpendicular to the local direction of the centre line.
  const tx: number[] = [], ty: number[] = [], tz: number[] = []
  for (let k = 0; k < keep.length; k++) {
    const a = Math.max(0, k - 1), c = Math.min(keep.length - 1, k + 1)
    const dx = cx2[c] - cx2[a], dy = cy2[c] - cy2[a], dz = cz2[c] - cz2[a]
    const l = Math.hypot(dx, dy, dz) || 1
    tx.push(dx / l); ty.push(dy / l); tz.push(dz / l)
  }
  const rs = new Float64Array(keep.length)
  for (let i = 0; i < n; i++) {
    const k = slot[asg[i]]
    if (k < 0) continue
    const dx = positions[i * 3] - cx2[k], dy = positions[i * 3 + 1] - cy2[k], dz = positions[i * 3 + 2] - cz2[k]
    const along = dx * tx[k] + dy * ty[k] + dz * tz[k]
    rs[k] += Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - along * along))
  }
  return keep.map((b, k) => ({ x: cx2[k], y: cy2[k], z: cz2[k], r: rs[k] / cnt[b] }))
}

/** The principal-curve smoother: two passes of [1 2 1]/4, ends fixed. Leaves evenly spaced collinear points unchanged. */
function smooth3(v: number[]): void {
  for (let pass = 0; pass < 2; pass++) {
    let prev = v[0]
    for (let i = 1; i < v.length - 1; i++) {
      const cur = v[i]
      v[i] = (prev + 2 * cur + v[i + 1]) / 4
      prev = cur
    }
  }
}

const dist = (a: LumenSlice, b: LumenSlice) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

/**
 * Chains segments in the given (insertion) order. The first segment keeps its own direction unless `startNear` is
 * given; every later segment is flipped so that its start is the end nearer the previous segment's end.
 */
export function lumenPath(segments: readonly LumenSegmentInput[], bins = 24, startNear?: { x: number; y: number; z: number }): LumenPathResult {
  if (!segments.length) return { ok: false, reason: 'no-segments' }
  const slices: LumenSlice[] = []
  const starts: { label: string; index: number }[] = []
  for (const seg of segments) {
    const c = segmentCentreline(seg.positions, bins)
    if (!c) {
      const n = Math.floor(seg.positions.length / 3)
      let finite = true
      for (let i = 0; i < n * 3; i++) if (!Number.isFinite(seg.positions[i])) { finite = false; break }
      return { ok: false, reason: finite ? 'segment-too-small' : 'non-finite', label: seg.label }
    }
    const ref = slices.length ? slices[slices.length - 1] : startNear ? { ...startNear, r: 0 } : null
    if (ref && dist(ref, c[c.length - 1]) < dist(ref, c[0])) c.reverse()
    starts.push({ label: seg.label, index: slices.length })
    slices.push(...c)
  }
  // Arc length, for landmarks at their true distance along the route.
  const cum = [0]
  for (let i = 1; i < slices.length; i++) cum.push(cum[i - 1] + dist(slices[i - 1], slices[i]))
  const length = cum[cum.length - 1]
  const landmarks = starts.map((s) => ({ label: s.label, t: length > 0 ? cum[s.index] / length : 0 }))
  return { ok: true, slices, landmarks, length }
}

/** Index of the landmark whose segment contains route fraction t (0..1). */
export function landmarkAt(landmarks: readonly { t: number }[], t: number): number {
  if (!landmarks.length || !Number.isFinite(t)) return -1
  let idx = 0
  for (let i = 0; i < landmarks.length; i++) if (t >= landmarks[i].t) idx = i
  return idx
}

/**
 * Anterior (front) projection of the centre line into a 0..100 box for a small route map, aspect preserved. The viewer
 * faces the body, so the patient's right (x < 0) is drawn on the left and up (y) is up. Null for fewer than 2 slices or
 * a degenerate extent.
 */
export function anteriorMap(slices: readonly LumenSlice[], pad = 8): { x: number; y: number }[] | null {
  if (slices.length < 2 || !(pad >= 0 && pad < 50)) return null
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (const s of slices) {
    if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) return null
    x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y)
  }
  const span = Math.max(x1 - x0, y1 - y0)
  if (!(span > 0)) return null
  const k = (100 - 2 * pad) / span
  const ox = (100 - (x1 - x0) * k) / 2, oy = (100 - (y1 - y0) * k) / 2
  return slices.map((s) => ({ x: ox + (s.x - x0) * k, y: 100 - (oy + (s.y - y0) * k) }))
}
