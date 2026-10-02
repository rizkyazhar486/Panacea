import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { batalkanCatatan, catatSelesai, jumlahHariIni, sudahDicatat, tanggalLokal } from '../../src/lib/prayerLog.ts'

// ─────────────────────────────────────────────────────────────────────────────
// MENANDAI SALAT — bukan sekadar tombol, sebuah janji yang harus ditahan
// sampai selesai baru ditagih.
//
// prayerLog.ts menyimpan tanggal LOKAL, bukan UTC: seseorang yang menandai
// Isya jam 23 lalu membuka lagi jam 1 dini hari harus tetap melihatnya
// tertandai untuk hari yang sama baginya. Dan mencatat hari ini tidak boleh
// menyusun ulang atau menghapus catatan hari lain.
// ─────────────────────────────────────────────────────────────────────────────

// localStorage tidak ada di Node — tiruan minimal yang cukup untuk diuji.
const memori = new Map<string, string>()
;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => memori.get(k) ?? null,
  setItem: (k: string, v: string) => { memori.set(k, v) },
  removeItem: (k: string) => { memori.delete(k) },
  clear: () => memori.clear(),
  key: () => null,
  get length() { return memori.size },
} as Storage

// ── 1. Belum ditandai secara default ─────────────────────────────────────
memori.clear()
assert.equal(sudahDicatat('2026-09-18', 'Dhuhr'), false, 'a prayer starts marked as prayed with nothing recorded')

// ── 2. Menandai, lalu membaca kembali ────────────────────────────────────
catatSelesai('2026-09-18', 'Dhuhr')
assert.equal(sudahDicatat('2026-09-18', 'Dhuhr'), true, 'marking a prayer done is not being recorded')
assert.equal(sudahDicatat('2026-09-18', 'Asr'), false, 'marking Dhuhr also marked a different prayer on the same day')

// ── 3. Tanggal lain tidak ikut tertandai ─────────────────────────────────
assert.equal(sudahDicatat('2026-09-19', 'Dhuhr'), false, 'marking today leaked into a different date')

// ── 4. Membatalkan mengembalikan seperti semula ──────────────────────────
batalkanCatatan('2026-09-18', 'Dhuhr')
assert.equal(sudahDicatat('2026-09-18', 'Dhuhr'), false, 'undo did not actually remove the mark')

// ── 5. Menghitung hanya yang benar-benar tercatat, tidak ditebak ─────────
memori.clear()
catatSelesai('2026-09-18', 'Fajr')
catatSelesai('2026-09-18', 'Dhuhr')
catatSelesai('2026-09-18', 'Dhuhr') // menandai dua kali tidak boleh dihitung dua kali
assert.equal(jumlahHariIni('2026-09-18'), 2, 'the daily count double-counts a repeated mark, or drops a real one')
assert.equal(jumlahHariIni('2026-09-20'), 0, 'a day with nothing recorded reports a nonzero count')

// ── 6. Tanggal lokal, bukan potongan ISO yang jatuh ke UTC ───────────────
// Dipaksa ke UTC+14 (Kiritimati) supaya pengujiannya tidak bergantung pada
// zona waktu mesin yang menjalankannya — mesin uji ini sendiri kebetulan
// UTC, tempat kedua representasi selalu sama dan sabotasenya tidak akan
// pernah tertangkap tanpa paksaan ini.
{
  const tzAsal = process.env.TZ
  process.env.TZ = 'Pacific/Kiritimati' // UTC+14
  try {
    // 2026-09-17T11:00Z: UTC-nya 17 September, tetapi pukul setempat (UTC+14)
    // sudah 2026-09-18 01:00 — TANGGAL LOKAL SUDAH BERGANTI.
    const d = new Date(Date.UTC(2026, 8, 17, 11, 0))
    assert.equal(d.toISOString().slice(0, 10), '2026-09-17', 'test fixture itself is wrong — this instant is not 17 September UTC')
    assert.equal(tanggalLokal(d), '2026-09-18',
      'tanggalLokal() returned the UTC calendar date instead of the local one — a prayer marked done late at night ' +
      'in a positive-offset timezone would silently land on the wrong day')
  } finally {
    if (tzAsal === undefined) delete process.env.TZ; else process.env.TZ = tzAsal
  }
}

