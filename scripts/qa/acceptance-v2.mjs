#!/usr/bin/env node
// Validator Acceptance v2: memastikan setiap kriteria engineering dapat dijalankan AI
// (perintah + berkas bukti yang benar-benar ada + kontrol negatif), gerbang manusia
// terpisah dari penyebut engineering, dan ke-45 kriteria lama tetap terpetakan.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SHA = /^[0-9a-f]{40}$/
const WAJIB = ['id', 'gate', 'horizon', 'priority', 'lane', 'legacy', 'capability', 'risk', 'done', 'checks', 'negativeControl', 'evidence', 'dependsOn', 'status']
const HORIZON = new Set(['H0', 'H1', 'H2'])
const PRIORITAS = new Set(['P0', 'P1', 'P2', 'P3'])

export function validate(doc, { root = AKAR, legacyIds = null, fileExists = (p) => existsSync(join(root, p)) } = {}) {
  const errors = []
  const err = (m) => errors.push(m)
  if (!doc || typeof doc !== 'object') return { errors: ['document is not an object'], summary: null }

  const statuses = new Set(doc.statuses ?? [])
  const extStatuses = new Set(doc.externalStatuses ?? [])
  const gates = new Set(Object.keys(doc.gates ?? {}))
  const lanes = new Set(doc.lanes ?? [])
  const humanRoles = new Set(doc.humanRoles ?? [])
  const criteria = Array.isArray(doc.criteria) ? doc.criteria : []
  const external = Array.isArray(doc.externalGates) ? doc.externalGates : []
  if (!criteria.length) err('criteria is empty')
  for (const s of ['BLOCKED_EXTERNAL']) if (statuses.has(s)) err(`engineering statuses must not include ${s}; human gates live in externalGates`)

  const ids = new Set()
  for (const c of criteria) {
    const tag = c?.id ?? '<no id>'
    for (const k of WAJIB) if (c?.[k] === undefined || c?.[k] === '') err(`${tag}: missing ${k}`)
    if (ids.has(c.id)) err(`${tag}: duplicate id`)
    ids.add(c.id)
    if (!/^ENG-[A-Z0-9]+-[A-Z0-9]+$/.test(String(c.id))) err(`${tag}: id must match ENG-<AREA>-<N>`)
    if (!gates.has(c.gate)) err(`${tag}: unknown gate ${c.gate}`)
    if (!HORIZON.has(c.horizon)) err(`${tag}: horizon must be H0/H1/H2`)
    if (!PRIORITAS.has(c.priority)) err(`${tag}: priority must be P0..P3`)
    if (!lanes.has(c.lane)) err(`${tag}: lane ${c.lane} is not an AI lane`)
    if (humanRoles.has(c.lane)) err(`${tag}: engineering criterion owned by a human role (${c.lane})`)
    if (!statuses.has(c.status)) err(`${tag}: status ${c.status} not allowed`)
    if (c.status === 'PASS' || c.status === 'FAIL') {
      if (!SHA.test(String(c.statusSha))) err(`${tag}: ${c.status} needs a 40-hex statusSha`)
    }
    if (c.status === 'NOT_APPLICABLE' && !c.statusNote) err(`${tag}: NOT_APPLICABLE needs a statusNote reason`)
    if (!Array.isArray(c.checks) || !c.checks.length) err(`${tag}: needs at least one check`)
    for (const ch of c.checks ?? []) {
      if (!ch?.cmd || typeof ch.cmd !== 'string') err(`${tag}: check without cmd`)
      if (!Array.isArray(ch?.files) || !ch.files.length) err(`${tag}: check without evidence files`)
      for (const f of ch?.files ?? []) if (!fileExists(f)) err(`${tag}: evidence file missing: ${f}`)
    }
    for (const d of c.dependsOn ?? []) if (!criteria.some((x) => x.id === d)) err(`${tag}: dependsOn unknown ${d}`)
    if (/\b(sign|signature|approve|approval|attest)\w*\b/i.test(String(c.done))) err(`${tag}: done-definition depends on a human approval; move it to externalGates`)
  }

  const extIds = new Set()
  for (const g of external) {
    const tag = g?.id ?? '<no id>'
    if (!/^EXT-[A-Z0-9]+-[A-Z]$/.test(String(g?.id))) err(`${tag}: external id must match EXT-<AREA>-<L>`)
    if (extIds.has(g.id) || ids.has(g.id)) err(`${tag}: duplicate id`)
    extIds.add(g.id)
    if (!humanRoles.has(g.owner)) err(`${tag}: owner must be a human role`)
    for (const k of ['question', 'impact', 'artifact']) if (!g?.[k]) err(`${tag}: missing ${k}`)
    if (!extStatuses.has(g.status)) err(`${tag}: status ${g.status} not allowed`)
    if (g.status === 'DECIDED' && !g.decisionRef) err(`${tag}: DECIDED needs decisionRef to a real record`)
  }

  if (legacyIds) {
    const mapped = new Set([...criteria, ...external].flatMap((x) => x.legacy ?? []))
    for (const l of legacyIds) if (!mapped.has(l)) err(`legacy ${l} is not mapped to any v2 criterion or external gate`)
    for (const l of mapped) if (!legacyIds.includes(l)) err(`unknown legacy id ${l}`)
  }

  const count = (s) => criteria.filter((c) => c.status === s).length
  const summary = {
    engineeringTotal: criteria.length - count('NOT_APPLICABLE'),
    pass: count('PASS'), fail: count('FAIL'), notRun: count('NOT_RUN'), notApplicable: count('NOT_APPLICABLE'),
    externalOpen: external.filter((g) => g.status === 'BLOCKED_EXTERNAL').length,
    externalDecided: external.filter((g) => g.status === 'DECIDED').length,
  }
  return { errors, summary }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const doc = JSON.parse(readFileSync(join(AKAR, 'governance/ACCEPTANCE_V2.json'), 'utf8'))
  const legacy = JSON.parse(readFileSync(join(AKAR, 'governance/ALPHA_ACCEPTANCE_LEDGER.json'), 'utf8')).criteria.map((c) => c.id)
  const { errors, summary } = validate(doc, { legacyIds: legacy })
  for (const e of errors) console.error(`acceptance-v2 FAIL ${e}`)
  if (summary) console.log(`acceptance-v2 engineering PASS ${summary.pass}/${summary.engineeringTotal} (FAIL ${summary.fail}, NOT_RUN ${summary.notRun}) | external gates open ${summary.externalOpen}, decided ${summary.externalDecided}`)
  process.exit(errors.length ? 1 : 0)
}
