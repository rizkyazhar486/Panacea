import VCF, { parseBreakend } from '@gmod/vcf'
import Papa from 'papaparse'
import * as nifti from 'nifti-reader-js'
import type { Dataset, DataKind, Source, VariantRow, CellRow, StatisticRow, Volume } from './types'

import { MAX_BYTES, MAX_ROWS } from './limits'
export { MAX_BYTES, MAX_ROWS } from './limits'
const forbidden = new Set(['__proto__', 'prototype', 'constructor'])
const geneSymbol = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/
const fail = (message: string): never => { throw new Error(message) }
const numeric = (s: string, label: string) => {
  if (!s?.trim() || !Number.isFinite(Number(s))) fail(`Invalid ${label}.`)
  return Number(s)
}

export function parseVariants(text: string): Pick<Dataset, 'reference' | 'variants'> {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(s => s.length > 0)
  if (!/^##fileformat=VCFv4\.[0-5]$/.test(lines[0] ?? '')) fail('Expected a VCF 4.x header.')
  const columnIndex = lines.findIndex(l => l.startsWith('#CHROM\t'))
  if (columnIndex < 0) fail('Missing VCF column header.')
  const header = lines.slice(0, columnIndex + 1)
  if (header.some(l => /ID=(__proto__|constructor|prototype)([,>])/.test(l))) fail('Unsafe VCF metadata key.')
  const columns = lines[columnIndex].split('\t')
  if (columns.some(c => forbidden.has(c)) || columns.length > 1000) fail('Unsupported VCF sample columns.')
  if (lines.length - columnIndex - 1 > MAX_ROWS) fail(`VCF exceeds ${MAX_ROWS} records. Import a filtered research subset.`)
  const parser = new VCF({ header: header.join('\n'), strict: true })
  const seen = new Set<string>()
  const variants: VariantRow[] = []
  for (const line of lines.slice(columnIndex + 1)) {
    const fields = line.split('\t')
    if (line.startsWith('#') || fields.length !== columns.length) fail('Malformed VCF record column count.')
    if (!/^[1-9]\d*$/.test(fields[1]) || (fields[5] !== '.' && (!fields[5].trim() || !Number.isFinite(Number(fields[5]))))) fail('Malformed VCF numeric field.')
    if (fields[7].split(';').some(s => forbidden.has(s.split('=')[0]))) fail('Unsafe VCF INFO key.')
    const r = parser.parseLine(line)
    const chromosome = r.CHROM ?? '', reference = r.REF ?? ''
    if (!chromosome || !Number.isSafeInteger(r.POS) || r.POS < 1 || !/^[ACGTN]+$/i.test(reference)) fail('Invalid VCF reference or position.')
    if (r.QUAL !== undefined && (!Number.isFinite(r.QUAL) || r.QUAL < 0)) fail('Invalid VCF quality.')
    const alternate = r.ALT ?? []
    if (alternate.some(a => !/^[ACGTN*]+$/i.test(a) && !/^<[A-Za-z0-9_:.-]+>$/.test(a) && !parseBreakend(a))) fail('Malformed alternate allele.')
    const id = `${r.CHROM}:${r.POS}:${r.REF}:${alternate.join(',')}`
    if (seen.has(id)) fail('Duplicate VCF record. Normalize and deduplicate upstream.')
    seen.add(id)
    const annotated = r.INFO.GENE
    const genes = (Array.isArray(annotated) ? annotated : []).filter((g): g is string => typeof g === 'string' && geneSymbol.test(g) && g !== '.')
    variants.push({ id, chromosome, position: r.POS, reference, alternate, quality: r.QUAL ?? null, filter: Array.isArray(r.FILTER) ? r.FILTER.join(';') : r.FILTER ?? 'Not evaluated', genes })
  }
  if (!variants.length) fail('No variant records found.')
  return { variants, reference: header.find(l => l.startsWith('##reference='))?.slice(12) ?? 'Unspecified' }
}

function csvRows(text: string, required: string[]) {
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: 'greedy', dynamicTyping: false })
  if (result.errors.length || result.meta.renamedHeaders && Object.keys(result.meta.renamedHeaders).length) fail('Malformed CSV or duplicate column names.')
  const fields = result.meta.fields ?? []
  if (fields.some(f => forbidden.has(f))) fail('Unsafe CSV column name.')
  if (required.some(f => !fields.includes(f))) fail(`Required CSV columns: ${required.join(', ')}.`)
  if (!result.data.length || result.data.length > MAX_ROWS) fail(`Expected 1 to ${MAX_ROWS} CSV rows.`)
  return result.data
}

export function parseCells(text: string): CellRow[] {
  const rows = csvRows(text, ['cell_id', 'gene', 'expression', 'x', 'y', 'z', 'group'])
  const seen = new Set<string>()
  const locations = new Map<string, string>()
  return rows.map(r => {
    const id = r.cell_id.trim(), gene = r.gene.trim(), group = r.group.trim()
    if (!id || id.length > 100 || !geneSymbol.test(gene) || !group || group.length > 100) fail('Invalid cell identifier, gene or group.')
    const key = JSON.stringify([id, gene])
    if (seen.has(key)) fail('Duplicate cell/gene pair.')
    seen.add(key)
    const expression = numeric(r.expression, 'expression')
    const position: [number, number, number] = [numeric(r.x, 'x'), numeric(r.y, 'y'), numeric(r.z, 'z')]
    if (expression < 0 || position.some(n => Math.abs(n) > 1e9)) fail('Expression must be non-negative and coordinates within bounds.')
    const location = JSON.stringify([position, group])
    if (locations.has(id) && locations.get(id) !== location) fail('A cell has inconsistent coordinates or groups.')
    locations.set(id, location)
    return { id, gene, group, expression, position }
  })
}

