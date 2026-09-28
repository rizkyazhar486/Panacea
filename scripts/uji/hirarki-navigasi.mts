import assert from 'node:assert/strict'
import { activeSuperPageForLocation, navigationHierarchyForRoute } from '../../src/lib/superPages.ts'

const kasus = [
  {
    nama: 'Training menunjukkan super-page, space, dan halaman',
    aktual: navigationHierarchyForRoute('/latihan', 'Fitness', 'Training'),
    harapan: ['Your Body', 'Move', 'Training'],
  },
  {
    nama: 'ponsel memakai short label super-page tanpa taxonomy baru',
    aktual: navigationHierarchyForRoute('/latihan', 'Fitness', 'Training', { compactSuperPage: true }),
    harapan: ['Body', 'Move', 'Training'],
  },
  {
    nama: 'Clinical hub tidak mengulang judul Clinical',
    aktual: navigationHierarchyForRoute('/clinical-hub', 'Clinical & AI', 'Clinical'),
    harapan: ['Clinical', 'Care'],
  },
  {
    nama: 'Body Explorer tetap berada di hierarki Body',
    aktual: navigationHierarchyForRoute('/body-explorer', 'Health', 'Body Explorer'),
    harapan: ['Your Body', 'Body', 'Body Explorer'],
  },
  {
    nama: 'Settings berada di For You > System',
    aktual: navigationHierarchyForRoute('/settings', 'Account', 'Settings'),
    harapan: ['For You', 'System', 'Settings'],
  },
  {
    nama: 'judul super-page yang sama hanya tampil sekali',
    aktual: navigationHierarchyForRoute('/fitness-hub', 'Fitness', 'Your Body'),
    harapan: ['Your Body', 'Move'],
  },
]

for (const k of kasus) {
  assert.deepEqual(k.aktual, k.harapan, k.nama)
  console.log('ok    ', k.nama)
}

console.log(`\n${kasus.length} lulus, 0 gagal`)


const activeCases = [
  ['/latihan', '', 'Fitness', 'body'],
  ['/body-explorer', '', 'Health', 'body'],
  ['/clinical-hub', '', 'Clinical & AI', 'clinical'],
  ['/settings', '', 'Account', 'for-you'],
  ['/', '', 'Home', null],
  ['/', '?t=for-you', 'Home', 'for-you'],
] as const

for (const [pathname, search, group, expected] of activeCases) {
  assert.equal(
    activeSuperPageForLocation(pathname, search, group),
    expected,
    `active super-page salah untuk ${pathname}${search}`,
  )
}

console.log(`${activeCases.length} active-state cases lulus, 0 gagal`)
