// scripts/qa/claim-guard.mjs
// Penjaga klaim: gagal bila kode produksi memuat istilah klaim tak berdasar di luar batas simulasi yang dilabeli.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts', '.json', '.md', '.html', '.css'
])

export function loadPolicy(file = 'governance/CLAIM_GUARD_POLICY.json') {
  const p = JSON.parse(readFileSync(file, 'utf8'))
  // Validasi bentuk: terms[] (string non-kosong), include[], exclude[], allowedBoundaryPaths[], baseline[{file,term}]
  if (!p || typeof p !== 'object') {
    throw new Error('claim-guard: invalid policy object')
  }
  if (!Array.isArray(p.terms) || p.terms.length === 0) {
    throw new Error('claim-guard: policy.terms must be a non-empty array')
  }
  for (const t of p.terms) {
    if (typeof t !== 'string' || t.trim().length === 0) {
      throw new Error('claim-guard: policy.terms contains an empty or non-string term')
    }
  }
  if (!Array.isArray(p.include) || !Array.isArray(p.exclude) || !Array.isArray(p.allowedBoundaryPaths)) {
    throw new Error('claim-guard: policy must define include[], exclude[], and allowedBoundaryPaths[] arrays')
  }
  if (!Array.isArray(p.baseline)) {
    throw new Error('claim-guard: policy.baseline must be an array')
  }
  for (const b of p.baseline) {
    if (!b || typeof b.file !== 'string' || !b.file.trim() || typeof b.term !== 'string' || !b.term.trim()) {
      throw new Error('claim-guard: invalid baseline entry (requires non-empty file and term)')
    }
  }
  return p
}

export function scanText(text, file, policy) {
  const normalizedFile = file.replace(/\\/g, '/')
  const hits = []
  const boundary = text.includes('@panacea-claim-boundary: simulation-not-clinical')
    && policy.allowedBoundaryPaths.some((p) => normalizedFile.startsWith(p))
  const lines = text.split('\n')
  for (const term of policy.terms) {
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    lines.forEach((l, i) => { if (re.test(l) && !boundary) hits.push({ file: normalizedFile, line: i + 1, term }) })
  }
  return hits
}

export function walk(root, policy) {
  // Telusuri include, lewati exclude, node_modules, dist, berkas biner; kembalikan path relatif
  const results = []
  const excludedSet = new Set([...(policy.exclude || []), 'node_modules', 'dist', '.git'])

  function visit(currentAbs, relPrefix) {
    let entries = []
    try {
      entries = readdirSync(currentAbs, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (excludedSet.has(entry.name)) continue
      const absPath = join(currentAbs, entry.name)
      const relPath = (relPrefix ? `${relPrefix}/${entry.name}` : entry.name).replace(/\\/g, '/')
      if (policy.exclude.some((ex) => relPath === ex || relPath.startsWith(`${ex}/`))) continue

      if (entry.isDirectory()) {
        visit(absPath, relPath)
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase()
        if (relPath.startsWith('public/') && ext !== '.json') continue
        if (!TEXT_EXTENSIONS.has(ext)) continue
        try {
          const st = statSync(absPath)
          if (st.size > 5 * 1024 * 1024) continue
          const buf = readFileSync(absPath)
          if (buf.includes(0)) continue
          results.push(relPath)
        } catch {
          // Abaikan berkas yang tidak dapat dibaca
        }
      }
    }
  }

  for (const inc of policy.include) {
    const incAbs = join(root, inc)
    try {
      const st = statSync(incAbs)
      if (st.isDirectory()) {
        visit(incAbs, relative(root, incAbs).replace(/\\/g, '/'))
      } else if (st.isFile()) {
        results.push(relative(root, incAbs).replace(/\\/g, '/'))
      }
    } catch {
      // Abaikan jika direktori include opsional belum tersedia
    }
  }
  return results.sort()
}

export function run(root = '.', policy = loadPolicy()) {
  // Kumpulkan hits; pisahkan yang ada di baseline; kembalikan { violations, stale }
  const files = walk(root, policy)
  const rawHits = []
  for (const relFile of files) {
    const text = readFileSync(join(root, relFile), 'utf8')
    rawHits.push(...scanText(text, relFile, policy))
  }

  const baselineKeys = new Set(
    policy.baseline.map((b) => `${b.file.replace(/\\/g, '/')}::${b.term.toLowerCase()}`)
  )
  const observedKeys = new Set(
    rawHits.map((h) => `${h.file.replace(/\\/g, '/')}::${h.term.toLowerCase()}`)
  )

  const violations = rawHits.filter(
    (h) => !baselineKeys.has(`${h.file.replace(/\\/g, '/')}::${h.term.toLowerCase()}`)
  )
  const stale = policy.baseline.filter(
    (b) => !observedKeys.has(`${b.file.replace(/\\/g, '/')}::${b.term.toLowerCase()}`)
  )

  return { violations, stale }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { violations, stale } = run()
  for (const s of stale) console.log(`claim-guard: stale baseline ${s.file} "${s.term}"`)
  for (const v of violations) console.error(`${v.file}:${v.line}: unsupported-claim "${v.term}"`)
  console.log(`claim-guard: ${violations.length} violation(s)`)
  process.exit(violations.length ? 1 : 0)
}
