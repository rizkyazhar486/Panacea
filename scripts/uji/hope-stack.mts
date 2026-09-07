import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const data = readFileSync('src/lib/hopeStack.ts', 'utf8')
const ui = readFileSync('src/components/frontier/PanaceaHopeStack.tsx', 'utf8')
const frontier = readFileSync('src/pages/FrontierHealthOS.tsx', 'utf8')
const mind = readFileSync('src/pages/PusatJiwa.tsx', 'utf8')
const safety = readFileSync('src/pages/MentalSafetyPlan.tsx', 'utf8')

const domains = [
  'mental-health',
  'geroscience-pharma',
  'regenerative-medicine',
  'early-detection',
  'longevity-care',
  'predictive-ai',
  'longevity-finance',
  'aging-technology',
  'longevity-infrastructure',
]
for (const domain of domains) assert.match(data, new RegExp(`key: '${domain}'`), `missing Hope domain ${domain}`)

assert.match(data, /PPV = sensitivity × prevalence/, 'early detection must expose prevalence-aware PPV')
assert.match(data, /BS = \(1\/N\) Σ\(pᵢ − yᵢ\)²/, 'prediction must expose a calibration/error metric')
assert.match(data, /age acceleration = predicted biological age − chronological age/, 'aging model must define age acceleration transparently')
assert.match(data, /PV = Σ Cₜ \/ \(1 \+ r\)ᵗ/, 'longevity finance must expose present-value assumptions')
assert.match(data, /OADR = population age 65\+ \/ population age 20–64 × 100/, 'infrastructure must define dependency ratio')
assert.match(data, /Research\/education only/, 'geroscience pharmaceuticals must be explicitly research/education only')
assert.match(data, /Do not generate synthesis instructions, dosing, self-experimentation protocols/, 'geroscience pipeline must block operational human experimentation')
assert.match(data, /fully lab-grown replacement organs are not a general clinical reality/, 'regenerative medicine must disclose maturity limits')
assert.match(data, /A model flag is not a diagnosis/, 'early detection must not equate a flag with diagnosis')
assert.match(data, /No model should autonomously prescribe treatment or claim to predict an individual lifespan/, 'predictive AI must preserve clinician and uncertainty gates')
assert.match(data, /Personal health data must not be used for discriminatory underwriting/, 'longevity finance must prohibit health-data discrimination')

assert.match(ui, /HOPE_DOMAINS\.map/, 'Hope dashboard must render every evidence domain')
assert.match(ui, /Transparent formulas/, 'Hope dashboard must expose formulas')
assert.match(ui, /Truth & safety boundary/, 'Hope dashboard must keep safety boundary visible')
assert.doesNotMatch(ui, /Canvas|WebGL|three\/|requestAnimationFrame/, 'Hope Stack must stay lightweight and add no renderer/animation loop')
assert.match(frontier, /<PanaceaHopeStack \/>/, 'Hope Stack must be reachable from Frontier Health OS')

assert.match(mind, /MentalSafetyPlan/, 'Mind hub must lazy-load the safety plan')
assert.match(mind, /id: 'aman'/, 'Safety plan must be a visible Mind tab')
assert.match(safety, /panacea:mental-safety-plan:v1/, 'Safety plan needs a versioned local storage key')
assert.match(safety, /Panacea cannot see this plan in real time and cannot contact emergency services for you/, 'Safety plan must not claim monitoring or dispatch')
assert.match(safety, /completed sections ÷ \{SECTIONS\.length\} × 100%/, 'completion meter must state its formula')
assert.match(safety, /This measures form completion only — never suicide risk/, 'completion metric must never be presented as a risk score')
assert.match(safety, /Move toward other people, contact a trusted person/, 'immediate danger guidance must prioritize human support')
assert.match(safety, /localStorage\.setItem/, 'safety plan must be local-first')
assert.doesNotMatch(safety, /fetch\(|api\.|axios|WebSocket/, 'local safety plan must not silently transmit its contents')

console.log('Panacea Hope Stack and local-first mental safety plan are evidence-gated and wired')
