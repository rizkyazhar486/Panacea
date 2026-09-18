import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FITUR_DARI_HUB } from '../../src/lib/katalogFitur.ts'
import { bentoSpan } from '../../src/lib/interaction/bento.ts'
import {
  DEFAULT_COMMAND_BAR_THRESHOLDS as AMBANG,
  nextCommandBarState,
} from '../../src/lib/interaction/commandBar.ts'

// ─────────────────────────────────────────────────────────────────────────────
// DUA CACAT YANG SAMA-SAMA TIDAK TERLIHAT DARI KODE YANG LOLOS tsc.
//
// 1. INDEKS KAPABILITAS BERHENTI DI 40 TANPA MENGATAKANNYA.
//    Katalognya memuat 135 kapabilitas. Daftar Beranda merender
//    `filtered.slice(0, 40)` dan tidak menampilkan apa pun tentang sisanya —
//    tidak ada hitungan, tidak ada "muat lagi", tidak ada tanda. Jadi 95
//    kapabilitas tidak dapat ditemukan dengan MENJELAJAH sama sekali; satu-
//    satunya jalan tersisa adalah mengetikkan namanya, yang hanya bisa
//    dilakukan orang yang sudah tahu nama itu ada.
//
// 2. BILAH YANG BERSEMBUNYI DAN TIDAK BISA DIPANGGIL KEMBALI.
//    Bilah yang menyingkir dengan translateY(-100%) tidak lagi berada di bawah
//    kursor, jadi `:hover` pada bilah itu sendiri tidak akan pernah menyala.
//    Dan bilah yang menyingkir saat fokus papan ketik ada di dalamnya membuang
//    pengguna papan ketik ke kendali yang tidak terlihat.
// ─────────────────────────────────────────────────────────────────────────────

const deck = readFileSync(new URL('../../src/components/HomeCommandDeck.tsx', import.meta.url), 'utf8')
const shell = readFileSync(new URL('../../src/components/Shell.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../../src/styles/command-bar.css', import.meta.url), 'utf8')

// ── 1. Tidak boleh ada pemotongan diam-diam pada indeks ──────────────────
assert.ok(!/\.slice\(0,\s*\d+\)/.test(deck),
  'the capability index truncates with a fixed slice again. With 135 capabilities in the catalogue and a ' +
  'cap of 40, browsing can never reach the rest and nothing on screen says they exist.')

