import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
// @ts-ignore modul .mjs tanpa deklarasi tipe
import { validate } from '../qa/acceptance-v2.mjs'

const doc = JSON.parse(await readFile(new URL('../../governance/ACCEPTANCE_V2.json', import.meta.url), 'utf8'))
const legacy = JSON.parse(await readFile(new URL('../../governance/ALPHA_ACCEPTANCE_LEDGER.json', import.meta.url), 'utf8'))
const legacyIds: string[] = legacy.criteria.map((c: { id: string }) => c.id)

// Berkas nyata harus valid dan seluruh 45 kriteria lama terpetakan.
assert.equal(legacyIds.length, 45, 'legacy ledger keeps all 45 historical criteria')
const real = validate(doc, { legacyIds })
assert.deepEqual(real.errors, [], real.errors.join('\n'))
assert.equal(real.summary.pass, 0, 'no v2 criterion may start as PASS without a recorded evidence run')

const clone = () => structuredClone(doc)
const fails = (d: unknown, pattern: RegExp, why: string, opts: Record<string, unknown> = { legacyIds }) => {
  const { errors } = validate(d, opts)
  assert.ok(errors.some((e: string) => pattern.test(e)), `${why}: expected ${pattern}, got ${JSON.stringify(errors)}`)
}

// Kontrol negatif: setiap aturan anti-gaming harus benar-benar menolak.
{ const d = clone(); d.criteria[0].checks = []; fails(d, /needs at least one check/, 'criterion without executable check') }
{ const d = clone(); d.criteria[0].checks[0].files = ['does/not/exist.mjs']; fails(d, /evidence file missing/, 'evidence path that does not exist') }
{ const d = clone(); d.criteria[0].lane = 'product-owner'; fails(d, /not an AI lane|human role/, 'engineering criterion owned by a human') }
{ const d = clone(); d.criteria[3].status = 'PASS'; d.criteria[3].statusSha = null; fails(d, /needs a 40-hex statusSha/, 'PASS without exact SHA') }
{ const d = clone(); d.criteria[0].done = 'Owner signs the release'; fails(d, /human approval/, 'done-definition hiding a human gate') }
{ const d = clone(); d.statuses.push('BLOCKED_EXTERNAL'); fails(d, /must not include BLOCKED_EXTERNAL/, 'external status inside engineering denominator') }
{ const d = clone(); d.criteria = d.criteria.filter((c: { legacy: string[] }) => !c.legacy.includes('D7')); d.externalGates = d.externalGates.filter((g: { legacy: string[] }) => !g.legacy.includes('D7')); fails(d, /legacy D7 is not mapped/, 'dropping a hard legacy criterion') }
{ const d = clone(); d.externalGates[0].owner = 'claude'; fails(d, /owner must be a human role/, 'AI owning a human decision') }
{ const d = clone(); d.externalGates[0].status = 'DECIDED'; fails(d, /DECIDED needs decisionRef/, 'decision without a record') }
{ const d = clone(); d.criteria[0].negativeControl = ''; fails(d, /missing negativeControl/, 'criterion without negative control') }

{ const d = clone(); d.externalGates[0].status = 'BLOCKED_EXTERNAL'; fails(d, /status BLOCKED_EXTERNAL not allowed/, 'old blocking status is no longer a working state') }
{ const d = clone(); delete d.externalGates[1].activatesWhen; fails(d, /deferred gate needs activatesWhen/, 'deferred gate without activation condition') }
{ const d = clone(); d.statuses.push('DEFERRED_FINAL_STAGE'); fails(d, /must not include DEFERRED_FINAL_STAGE/, 'deferred state inside engineering denominator') }
assert.ok(doc.externalGates.every((g: { status: string }) => g.status === 'DEFERRED_FINAL_STAGE'), 'no human gate is requested now: all deferred to the final stage')

console.log(`acceptance-v2: ${real.summary.engineeringTotal} engineering criteria runnable by AI, ${real.summary.externalDeferred} human gates deferred to the final stage and kept separate, 45/45 legacy mapped`)