// ── 7. Widget benar-benar memakainya, bukan hanya mengimpornya ──────────
const ubin = readFileSync(new URL('../../src/components/UbinSalat.tsx', import.meta.url), 'utf8')
assert.match(ubin, /HoldToConfirm/, 'UbinSalat no longer renders the hold-to-confirm control')
assert.match(ubin, /catatSelesai\(/, 'UbinSalat no longer records a completed prayer')
assert.match(ubin, /sudahDicatat\(/, 'UbinSalat no longer checks whether a prayer was already marked')
assert.match(ubin, /batalkanCatatan\(/, 'UbinSalat lost the undo path — marking done would become irreversible')
assert.match(ubin, /e\.stopPropagation\(\)/,
  'the confirm control is inside the /prayer-times link again without stopping propagation — every hold would ' +
  'also navigate away the moment the finger lifts')
// stopPropagation ALONE was tried and found insufficient in a real browser:
// it stops <Link>'s own onClick from ever running, which is exactly where
// Link calls preventDefault() to suppress the anchor's native navigation.
// Without preventDefault() called independently here, the browser still
// followed the href the instant the hold finished and the finger lifted.
assert.match(ubin, /e\.preventDefault\(\)/,
  'the confirm wrapper lost preventDefault() — stopPropagation alone does not stop the native anchor navigation ' +
  '(browsers gate that on event.defaultPrevented, not on where propagation stopped); this was caught by actually ' +
  'holding the control in a real browser, where the page navigated away the moment the hold completed')
// Ia harus menandai salat yang SUDAH LEWAT, bukan yang berikutnya — menahan
// tombol untuk sesuatu yang belum tiba waktunya tidak berarti apa pun.
assert.match(ubin, /sudahLewat\(/, 'UbinSalat stopped computing which prayer has already passed')
const blokKonfirmasi = ubin.slice(ubin.indexOf('const terlewat = sudahLewat'))
assert.match(blokKonfirmasi, /HoldToConfirm/, 'sudahLewat() is computed but never reaches the confirm control')
assert.match(blokKonfirmasi, /terlewat\.salat/, 'the confirm control no longer targets the prayer sudahLewat() found')

// ── 8. Kontrolnya sendiri menahan, bukan sekadar tombol ──────────────────
const htc = readFileSync(new URL('../../src/components/HoldToConfirm.tsx', import.meta.url), 'utf8')
assert.match(htc, /onPointerDown/, 'the control no longer tracks a held pointer')
assert.match(htc, /onPointerUp/, 'releasing early no longer cancels the hold')
assert.match(htc, /holdMs/, 'the deliberate hold duration disappeared')
assert.match(htc, /detail === 0/,
  'keyboard/assistive-technology activation is no longer distinguished from a real pointer click — a screen ' +
  'reader user would be stuck holding a gesture they cannot physically perform')

const css = readFileSync(new URL('../../src/components/hold-to-confirm.css', import.meta.url), 'utf8')
assert.match(css, /prefers-reduced-motion/, 'the reduced-motion guard for the confirmation animation disappeared')

// Sabotase nyata di peramban sungguhan (bukan hanya dibaca dari kodenya):
// onConfirm terjadi SAAT progres penuh, sebelum jari benar-benar dilepas.
// React langsung menukar tombol ke wujud "selesai" (onClick=onUndo) SEMENTARA
// pointer masih tertahan di elemen DOM yang sama. Melepasnya sesaat kemudian
// menghasilkan `click` natif pada elemen itu — yang sekarang memanggil
// onUndo, membatalkan tepat setelah tercatat. localStorage yang tersimpan
// jadi array KOSONG padahal baru saja diisi. Tanpa penjaga `selesaiRef` di
// bawah ini, blok uji #7/#8 di atas tetap lulus karena keduanya hanya
// membaca kode sumber, tidak benar-benar menekan apa pun.
const blokSelesai = htc.slice(htc.indexOf('if (done) {'), htc.indexOf('return (\n    <button', htc.indexOf('if (done) {') + 1))
assert.match(blokSelesai, /if \(selesaiRef\.current\) return/,
  'the "done" button lost its cooldown guard — confirming right before the finger lifts fires onUndo a moment ' +
  'later on the same DOM node, silently reverting the mark. Caught only by actually holding the control in a ' +
  'real browser; a source scan for onUndo alone would not see this.')

console.log('tandai-salat-tertahan: ok (menahan untuk menandai, dapat dibatalkan, tanggal lokal, dapat diakses)')