export function parseStatistics(text: string): StatisticRow[] {
  const seen = new Set<string>()
  return csvRows(text, ['gene', 'p_value', 'log2fc']).map(r => {
    const gene = r.gene.trim()
    const p = numeric(r.p_value, 'p-value'), log2fc = numeric(r.log2fc, 'log2 fold change')
    if (!geneSymbol.test(gene) || seen.has(gene) || p < 0 || p > 1) fail('Invalid or duplicate gene hypothesis, or p-value outside [0, 1].')
    seen.add(gene)
    return { gene, p, log2fc }
  })
}

export function parseVolume(buffer: ArrayBuffer): Volume {
  if (nifti.isCompressed(buffer)) fail('Compressed NIfTI is not accepted. Decompress a research subset to .nii first.')
  if (!nifti.isNIFTI(buffer)) fail('Expected an uncompressed NIfTI file.')
  const header = nifti.readHeader(buffer)
  if (header.dims[0] !== 3) fail('Only scalar 3D NIfTI volumes are supported; select one 3D volume upstream.')
  const dimensions = header.dims.slice(1, 4) as [number, number, number]
  if (dimensions.some(n => !Number.isSafeInteger(n) || n < 1 || n > 1024)) fail('Invalid volume dimensions.')
  const count = dimensions.reduce((a, b) => a * b, 1)
  if (count > 8_000_000) fail('Volume exceeds eight million voxels. Downsample upstream.')
  const readers: Record<number, { bytes: number; get: (view: DataView, i: number) => number }> = {
    2: { bytes: 1, get: (v, i) => v.getUint8(i) },
    4: { bytes: 2, get: (v, i) => v.getInt16(i, header.littleEndian) },
    8: { bytes: 4, get: (v, i) => v.getInt32(i, header.littleEndian) },
    16: { bytes: 4, get: (v, i) => v.getFloat32(i, header.littleEndian) },
    64: { bytes: 8, get: (v, i) => v.getFloat64(i, header.littleEndian) },
    512: { bytes: 2, get: (v, i) => v.getUint16(i, header.littleEndian) },
  }
  const reader = readers[header.datatypeCode]
  if (!reader) fail('Unsupported NIfTI datatype. Use scalar uint8, int16, uint16, int32, float32 or float64.')
  if (header.numBitsPerVoxel !== reader.bytes * 8 || !Number.isSafeInteger(header.vox_offset) || header.vox_offset < (nifti.isNIFTI2(buffer) ? 544 : 352) || header.vox_offset + count * reader.bytes > buffer.byteLength) fail('Truncated or inconsistent NIfTI payload.')
  const view = new DataView(nifti.readImage(header, buffer))
  const values = new Float32Array(count)
  let min = Infinity, max = -Infinity
  const slope = header.scl_slope === 0 ? 1 : header.scl_slope
  const intercept = header.scl_slope === 0 ? 0 : header.scl_inter
  for (let i = 0; i < count; i++) {
    const value = reader.get(view, i * reader.bytes) * slope + intercept
    if (!Number.isFinite(value) || Math.abs(value) > 3.4e38) fail('Volume contains invalid intensities.')
    values[i] = value
    min = Math.min(min, value); max = Math.max(max, value)
  }
  if (header.qform_code < 1 && header.sform_code < 1) fail('NIfTI has no defined spatial transform. Provide a volume with a documented qform or sform.')
  if (header.affine.flat().some(n => !Number.isFinite(n) || Math.abs(n) > 1e9)) fail('Invalid NIfTI spatial transform.')
  const [a, b, c] = header.affine
  const determinant = a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])
  if (determinant === 0 || !Number.isFinite(determinant)) fail('NIfTI spatial transform is singular.')
  return { dimensions, values, range: [min, max], affine: header.affine, units: ({ 1: 'm', 2: 'mm', 3: 'micron' } as Record<number, string>)[header.xyzt_units & 7] ?? 'unspecified units' }
}

export async function importDataset(name: string, kind: DataKind, buffer: ArrayBuffer, synthetic = false): Promise<Dataset> {
  if (!buffer.byteLength || buffer.byteLength > MAX_BYTES) fail('File must be non-empty and no larger than 32 MiB.')
  const hash = await crypto.subtle.digest('SHA-256', buffer)
  const sha256 = [...new Uint8Array(hash)].map(n => n.toString(16).padStart(2, '0')).join('')
  const source: Source = { id: sha256, sha256, name, kind, bytes: buffer.byteLength, synthetic, warnings: [] }
  if (kind === 'imaging') return { source, volume: parseVolume(buffer) }
  const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  if (kind === 'variants') {
    const result = parseVariants(text)
    source.warnings = ['GENE annotations are imported assertions, not validated gene mapping. No reference-genome alignment or clinical classification is performed.']
    if (result.reference === 'Unspecified') source.warnings.push('Reference genome is missing; coordinate interpretation requires review.')
    return { source, ...result }
  }
  if (kind === 'cells') return { source, cells: parseCells(text) }
  if (kind === 'statistics') return { source, statistics: parseStatistics(text) }
  return fail('Unsupported data type.')
}
