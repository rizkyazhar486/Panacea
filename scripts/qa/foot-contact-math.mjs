// Statistik kontak dalam presisi penuh; pembulatan hanya untuk tampilan, tidak untuk acceptance.
export function fitFootContact(groups) {
  if (!Array.isArray(groups)) throw new Error('contact groups must be an array')
  if (!groups.length) return { stance_phases: 0 }
  let num = 0, den = 0
  for (const g of groups) {
    if (!Array.isArray(g.t) || !Array.isArray(g.x) || g.t.length !== g.x.length || g.t.length < 3 || !g.t.every(Number.isFinite) || !g.x.every(Number.isFinite) || g.t.some((t, i) => i > 0 && t <= g.t[i - 1])) throw new Error('invalid contact samples')
    const tm = g.t.reduce((a, b) => a + b, 0) / g.t.length, xm = g.x.reduce((a, b) => a + b, 0) / g.x.length
    g.t.forEach((t, i) => { num += (t - tm) * (g.x[i] - xm); den += (t - tm) ** 2 })
  }
  if (!(den > 0) || !Number.isFinite(num) || !Number.isFinite(den)) throw new Error('invalid contact regression')
  const vel = -num / den, res = []
  for (const g of groups) {
    const tm = g.t.reduce((a, b) => a + b, 0) / g.t.length, xm = g.x.reduce((a, b) => a + b, 0) / g.x.length
    g.t.forEach((t, i) => res.push(g.x[i] - (xm - vel * (t - tm))))
  }
  const rms = Math.sqrt(res.reduce((a, b) => a + b * b, 0) / res.length)
  const values = { common_forward_speed_m_s: Math.abs(vel), slide_rms_mm: rms * 1000, slide_max_mm: Math.max(...res.map(Math.abs)) * 1000 }
  if (!Object.values(values).every(Number.isFinite)) throw new Error('nonfinite contact regression output')
  return { stance_phases: groups.length, stance_frames: groups.reduce((a, g) => a + g.t.length, 0), ...values, display: { common_forward_speed_m_s: +values.common_forward_speed_m_s.toFixed(3), slide_rms_mm: +values.slide_rms_mm.toFixed(1), slide_max_mm: +values.slide_max_mm.toFixed(1) } }
}
