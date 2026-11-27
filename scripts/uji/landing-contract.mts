// Public landing contract (owner directive 2026-11-27: compact, visual, no doodles). Replaces the older
// "rich welcome" marker list, which only checked that 25 strings appeared in a comment.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const DIR = 'src/pages/landing/sections'
const landing = readFileSync('src/pages/landing/Landing.tsx', 'utf8')
const bagian = readdirSync(DIR).filter((f) => f.endsWith('.tsx')).map((f) => [f, readFileSync(join(DIR, f), 'utf8')] as const)
const semua = [landing, ...bagian.map(([, s]) => s)].join('\n')

// Example telemetry on a public page reads as a measurement. A number followed by a vital-sign unit is refused.
const TELEMETRI_CONTOH = /\b\d{2,3}\s*(bpm|ms\b|%\s*SpO2|mmHg|mg\/dL)|SpO2\s*\d|HRV\s*\d/i

gagal('tanpa_angka_telemetri_contoh_di_halaman_publik', () => {
  for (const [f, s] of bagian) assert.doesNotMatch(s, TELEMETRI_CONTOH, `${f} shows an example vital sign`)
  assert.doesNotMatch(landing, TELEMETRI_CONTOH)
})
gagal('pola_telemetri_menangkap_contoh_lama', () => {
  // Paired: the exact strings the old hero showed must be caught, so the rule above is not vacuous.
  for (const s of ["metric: '72 bpm'", "metric: '98% SpO2'", "metric: 'HRV 68ms'"]) assert.match(s, TELEMETRI_CONTOH, s)
  assert.doesNotMatch('Satu tubuh. Semua data kesehatan Anda.', TELEMETRI_CONTOH)
})

gagal('struktur_ringkas_empat_bagian', () => {
  const urutan = ['<LandingHeader', '<HeroSection', '<FourDoorsSection', '<PricingSection', '<LandingFooter']
  let terakhir = -1
  for (const k of urutan) { const i = landing.indexOf(k); assert.ok(i > terakhir, `${k} missing or out of order`); terakhir = i }
  for (const lama of ['ScrollCinematic', 'BrandFilmsSection', 'FeaturesSection', 'RolesSection', 'NewsSection', 'ScienceOdysseySection', 'GovernanceSection', 'LandingCtaSection']) {
    assert.ok(!landing.includes(lama), `${lama} is back on the landing`)
    assert.ok(!existsSync(join(DIR, `${lama}.tsx`)), `${lama}.tsx still exists`)
  }
})

gagal('batas_klaim_dirender_di_hero', () => {
  const hero = readFileSync(join(DIR, 'HeroSection.tsx'), 'utf8')
  assert.match(hero, /<BatasKlaimKesehatan permukaan="care\.landing"/)
})

gagal('tanpa_mesin_3d_atau_video_autoplay_di_halaman_publik', () => {
  assert.doesNotMatch(semua, /BodyExposureWidget|Body3D|@react-three|from 'three'/, 'the public page must not load the 3D engine')
  assert.doesNotMatch(semua, /<video[^>]*autoPlay/s, 'no autoplaying video')
  assert.doesNotMatch(semua, /Sistem Beroperasi Normal|Verifikasi STR/, 'no unmeasured status or credential claims')
})

gagal('render_tubuh_nyata_ada_kecil_dan_berkredit', () => {
  const xray = readFileSync(join(DIR, 'XRayBody.tsx'), 'utf8')
  for (const n of ['body-skeleton.webp', 'body-muscles.webp']) {
    assert.match(xray, new RegExp(`/landing/${n.replace('.', '\\.')}`))
    const p = join('public/landing', n)
    assert.ok(existsSync(p), `${p} missing`)
    assert.ok(statSync(p).size < 120_000, `${p} is ${statSync(p).size} B; keep the hero light`)
  }
  const kredit = readFileSync('public/landing/CREDITS.txt', 'utf8')
  assert.match(kredit, /CC BY-SA 4\.0/)
  assert.match(kredit, /not a scan of any person/i)
  assert.match(xray, /Bukan pindaian tubuh Anda/, 'the caption says it is reference anatomy')
})

const { batasReveal } = await import('../../src/pages/landing/sections/XRayBody.tsx')
gagal('batas_reveal', () => {
  assert.equal(batasReveal(56), 56)
  assert.equal(batasReveal(0), 0)
  assert.equal(batasReveal(100), 100)
  assert.equal(batasReveal(-1), 0)
  assert.equal(batasReveal(101), 100)
  assert.equal(batasReveal(Number.NaN), 50, 'NaN falls back to the middle, never an invisible layer')
  assert.equal(batasReveal(Number.POSITIVE_INFINITY), 50)
})

console.log('landing-contract: compact 4-part page, real credited body renders, claim boundary in hero, no example telemetry, no 3D engine or autoplay')
