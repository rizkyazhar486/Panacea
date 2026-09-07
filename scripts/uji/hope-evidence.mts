import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const client = readFileSync('src/lib/hopeEvidence.ts', 'utf8')
const panel = readFileSync('src/components/frontier/HopeEvidencePanel.tsx', 'utf8')
const stack = readFileSync('src/components/frontier/PanaceaHopeStack.tsx', 'utf8')
const pubmedAdapter = readFileSync('server/src/pubmed.ts', 'utf8')
const trialAdapter = readFileSync('server/src/trials.ts', 'utf8')
const pubmedRegistry = JSON.parse(readFileSync('data/source-registry/evidence/pubmed-ncbi-eutils.json', 'utf8')) as Record<string, unknown>
const trialRegistry = JSON.parse(readFileSync('data/source-registry/evidence/clinicaltrials-gov-api-v2.json', 'utf8')) as Record<string, unknown>

assert.match(client, /import \{ apiBaseUrl \} from '\.\/api'/, 'Hope evidence must reuse Panacea API base configuration')
assert.match(client, /credentials: 'include'/, 'Hope evidence must preserve cookie auth behavior')
assert.match(client, /localStorage\.getItem\('pmd-token'\)/, 'Hope evidence must preserve Bearer-token behavior')
assert.match(client, /'\/api\/evidence\/pubmed'/, 'Hope evidence must use the existing PubMed server route')
assert.match(client, /'\/api\/trials'/, 'Hope evidence must use the existing ClinicalTrials server route')
assert.doesNotMatch(client, /eutils\.ncbi\.nlm\.nih\.gov|clinicaltrials\.gov\/api\/v2/, 'frontend must not bypass Panacea server adapters')
assert.doesNotMatch(client, /Math\.random|fallback.*article|fallback.*trial/i, 'live evidence must never fabricate fallback records')
assert.match(client, /AbortSignal/, 'evidence loading must be cancellable')
assert.match(client, /evidenceClass: 'documented'/, 'retrieved records need explicit evidence classification')
assert.match(client, /provenanceId/, 'retrieved evidence needs a provenance identifier')

for (const state of ['idle', 'loading', 'ready', 'auth-required', 'error']) {
  assert.match(panel, new RegExp(`'${state}'`), `panel must expose ${state} state`)
}
assert.match(panel, /AbortController/, 'panel must cancel stale/unmounted requests')
assert.match(panel, /requestIdRef/, 'panel must guard against stale responses')
assert.match(panel, /Load live evidence/, 'retrieval must be explicit rather than eager')
assert.match(panel, /will not substitute remembered, generated, or mock records/, 'failure copy must reject fake evidence')
assert.match(panel, /Literature retrieval is not crisis response/, 'mental-health evidence search must remain separate from crisis support')
assert.match(panel, /A publication or registered study is evidence provenance, not proof/, 'record presence must not be presented as efficacy')
assert.match(stack, /<HopeEvidencePanel domain=\{selected\.key\} \/>/, 'Hope Stack must expose the live evidence panel')

assert.match(pubmedAdapter, /eutils\.ncbi\.nlm\.nih\.gov/, 'server must contain the real NCBI adapter')
assert.match(trialAdapter, /clinicaltrials\.gov\/api\/v2\/studies/, 'server must contain the real ClinicalTrials.gov v2 adapter')

const pubmedUsage = pubmedRegistry.usage as { runtime?: unknown }
const trialUsage = trialRegistry.usage as { runtime?: unknown }
const pubmedValidation = pubmedRegistry.validation as { clinicalDecisionUse?: unknown }
const trialValidation = trialRegistry.validation as { clinicalDecisionUse?: unknown }
const pubmedRegistryAdapter = pubmedRegistry.adapter as { status?: unknown; module?: unknown }
const trialRegistryAdapter = trialRegistry.adapter as { status?: unknown; module?: unknown }

assert.equal(pubmedRegistryAdapter.module, 'server/src/pubmed.ts')
assert.equal(trialRegistryAdapter.module, 'server/src/trials.ts')
assert.equal(pubmedRegistryAdapter.status, 'ACTIVE')
assert.equal(trialRegistryAdapter.status, 'ACTIVE')
assert.equal(pubmedUsage.runtime, true)
assert.equal(trialUsage.runtime, true)
assert.equal(pubmedValidation.clinicalDecisionUse, 'CONTEXT_ONLY')
assert.equal(trialValidation.clinicalDecisionUse, 'CONTEXT_ONLY')

console.log('Hope live evidence uses real server adapters, explicit provenance, cancellation, and no fabricated fallback')
