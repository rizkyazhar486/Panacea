import { useMemo, useState } from 'react'
import type { BodySystemId } from '../../lib/bodySystemSourceWave'

type MicroscopyModality = 'he' | 'fluorescence' | 'em'

interface TissueHistologyEntry {
  readonly id: string
  readonly systemId: BodySystemId
  readonly tissueName: string
  readonly dominantCell: string
  readonly normalArchitecture: string
  readonly pathologyName: string
  readonly pathologyArchitecture: string
  readonly scaleBarUm: { readonly he: string; readonly fluorescence: string; readonly em: string }
  readonly pattern: 'striated' | 'alveolar' | 'lobular' | 'glomerular' | 'cortical' | 'layered'
}

export const VIRTUAL_HISTOLOGY_TISSUES: readonly TissueHistologyEntry[] = [
  { id: 'myocardium', systemId: 'cardiovascular', tissueName: 'Myocardium', dominantCell: 'Cardiomyocyte + Intercalated Discs', normalArchitecture: 'Branched striated myofibers with central nuclei & abundant mitochondria.', pathologyName: 'Acute MI Necrosis', pathologyArchitecture: 'Contraction-band necrosis, eosinophilic coagulative loss of nuclei & neutrophil infiltrate.', scaleBarUm: { he: '50 µm', fluorescence: '20 µm', em: '500 nm' }, pattern: 'striated' },
  { id: 'coronary_wall', systemId: 'cardiovascular', tissueName: 'Coronary Artery Wall', dominantCell: 'Endothelium + VSMC', normalArchitecture: 'Thin tunica intima, intact internal elastic lamina & concentric smooth muscle media.', pathologyName: 'Fibroatheroma Plaque', pathologyArchitecture: 'Lipid-rich necrotic core, foam macrophages & thinning fibrous cap narrowing lumen.', scaleBarUm: { he: '100 µm', fluorescence: '25 µm', em: '1 µm' }, pattern: 'layered' },
  { id: 'alveolar_wall', systemId: 'respiratory', tissueName: 'Alveolar-Capillary Unit', dominantCell: 'Type I/II Pneumocyte', normalArchitecture: '0.5 µm air-blood diffusion barrier with open airspaces & surfactant film.', pathologyName: 'ARDS Diffuse Alveolar Damage', pathologyArchitecture: 'Eosinophilic hyaline membranes lining alveoli with interstitial edema.', scaleBarUm: { he: '50 µm', fluorescence: '20 µm', em: '500 nm' }, pattern: 'alveolar' },
  { id: 'cerebral_cortex', systemId: 'nervous', tissueName: 'Cerebral Neocortex (6 Layers)', dominantCell: 'Pyramidal Neuron + Astrocyte', normalArchitecture: 'Organized cortical laminae I–VI with dense synaptic neuropil.', pathologyName: 'Ischemic Red Neurons', pathologyArchitecture: 'Eosinophilic shrunken soma, pyknotic nuclei & perineuronal vacuolation.', scaleBarUm: { he: '50 µm', fluorescence: '15 µm', em: '200 nm' }, pattern: 'cortical' },
  { id: 'hepatic_lobule', systemId: 'digestive', tissueName: 'Hepatic Lobule', dominantCell: 'Hepatocyte + Kupffer Cell', normalArchitecture: 'Radiating single-cell hepatocyte cords draining into central vein.', pathologyName: 'Cirrhosis Bridging Fibrosis', pathologyArchitecture: 'Regenerative hepatocyte nodules encased by dense collagen fibrous septa.', scaleBarUm: { he: '100 µm', fluorescence: '25 µm', em: '1 µm' }, pattern: 'lobular' },
  { id: 'renal_glomerulus', systemId: 'urinary', tissueName: 'Renal Glomerulus', dominantCell: 'Podocyte + Mesangial Cell', normalArchitecture: 'Open capillary loops with delicate basement membrane & foot processes.', pathologyName: 'Diabetic Glomerulosclerosis', pathologyArchitecture: 'Mesangial matrix expansion, Kimmelstiel-Wilson nodules & GBM thickening.', scaleBarUm: { he: '50 µm', fluorescence: '20 µm', em: '500 nm' }, pattern: 'glomerular' },
  { id: 'skeletal_muscle', systemId: 'musculoskeletal', tissueName: 'Skeletal Muscle Fascicle', dominantCell: 'Multinucleated Myofiber', normalArchitecture: 'Polygonal fibers with peripheral nuclei & ordered sarcomere Z-discs.', pathologyName: 'Neurogenic Atrophy', pathologyArchitecture: 'Angular atrophic fibers grouped by denervated motor units.', scaleBarUm: { he: '50 µm', fluorescence: '20 µm', em: '500 nm' }, pattern: 'striated' },
  { id: 'trabecular_bone', systemId: 'musculoskeletal', tissueName: 'Trabecular Bone & Marrow', dominantCell: 'Osteocyte + Hematopoietic Cells', normalArchitecture: 'Interconnected lamellar bone struts surrounding cellular marrow.', pathologyName: 'Osteoporotic Thinning', pathologyArchitecture: 'Perforated, disconnected thin trabeculae with fatty marrow replacement.', scaleBarUm: { he: '200 µm', fluorescence: '50 µm', em: '2 µm' }, pattern: 'alveolar' },
  { id: 'pancreatic_islet', systemId: 'endocrine', tissueName: 'Islet of Langerhans', dominantCell: 'Beta-Cell & Alpha-Cell', normalArchitecture: 'Vascularized endocrine nests embedded within exocrine acini.', pathologyName: 'Autoimmune Insulitis / Amyloid', pathologyArchitecture: 'Lymphocytic infiltration or islet amyloid deposition depleting beta-cell mass.', scaleBarUm: { he: '50 µm', fluorescence: '20 µm', em: '500 nm' }, pattern: 'glomerular' },
  { id: 'epidermis', systemId: 'integumentary-surface', tissueName: 'Skin Epidermis & Dermis', dominantCell: 'Keratinocyte + Melanocyte', normalArchitecture: 'Stratified squamous epithelium (basal→corneum) over collagenous dermis.', pathologyName: 'Psoriasiform Hyperplasia', pathologyArchitecture: 'Elongated rete ridges, parakeratosis & neutrophilic microabscesses.', scaleBarUm: { he: '100 µm', fluorescence: '25 µm', em: '1 µm' }, pattern: 'layered' },
  { id: 'lymph_node', systemId: 'lymphatic-immune', tissueName: 'Lymph Node Germinal Center', dominantCell: 'B/T Lymphocyte + Dendritic Cell', normalArchitecture: 'Polarized dark/light follicular zones mediating affinity maturation.', pathologyName: 'Reactive Follicular Hyperplasia', pathologyArchitecture: 'Expanded germinal centers with tangible-body macrophages clearing debris.', scaleBarUm: { he: '100 µm', fluorescence: '20 µm', em: '500 nm' }, pattern: 'lobular' },
  { id: 'endometrium', systemId: 'reproductive', tissueName: 'Endometrial Mucosa', dominantCell: 'Glandular Epithelium + Stroma', normalArchitecture: 'Tubular glands & spiral arterioles cycling with estrogen/progesterone.', pathologyName: 'Endometrial Hyperplasia', pathologyArchitecture: 'Crowded dilated glands with elevated gland-to-stroma ratio.', scaleBarUm: { he: '100 µm', fluorescence: '25 µm', em: '1 µm' }, pattern: 'alveolar' },
] as const

