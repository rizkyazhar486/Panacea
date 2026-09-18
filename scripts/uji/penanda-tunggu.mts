import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// PENANDA TUNGGU YANG MENGATAKAN LEBIH BANYAK DARIPADA YANG IA KETAHUI.
//
// Ada dua jenis menunggu di aplikasi ini dan keduanya menuntut penanda yang
// berbeda. Menukarnya bukan soal selera:
//
//   MENUNGGU TATA LETAK — isi yang bentuknya sudah diketahui. Penandanya wajib
//   rangka setinggi isi yang akan menggantikannya. Orb tidak mencegah lompatan
//   tata letak sama sekali, dan di halaman yang memuat dosis obat, lompatan
//   berarti jari mendarat pada tombol yang berbeda dari yang dituju.
//
//   MENUNGGU PENALARAN — jawaban yang panjang dan bentuknya belum diketahui
//   siapa pun. Tidak ada rangka yang bisa menirunya; di sinilah orb berada.
//
// Dan satu larangan yang berlaku untuk keduanya: penanda tunggu TIDAK BOLEH
// menyatakan kemajuan yang tidak diukurnya. Batang yang terisi menurut tebakan
// waktu membuat orang menunggu lebih lama karena percaya tinggal sedikit lagi,
// lalu berhenti mempercayai angka lain di layar yang sama.
// ─────────────────────────────────────────────────────────────────────────────

const orb = readFileSync(new URL('../../src/components/ThinkingOrb.tsx', import.meta.url), 'utf8')
const orbCss = readFileSync(new URL('../../src/components/thinking-orb.css', import.meta.url), 'utf8')
const rangka = readFileSync(new URL('../../src/components/Rangka.tsx', import.meta.url), 'utf8')
const main = readFileSync(new URL('../../src/main.tsx', import.meta.url), 'utf8')
const chatbot = readFileSync(new URL('../../src/pages/Chatbot.tsx', import.meta.url), 'utf8')

// ── 1. Orb tidak boleh mengaku tahu kemajuan ─────────────────────────────
assert.ok(!/role="progressbar"|aria-valuenow|aria-valuemax/.test(orb),
  'the thinking orb reports progress it never measured. The wait it marks has no known length, so any ' +
  'percentage on it is invented.')
// Diperiksa pada KODE saja, bukan prosa: versi pertama pemeriksaan ini
// menangkap kata "persentase" di dalam komentar yang justru melarangnya, dan
// gerbang yang menuduh dokumentasinya sendiri akan dilucuti, bukan dibaca.
const orbKode = orb.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
assert.ok(!/\{[^}]*\}\s*%|percent|progress/i.test(orbKode),
  'the thinking orb renders a percentage or a progress value. Nothing here measures how far along the answer ' +
  'is, so any such number is invented.')

// ── 2. Tetapi ia harus tetap mengumumkan dirinya ─────────────────────────
assert.ok(/role="status"/.test(orb), 'the orb no longer announces itself; a screen reader would sit in silence')
assert.ok(/aria-live="polite"/.test(orb), 'the orb announcement is no longer live')
assert.ok(/aria-hidden="true"/.test(orb),
  'the decorative orb nodes are read out again: a screen reader would name three unlabelled shapes before ' +
  'reaching the one sentence that carries the meaning')

// ── 3. Gerak tak berujung wajib bisa dimatikan ───────────────────────────
const blokGerak = orbCss.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
assert.ok(blokGerak.length > 0, 'the orb lost its reduced-motion block; an endless loop is exactly the animation ' +
  'that triggers nausea for some people')
assert.ok(/animation:\s*none/.test(blokGerak), 'reduced motion no longer stops the orb animation')

// ── 4. Orb tidak boleh menggantikan rangka untuk memuat isi ──────────────
// Fallback rute tingkat aplikasi adalah MENUNGGU TATA LETAK. Menukarnya dengan
// orb menghidupkan kembali lompatan tata letak yang Rangka.tsx dibuat untuk
// mencegahnya, dan alasannya tertulis di berkas itu sendiri.
assert.ok(/RangkaHalaman/.test(main),
  'the app-level route fallback stopped using the page skeleton. An orb there does not reserve any height, so ' +
  'the page jumps when content arrives — which is the defect Rangka.tsx exists to prevent.')
assert.ok(!/ThinkingOrb/.test(main), 'the thinking orb was used as an app-level route fallback')
assert.ok(/mendekati kartu isi yang sesungguhnya/.test(rangka),
  'the reasoning that ties skeleton height to real content height was removed from Rangka')

// ── 5. Orb dipasang di tempat yang memang menunggu penalaran ─────────────
assert.ok(/<ThinkingOrb/.test(chatbot),
  'the orb is not mounted where the app actually waits on reasoning; a component nobody renders marks nothing')
assert.ok(!/animate-pulse">AI is analyzing/.test(chatbot),
  'the old pulsing text came back alongside the orb, so the same wait is now announced twice')

// ── 6. Tulisan untuk pembaca layar adalah antarmuka, dan antarmuka Inggris ──
// Aturan bahasa repositori ini memisahkan keduanya dengan tegas: komentar dan
// pengenal boleh Indonesia, antarmuka tidak. Tulisan yang hanya terdengar oleh
// pembaca layar tetap antarmuka — ia dibacakan kepada pengguna.
for (const [berkas, isi] of [['Rangka.tsx', rangka], ['ThinkingOrb.tsx', orb]] as const) {
  const label = [...isi.matchAll(/label\s*=\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
  assert.ok(label.length > 0, `${berkas} no longer sets any screen-reader label`)
  for (const teks of label) {
    assert.ok(!/^Memuat|^Sedang|^Mohon/i.test(teks),
      `${berkas} announces "${teks}" to screen readers in Indonesian. Screen-reader text is interface, and the ` +
      'interface language of this application is English.')
  }
}

console.log('penanda-tunggu: ok (orb untuk penalaran, rangka untuk tata letak, tidak ada kemajuan yang dikarang)')