// Yang dirender adalah SELURUH isi kelompok, bukan sebagian.
assert.ok(/group\.items\.map\(/.test(deck),
  'the bento no longer renders a group by its whole item list; a partial render brings the silent cap back')

// Hitungan harus terlihat: sebuah kelompok yang menyembunyikan ukurannya
// adalah pemotongan diam-diam dalam bentuk lain.
assert.ok(/panacea-bento-count/.test(deck), 'the per-group count disappeared from the bento tile')
assert.ok(/All \$\{uniqueFeatures\.length\} capabilities/.test(deck),
  'the index toggle no longer states how many capabilities exist in total')

// ── 2. Pengelompokan harus meliputi seluruh katalog ──────────────────────
// Kalau `grup` hilang dari sebagian entri, ubin "Other" wajib menampungnya;
// tanpa itu kapabilitas jatuh keluar dari bento tanpa jejak.
const perGrup = new Map<string, number>()
for (const f of FITUR_DARI_HUB) {
  const k = f.grup ?? 'Other'
  perGrup.set(k, (perGrup.get(k) ?? 0) + 1)
}
const jumlahTerkelompok = [...perGrup.values()].reduce((a, b) => a + b, 0)
assert.equal(jumlahTerkelompok, FITUR_DARI_HUB.length,
  `grouping lost capabilities: ${jumlahTerkelompok} grouped vs ${FITUR_DARI_HUB.length} in the catalogue`)
// Fallback kelompok kini tinggal di penggabung katalog, bukan di komponen —
// satu tempat untuk kedua pemakainya. Yang dijaga tetap sama: entri tanpa
// kelompok harus jatuh ke ember yang TERLIHAT, bukan menghilang.
const gabung = readFileSync(new URL('../../src/lib/katalogLengkap.ts', import.meta.url), 'utf8')
assert.ok(/f\.grup \?\? 'Other'/.test(gabung),
  'features without a group are dropped instead of collected into a visible bucket')

// ── 3. Ukuran ubin dibaca dari isi, bukan dari selera ────────────────────
// Angka-angka ini adalah isi katalog yang sebenarnya, bukan contoh karangan:
// Longevity 57, Calculators & Labs 41, Fitness 28, Learn & Look Up 9.
assert.equal(bentoSpan(57, 135), 'lead', 'the largest group no longer earns the lead tile')
assert.equal(bentoSpan(28, 135), 'wide')
assert.equal(bentoSpan(9, 135), 'unit', 'a small group is being given the same weight as a large one')
assert.equal(bentoSpan(0, 0), 'unit', 'an empty catalogue must not divide by zero')
// Monoton: lebih banyak isi tidak boleh menghasilkan ubin yang lebih kecil.
const urutan = { unit: 0, wide: 1, lead: 2 }
for (let n = 1; n < 135; n += 1) {
  assert.ok(urutan[bentoSpan(n + 1, 135)] >= urutan[bentoSpan(n, 135)],
    `bentoSpan shrank the tile when the group grew from ${n} to ${n + 1}`)
}

// ── 4. Bilah perintah: fokus papan ketik menang atas segalanya ───────────
const dasar = { scrollY: 900, previousScrollY: 0, pointerY: null, focusWithin: false }
assert.equal(nextCommandBarState('shown', { ...dasar, focusWithin: true }), 'shown',
  'the bar hides while keyboard focus is inside it; Tab would then move into controls nobody can see')
assert.equal(nextCommandBarState('hidden', { ...dasar, focusWithin: true }), 'shown',
  'focus entering a hidden bar does not bring it back')

// ── 5. Puncak halaman selalu menampilkan bilah ───────────────────────────
assert.equal(nextCommandBarState('hidden', { ...dasar, scrollY: 0, previousScrollY: 400 }), 'shown')
assert.equal(
  nextCommandBarState('hidden', { ...dasar, scrollY: AMBANG.alwaysVisibleBelowPx, previousScrollY: 400 }),
  'shown',
  'at the always-visible offset the bar is allowed to stay hidden',
)

// ── 6. Pita tangkap memanggil bilah kembali ──────────────────────────────
assert.equal(nextCommandBarState('hidden', { ...dasar, pointerY: AMBANG.revealZonePx - 1 }), 'shown',
  'a pointer at the top edge no longer reveals the bar — with the bar itself off-screen, nothing else can')
assert.equal(nextCommandBarState('hidden', { ...dasar, pointerY: AMBANG.revealZonePx + 40 }), 'hidden',
  'a pointer in the middle of the page reveals the bar, so it can never stay out of the way')

// ── 7. Arah gulir, dan getaran jari yang harus diabaikan ─────────────────
assert.equal(nextCommandBarState('shown', { ...dasar, scrollY: 900, previousScrollY: 400 }), 'hidden')
assert.equal(nextCommandBarState('hidden', { ...dasar, scrollY: 400, previousScrollY: 900 }), 'shown')
assert.equal(
  nextCommandBarState('hidden', { ...dasar, scrollY: 900, previousScrollY: 900 - (AMBANG.ignoreDeltaPx - 1) }),
  'hidden',
  'a sub-threshold jitter flips the bar; it would strobe while a finger rests on the screen',
)

// ── 8. Pita tangkap tidak boleh menelan klik ─────────────────────────────
const blokPita = css.match(/\.panacea-command-bar-reveal-zone\s*\{[^}]*\}/)?.[0] ?? ''
assert.ok(blokPita.length > 0, 'the reveal zone disappeared from the stylesheet')
assert.ok(/pointer-events:\s*none/.test(blokPita),
  'the reveal zone accepts the pointer again: an invisible 64px strip would then swallow every click meant ' +
  'for the content beneath it, which is the same class of defect as the banner that once covered the top bar')

// ── 9. Bilah yang tersembunyi tidak boleh menahan fokus ──────────────────
assert.ok(/data-panacea-command-bar='hidden'\][\s\S]{0,220}?visibility:\s*hidden/.test(css),
  'a hidden bar stays focusable: it is only moved off-screen, so Tab still walks into it')

// ── 10. Shell benar-benar memasangnya ────────────────────────────────────
assert.ok(/data-panacea-command-bar=\{keadaanBilah\}/.test(shell), 'the top bar no longer reports its state')
assert.ok(/panacea-command-bar-reveal-zone/.test(shell), 'the reveal zone is not mounted in the Shell')
assert.doesNotMatch(shell, /navHidden|setNavHidden/,
  'global Assistive Touch must not disappear when the command bar hides during reading')
assert.match(shell, /SUPER_PAGES\.map\(/,
  'removing the old dock must still leave the three super-page command dropdown reachable from the command bar')

console.log(
  `bento-dan-bilah-perintah: ok (${FITUR_DARI_HUB.length} kapabilitas dalam ${perGrup.size} kelompok, tidak ada yang dipotong diam-diam)`,
)
