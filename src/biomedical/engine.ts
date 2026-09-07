import type { Dataset, EngineRun, EngineSettings } from './types'

export const ENGINE_VERSION = 'research-workbench/0.1.0'

// Koreksi BH menjaga urutan masukan; seluruh keluarga hipotesis harus disertakan.
export function benjaminiHochberg(values: number[]): number[] {
  if (values.some(p => !Number.isFinite(p) || p < 0 || p > 1)) throw new Error('Invalid p-value.')
  const ranked = values.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p)
  const result = new Array<number>(values.length)
  let previous = 1
  for (let rank = ranked.length - 1; rank >= 0; rank--) {
    previous = Math.min(previous, ranked[rank].p * ranked.length / (rank + 1))
    result[ranked[rank].i] = previous
  }
  return result
}

export function runEngine(datasets: Dataset[], settings: EngineSettings, generatedAt = new Date().toISOString()): EngineRun {
  if (!Number.isFinite(settings.minimumQuality) || settings.minimumQuality < 0 || !Number.isFinite(settings.alpha) || settings.alpha <= 0 || settings.alpha >= 1) throw new Error('Invalid analysis settings.')
  const variants = datasets.flatMap(d => d.variants ?? [])
  const cells = datasets.flatMap(d => d.cells ?? [])
  const stats = datasets.flatMap(d => d.statistics ?? [])
  const qValues = benjaminiHochberg(stats.map(s => s.p))
  const adjusted = stats.map((s, i) => ({ ...s, q: qValues[i], significant: qValues[i] <= settings.alpha }))
  const expressed = new Set(cells.filter(c => c.expression > 0).map(c => c.gene))
  const variantGenes = new Set(variants.flatMap(v => v.genes))
  const sharedGenes = [...variantGenes].filter(g => expressed.has(g)).sort()
  const passVariants = variants.filter(v => v.filter === 'PASS' && v.quality !== null && v.quality >= settings.minimumQuality && v.alternate.length > 0).length
  const counts = { variants: variants.length, passVariants, unscoredVariants: variants.filter(v => v.quality === null).length, cells: new Set(cells.map(c => c.id)).size, genes: new Set(cells.map(c => c.gene)).size, hypotheses: stats.length, discoveries: adjusted.filter(s => s.significant).length, voxels: datasets.reduce((n, d) => n + (d.volume?.values.length ?? 0), 0) }
  const warnings = [...datasets.flatMap(d => d.source.warnings)]
  if (datasets.some(d => d.source.synthetic)) warnings.push('Synthetic demonstration data is present. These are not patient findings.')
  if (variants.length) warnings.push('VCF QUAL is caller-specific; PASS and a quality threshold do not establish pathogenicity, causality or treatment eligibility.')
  if (cells.length) warnings.push('Cell coordinates are imported coordinates, not reconstructed anatomy. Cells are not independent patient replicates.')
  if (stats.length) warnings.push('BH uses only the uploaded hypothesis family. Upload all tested hypotheses. Validity depends on the upstream study design and dependence assumptions; significance is not clinical actionability.')
  if (datasets.length > 1) warnings.push('Cross-modal gene overlap is descriptive. Sample identity, genome build and spatial registration have not been established.')
  if (counts.voxels) warnings.push('Imaging is an intensity visualization, not a lesion detector, segmentation, neuron map or calibrated diagnostic viewer.')
  return { version: ENGINE_VERSION, generatedAt, status: 'research-only', counts, adjusted, sharedGenes, warnings, settings: { ...settings }, sources: datasets.map(d => d.source), stages: [
    { id: 'import', name: 'Import & fingerprint', status: datasets.length ? 'complete' : 'waiting', detail: `${datasets.length} local sources` },
    { id: 'qc', name: 'Quality review', status: datasets.length ? (warnings.length ? 'review' : 'complete') : 'waiting', detail: `${passVariants}/${variants.length} VCF records meet configured QC` },
    { id: 'statistics', name: 'Multiple testing', status: stats.length ? 'complete' : 'waiting', detail: stats.length ? `${stats.length} hypotheses, Benjamini-Hochberg` : 'No p-value table imported' },
    { id: 'context', name: 'Cross-modal context', status: datasets.length > 1 ? 'review' : 'waiting', detail: `${sharedGenes.length} shared gene labels; identity unverified` },
    { id: 'review', name: 'Scientific review', status: 'review', detail: 'Independent expert review required; no clinical release' },
  ] }
}

export function researchReport(run: EngineRun, study: string) {
  return { ...run, study: study.trim().slice(0, 80) || 'Research study', sources: run.sources.map(({ name: _name, ...source }) => source), intendedUse: 'Research only. Not a diagnosis, prescription, gene-editing design or evidence of age reversal.', privacy: 'Source filenames, sample genotypes and raw volume/cell records excluded. Gene labels and source fingerprints may still be sensitive.', unsupported: ['Nanopore signal acquisition/basecalling', 'Clinical variant classification', 'Drug/vaccine/serum design', 'CRISPR guide design or delivery', 'Autonomous code changes/deployment', 'Reverse-aging efficacy', 'EEG/MEG or neuron-resolution inference'] }
}
