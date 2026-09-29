import assert from 'node:assert/strict'
import {
  SUPER_PAGES,
  activeSuperPageForLocation,
  categoryPageContextForRoute,
  navigationHierarchyForRoute,
  superPageForRoute,
} from '../../src/lib/superPages.ts'

const kasus = [
  {
    nama: 'Training berada di category-page Health',
    aktual: navigationHierarchyForRoute('/latihan', 'Fitness', 'Training'),
    harapan: ['Health', 'Move', 'Training'],
  },
  {
    nama: 'ponsel tetap memakai category-page yang sama',
    aktual: navigationHierarchyForRoute('/latihan', 'Fitness', 'Training', { compactSuperPage: true }),
    harapan: ['Health', 'Move', 'Training'],
  },
  {
    nama: 'Clinical hub tidak mengulang judul Clinical',
    aktual: navigationHierarchyForRoute('/clinical-hub', 'Clinical & AI', 'Clinical'),
    harapan: ['Clinical', 'Care'],
  },
  {
    nama: 'Body Explorer berada di Human > Body',
    aktual: navigationHierarchyForRoute('/body-explorer', 'Health', 'Body Explorer'),
    harapan: ['Human', 'Body', 'Body Explorer'],
  },
  {
    nama: 'Medical record dipromosikan menjadi Records tanpa menghapus Care ancestry',
    aktual: navigationHierarchyForRoute('/emr', 'Clinical & AI', 'Medical Records'),
    harapan: ['Records', 'Care', 'Medical Records'],
  },
  {
    nama: 'Health simulator menjadi Simulate > Discover',
    aktual: navigationHierarchyForRoute('/health-simulator', 'Longevity', 'Health Simulator'),
    harapan: ['Simulate', 'Discover', 'Health Simulator'],
  },
  {
    nama: 'Medical study menjadi Explore > Learn',
    aktual: navigationHierarchyForRoute('/med-study', 'Learn & Look Up', 'Medical Library'),
    harapan: ['Explore', 'Learn', 'Medical Library'],
  },
  {
    nama: 'Settings berada di For You > System',
    aktual: navigationHierarchyForRoute('/settings', 'Account', 'Settings'),
    harapan: ['For You', 'System', 'Settings'],
  },
]

for (const k of kasus) {
  assert.deepEqual(k.aktual, k.harapan, k.nama)
  console.log('ok    ', k.nama)
}

console.log(`\n${kasus.length} hierarchy cases lulus, 0 gagal`)

const activeCases = [
  ['/latihan', '', 'Fitness', 'health'],
  ['/body-explorer', '', 'Health', 'human'],
  ['/clinical-hub', '', 'Clinical & AI', 'clinical'],
  ['/med-study', '', 'Learn & Look Up', 'explore'],
  ['/health-simulator', '', 'Longevity', 'simulate'],
  ['/health-data', '', 'Health', 'records'],
  ['/settings', '', 'Account', 'for-you'],
  ['/', '', 'Home', null],
  ['/', '?t=for-you', 'Home', 'for-you'],
] as const

for (const [pathname, search, group, expected] of activeCases) {
  assert.equal(
    activeSuperPageForLocation(pathname, search, group),
    expected,
    `active category-page salah untuk ${pathname}${search}`,
  )
}

console.log(`${activeCases.length} active-state cases lulus, 0 gagal`)

assert.deepEqual(
  SUPER_PAGES.map((page) => page.id),
  ['human', 'health', 'clinical', 'explore', 'simulate', 'records', 'for-you'],
  'top-level product surface harus tetap tujuh category-pages yang compact',
)
assert.equal(new Set(SUPER_PAGES.map((page) => page.to)).size, SUPER_PAGES.length)
assert.equal(SUPER_PAGES.every((page) => page.stateSource === 'canonical-human-state'), true)

const representativeRoutes = [
  ['/body-explorer', 'human'],
  ['/latihan', 'health'],
  ['/clinical-hub', 'clinical'],
  ['/med-study', 'explore'],
  ['/health-simulator', 'simulate'],
  ['/emr', 'records'],
  ['/settings', 'for-you'],
] as const

for (const [route, expectedCategory] of representativeRoutes) {
  assert.equal(superPageForRoute(route), expectedCategory)
  const context = categoryPageContextForRoute(route)
  assert.equal(context.category.id, expectedCategory)
  assert.equal(context.canonicalStateSource, 'canonical-human-state')
  assert.equal(context.projectionModel, 'shared-state-category-lens')
  assert.equal(context.connectedCategories.includes(expectedCategory), false)
  assert.equal(context.connectedCategories.length, SUPER_PAGES.length - 1)
}

console.log('category-page integration contract lulus: one human state, many connected lenses')
