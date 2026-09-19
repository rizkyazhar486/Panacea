import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const lib = await readFile('src/lib/medicalEducationBridgeSearch.ts', 'utf8')
const component = await readFile('src/components/MedicalEducationBridgeSearch.tsx', 'utf8')
const page = await readFile('src/pages/KnowledgeBridgeBase.tsx', 'utf8')
const surfaces = JSON.parse(await readFile('data/feature-factory/surfaces.json', 'utf8')) as {
  surfaces: Array<{ domainId: string; route: string; surface: string }>
}

const surface = surfaces.surfaces.find((item) => item.domainId === 'medical-education')
assert.ok(surface, 'medical-education must have a canonical user-facing surface')
assert.equal(surface?.route, '/knowledge-bridge', 'medical-education search must live on the existing Knowledge Bridge surface, not a second dedicated route')
assert.equal(surface?.surface, 'dedicated', 'medical-education must remain a dedicated, reachable surface')

// Anatomy comes from the local z-anatomy/nih-3d-derived atlas index, never a live call.
assert.match(lib, /import \{ cariStrukturAtlas, type StrukturAtlasCari \} from '\.\/anatomyStructureSearch'/, 'anatomy results must reuse the existing z-anatomy/nih-3d structure index instead of a new lookup')
assert.match(lib, /const anatomyItems = cariStrukturAtlas\(q, 12\)/, 'anatomy search must stay local/synchronous, not a network call')

// ICD-11 and PubMed reuse the existing production adapters through the shared api client.
assert.match(lib, /import \{ api, type IcdEntry \} from '\.\/api'/, 'ICD search must reuse the existing WHO ICD-11/ICD-10-CM adapter via the shared api client')
assert.match(lib, /Promise\.allSettled\(\[api\.icdSearch\(q\), api\.searchPubmed\(q\)\]\)/, 'ICD-11 and PubMed must be queried concurrently and independently so one failure cannot hide the other')

// Every result carries its own provenance; nothing is fabricated when a source errors.
assert.match(lib, /icd11Settled\.status === 'fulfilled'|icdSettled\.status === 'fulfilled'/, 'ICD branch must distinguish fulfilled vs rejected explicitly')
assert.match(lib, /error: errorMessage\(icdSettled\.reason, 'icd_unavailable'\)/, 'a failed ICD lookup must surface an explicit error, not an empty silent success')
assert.match(lib, /error: errorMessage\(pubmedSettled\.reason, 'pubmed_unavailable'\)/, 'a failed PubMed lookup must surface an explicit error, not an empty silent success')
assert.doesNotMatch(lib, /Math\.random|fabricate|placeholder|mock/i, 'the bridge search must never fabricate results for a failed or empty source')

// The UI must never relabel an ICD-10-CM fallback result as ICD-11.
assert.match(component, /entry\.sumber === 'icd11' \? 'ICD-11' : 'ICD-10-CM fallback'/, 'ICD result badge must keep the icd11 vs icd10cm fallback distinction visible')
assert.match(component, /SourceBadge>Z-Anatomy · NIH 3D/, 'anatomy section must disclose its exact source pair')
assert.match(component, /SourceBadge>WHO ICD-11/, 'ICD section must disclose its source')
assert.match(component, /SourceBadge>PubMed/, 'literature section must disclose its source')
assert.match(component, /result\?\.icd\.error && <p[^>]*>ICD lookup unavailable: \{result\.icd\.error\}/, 'a failed ICD source must show its own error instead of an empty list pretending nothing was searched')
assert.match(component, /result\?\.pubmed\.error && <p[^>]*>PubMed unavailable: \{result\.pubmed\.error\}/, 'a failed PubMed source must show its own error instead of an empty list pretending nothing was searched')

// Mounted on the existing Knowledge Bridge page, not a competing route.
assert.match(page, /import \{ MedicalEducationBridgeSearch \} from '\.\.\/components\/MedicalEducationBridgeSearch'/, 'the bridge search must mount on the existing KnowledgeBridgeBase page')
assert.match(page, /<MedicalEducationBridgeSearch \/>/, 'the bridge search component must actually render on the page')

console.log('Feature Factory medical-education search: PubMed + WHO ICD-11/ICD-10-CM + local z-anatomy/nih-3d atlas bridged on the existing /knowledge-bridge surface, per-source fail-open, no fabricated results, ICD-11 vs ICD-10-CM fallback always distinguished.')
