import { lazy } from 'react'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { IconLeaf } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Gizi — delapan halaman yang semuanya menjawab satu pertanyaan yang sama:
// apa yang masuk ke tubuh hari ini, dan apa akibatnya.
//
// Sebelumnya kedelapannya berdiri sebagai rute sendiri-sendiri, padahal orang
// tidak memikirkannya terpisah: makanan, cairan, kopi, alkohol, dan suplemen
// adalah satu keputusan yang diambil pada hari yang sama. Memisahkannya
// menjadi delapan alamat memaksa orang mengingat delapan tempat untuk satu
// urusan.
//
// Isinya TIDAK ditulis ulang — sama seperti penggabungan skor klinis, latihan,
// dan pemulihan. Yang digabung adalah tempatnya, bukan isinya, karena menyalin
// ulang angka gizi berarti berisiko salah menyalin satu takaran tanpa ada yang
// menyadarinya. Tiap komponen tetap dimuat lazy, jadi hanya tab yang dibuka
// yang diunduh.
// ─────────────────────────────────────────────────────────────────────────────

const Nutrition = lazy(() => import('./Nutrition').then((m) => ({ default: m.Nutrition })))
const MacroLabGizi = lazy(() => import('./MacroLabGizi').then((m) => ({ default: m.MacroLabGizi })))
const NutritionToolkit = lazy(() => import('./NutritionToolkit').then((m) => ({ default: m.NutritionToolkit })))
const DietarySupplements = lazy(() => import('./DietarySupplements').then((m) => ({ default: m.DietarySupplements })))
const HydrationCalculator = lazy(() => import('./HydrationCalculator').then((m) => ({ default: m.HydrationCalculator })))
const CaffeineCalculator = lazy(() => import('./CaffeineCalculator').then((m) => ({ default: m.CaffeineCalculator })))
const AlcoholCalculator = lazy(() => import('./AlcoholCalculator').then((m) => ({ default: m.AlcoholCalculator })))
const CarbonDiet = lazy(() => import('./CarbonDiet').then((m) => ({ default: m.CarbonDiet })))

// Urutannya mengikuti besarnya pengaruh terhadap tubuh, bukan abjad: makanan
// dan makro lebih dulu, lalu cairan, lalu zat yang ditambahkan sendiri, lalu
// dampaknya di luar tubuh.
const TABS: TabDef[] = [
  { id: 'makan', label: 'Food', emoji: '🍽️', komponen: Nutrition,
    ringkas: 'What you ate, its energy and composition, and how it lands' },
  { id: 'makro', label: 'Macros', emoji: '📊', komponen: MacroLabGizi,
    ringkas: 'Protein, carbohydrate and fat targets, and why each one is set there' },
  { id: 'alat', label: 'Toolkit', emoji: '🧰', komponen: NutritionToolkit,
    ringkas: 'Practical tools — portions, labels, swaps, planning' },
  { id: 'suplemen', label: 'Supplements', emoji: '💊', komponen: DietarySupplements,
    ringkas: 'What the evidence supports, what it does not, and what interacts' },
  { id: 'cairan', label: 'Hydration', emoji: '💧', komponen: HydrationCalculator,
    ringkas: 'Fluid needs by body mass, activity and heat' },
  { id: 'kafein', label: 'Caffeine', emoji: '☕', komponen: CaffeineCalculator,
    ringkas: 'Intake, half-life, and how late a dose still costs you sleep' },
  { id: 'alkohol', label: 'Alcohol', emoji: '🍷', komponen: AlcoholCalculator,
    ringkas: 'Units, clearance time, and the effect on sleep and recovery' },
  { id: 'jejak', label: 'Footprint', emoji: '🌱', komponen: CarbonDiet,
    ringkas: 'The environmental cost of what is on the plate' },
]

export function PusatGizi() {
  return (
    <HalamanTab
      judul="Nutrition"
      subjudul="Food, macros, fluids, supplements, caffeine and alcohol on one page"
      ikon={<IconLeaf />}
      tabs={TABS}
    />
  )
}

export default PusatGizi
