import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const outdatedPath = process.argv[2]
const packageJson = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'))

let outdated = {}
if (outdatedPath && fs.existsSync(outdatedPath)) {
  try {
    outdated = JSON.parse(fs.readFileSync(outdatedPath, 'utf8') || '{}')
  } catch {
    outdated = { __parseError: { current: 'unknown', wanted: 'unknown', latest: 'unknown' } }
  }
}

const rows = Object.entries(outdated)
  .filter(([name]) => name !== '__parseError')
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, info]) => {
    const value = info ?? {}
    return `| ${name} | ${value.current ?? '—'} | ${value.wanted ?? '—'} | ${value.latest ?? '—'} |`
  })

const dependencies = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
}

const generatedAt = new Date().toISOString()

const body = `# Panacea Future Resilience Radar

Generated: **${generatedAt}**

This issue is a recurring engineering/research checkpoint. It is **not** permission to auto-migrate critical clinical infrastructure.

## Deterministic repository drift

- Direct npm dependencies tracked: **${Object.keys(dependencies).length}**
- Packages reported by \`npm outdated\`: **${rows.length}**

${rows.length > 0
  ? `| Package | Current | Wanted | Latest |
| --- | ---: | ---: | ---: |
${rows.join('\n')}`
  : 'No npm package drift was reported by this run.'}

## Horizon scan required

Review authoritative sources for material changes affecting:

- AI model/runtime APIs, tool use, structured outputs, context/memory and model deprecations;
- clinical AI evaluation, safety, governance and applicable regulatory guidance;
- FHIR, DICOM, IHE Devices and IEEE 11073 interoperability;
- medical-device vendor interfaces and authorized integration paths;
- WebGPU/browser/mobile rendering and Body Exposure performance;
- storage, streaming, search/vector and event infrastructure;
- security, identity, secrets, consent, audit and privacy controls;
- deployment/runtime portability;
- high-quality biomedical evidence that changes a Panacea clinical or simulation assumption.

For every candidate, record **source + version/date + retrieval date + affected capability + upside + compatibility + portability + reversibility + security + clinical-safety impact + migration cost + lock-in + unknowns**.

## Cutover rule

A novel technology may be urgent to investigate while still being unfit to adopt.

Critical replacement remains blocked until the Future Resilience OS gates are met: benchmark, shadow mode, rollback, canonical-contract compatibility, portability, security and clinical-safety thresholds.

See \`DOCS/FUTURE-RESILIENCE-OS.md\` and \`src/lib/futureResilienceOS.ts\`.

## Next action

Use this radar to open one bounded experiment at a time. Prefer a reversible adapter or benchmark over a product-wide rewrite.
`

process.stdout.write(body)
