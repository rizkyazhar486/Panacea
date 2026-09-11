import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const landing = readFileSync('src/pages/Landing.tsx', 'utf8')

for (const marker of [
  'InteractiveAura',
  'Reveal, CountUp',
  'ScrollCinematic',
  'PricingSection',
  'MedicalNews',
  'VideoSaatTerlihat',
  'IntersectionObserver',
  'HISTORY_ERAS',
  'HISTORY_MODERN',
  'STEM_CELLS',
  'ROBOTICS',
  'Healthy Living Dashboard',
  'AI Longevity Calculator',
  'AI Chatbot → AI-EMR',
  'Consultations, Pharmacy & Facilities',
  'Medical Knowledge Hub',
  'Certified AI-EMR',
  'Customer / Patient',
  'Contributor',
  'Verifier',
  'PanaceaToken',
  'hf_20260702_023227_88b54135-7489-48de-9476-ca0657fc0d29.mp4',
  'hf_20260807_091507_583431ed-8898-4dfa-b8f9-c5b0dbbe2f60.mp4',
]) {
  assert.match(landing, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Original rich welcome marker missing: ${marker}`)
}

assert.doesNotMatch(landing, /BodyExposureWidget/, 'public welcome page must not eagerly mount the heavy Body Exposure 3D widget')
assert.match(landing, /autoPlay muted loop playsInline/, 'Higgsfield brand film should remain mobile-safe and inline')
assert.match(landing, /preload="none"/, 'history-era videos should stay demand-loaded rather than competing for mobile bandwidth')

console.log('Original rich Higgsfield welcome, history, regeneration, robotics and heavy-3D safeguards preserved')
