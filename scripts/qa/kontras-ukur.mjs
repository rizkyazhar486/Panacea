// F2 / Task 45 — fungsi ukur kontras yang dijalankan DI DALAM halaman (page.evaluate); dipisah agar bisa diuji pada fixture (kontras-ukur.fixture.mjs).
export const ukur = () => {
  // Warna terhitung bisa berupa oklch()/color()/lab() (Tailwind v4 dan color-mix); regex rgb() saja membaca itu sebagai transparan, lalu latar
  // jatuh ke latar halaman dan rasio salah (positif palsu pada kotak krem oklch). Kanvas menormalkan semua ruang warna ke sRGB; nilai tak dikenal = null (tidak ditebak).
  const kanvas = document.createElement('canvas'); kanvas.width = kanvas.height = 1
  const g2 = kanvas.getContext('2d', { willReadFrequently: true })
  const parse = (c) => {
    const m = c.match(/^rgba?\(([^)]+)\)$/)
    if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 } }
    g2.clearRect(0, 0, 1, 1); g2.fillStyle = 'rgb(1,2,3)'; g2.fillStyle = c
    if (g2.fillStyle === '#010203') return null // fillStyle menolak nilai yang tak dikenal dan mempertahankan sentinel
    g2.fillRect(0, 0, 1, 1); const d = g2.getImageData(0, 0, 1, 1).data
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255, ruang: true } // ruang: dinormalkan lewat kanvas (bukan rgb() langsung)
  }
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 })
  const lum = (c) => { const t = [c.r, c.g, c.b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2] }
  const rasio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
  // OneShape is an actual opaque sibling backdrop, not an ancestor background.
  // Credit its measured colour ONLY if the rendered shape fully covers this text.
  // Otherwise retain normal ancestor-based WCAG failure (fail closed).
  const oneShapeBackdrop = (el, textNode) => {
    const active = el.closest('[data-one-shape-active="true"],[aria-selected="true"],[aria-current="page"]')
    const parent = active?.closest('[data-one-shape]')
    if (!parent) return null
    // Match OneShape's own selection rule: explicit containers NEVER fall back to
    // aria-current, e.g. the For You route points to Home without selecting its tab.
    const selector = parent.dataset.oneShape === 'explicit'
      ? '[data-one-shape-active="true"]'
      : '[aria-selected="true"],[aria-current="page"],[data-one-shape-active="true"]'
    if (parent.querySelector(selector) !== active) return null
    const shape = parent.querySelector(':scope > .pmd-one-shape')
    if (!shape) return null
    const st = getComputedStyle(shape)
    if (st.visibility === 'hidden' || st.display === 'none' || st.backgroundImage !== 'none' || Number(st.opacity) < 0.999) return null
    const colour = parse(st.backgroundColor)
    if (!colour || colour.a < 0.999) return null
    const range = document.createRange()
    range.selectNodeContents(textNode)
    const t = range.getBoundingClientRect()
    const b = shape.getBoundingClientRect()
    if (!(t.width > 0 && t.height > 0 && b.width > 0 && b.height > 0)) return null
    if (b.left > t.left + 1 || b.right < t.right - 1 || b.top > t.top + 1 || b.bottom < t.bottom - 1) return null
    // Backgrounds painted by descendants and the active element appear ABOVE
    // the shape; failing to composite them can falsely pass unreadable text.
    const layers = []
    let ruang = !!colour.ruang
    for (let e = el; e && e !== parent; e = e.parentElement) {
      const s = getComputedStyle(e)
      if (s.backgroundImage !== 'none' || Number(s.opacity) < 0.999) return { warna: null, ok: false, ruang }
      const c = parse(s.backgroundColor)
      if (!c) return { warna: null, ok: false, ruang }
      if (c.a > 0) { layers.push(c); ruang ||= !!c.ruang }
    }
    let warna = colour
    for (const layer of layers.reverse()) warna = over(layer, warna)
    return { warna, ok: true, ruang }
  }
  const latar = (el, textNode) => { // dari elemen ke atas sampai lapisan opak; gradien/gambar di antaranya => tak dapat diukur
    const shapeBackdrop = oneShapeBackdrop(el, textNode)
    if (shapeBackdrop) return shapeBackdrop
    const lapis = []; let ok = true; let dasar = null; let ruang = false
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e)
      if (s.backgroundImage !== 'none') { ok = false; break }
      const c = parse(s.backgroundColor)
      if (c && c.a > 0) { if (c.ruang) ruang = true; lapis.push(c); if (c.a >= 1) { dasar = c; break } }
    }
    let hasil = dasar ?? { r: 255, g: 255, b: 255, a: 1 }
    for (const c of (dasar ? lapis.slice(0, -1) : lapis).reverse()) hasil = over(c, hasil)
    return { warna: hasil, ok, ruang }
  }
  const out = { teksDiukur: 0, gagal: [], tidakDapatDiukur: 0 }
  const seen = new Set()
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n; (n = w.nextNode());) {
    if (!n.nodeValue.trim()) continue
    const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el)
    const s = getComputedStyle(el); const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1 || s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) === 0 || el.closest('[aria-hidden="true"],script,style,noscript,canvas')) continue
    if (s.clip !== 'auto' && s.clip !== '' || (s.position === 'absolute' && r.width <= 1 && r.height <= 1) || el.closest('.sr-only')) continue // teks khusus pembaca layar (sr-only)
    if (el.disabled || el.closest('[disabled]')) continue // WCAG 1.4.3 mengecualikan komponen nonaktif
    const fg0 = parse(s.color); if (!fg0) continue
    const { warna: bg, ok, ruang: bgRuang } = latar(el, n)
    if (!ok) { out.tidakDapatDiukur++; continue }
    const op = parseFloat(s.opacity) // opasitas elemen sendiri saja (opasitas ancestor tidak dihitung: dicatat di metode)
    const fg = over({ ...fg0, a: fg0.a * op }, bg)
    const px = parseFloat(s.fontSize)
    if (!(px > 0)) continue // font-size 0: tidak dirender sebagai teks yang terbaca (mis. lencana titik yang menyimpan angka); bukan kegagalan kontras
    const tebal = parseInt(s.fontWeight, 10) >= 700
    const besar = px >= 24 || (px >= 18.66 && tebal)
    const perlu = besar ? 3 : 4.5
    const k = rasio(fg, bg)
    // teks ~identik dengan latar yang terbaca = hampir pasti lapisan latar di luar rantai ancestor (pseudo-elemen, saudara absolut): TIDAK dinilai lulus, dihitung terpisah.
    if (k < 1.5) { out.latarTakTerselesaikan = (out.latarTakTerselesaikan || 0) + 1; continue }
    out.teksDiukur++
    if (k < perlu) out.gagal.push({ ruang: !!(fg0.ruang || bgRuang), sel: `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''}`, teks: n.nodeValue.trim().slice(0, 30), rasio: Math.round(k * 100) / 100, perlu, px, fg: `rgb(${Math.round(fg.r)},${Math.round(fg.g)},${Math.round(fg.b)})`, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})` })
  }
  return out
}
