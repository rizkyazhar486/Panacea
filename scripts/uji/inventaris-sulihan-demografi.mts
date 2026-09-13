import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// ─────────────────────────────────────────────────────────────────────────────
// INVENTARIS PEMANGGIL getDemo().
//
// APA YANG DIBUKTIKAN BERKAS INI, dan apa yang TIDAK.
//
// getDemo() memadukan DEMO_DEFAULT -- 30 tahun, 70 kg, 170 cm, laki-laki --
// ke dalam profil yang kosong. Untuk sebuah kalkulator dengan kolom yang
// terlihat, itu pilihan yang masuk akal: nilai awal harus ada, dan pemakainya
// melihat serta bisa menggantinya. Untuk layar yang MENYAJIKAN hasilnya
// sebagai milik pembacanya, itu cacat: empat kasus sudah ditemukan dan
// diperbaiki -- kompas energi di beranda, VO2max terhadap norma seusia,
// "metabolic age", dan pemberitahuan "Updated from your devices".
//
// Berkas ini TIDAK memutuskan mana yang mana. Menilai itu perlu membaca apa
// yang ditampilkan tiap layar, dan gerbang yang berpura-pura bisa menilainya
// akan menjadi stempel: hijau tanpa memeriksa apa pun.
//
// Yang dilakukannya hanya satu hal, dan hal itu dilakukan dengan benar:
// MENGHITUNG. Daftar di bawah adalah keadaan yang sudah diperiksa mata
// manusia. Bertambah -- berkas baru, atau panggilan baru di berkas lama --
// berarti ada tempat penyulihan yang belum pernah ditimbang, dan gerbang ini
// memaksa seseorang menimbangnya. Berkurang berarti daftarnya sudah basi dan
// harus dirapikan, supaya ia tidak berubah menjadi hiasan.
//
// Panggilan di dalam komentar tidak dihitung: justru di komentarlah alasan
// setiap perbaikan dicatat.
// ─────────────────────────────────────────────────────────────────────────────

const DIKETAHUI: ReadonlyArray<readonly [string, number]> = [
  ['src/components/KartuKlinisTubuh.tsx', 1],
  ['src/components/PapanWidget.tsx', 1],
  ['src/components/UbinLangsung.tsx', 1],
  ['src/components/UbinLanjutan.tsx', 1],
  ['src/components/UbinRingHarian.tsx', 1],
  ['src/components/WidgetBeranda.tsx', 1],
  ['src/components/digital-twin/Workout4DLab.tsx', 1],
  ['src/lib/autoIsiFilter.ts', 1],
  ['src/lib/nilaiAwal.ts', 1],
  ['src/lib/profile.ts', 2],
  ['src/pages/AaGradient.tsx', 1],
  ['src/pages/AlcoholCalculator.tsx', 2],
  ['src/pages/AnalisisPro.tsx', 1],
  ['src/pages/BloodDonation.tsx', 2],
  ['src/pages/BodyBattery.tsx', 1],
  ['src/pages/CharlsonIndex.tsx', 1],
  ['src/pages/EnduranceTools.tsx', 3],
  ['src/pages/Feed.tsx', 2],
  ['src/pages/Findrisc.tsx', 1],
  ['src/pages/GlasgowBlatchfordScore.tsx', 1],
  ['src/pages/GraceScore.tsx', 1],
  ['src/pages/HealthSimulator.tsx', 1],
  ['src/pages/HeartRateLog.tsx', 1],
  ['src/pages/MacroLabGizi.tsx', 1],
  ['src/pages/MovementToolkit.tsx', 1],
  ['src/pages/Nutrition.tsx', 1],
  ['src/pages/PapanAtlet.tsx', 1],
  ['src/pages/PerformanceLab.tsx', 2],
  ['src/pages/PredictiveModelsToolkit.tsx', 1],
  ['src/pages/QTcCalculator.tsx', 1],
  ['src/pages/Rekomposisi.tsx', 1],
  ['src/pages/RiskCalculators.tsx', 1],
  ['src/pages/SelfAssessmentToolkit.tsx', 1],
  ['src/pages/SleepApneaScreen.tsx', 1],
  ['src/pages/TrainingPhysiology.tsx', 1],
  ['src/pages/TrainingPlan.tsx', 3],
  ['src/pages/WorkoutHistory.tsx', 1],
]

function hitungDi(berkas: string): number {
  let n = 0
  for (const baris of readFileSync(berkas, 'utf8').split('\n')) {
    const t = baris.trim()
    if (t.startsWith('//') || t.startsWith('*')) continue
    n += (baris.match(/\bgetDemo\(\)/g) ?? []).length
  }
  return n
}

function telusuri(dir: string, keluar: string[]): string[] {
  for (const nama of readdirSync(dir)) {
    const p = join(dir, nama)
    if (statSync(p).isDirectory()) telusuri(p, keluar)
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) keluar.push(p)
  }
  return keluar
}

const sekarang = new Map<string, number>()
for (const berkas of telusuri('src', [])) {
  const n = hitungDi(berkas)
  if (n > 0) sekarang.set(berkas.replace(/\\/g, '/'), n)
}

const catatan = new Map(DIKETAHUI.map(([b, n]) => [b, n]))

// ── Bertambah: tempat penyulihan yang belum ditimbang ──────────────────────
const baru: string[] = []
for (const [berkas, n] of sekarang) {
  const tercatat = catatan.get(berkas)
  if (tercatat === undefined) baru.push(`${berkas} (${n})`)
  else if (n > tercatat) baru.push(`${berkas} (${tercatat} -> ${n})`)
}
assert.deepEqual(baru, [],
  `New getDemo() call sites appeared. getDemo() substitutes 30 years / 70 kg / 170 cm / male into an empty profile. ` +
  `If this surface PRESENTS a figure as the reader's own, use getDemoTersimpan() and say what is missing instead. ` +
  `If it is a calculator with a visible, editable field, the default is fine -- mark it as a default, then add it to DIKETAHUI here. ` +
  `New: ${baru.join(', ')}`)

// ── Berkurang: daftar yang mulai basi ──────────────────────────────────────
const lapuk: string[] = []
for (const [berkas, n] of catatan) {
  const kini = sekarang.get(berkas)
  if (kini === undefined) lapuk.push(`${berkas} (gone)`)
  else if (kini < n) lapuk.push(`${berkas} (${n} -> ${kini})`)
}
assert.deepEqual(lapuk, [],
  `The inventory is stale -- these entries no longer match. Trim DIKETAHUI so the list keeps meaning something. Stale: ${lapuk.join(', ')}`)

// ── Empat yang sudah diperbaiki tidak boleh kembali ────────────────────────
// Masing-masing punya gerbangnya sendiri. Di sini hanya dijaga bahwa keempat
// berkas itu TIDAK muncul lagi sebagai pemanggil getDemo() untuk penyajian.
for (const berkas of ['src/components/UbinTdee.tsx', 'src/pages/PelatihAsupan.tsx']) {
  assert.equal(sekarang.get(berkas), undefined,
    `${berkas} calls getDemo() again; it was changed to getDemoTersimpan() precisely because its guard could not fire otherwise`)
}

console.log(`inventaris-sulihan-demografi: ok (${sekarang.size} files, ${[...sekarang.values()].reduce((a, b) => a + b, 0)} call sites)`)
