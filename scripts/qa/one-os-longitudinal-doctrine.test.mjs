import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

test('One OS doctrine is wired into the constitutional and agent authority chain', () => {
  const constitution = read('PANACEA_CONSTITUTION.md')
  const agents = read('AGENTS.md')
  const claude = read('CLAUDE.md')
  const gemini = read('GEMINI.md')
  for (const content of [constitution, agents, claude, gemini]) {
    assert.match(content, /PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE\.md/)
  }
})

test('Visit OS exposes the poli board and stable poli route', () => {
  const visit = read('src/pages/VisitOS.tsx')
  const main = read('src/main.tsx')
  assert.match(visit, /PoliPatientFlowBoard/)
  assert.match(visit, /derivePoliPatientFlow/)
  assert.match(main, /path="\/poli"/)
})
