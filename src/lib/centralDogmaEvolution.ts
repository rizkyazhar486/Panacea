import { KODON, bersihkanUrutan } from './genomics'

/**
 * Educational central-dogma and population-genetics engine.
 *
 * Scope:
 * - sequence-level replication, transcription and translation for teaching;
 * - a diploid two-allele population model with selection, reversible mutation,
 *   and optional Wright-Fisher-style finite-population sampling.
 *
 * This is not a molecular-dynamics engine, laboratory protocol, ancestry tool,
 * fitness prediction, or patient-specific genomic interpretation.
 */

const DNA_PAIR: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' }
const RNA_PAIR: Record<string, string> = { A: 'U', U: 'A', C: 'G', G: 'C' }

export const CENTRAL_DOGMA_REFERENCES = [
  {
    label: 'OpenStax Biology 2e — DNA replication',
    url: 'https://openstax.org/books/biology-2e/pages/14-3-basics-of-dna-replication',
  },
  {
    label: 'OpenStax Biology 2e — Genetic code / central dogma',
    url: 'https://openstax.org/books/biology-2e/pages/15-1-the-genetic-code',
  },
  {
    label: 'NCBI Bookshelf — How Cells Read the Genome',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK21050/',
  },
  {
    label: 'OpenStax Biology 2e — Population evolution',
    url: 'https://openstax.org/books/biology-2e/pages/19-1-population-evolution',
  },
  {
    label: 'OpenStax Biology 2e — Population genetics',
    url: 'https://openstax.org/books/biology-2e/pages/19-2-population-genetics',
  },
] as const

export function normaliseCodingDna(input: string): string {
  return bersihkanUrutan(input).replace(/U/g, 'T').replace(/[^ACGT]/g, '')
}

/**
 * Complement aligned antiparallel to a coding strand written 5'→3'.
 * The returned text is therefore read 3'→5' when displayed beneath it.
 */
export function alignedTemplate3to5(codingDna: string): string {
  return normaliseCodingDna(codingDna)
    .split('')
    .map((base) => DNA_PAIR[base] ?? 'N')
    .join('')
}

export function codingDnaToMrna(codingDna: string): string {
  return normaliseCodingDna(codingDna).replace(/T/g, 'U')
}

export function mrnaToTemplateDna3to5(mrna: string): string {
  return mrna
    .toUpperCase()
    .replace(/[^ACGU]/g, '')
    .split('')
    .map((base) => ({ A: 'T', U: 'A', C: 'G', G: 'C' }[base] ?? 'N'))
    .join('')
}

export interface ReplicationFrame {
  coding5to3: string
  template3to5: string
  daughterAgainstCoding3to5: string
  daughterAgainstTemplate5to3: string
  copiedBases: number
  totalBases: number
}

/**
 * Sequence-level semiconservative teaching frame.
 *
 * Each parental strand templates a complementary daughter strand. Progress is
 * deliberately base-counted so the UI can scrub the process without pretending
 * to simulate helicase/polymerase atom-by-atom.
 */
export function replicationFrame(codingDna: string, progress: number): ReplicationFrame {
  const coding = normaliseCodingDna(codingDna)
  const template = alignedTemplate3to5(coding)
  const copiedBases = Math.max(0, Math.min(coding.length, Math.floor(progress)))
  const masked = (sequence: string) =>
    sequence.slice(0, copiedBases) + '·'.repeat(Math.max(0, sequence.length - copiedBases))

  return {
    coding5to3: coding,
    template3to5: template,
    daughterAgainstCoding3to5: masked(template),
    daughterAgainstTemplate5to3: masked(coding),
    copiedBases,
    totalBases: coding.length,
  }
}

export interface TranscriptionFrame {
  codingDna5to3: string
  templateDna3to5: string
  mrna5to3: string
  visibleMrna5to3: string
  copiedBases: number
  totalBases: number
}

/**
 * For a coding DNA strand written 5'→3', mature sequence identity at this
 * simplified teaching level is DNA coding T→RNA U. The actual RNA polymerase
 * reads the antiparallel template strand.
 */
