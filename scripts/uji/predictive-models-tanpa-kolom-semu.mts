import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Regresi: Autophagy timing menampilkan kolom "Weight (kg)" bernilai 70 dari
// getDemo(), padahal rumusnya (lean mass factor dari lemak tubuh, dikurangi
// jam sejak makan terakhir) tidak memakai berat. Kolom yang tidak berpengaruh
// membuat pembaca mengira hasil disesuaikan dengan tubuhnya.
const src = readFileSync('src/pages/PredictiveModelsToolkit.tsx', 'utf8')
const kode = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
const mulai = kode.indexOf('function AutophagyTiming')
const akhir = kode.indexOf('function CortisolAwakening')
assert.ok(mulai >= 0 && akhir > mulai, 'AutophagyTiming block not found')
const blok = kode.slice(mulai, akhir)

// Negatif: kolom berat dan sulih profil tidak boleh kembali.
assert.ok(!/getDemo\b/.test(kode), 'page must not substitute a demo profile')
assert.ok(!/weightKg/.test(blok), 'Autophagy block must not carry an unused weight state')
assert.ok(!/Weight \(kg\)/.test(blok), 'Autophagy block must not show an inert weight field')
// Positif (pasangan): masukan yang benar-benar dipakai rumus tetap ada.
assert.ok(/Body fat %/.test(blok), 'body fat input must remain')
assert.ok(/Hours since last meal/.test(blok), 'hours-since-meal input must remain')
assert.ok(/bodyFatPct/.test(blok) && /lastMealHoursAgo/.test(blok), 'both inputs feed the estimate')
console.log('predictive-models-tanpa-kolom-semu: ok')
