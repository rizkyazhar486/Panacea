// H0-08: gerbang browser wajib hadir di setiap PR ke main, bukan hanya perubahan UI.
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const gates = [
  { file: '.github/workflows/stabilization-acceptance.yml', job: 'full-acceptance' },
  { file: '.github/workflows/user-journey-acceptance.yml', job: 'user-journeys' },
  { file: '.github/workflows/ux-audit-acceptance.yml', job: 'ux-audit' },
]

function pullRequestTrigger(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex((line) => line === '  pull_request:')
  if (start < 0) return null
  const body = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() && !line.startsWith('    ') && !line.startsWith('#')) break
    body.push(line)
  }
  return body.join('\n')
}

function browserGateErrors(source, job) {
  const errors = []
  const trigger = pullRequestTrigger(source)
  if (trigger === null) errors.push('pull_request trigger missing')
  else {
    if (!/^    branches:\s*\[main\]\s*$/m.test(trigger)) errors.push('not targeting main')
    if (/^    (?:paths|paths-ignore|types):/m.test(trigger)) errors.push('pull_request is filtered')
  }
  if (!new RegExp('^  ' + job + ':\\s*$', 'm').test(source)) errors.push(job + ' job missing')
  return errors
}

for (const gate of gates) {
  test(gate.job + ' is emitted for every pull_request to main', () => {
    const source = readFileSync(new URL('../../' + gate.file, import.meta.url), 'utf8')
    assert.deepEqual(browserGateErrors(source, gate.job), [])
  })
}

test('negative control: paths filter makes the required browser gate fail', () => {
  const source = readFileSync(new URL('../../.github/workflows/user-journey-acceptance.yml', import.meta.url), 'utf8')
  const sabotaged = source.replace(
    /(^  pull_request:\n    branches: \[main\]\n)/m,
    '$1    paths:\n      - src/pages/**\n',
  )
  assert.notEqual(sabotaged, source, 'negative control must actually mutate trigger')
  assert.ok(browserGateErrors(sabotaged, 'user-journeys').includes('pull_request is filtered'))
})

test('negative control: missing expected check name is rejected', () => {
  const source = readFileSync(new URL('../../.github/workflows/ux-audit-acceptance.yml', import.meta.url), 'utf8')
  assert.ok(browserGateErrors(source, 'renamed-ux-audit').includes('renamed-ux-audit job missing'))
})
