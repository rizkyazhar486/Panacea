import assert from 'node:assert/strict'
import { PANCREATIC_KNOWLEDGE_EDGES } from '../../src/lib/bodyOrganPancreatic'

assert.ok(PANCREATIC_KNOWLEDGE_EDGES.length >= 5, 'pancreatic education must cover all five projection domains')
