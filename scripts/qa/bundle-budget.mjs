// F2 — anggaran muatan awal (bundle budget): mengukur apa yang dimuat `dist/index.html` sebelum aplikasi interaktif, bukan waktu muat.
// Kenapa bukan waktu: audit UX berjalan di server dev Vite (kompilasi dingin; muatMsMaks ~30-40 detik) sehingga detiknya tidak mewakili produksi, dan runner CI
// berderau. Ukuran gzip berkas yang dirujuk index.html bersifat deterministik untuk sumber yang sama dan merupakan penentu utama waktu muat jaringan lambat.
// Metodologi: (1) parse tag <script>/<link> index.html; (2) baca tiap berkas lokal dari dist/ (berkas yang dirujuk tapi hilang = GALAT, tidak diabaikan);
// (3) gzip level 9; (4) bandingkan dengan governance/BUNDLE_BUDGET_BASELINE.json (ratchet: batas hanya boleh turun). Stylesheet lintas-origin tidak diukur
// ukurannya (tak ada di dist) tetapi DIHITUNG sebagai pemblokir render.
//   node scripts/qa/bundle-budget.mjs    (BUNDLE_DIST=dist, BUNDLE_BASELINE=<json>, QA_OUT=<json>)
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const atribut = (s, nama) => { const m = s.match(new RegExp(`(?:^|\\s)${nama}(?:\\s*=\\s*"([^"]*)")?(?=\\s|/|$)`)); return m ? (m[1] ?? '') : null }
const eksternal = (u) => /^(?:https?:)?\/\//i.test(u)

// html: isi index.html; baca(path relatif dist) => Buffer | null. Murni: tanpa fs, jam, atau jaringan.
export function analisisIndeks(html, baca) {
  const galat = []
  const m = { cssBlokirBerkas: 0, cssBlokirGzip: 0, cssBlokirEksternal: 0, jsBerkas: 0, jsGzip: 0, jsBlokirBerkas: 0, totalGzip: 0 }
  for (const t of html.matchAll(/<(script|link)\b([^>]*)>/gi)) {
    const tag = t[1].toLowerCase(); const a = t[2]
    const u = atribut(a, tag === 'script' ? 'src' : 'href'); if (!u) continue
    let jenis = null
    if (tag === 'script') {
      jenis = atribut(a, 'type') === 'module' ? 'js' : (atribut(a, 'defer') !== null || atribut(a, 'async') !== null ? 'js' : 'jsBlokir')
    } else {
      const rel = (atribut(a, 'rel') || '').toLowerCase()
      if (rel === 'stylesheet') jenis = (atribut(a, 'media') || '').toLowerCase() === 'print' ? null : 'css'
      else if (rel === 'modulepreload') jenis = 'js'
    }
    if (!jenis) continue
    if (eksternal(u)) { if (jenis === 'css') m.cssBlokirEksternal++; else galat.push(`skrip lintas-origin tak terukur: ${u}`); continue }
    const rel = u.split(/[?#]/)[0].replace(/^\.\//, '').replace(/^\//, '')
    const isi = baca(rel)
    if (!isi) { galat.push(`berkas dirujuk index.html tidak ada di dist: ${rel}`); continue }
    const gz = gzipSync(isi, { level: 9 }).length
    if (jenis === 'css') { m.cssBlokirBerkas++; m.cssBlokirGzip += gz } else { m.jsBerkas++; m.jsGzip += gz; if (jenis === 'jsBlokir') m.jsBlokirBerkas++ }
    m.totalGzip += gz
  }
  if (m.jsBerkas === 0) galat.push('tidak ada skrip/modul terukur di index.html (halaman kosong atau parser salah)')
  return { metrik: m, galat }
}

// Mengembalikan daftar pelanggaran bernama. Metrik yang tak punya batas di baseline = pelanggaran (fail-closed), bukan lulus.
export function periksaAnggaran(metrik, dasar) {
  const out = []
  for (const k of Object.keys(metrik)) {
    if (!Number.isFinite(dasar?.batas?.[k])) { out.push(`${k}: baseline tidak punya batas (fail-closed)`); continue }
    if (metrik[k] > dasar.batas[k]) out.push(`${k}: ${metrik[k]} > ${dasar.batas[k]}`)
  }
  return out
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const dist = process.env.BUNDLE_DIST || 'dist'
  const idx = join(dist, 'index.html')
  if (!existsSync(idx)) { console.error(`bundle-budget GAGAL: ${idx} tidak ada (jalankan vite build lebih dulu)`); process.exit(1) }
  const { metrik, galat } = analisisIndeks(readFileSync(idx, 'utf8'), (p) => { const f = join(dist, p); return existsSync(f) ? readFileSync(f) : null })
  console.log(JSON.stringify(metrik))
  if (process.env.QA_OUT) writeFileSync(process.env.QA_OUT, JSON.stringify({ dihasilkan: new Date().toISOString(), metrik, galat }, null, 2))
  if (galat.length) { console.error('bundle-budget GAGAL (galat ukur):\n - ' + galat.join('\n - ')); process.exit(1) }
  const bf = process.env.BUNDLE_BASELINE || 'governance/BUNDLE_BUDGET_BASELINE.json'
  if (!existsSync(bf)) { console.error(`bundle-budget GAGAL: baseline ${bf} tidak ada (fail-closed)`); process.exit(1) }
  const pel = periksaAnggaran(metrik, JSON.parse(readFileSync(bf, 'utf8')))
  if (pel.length) { console.error('bundle-budget GAGAL:\n - ' + pel.join('\n - ')); process.exit(1) }
}
