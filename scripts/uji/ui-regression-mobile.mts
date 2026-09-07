import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const landing = readFileSync('src/pages/Landing.tsx', 'utf8')
const pricing = readFileSync('src/components/PricingSection.tsx', 'utf8')
const body = readFileSync('src/pages/BodyExplorer.tsx', 'utf8')
const polish = readFileSync('public/ui-regression-polish.css', 'utf8')
const index = readFileSync('index.html', 'utf8')

// Claude welcome history/features: do not replace the experience with a new marketing page.
for (const marker of [
  'Dashboard Hidup Sehat',
  'Kalkulator Longevity AI',
  'AI Chatbot → AI-EMR',
  'Konsultasi, Apotek & Faskes',
  'Pusat Materi Kedokteran',
  'AI-EMR Bersertifikat',
  'InteractiveAura',
  'MedicalNews',
  'PanaceaToken',
  'hf_20260702_023227_88b54135-7489-48de-9476-ca0657fc0d29.mp4',
]) assert.ok(landing.includes(marker), `Claude landing marker missing: ${marker}`)

// Payment content remains intact; layout is repaired rather than price/product being rewritten.
assert.match(pricing, /Equivalent bank transfer/)
assert.match(pricing, /Rp500,000/)
assert.match(pricing, /500 PNC/)
assert.match(polish, /#pricing \[class~="items-baseline"\]/)
assert.match(polish, /flex-direction: column !important/)
assert.match(polish, /word-break: normal !important/)
assert.match(polish, /overflow-wrap: break-word !important/)

// Body Exposure must keep the existing end-to-end source tools and one-workspace model.
for (const marker of [
  'HeadToToeAnatomyWorkbench',
  'HumanAnatomyMasterAtlas',
  'HumanAnatomyLayerNavigator',
  'BodyParts3DDeepAtlas',
  'HraClinicalAtlas',
  'HraSourceSearch',
  "useState<AnatomyTool>('head-to-toe')",
]) assert.ok(body.includes(marker), `Body Exposure regression: ${marker}`)

// iPhone safeguards: search fields should not trigger Safari focus zoom and 3D viewports stay bounded.
assert.match(polish, /font-size: 16px !important/)
assert.match(polish, /HRA 3D model of/)
assert.match(polish, /min-height: 330px !important/)
assert.match(index, /ui-regression-polish\.css/)

console.log('UI regression safeguards: Claude landing preserved; pricing and Body Exposure mobile guards present')
