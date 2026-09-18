import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cakupanDenyutPekan, kalimatCakupan } from '../../src/lib/cakupanDenyut.ts'

// ─────────────────────────────────────────────────────────────────────────────
// ANGKA YANG BENAR YANG MENGHASILKAN KESIMPULAN YANG SALAH.
//
// Menit Zona 2 hanya dapat dihitung dari sesi yang MEREKAM detak jantung. Ubin
// Zona 2 menyaring sesi tanpa HR (`w.hr.length >= 2`) lalu menjumlahkan sisanya
// — dan tidak mengatakan apa pun tentang yang tersaring.
//
// Akibatnya bukan salah hitung, melainkan salah baca. Seseorang yang berlatih
// lima kali pekan ini dengan dua sesi memakai jam tangan melihat "34 menit" dan
// menyimpulkan pekannya ringan. Yang ringan adalah datanya. Ia lalu menambah
// beban yang tidak perlu ditambah, dari angka yang secara aritmetika benar.
//
// Dan ketika TIDAK SATU PUN sesi merekam HR, ubinnya dahulu `return null`:
// hilang dari layar tanpa sepatah kata. Pemakainya tidak diberi tahu bahwa
// yang kurang adalah alat perekamnya, bukan latihannya.
// ─────────────────────────────────────────────────────────────────────────────

const HARI = 864e5
const sesi = (umurHari: number, titikHr: number) => ({
  mulai: new Date(Date.now() - umurHari * HARI).toISOString(),
  hr: Array.from({ length: titikHr }, (_, i) => ({ t: i * 60, bpm: 130 })),
})

// ── 1. Sesi tanpa HR dihitung, bukan dibuang ─────────────────────────────
{
  const c = cakupanDenyutPekan([sesi(1, 30), sesi(2, 0), sesi(3, 0), sesi(4, 40), sesi(5, 0)])
  assert.equal(c.denganHr, 2, 'sessions with a heart-rate series are no longer counted')
  assert.equal(c.tanpaHr, 3,
    'sessions without heart rate are being dropped instead of counted. That is exactly how "34 minutes" comes ' +
    'to stand for a whole week that it never covered.')
}

// ── 2. Hanya tujuh hari terakhir ─────────────────────────────────────────
{
  const c = cakupanDenyutPekan([sesi(1, 10), sesi(8, 10), sesi(30, 0)])
  assert.equal(c.denganHr + c.tanpaHr, 1, 'the window is no longer seven days, so the count no longer matches the figure it annotates')
}

// ── 3. Satu titik HR bukan deret ─────────────────────────────────────────
// Satu sampel tidak membentuk rentang waktu, jadi tidak ada zona yang bisa
// diturunkan darinya. Ambangnya harus sama dengan penyaring yang dipakai ubin;
// kalau berbeda, keterangan cakupan akan menghitung sesi yang justru tidak ikut
// dijumlahkan.
{
  const c = cakupanDenyutPekan([sesi(1, 1)])
  assert.equal(c.denganHr, 0, 'a single heart-rate sample is treated as a usable series')
  assert.equal(c.tanpaHr, 1)
}

// ── 4. Tanggal rusak tidak menggelembungkan hitungan ─────────────────────
{
  const c = cakupanDenyutPekan([{ mulai: 'bukan tanggal', hr: [] }, { hr: [] }, sesi(1, 0)])
  assert.equal(c.tanpaHr, 1, 'unparseable timestamps are being counted as sessions this week')
}

// ── 5. Kalimatnya diam ketika memang lengkap ─────────────────────────────
assert.equal(kalimatCakupan({ denganHr: 3, tanpaHr: 0 }), null,
  'a coverage note is printed even when every session was measured, which adds text without adding anything to know')

// ── 6. Dan berbicara ketika tidak ─────────────────────────────────────────
{
  const teks = kalimatCakupan({ denganHr: 2, tanpaHr: 3 }) ?? ''
  assert.match(teks, /2 of 5/, 'the coverage note no longer states how many of the week\'s sessions it covers')
  assert.match(teks, /unknown rather than zero/,
    'the note no longer says the missing minutes are unknown rather than zero — that distinction is the whole point')
  assert.match(teks, /floor/, 'the note no longer says the figure is a floor')
  assert.match(kalimatCakupan({ denganHr: 1, tanpaHr: 1 }) ?? '', /One session has/,
    'the singular case reads as "1 sessions have"')
}

// ── 7. Ubin Zona 2 harus benar-benar memakainya ──────────────────────────
const ubin = readFileSync(new URL('../../src/components/UbinLanjutan.tsx', import.meta.url), 'utf8')
const blok = ubin.slice(ubin.indexOf('export function UbinZona2'))
  .slice(0, ubin.slice(ubin.indexOf('export function UbinZona2')).indexOf('\nexport function '))
assert.ok(/cakupanDenyutPekan\(/.test(blok),
  'the Zone 2 tile stopped counting its unmeasured sessions, so the filtered-out ones vanish silently again')
assert.ok(/kalimatCakupan\(/.test(blok), 'the Zone 2 tile no longer renders the coverage note')
assert.ok(!/if \(menit == null\) return null/.test(blok),
  'the Zone 2 tile disappears entirely again when no session recorded heart rate, telling the reader nothing ' +
  'about why — they cannot tell a broken feature from a missing chest strap')

console.log('cakupan-denyut: ok (sesi tanpa HR dihitung dan disebut; angka HR dinyatakan sebagai lantai)')
