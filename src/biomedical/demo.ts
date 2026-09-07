import type { Dataset } from './types'

export const DEMO_VCF = `##fileformat=VCFv4.2
##reference=SYNTHETIC-NOT-A-HUMAN-ASSEMBLY
##contig=<ID=demo,length=100000>
##INFO=<ID=GENE,Number=.,Type=String,Description="Synthetic gene label, not a genomic mapping">
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO
demo\t100\t.\tA\tG\t60\tPASS\tGENE=KRAS
demo\t200\t.\tC\tT\t48\tPASS\tGENE=BRAF
demo\t300\t.\tG\tA\t12\tLowQual\tGENE=HBB
demo\t400\t.\tT\tC\t.\t.\tGENE=G6PD
demo\t500\t.\tA\tC,G\t32\tPASS\tGENE=MAPK1
`

export function demoCells() {
  const rows = ['cell_id,gene,expression,x,y,z,group']
  for (let i = 0; i < 180; i++) {
    const group = i < 90 ? 'Synthetic A' : 'Synthetic B'
    const angle = i * 2.399963229728653
    const r = Math.sqrt((i % 90) / 90) * 3
    const x = Math.cos(angle) * r + (i < 90 ? -2.2 : 2.2)
    const y = Math.sin(angle) * r
    const z = Math.sin(i * 1.7) * 1.7
    for (const [j, gene] of ['KRAS', 'BRAF', 'MAPK1', 'G6PD'].entries()) {
      rows.push(`demo-${i},${gene},${((1 + Math.sin(i * 0.3 + j)) * (i < 90 ? 2 : 4)).toFixed(3)},${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)},${group}`)
    }
  }
  return rows.join('\n')
}

export const DEMO_STATS = 'gene,p_value,log2fc\nKRAS,0.001,1.2\nBRAF,0.02,0.8\nMAPK1,0.08,0.3\nG6PD,0.6,-0.1\n'

export async function demoDatasets(): Promise<Dataset[]> {
  const { importDataset } = await import('./imports')
  const encode = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer
  const datasets = [await importDataset('synthetic-variants.vcf', 'variants', encode(DEMO_VCF), true), await importDataset('synthetic-cells.csv', 'cells', encode(demoCells()), true), await importDataset('synthetic-hypotheses.csv', 'statistics', encode(DEMO_STATS), true)]
  return datasets
}
