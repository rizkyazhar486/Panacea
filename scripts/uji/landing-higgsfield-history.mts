import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const landing = readFileSync('src/pages/Landing.tsx', 'utf8')

for (const marker of [
  'InteractiveAura',
  'Reveal, CountUp',
  'Dashboard Hidup Sehat',
  'Kalkulator Longevity AI',
  'AI Chatbot → AI-EMR',
  'Konsultasi, Apotek & Faskes',
  'Pusat Materi Kedokteran',
  'AI-EMR Bersertifikat',
  'Pelanggan / Pasien',
  'Kontributor',
  'Verifikator',
  'MedicalNews',
  'PanaceaToken',
  'hf_20260702_023227_88b54135-7489-48de-9476-ca0657fc0d29.mp4',
]) {
  assert.match(landing, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Higgsfield/Claude landing history marker missing: ${marker}`)
}

assert.doesNotMatch(landing, /BodyExposureWidget/, 'public welcome page must not eagerly mount the heavy Body Exposure 3D widget')
assert.match(landing, /autoPlay muted loop playsInline/, 'Higgsfield brand film should remain mobile-safe and inline')
assert.match(landing, /overflow-x-hidden/, 'landing should keep horizontal overflow contained on mobile')

console.log('Higgsfield/Claude welcome history preserved and heavy 3D landing regression blocked')
