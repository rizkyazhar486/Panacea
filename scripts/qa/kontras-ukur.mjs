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
  const latar = (el) => { // dari elemen ke atas sampai lapisan opak; gradien/gambar di antaranya => tak dapat diukur
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
    const { warna: bg, ok, ruang: bgRuang } = latar(el)
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
