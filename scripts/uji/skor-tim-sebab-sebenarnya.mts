import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// "TIDAK ADA LAGA DALAM 30 HARI" ADALAH KLAIM TENTANG JADWAL.
//
// /api/sports/scores selalu menjawab dengan `res.json(...)` — juga ketika hulu
// gagal, dan bentuknya `{ events: [], error: 'upstream_403' }` dengan status
// HTTP 200. Maka `catch` di widget TIDAK PERNAH berjalan untuk kegagalan yang
// paling sering terjadi, dan `r.error` dulu tidak dibaca sama sekali.
//
// Yang sampai ke layar: tiga belas tim sekaligus — Barcelona, Arsenal,
// Liverpool, PSG, Internazionale — dilaporkan tidak punya satu pun laga dalam
// tiga puluh hari. Bukan salah hitung; klaim yang tidak pernah diperiksa.
// Sumbernya tidak menjawab, dan diamnya dibaca sebagai jawaban "kosong".
// ─────────────────────────────────────────────────────────────────────────────

const ubin = readFileSync(new URL('../../src/components/UbinSkor.tsx', import.meta.url), 'utf8')

// ── 1. Muatan galat dari sumber dihitung sebagai KEGAGALAN, bukan kekosongan ─
assert.match(ubin, /if \(r\.error\) \{[\s\S]{0,200}gagal\.add\(liga\)/,
  'the widget ignores `r.error` again. The scores route answers HTTP 200 even when the upstream fails, so an ' +
  'unanswered question is once more indistinguishable from "this team has no fixtures" — which is what put ' +
  'thirteen teams on screen as though they were all simultaneously idle.')

// ── 2. Liga yang akhirnya terjawab tidak boleh tetap dicap gagal ─────────
// Keliru ke arah sebaliknya juga keliru: menyebut sumbernya rusak padahal ia
// menjawab "memang kosong" membuat pemakainya mencari kerusakan yang tidak ada.
assert.match(ubin, /gagal\.delete\(liga\)/,
  'a league that failed on the 14-day window but answered on the 30-day one stays labelled as a source failure, ' +
  'reporting a fault that is not there')

// ── 3. Kalimat pembuka mengikuti sebab yang sebenarnya ───────────────────
assert.match(ubin, /could not be reached, so no fixture could be checked/,
  'when every league failed, the card still opens with "None of your teams have a match in the next 30 days" — ' +
  'a statement about the schedule, made without ever reading the schedule')
assert.match(ubin, /This is not the same as your teams having no match/,
  'the card no longer separates "we could not check" from "there is nothing" in words the reader can act on')
assert.match(ubin, /Some leagues could not be reached/,
  'the mixed case (some leagues answered, some did not) collapsed back into one blanket sentence')

// ── 4. Kalimat lama HANYA boleh muncul saat benar-benar terjawab ─────────
const blokKosong = ubin.slice(ubin.indexOf('laga.length === 0'), ubin.indexOf('kosongTim.map'))
assert.ok(
  blokKosong.includes("kosongTim.every((t) => t.sebab === 'gagal')"),
  'the "no match in the next 30 days" sentence is no longer guarded by whether the source actually answered',
)

// ── 5. Per-tim tetap menyebut sebabnya masing-masing ─────────────────────
assert.match(ubin, /its league could not be fetched from the scores source right now/,
  'the per-team reason line disappeared, so a reader can no longer tell which teams were checked and which were not')

console.log('skor-tim-sebab-sebenarnya: ok (sumber gagal tidak lagi dilaporkan sebagai "tidak ada jadwal")')
