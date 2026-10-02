import assert from 'node:assert/strict'
import { parseComplaintCsv, routeComplaint, suggestComplaintColumns } from '../../src/lib/finance/cfpbComplaintRouting.ts'

const csv = [
  'Complaint ID,Product,Consumer complaint narrative',
  '1,Credit card,"Card charged twice for one purchase and merchant will not reverse it"',
  '2,Credit card,"Unauthorized card charge appeared after the card was locked"',
  '3,Credit reporting,"Incorrect account remains on my credit report after dispute"',
  '4,Credit reporting,"Credit bureau did not remove inaccurate reporting"',
  '5,Mortgage,"Mortgage servicer applied my payment to the wrong month"',
  '6,Mortgage,"Escrow payment changed without a clear explanation"',
].join('\n')

const parsed = parseComplaintCsv(csv)
assert.deepEqual(suggestComplaintColumns(parsed.headers), {
  narrative: 'Consumer complaint narrative',
  product: 'Product',
  id: 'Complaint ID',
})
assert.equal(parsed.rows.length, 6)

const records = parsed.rows.map((row) => ({
  id: row[0],
  product: row[1],
  narrative: row[2],
}))

const card = routeComplaint(records, 'I found an unauthorized charge on my locked card')
assert.equal(card.candidate, 'Credit card')
assert.equal(card.neighbors[0]?.id, '2')
assert(card.evidenceShare > 0.5)
assert.equal(card.reason.includes('imported examples'), true)

const short = routeComplaint(records, 'wrong')
assert.equal(short.candidate, null)
assert.equal(short.uncertain, true)

const noEvidence = routeComplaint(records, 'airline luggage was lost during an international journey')
assert.equal(noEvidence.candidate, null)
assert.equal(noEvidence.neighbors.length, 0)

const quoted = parseComplaintCsv('id,product,narrative\n7,"Checking, savings","Fee was ""not disclosed"" before opening"')
assert.equal(quoted.rows[0][1], 'Checking, savings')
assert.equal(quoted.rows[0][2], 'Fee was "not disclosed" before opening')

console.log('CFPB complaint routing tests passed')
