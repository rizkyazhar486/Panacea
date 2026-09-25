import assert from 'node:assert/strict'
import { navigationHierarchyForRoute } from '../../src/lib/superPages.ts'

const kasus = [
  {
    nama: 'Training menunjukkan super-page, space, dan halaman',
    aktual: navigationHierarchyForRoute('/latihan', 'Fitness', 'Training'),
    harapan: ['Your Body', 'Move', 'Training'],
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