const MODALITY_STYLE: Record<MicroscopyModality, { label: string; bg: string; primary: string; nuclei: string; accent: string }> = {
  he: { label: 'H&E Stain', bg: '#211322', primary: '#e879a8', nuclei: '#5b3ea8', accent: '#f4a4c2' },
  fluorescence: { label: 'Fluorescence (IF)', bg: '#040a14', primary: '#22d3ee', nuclei: '#3b82f6', accent: '#34d399' },
  em: { label: 'Electron (TEM)', bg: '#0e1014', primary: '#94a3b8', nuclei: '#cbd5e1', accent: '#64748b' },
}

export default function VirtualHistologyMicroscope({ selectedSystemId }: { selectedSystemId: BodySystemId }) {
  const defaultTissue = useMemo(
    () => VIRTUAL_HISTOLOGY_TISSUES.find((t) => t.systemId === selectedSystemId) ?? VIRTUAL_HISTOLOGY_TISSUES[0],
    [selectedSystemId],
  )
  const [tissueId, setTissueId] = useState<string>(defaultTissue.id)
  const [modality, setModality] = useState<MicroscopyModality>('he')
  const [comparePathology, setComparePathology] = useState<boolean>(true)
  const [zoomMag, setZoomMag] = useState<number>(20)

  const tissue = VIRTUAL_HISTOLOGY_TISSUES.find((t) => t.id === tissueId) ?? defaultTissue
  const style = MODALITY_STYLE[modality]
  const scaleBar = tissue.scaleBarUm[modality]

  return (
    <section
      data-virtual-histology-microscope="v1"
      aria-label="Virtual Histology and Pathology Microscope"
      className="dark mt-3 space-y-2.5 rounded-2xl border border-pink-400/20 bg-[#070911] p-3 text-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div>
          <div className="font-mono text-[10px] font-black uppercase tracking-wider text-pink-200">
            Virtual Microscope · 12-Tissue Histology & Normal vs Pathology
          </div>
          <div className="text-[10.5px] text-slate-300">
            {tissue.tissueName} · {tissue.dominantCell} · {zoomMag}× objective ({style.label})
          </div>
        </div>
        <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] text-amber-200">
          ILLUSTRATIVE HISTOLOGY SCHEMATIC
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1 font-mono text-[9.5px]">
        {VIRTUAL_HISTOLOGY_TISSUES.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={t.id === tissue.id}
            onClick={() => setTissueId(t.id)}
            className={`min-h-8 rounded-lg border px-2 font-bold ${
              t.id === tissue.id ? 'border-pink-300 bg-pink-500/20 text-white' : 'border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {t.tissueName}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[9.5px]">
        <div className="flex gap-1">
          {(['he', 'fluorescence', 'em'] as const).map((m) => (
            <button key={m} type="button" aria-pressed={modality === m} onClick={() => setModality(m)} className={`min-h-8 rounded-lg border px-2.5 font-black ${modality === m ? 'border-cyan-300 bg-cyan-500/20 text-white' : 'border-white/10 text-slate-400'}`}>
              {MODALITY_STYLE[m].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-slate-300">
            <span>{zoomMag}×</span>
            <input type="range" min={10} max={100} step={10} value={zoomMag} onChange={(e) => setZoomMag(Number(e.target.value))} className="w-20 accent-pink-400" />
          </label>
          <button type="button" aria-pressed={comparePathology} onClick={() => setComparePathology((v) => !v)} className={`min-h-8 rounded-lg border px-2.5 font-black ${comparePathology ? 'border-amber-300 bg-amber-500/20 text-amber-100' : 'border-white/10 text-slate-400'}`}>
            Normal vs Pathology
          </button>
        </div>
      </div>

      <div className={`grid gap-2.5 ${comparePathology ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
        {(['normal', ...(comparePathology ? ['pathology'] : [])] as const).map((side) => {
          const isPath = side === 'pathology'
          return (
            <div key={side} className="overflow-hidden rounded-xl border border-white/10 p-2.5" style={{ backgroundColor: style.bg }}>
              <div className="mb-1.5 flex items-center justify-between font-mono text-[9.5px]">
                <strong className={isPath ? 'text-amber-200' : 'text-emerald-200'}>
                  {isPath ? `PATHOLOGY: ${tissue.pathologyName}` : `NORMAL: ${tissue.tissueName}`}
                </strong>
                <span className="border-b-2 border-white/80 px-1 text-[8.5px] text-white/80">{scaleBar}</span>
              </div>
              <svg viewBox="0 0 220 90" className="h-24 w-full rounded-lg bg-black/25" role="img" aria-label={`${side} ${tissue.tissueName} microscopy schematic`}>
                {Array.from({ length: 14 }, (_, i) => {
                  const x = 14 + (i % 7) * 30
                  const y = 24 + Math.floor(i / 7) * 38
                  const jitter = isPath ? ((i * 7) % 11) - 5 : 0
                  return (
                    <g key={i} transform={`translate(${x + jitter}, ${y + (isPath ? (i % 3) * 3 : 0)})`}>
                      <ellipse rx={isPath ? 10 : 12} ry={isPath ? 7 : 9} fill={isPath ? '#f59e0b' : style.primary} fillOpacity={isPath ? 0.34 : 0.42} stroke={style.accent} strokeWidth="0.9" />
                      <circle cx={isPath ? 2 : 0} cy="0" r={isPath ? 2.1 : 3.2} fill={style.nuclei} />
                    </g>
                  )
                })}
              </svg>
              <p className="mt-1.5 text-[10.5px] leading-snug text-slate-200">
                {isPath ? tissue.pathologyArchitecture : tissue.normalArchitecture}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
