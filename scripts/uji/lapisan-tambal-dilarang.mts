import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// TIDAK ADA LAPISAN TAMBAL BARU.
//
// public/ dan src/styles/ berisi lapisan CSS/JS berversi (v4 … v50). Setiap
// redesign menambah lapisan di atasnya dan memakai `!important` supaya menang,
// sehingga perubahan kecil merusak tempat lain dan sistem desain tunggal
// mustahil dibangun. Lihat docs/V1_REBUILD_VS_REFACTOR.md (K2).
//
// Gerbang ini membekukan keadaan sekarang, bukan memperbaikinya:
//   1. berkas `*-vNN.css|js` baru ditolak; ubah token/komponen yang ada, atau
//      ubah lapisan yang sudah terdaftar di bawah;
//   2. jumlah `!important` tidak boleh naik. Turunkan angkanya saat
//      lapisan lama dipensiunkan; jangan pernah menaikkannya.
// Saat sebuah berkas dipensiunkan, hapus juga namanya dari DAFTAR_LAMA.

const DAFTAR_LAMA = new Set([
  'public/deep-human-lab/deep-human-lab-v2.css',
  'public/deep-human-lab/deep-human-lab-v2.js',
  'public/deep-human-lab/deep-human-lab-v3.css',
  'public/deep-human-lab/deep-human-lab-v3.js',
  'public/ui-iterations/home-performance-v12.css',
  'public/ui-iterations/nav-ux-v21.css',
  'public/ui-iterations/panacea-control-grading-v46.css',
  'public/ui-iterations/panacea-feature-spectrum-v48.css',
  'public/ui-iterations/panacea-feature-spectrum-v48.js',
  'public/ui-iterations/panacea-green-material-v48.css',
  'public/ui-iterations/panacea-hig-v41.css',
  'public/ui-iterations/panacea-liquid-actions-v45.css',
  'public/ui-iterations/panacea-liquid-actions-v45.js',
  'public/ui-iterations/panacea-liquid-infinite-v44.css',
  'public/ui-iterations/panacea-liquid-infinite-v44.js',
  'public/ui-iterations/panacea-reference-ui-v47.css',
  'public/ui-iterations/panacea-reference-ui-v47.js',
  'public/ui-iterations/panacea-ruthless-simple-v50.css',
  'public/ui-iterations/panacea-shell-mobile-compact-v49.css',
  'public/ui-iterations/panacea-visual-first-v43.css',
  'public/ui-iterations/panacea-visual-first-v43.js',
  'public/ui-iterations/shell-mobile-compact-v49.css',
  'public/ui-iterations/shell-performance-v20.css',
  'public/ui-iterations/shell-theme-v18.css',
  'public/ui-iterations/welcome-revitalization-v28.css',
  'public/ui-iterations/welcome-runtime-v28.js',
  'src/styles/home-dark-comfort-v34.css',
  'src/styles/home-green-material-v48.css',
  'src/styles/home-health-instruments-v40.css',
  'src/styles/home-mobile-shell-repair-v45.css',
  'src/styles/home-overview-mosaic-v43.css',
  'src/styles/home-widget-active-v35.css',
  'src/styles/home-widget-rebuild-v39.css',
  'src/styles/production-readability-v1.css',
  'src/styles/responsive-density-v1.css',
  'src/styles/superpage-cohesion-v1.css',
  'src/styles/widget-archetypes-v6.css',
  'src/styles/widget-concepts-v6.css',
  'src/styles/widget-concepts-v7.css',
  'src/styles/widget-concepts-v8.css',
  'src/styles/widget-concepts-v9.css',
  'src/styles/widget-dark-surface-v29.css',
  'src/styles/widget-living-instrument-v5.css',
  'src/styles/widget-system-v4.css',
])

const AKAR = join(new URL('.', import.meta.url).pathname, '..', '..')
const semua = (dir: string): string[] =>
  (readdirSync(join(AKAR, dir), { recursive: true }) as string[]).map((p) => `${dir}/${p}`)

const berkas = [...semua('public'), ...semua('src')]

const berversi = berkas.filter((p) => /-v\d+[a-z0-9.-]*\.(css|js|mjs)$/.test(p))
const baru = berversi.filter((p) => !DAFTAR_LAMA.has(p))
assert.deepEqual(
  baru, [],
  `lapisan berversi baru dilarang; ubah yang sudah ada atau token desain:\n  ${baru.join('\n  ')}`,
)

const css = berkas.filter((p) => p.endsWith('.css'))
const BATAS_IMPORTANT = 2157

const jumlah = css.reduce(
  (n, p) => n + (readFileSync(join(AKAR, p), 'utf8').match(/!important/g)?.length ?? 0), 0,
)
assert.ok(
  jumlah <= BATAS_IMPORTANT,
  `!important naik menjadi ${jumlah} (batas ${BATAS_IMPORTANT}); pakai token/@layer, bukan !important baru`,
)

console.log(`lapisan tambal dibekukan: ${berversi.length} berkas berversi, ${jumlah}/${BATAS_IMPORTANT} !important di ${css.length} css`)
