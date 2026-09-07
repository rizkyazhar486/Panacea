export type DataKind = 'variants' | 'cells' | 'statistics' | 'imaging'
export interface Source {
  id: string
  name: string
  bytes: number
  sha256: string
  kind: DataKind
  synthetic: boolean
  warnings: string[]
}
export interface VariantRow {
  id: string
  chromosome: string
  position: number
  reference: string
  alternate: string[]
  quality: number | null
  filter: string
  genes: string[]
}
export interface CellRow {
  id: string
  gene: string
  expression: number
  group: string
  position: [number, number, number]
}
export interface StatisticRow { gene: string; p: number; log2fc: number }
export interface Volume {
  dimensions: [number, number, number]
  affine: number[][]
  values: Float32Array
  range: [number, number]
  units: string
}
export interface Dataset {
  source: Source
  reference?: string
  variants?: VariantRow[]
  cells?: CellRow[]
  statistics?: StatisticRow[]
  volume?: Volume
}
export interface Stage { id: string; name: string; status: 'complete' | 'review' | 'waiting'; detail: string }
export interface EngineSettings { minimumQuality: number; alpha: number }
export interface EngineRun {
  version: string
  generatedAt: string
  status: 'research-only'
  stages: Stage[]
  counts: { variants: number; passVariants: number; unscoredVariants: number; cells: number; genes: number; hypotheses: number; discoveries: number; voxels: number }
  adjusted: (StatisticRow & { q: number; significant: boolean })[]
  sharedGenes: string[]
  warnings: string[]
  settings: EngineSettings
  sources: Source[]
}
