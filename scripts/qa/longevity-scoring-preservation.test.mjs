import test from 'node:test'
import assert from 'node:assert/strict'
import { DEF, bioAge, hitungSkor, pillarsOf } from '../../src/pages/bodyhub/longevityScoring.ts'

// Captured from the existing equations at main 20aefa26; every input is answered.
const cases = [
  {
    "patch": {
      "age": 25,
      "g": "M",
      "vo2": 52,
      "grip": 46,
      "chair30": 25,
      "balance": 35,
      "whr": 0.84,
      "rhr": 55,
      "sleepH": 7.75,
      "protein": true,
      "social": true,
      "purpose": true
    },
    "pillarScores": [
      84.78260869565217,
      80,
      80,
      100,
      100,
      100,
      100,
      100
    ],
    "score": 91,
    "bAge": 20.3
  },
  {
    "patch": {
      "age": 41,
      "g": "F",
      "vo2": 45,
      "grip": 28,
      "chair30": 18,
      "balance": 25,
      "whr": 0.82,
      "rhr": 58,
      "sleepH": 7.5
    },
    "pillarScores": [
      98.11046511627907,
      85.33333333333333,
      67.0391061452514,
      83.33333333333334,
      72.00000000000003,
      100,
      93,
      80
    ],
    "score": 86,
    "bAge": 37.5
  },
  {
    "patch": {
      "age": 72,
      "g": "M",
      "vo2": 28,
      "grip": 30,
      "chair30": 12,
      "balance": 8,
      "whr": 0.98,
      "rhr": 83,
      "sleepH": 6,
      "smoke": "former",
      "alcohol": 1,
      "hba1c": 6.7,
      "ldl": 155,
      "crp": 2.4,
      "sbp": 145
    },
    "pillarScores": [
      71.06598984771574,
      67.6056338028169,
      65.48431105047749,
      26.666666666666668,
      48,
      20,
      51,
      55
    ],
    "score": 54,
    "bAge": 86
  },
  {
    "patch": {
      "age": 18,
      "g": "F",
      "vo2": 60,
      "grip": 40,
      "chair30": 35,
      "balance": 40,
      "whr": 0.7,
      "rhr": 50,
      "sleepH": 8,
      "protein": true,
      "social": true,
      "purpose": true
    },
    "pillarScores": [
      100,
      100,
      100,
      100,
      100,
      100,
      93,
      100
    ],
    "score": 99,
    "bAge": 15
  }
]

for (const [index, fixture] of cases.entries()) test(`existing Longevity equations preserved, fixture ${index+1}`, () => {
  const data = { ...DEF, ...fixture.patch }
  const answered = { age: true, g: true, sleepH: true, smoke: true, alcohol: true }
  assert.deepEqual(pillarsOf(data, answered).map(p => p.score), fixture.pillarScores)
  assert.equal(bioAge(data, fixture.score), fixture.bAge)
  assert.deepEqual(hitungSkor(data, answered), { score: fixture.score, bAge: fixture.bAge, kurang: [] })
})