export function transcriptionFrame(codingDna: string, progress: number): TranscriptionFrame {
  const coding = normaliseCodingDna(codingDna)
  const template = alignedTemplate3to5(coding)
  const mrna = codingDnaToMrna(coding)
  const copiedBases = Math.max(0, Math.min(mrna.length, Math.floor(progress)))
  return {
    codingDna5to3: coding,
    templateDna3to5: template,
    mrna5to3: mrna,
    visibleMrna5to3: mrna.slice(0, copiedBases) + '·'.repeat(Math.max(0, mrna.length - copiedBases)),
    copiedBases,
    totalBases: mrna.length,
  }
}

export interface TranslationCodon {
  index: number
  codon: string
  aminoAcid: string
  anticodon3to5: string | null
  isStart: boolean
  isStop: boolean
}

export interface TranslationFrame {
  mrna5to3: string
  startIndex: number
  codons: TranslationCodon[]
  completedCodons: TranslationCodon[]
  peptide: string
  current: TranslationCodon | null
  stopped: boolean
}

function rnaAnticodon3to5(codon: string): string {
  return codon
    .split('')
    .map((base) => RNA_PAIR[base] ?? 'N')
    .join('')
}

/**
 * Translate from the first AUG and terminate at the first stop codon.
 * Amino-acid letters use the same standard code table as src/lib/genomics.ts.
 */
export function translationFrame(mrnaInput: string, completedCodonCount: number): TranslationFrame {
  const mrna = mrnaInput.toUpperCase().replace(/T/g, 'U').replace(/[^ACGU]/g, '')
  const startIndex = mrna.indexOf('AUG')
  if (startIndex < 0) {
    return { mrna5to3: mrna, startIndex: -1, codons: [], completedCodons: [], peptide: '', current: null, stopped: false }
  }

  const codons: TranslationCodon[] = []
  for (let i = startIndex, index = 0; i + 2 < mrna.length; i += 3, index++) {
    const codon = mrna.slice(i, i + 3)
    const aminoAcid = KODON[codon.replace(/U/g, 'T')] ?? 'X'
    const isStop = aminoAcid === '*'
    codons.push({
      index,
      codon,
      aminoAcid,
      anticodon3to5: isStop ? null : rnaAnticodon3to5(codon),
      isStart: index === 0 && codon === 'AUG',
      isStop,
    })
    if (isStop) break
  }

  const n = Math.max(0, Math.min(codons.length, Math.floor(completedCodonCount)))
  const completedCodons = codons.slice(0, n)
  const peptide = completedCodons.filter((c) => !c.isStop).map((c) => c.aminoAcid).join('')
  const stopped = completedCodons.some((c) => c.isStop)
  const current = stopped ? completedCodons[completedCodons.length - 1] ?? null : codons[n] ?? null
  return { mrna5to3: mrna, startIndex, codons, completedCodons, peptide, current, stopped }
}

export interface HardyWeinberg {
  p: number
  q: number
  AA: number
  Aa: number
  aa: number
  heterozygosity: number
}

export function hardyWeinberg(pInput: number): HardyWeinberg {
  const p = clamp01(pInput)
  const q = 1 - p
  return {
    p,
    q,
    AA: p * p,
    Aa: 2 * p * q,
    aa: q * q,
    heterozygosity: 2 * p * q,
  }
}

export interface SelectionState {
  pBefore: number
  pAfter: number
  meanFitness: number
  wAA: number
  wAa: number
  waa: number
}

/**
 * Viability-selection update for allele A:
 *
 * p' = (p² wAA + p q wAa) / wBar
 * wBar = p² wAA + 2pq wAa + q² waa
 *
 * s > 0 favours A in this teaching parameterization:
 * wAA = 1+s, wAa = 1+h*s, waa = 1.
 */
