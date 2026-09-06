import {
  exploratoryWeightedSignalIndex,
  n50,
  phredErrorProbability,
  posteriorProbabilityFromLikelihoodRatios,
  variantAlleleFraction,
  zScore,
} from '../../src/lib/biomedicalEvidence'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

ok('Q20 berarti error probability 1%', Math.abs(phredErrorProbability(20) - 0.01) < 1e-12)
ok('Q30 berarti error probability 0.1%', Math.abs(phredErrorProbability(30) - 0.001) < 1e-12)
ok('VAF menghitung alternate / total', Math.abs(variantAlleleFraction(70, 30) - 0.3) < 1e-12)
ok('VAF nol saat tak ada read', variantAlleleFraction(0, 0) === 0)
ok('N50 dihitung dari panjang kumulatif', n50([1200, 850, 2100, 500, 1800, 3200]) === 2100)
ok('z score satu SD', zScore(12, 10, 2) === 1)
ok('weighted index adalah weighted mean', Math.abs(exploratoryWeightedSignalIndex([
  { label: 'a', normalizedValue: 1, weight: 1 },
  { label: 'b', normalizedValue: 3, weight: 3 },
]) - 2.5) < 1e-12)

const posterior = posteriorProbabilityFromLikelihoodRatios(0.1, [
  { label: 'evidence A', likelihoodRatio: 2 },
  { label: 'evidence B', likelihoodRatio: 3 },
])
// prior odds = 1/9; ×6 = 2/3; posterior = (2/3)/(1+2/3) = 0.4
ok('Bayesian LR aggregation menghitung posterior odds secara transparan', Math.abs(posterior - 0.4) < 1e-12)

console.log(`\nBiomedical evidence: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
