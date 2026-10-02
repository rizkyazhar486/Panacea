import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_COMMAND_BAR_THRESHOLDS as AMBANG,
  nextCommandBarState,
} from '../../src/lib/interaction/commandBar.ts'

// ─────────────────────────────────────────────────────────────────────────────
// DI PONSEL, TIDAK ADA HOVER — JADI TIDAK ADA JALAN KEMBALI.
//
// useCommandBar sengaja membuang posisi jari (`pointerType === 'mouse' ?
// clientY : null`), dengan alasan sentuhan tidak punya "dekat tepi atas".
// Benar untuk hover; keliru sebagai kesimpulan. Akibatnya di ponsel bilah
// hanya bisa dipanggil dengan menggulir ke atas, dan MENGETUK tepi atas —
// isyarat yang paling langsung — tidak melakukan apa pun.
//
// Dan tombol melayang tetap tinggal saat bilahnya menyingkir, jadi layar yang
// seharusnya bersih masih menyisakan satu benda mengambang di atas isi.
// ─────────────────────────────────────────────────────────────────────────────

const DASAR = { scrollY: 600, previousScrollY: 600, pointerY: null, focusWithin: false }

// ── 1. Ketukan di tepi atas memanggil bilah kembali ──────────────────────
assert.equal(
  nextCommandBarState('hidden', { ...DASAR, tapAtTop: true }),
  'shown',
  'tapping the top edge no longer reveals the command bar — on a touch device that removes the only direct way ' +
  'to call it back, since a finger has no hover',
)

// ── 2. Tanpa ketukan, keadaan tersembunyi bertahan ───────────────────────
assert.equal(
  nextCommandBarState('hidden', { ...DASAR, tapAtTop: false }),
  'hidden',
  'the bar reappears without any trigger, which defeats the point of it stepping aside',
)

// ── 3. Menggulir ke bawah menyembunyikannya lagi sesudah diketuk ─────────
// Ketukan bukan kunci: ia memanggil sekali, lalu perilaku normal kembali.
assert.equal(
  nextCommandBarState('shown', { ...DASAR, scrollY: 900, previousScrollY: 600 }),
  'hidden',
  'after a tap reveal, scrolling down no longer hides the bar — the tap has become a latch instead of a call',
)

// ── 4. Menggulir ke atas tetap memanggilnya, seperti sebelumnya ──────────
assert.equal(
  nextCommandBarState('hidden', { ...DASAR, scrollY: 400, previousScrollY: 600 }),
  'shown',
  'scrolling up no longer reveals the bar',
)

// ── 5. Fokus papan ketik tetap menang atas segalanya ─────────────────────
assert.equal(
  nextCommandBarState('hidden', { ...DASAR, scrollY: 900, previousScrollY: 600, focusWithin: true }),
  'shown',
  'a bar holding keyboard focus hides itself, which strands the focused control off-screen',
)

// ── 6. Hook benar-benar mendengarkan ketukan, bukan hanya hover ──────────
const hook = readFileSync(new URL('../../src/components/useCommandBar.ts', import.meta.url), 'utf8')
assert.match(hook, /addEventListener\('pointerdown'/,
  'the touch tap listener is gone; only mouse hover can reveal the bar again')
assert.match(hook, /pointerType === 'mouse'\) return/,
  'the tap path no longer excludes the mouse — a plain click anywhere near the top of the page would pop the bar open')
assert.match(hook, /tapAtTop/, 'the hook no longer feeds the tap through to the decision function')

// ── 6b. Masukan dipotret SEBELUM ref diperbarui ──────────────────────────
// Ditemukan dengan menggulir sungguhan di 390x844, bukan dengan membaca kode:
// membaca `previousScrollY.current` di dalam updater setState sementara
// barisnya diperbarui tepat sesudah setState membuat updater React 18 melihat
// nilai yang sudah tertimpa. Selisihnya nol, dan arah gulir tidak terbaca
// sama sekali — menggulir ke ATAS tidak memanggil bilah kembali.
const iPotret = hook.indexOf('const masukan = {')
const iSetState = hook.indexOf('setState((current) =>')
assert.ok(iPotret !== -1 && iPotret < iSetState,
  'the scroll input is no longer snapshotted before setState. Reading previousScrollY inside the updater lets ' +
  "React run it after the ref was overwritten, so the delta reads zero and scroll direction stops working entirely.")
assert.ok(
  hook.indexOf('previousScrollY.current = scrollY') < iSetState,
  'previousScrollY is updated after setState again, which reintroduces the race that silently disabled ' +
  'scroll-up reveal',
)
// Ketukan TIDAK BOLEH ditelan: isi halaman di bawah pita tetap harus menerimanya.
assert.doesNotMatch(hook, /padaKetukan[\s\S]{0,400}preventDefault/,
  'the tap listener calls preventDefault, so it now swallows taps belonging to the page content underneath the ' +
  'top 64px — exactly the invisible-layer bug this reveal zone was built to avoid')

// ── 7. FAB ikut menyingkir bersama bilahnya ──────────────────────────────
const fab = readFileSync(new URL('../../src/components/FabNavigasi.tsx', import.meta.url), 'utf8')
assert.match(fab, /tersembunyi/, 'the assistive orb no longer accepts the hidden state, so it stays while the bar leaves')
assert.match(fab, /const menyingkir = tersembunyi && !buka && !menggeser/,
  'the orb either hides unconditionally — cancelling an open menu or a drag mid-gesture — or no longer hides at all')
assert.match(fab, /pointerEvents: menyingkir \? 'none' : undefined/,
  'a hidden orb still catches pointer events, so an invisible button sits over the page content')

const shell = readFileSync(new URL('../../src/components/Shell.tsx', import.meta.url), 'utf8')
assert.match(shell, /tersembunyi=\{keadaanBilah === 'hidden'\}/,
  'Shell no longer passes the command-bar state to the orb, so the two stopped moving together')

console.log('bilah-fab-menyingkir: ok (ketuk tepi atas memanggil bilah; orb ikut menyingkir tanpa membatalkan gerakan)')