export function selectionStep(pInput: number, sInput: number, hInput: number): SelectionState {
  const p = clamp01(pInput)
  const q = 1 - p
  const s = Math.max(-0.95, Math.min(2, sInput))
  const h = clamp01(hInput)
  const wAA = Math.max(0.000001, 1 + s)
  const wAa = Math.max(0.000001, 1 + h * s)
  const waa = 1
  const meanFitness = p * p * wAA + 2 * p * q * wAa + q * q * waa
  const pAfter = meanFitness > 0
    ? (p * p * wAA + p * q * wAa) / meanFitness
    : p
  return { pBefore: p, pAfter: clamp01(pAfter), meanFitness, wAA, wAa, waa }
}

/**
 * Reversible mutation after selection:
 * p_mut = p_sel (1 - mu_A→a) + (1 - p_sel) nu_a→A
 */
export function mutationStep(pInput: number, mutationBigAToLittleA: number, mutationLittleAToBigA: number): number {
  const p = clamp01(pInput)
  const mu = Math.max(0, Math.min(1, mutationBigAToLittleA))
  const nu = Math.max(0, Math.min(1, mutationLittleAToBigA))
  return clamp01(p * (1 - mu) + (1 - p) * nu)
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(1, x))
}

function nextRandom(seedInput: number): { value: number; seed: number } {
  const seed = (Math.imul(seedInput >>> 0, 1664525) + 1013904223) >>> 0
  return { value: seed / 0x100000000, seed }
}

function sampleAlleles(copyCount: number, p: number, seedInput: number): { p: number; seed: number } {
  let hits = 0
  let seed = seedInput >>> 0
  for (let i = 0; i < copyCount; i++) {
    const r = nextRandom(seed)
    seed = r.seed
    if (r.value < p) hits++
  }
  return { p: copyCount > 0 ? hits / copyCount : p, seed }
}

export interface EvolutionParams {
  initialP: number
  populationSize: number
  generations: number
  selectionCoefficient: number
  dominance: number
  mutationBigAToLittleA: number
  mutationLittleAToBigA: number
  drift: boolean
  seed?: number
}

export interface EvolutionGeneration extends HardyWeinberg {
  generation: number
  pAfterSelection: number
  pAfterMutation: number
  meanFitness: number
}

export interface EvolutionResult {
  generations: EvolutionGeneration[]
  finalSeed: number
}

/**
 * Diploid generation model:
 * random mating (Hardy-Weinberg baseline) → viability selection → mutation →
 * optional finite-population sampling of 2N allele copies (genetic drift).
 *
 * This intentionally omits migration, assortative mating, linkage, epistasis,
 * age structure, overlapping generations and spatial structure. It is a
 * mechanistic teaching model, not a forecast of any real population.
 */
export function simulateEvolution(params: EvolutionParams): EvolutionResult {
  const generations = Math.max(0, Math.min(250, Math.floor(params.generations)))
  const populationSize = Math.max(2, Math.min(5000, Math.floor(params.populationSize)))
  let p = clamp01(params.initialP)
  let seed = params.seed ?? 0x5f3759df
  const out: EvolutionGeneration[] = []

  for (let generation = 0; generation <= generations; generation++) {
    const hw = hardyWeinberg(p)
    if (generation === 0) {
      out.push({
        generation,
        ...hw,
        pAfterSelection: p,
        pAfterMutation: p,
        meanFitness: 1,
      })
      continue
    }

    const selected = selectionStep(p, params.selectionCoefficient, params.dominance)
    const mutated = mutationStep(selected.pAfter, params.mutationBigAToLittleA, params.mutationLittleAToBigA)
    if (params.drift) {
      const sampled = sampleAlleles(populationSize * 2, mutated, seed)
      p = sampled.p
      seed = sampled.seed
    } else {
      p = mutated
    }

    const nextHw = hardyWeinberg(p)
    out.push({
      generation,
      ...nextHw,
      pAfterSelection: selected.pAfter,
      pAfterMutation: mutated,
      meanFitness: selected.meanFitness,
    })
  }

  return { generations: out, finalSeed: seed }
}
