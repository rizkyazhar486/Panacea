import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const routerPath = new URL('../../.claude/skills/panacea-capability-router/SKILL.md', import.meta.url)
const orchestratorPath = new URL('../../.claude/skills/panacea-orchestrator/SKILL.md', import.meta.url)

test('capability router declares manifest and runtime availability boundaries', async () => {
  const text = await readFile(routerPath, 'utf8')
  assert.match(text, /config\/capability-os\.json/)
  assert.match(text, /runtime availability/i)
  assert.match(text, /never.*connection state/i)
  assert.match(text, /fallback.*policy/i)
  assert.match(text, /required evidence/i)
  assert.match(text, /stop condition/i)
})

test('capability router fails closed on authorization and policy boundaries', async () => {
  const text = await readFile(routerPath, 'utf8')
  assert.match(text, /authorization/i)
  assert.match(text, /policy denial|policy denied/i)
  assert.match(text, /never.*install/i)
  assert.match(text, /never.*permission/i)
  assert.match(text, /LLM.*not.*evidence|never.*LLM.*evidence/i)
})

test('orchestrator delegates provider selection to capability router', async () => {
  const text = await readFile(orchestratorPath, 'utf8')
  assert.match(text, /panacea-capability-router/)
  assert.match(text, /select/i)
  assert.match(text, /schedule|ownership|parallel/i)
})
