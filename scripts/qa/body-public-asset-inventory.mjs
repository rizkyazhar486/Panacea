// D8 evidence inventory, not a legal-clearance gate. No downloads or asset mutations.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, lstatSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const ordered = (values) => [...new Set(values)].sort()
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0

export function claimsFromJson(value) {
  const sources = [], licenses = []
  function visit(node) {
    if (!node || typeof node !== 'object') return
    for (const [key, item] of Object.entries(node)) {
      if (nonempty(item)) {
        if (/^(panacea_source|source|source_url|citation)$/.test(key)) sources.push(item.trim())
        if (/^(panacea_license|license|licence)$/.test(key)) licenses.push(item.trim())
      } else if (item && typeof item === 'object') visit(item)
    }
  }
  visit(value)
  return { sources: ordered(sources), licenses: ordered(licenses) }
}

export function classifyClaims({ sources, licenses }) {
  const findings = []
  if (!sources.length) findings.push('source-claim-missing')
  if (!licenses.length) findings.push('license-claim-missing')
  for (const license of licenses) {
    // Recognition is deliberately not validation of permission or scope.
    if (!/^(?:CC[ -]BY(?:-SA)?[ -](?:2\.1 Japan|3\.0|4\.0)|CC0(?:[ -]1\.0)?|Creative Commons Attribution License(?: \(PLOS Medicine, open access\))?|Apache-2\.0|ICRP Publication (?:145|156))$/i.test(license)) {
      findings.push(`unrecognized-license-claim:${license}`)
    }
  }
  if (/ICRP(?: Publication)?\s*(145|156)/i.test([...sources, ...licenses].join(' '))) findings.push('ICRP-redistribution-permission-unresolved')
  if (/INTERGROWTH|University of Oxford/i.test([...sources, ...licenses].join(' '))) findings.push('Oxford-table-reuse-permission-unresolved')
  return ordered(findings)
}

export function glbJson(bytes, name) {
  if (bytes.length < 20 || bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error(`${name}: invalid GLB header`)
  const size = bytes.readUInt32LE(12)
  if (bytes.readUInt32LE(16) !== 0x4e4f534a || size > bytes.length - 20) throw new Error(`${name}: invalid JSON chunk`)
  return JSON.parse(bytes.subarray(20, 20 + size).toString('utf8'))
}

export function inventory(root) {
  // lstat the selected root itself: readdirSync would otherwise follow a symlink.
  const rootStat = lstatSync(root)
  if (rootStat.isSymbolicLink()) throw new Error(`${root}: symlink not permitted in published inventory`)
  if (!rootStat.isDirectory()) throw new Error(`${root}: published inventory root must be a directory`)
  const entries = []
  function walk(dir) {
    for (const name of readdirSync(dir).sort()) {
      const filename = path.join(dir, name), stat = lstatSync(filename)
      if (stat.isSymbolicLink()) throw new Error(`${filename}: symlink not permitted in published inventory`)
      if (stat.isDirectory()) { walk(filename); continue }
      if (!stat.isFile()) throw new Error(`${filename}: unsupported file type`)
      const relative = path.relative(root, filename).split(path.sep).join('/'), bytes = readFileSync(filename)
      const extension = path.extname(name).toLowerCase()
      let claims = { sources: [], licenses: [] }, evidencePath = relative
      if (extension === '.glb') claims = claimsFromJson(glbJson(bytes, relative))
      else if (extension === '.json') claims = claimsFromJson(JSON.parse(bytes.toString('utf8')))
      else if (extension === '.png') {
        const manifest = path.join(dir, 'manifest.json')
        if (existsSync(manifest)) {
          const manifestStat = lstatSync(manifest)
          if (manifestStat.isSymbolicLink()) throw new Error(`${manifest}: symlink not permitted in published inventory`)
          if (!manifestStat.isFile()) throw new Error(`${manifest}: manifest must be a regular file`)
          claims = claimsFromJson(JSON.parse(readFileSync(manifest, 'utf8')))
          evidencePath = path.relative(root, manifest).split(path.sep).join('/')
        }
      }
      entries.push({ path: relative, bytes: bytes.length, sha256: sha256(bytes), evidencePath, ...claims,
        findings: classifyClaims(claims), permissionStatus: 'not-independently-cleared' })
    }
  }
  walk(root)
  entries.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
  return { schema: 1, scope: 'public/bodyexposure recursively; excludes other public directories and npm dependencies',
    permissionDisclaimer: 'Metadata claims and inherited manifest claims are recorded, not independently authenticated rights. No asset is cleared for redistribution by this report.', entries }
}

export function compareInventory(expected, actual) {
  const prior = new Map(expected.entries.map((entry) => [entry.path, entry]))
  const current = new Map(actual.entries.map((entry) => [entry.path, entry]))
  const findings = []
  // A clean replay requires identical report contracts, not just identical asset rows.
  for (const field of ['schema', 'scope', 'permissionDisclaimer']) {
    if (expected[field] !== actual[field]) findings.push(`changed-report-header:${field}`)
  }
  for (const [name, entry] of prior) {
    if (!current.has(name)) findings.push(`missing-file:${name}`)
    else if (JSON.stringify(entry) !== JSON.stringify(current.get(name))) findings.push(`changed-resource:${name}`)
  }
  for (const name of current.keys()) if (!prior.has(name)) findings.push(`unrecorded-file:${name}`)
  return findings.sort()
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] || 'public/bodyexposure'
  const actual = inventory(root)
  if (process.argv[3]) {
    const findings = compareInventory(JSON.parse(readFileSync(process.argv[3], 'utf8')), actual)
    console.log(JSON.stringify({ files: actual.entries.length, findings }, null, 2))
    if (findings.length) process.exitCode = 1
  } else console.log(JSON.stringify(actual, null, 2))
}
