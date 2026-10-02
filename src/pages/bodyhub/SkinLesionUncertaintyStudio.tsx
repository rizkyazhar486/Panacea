import { useMemo, useRef, useState } from 'react'

const CLASSES = [
  ['nv', 'Melanocytic nevus'],
  ['mel', 'Melanoma'],
  ['bkl', 'Benign keratosis-like lesion'],
  ['bcc', 'Basal cell carcinoma'],
  ['akiec', 'Actinic keratosis / intraepithelial carcinoma'],
  ['vasc', 'Vascular lesion'],
  ['df', 'Dermatofibroma'],
] as const

type Preset = 'peaked' | 'ambiguous' | 'flat'

const DISTRIBUTIONS: Record<Preset, number[]> = {
  peaked: [0.72, 0.08, 0.07, 0.05, 0.03, 0.03, 0.02],
  ambiguous: [0.31, 0.28, 0.16, 0.10, 0.07, 0.05, 0.03],
  flat: [0.16, 0.15, 0.15, 0.14, 0.14, 0.13, 0.13],
}

function normalizedEntropy(probabilities: number[]) {
  const h = -probabilities.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0)
  return h / Math.log(probabilities.length)
}

export function SkinLesionUncertaintyStudio() {
  const objectUrlRef = useRef<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageName, setImageName] = useState('')
  const [preset, setPreset] = useState<Preset>('ambiguous')
  const probabilities = DISTRIBUTIONS[preset]
  const entropy = useMemo(() => normalizedEntropy(probabilities), [probabilities])

  function loadImage(file: File | undefined) {
    if (!file) return
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setImageUrl(url)
    setImageName(file.name)
  }

  return (
    <section data-skin-uncertainty-studio="v1" className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-950">
      <div className="border-b border-neutral-200 bg-gradient-to-br from-amber-500/[0.08] via-transparent to-rose-500/[0.08] p-3 dark:border-white/10">
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">Skin anatomy × image uncertainty</div>
        <h3 className="mt-1 text-sm font-black text-ink dark:text-white">Learn why a classifier score is not a diagnosis</h3>
        <p className="mt-1 text-[10.5px] leading-relaxed text-neutral-500">
          Load a skin image locally, then switch between synthetic probability shapes. The image is never analysed: the probabilities are teaching examples only, shown beside Panacea's source-backed skin surface atlas.
        </p>
      </div>

      <div className="grid gap-3 p-3 md:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[0.03]">
          {imageUrl ? (
            <img src={imageUrl} alt={imageName ? `Locally loaded skin image: ${imageName}` : 'Locally loaded skin image'} className="aspect-square w-full object-contain" />
          ) : (
            <div className="flex aspect-square items-center justify-center p-5 text-center text-[10.5px] leading-relaxed text-neutral-500">
              No image loaded. The lesson still works because no inference is performed on the image.
            </div>
          )}
          <label className="flex min-h-11 cursor-pointer items-center justify-center border-t border-neutral-200 px-3 text-[10.5px] font-black text-amber-700 dark:border-white/10 dark:text-amber-300">
            Load local skin image
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => loadImage(event.target.files?.[0])} />
          </label>
        </div>

        <div>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Synthetic uncertainty shape">
            {(['peaked', 'ambiguous', 'flat'] as Preset[]).map((key) => (
              <button key={key} type="button" aria-pressed={preset === key} onClick={() => setPreset(key)} className={`min-h-11 rounded-xl border px-2 text-[10px] font-black capitalize ${preset === key ? 'border-amber-400 bg-amber-400 text-black' : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'}`}>
                {key}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {CLASSES.map(([id, label], index) => (
              <div key={id}>
                <div className="flex items-center justify-between gap-2 text-[9.5px]">
                  <span className="truncate font-bold text-neutral-600 dark:text-neutral-300">{label}</span>
                  <span className="font-mono text-neutral-500">{Math.round(probabilities[index] * 100)}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/5">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${probabilities[index] * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-sky-400/20 bg-sky-400/[0.05] p-2.5">
            <div className="text-[9px] font-black uppercase tracking-wide text-sky-600 dark:text-sky-300">Normalized uncertainty</div>
            <div className="mt-1 text-2xl font-black tabular-nums text-ink dark:text-white">{entropy.toFixed(2)}</div>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">0 means one class dominates; values nearer 1 mean the distribution is more diffuse. This is Shannon entropy of a synthetic teaching distribution, not confidence about the loaded image.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 p-3 text-[9.5px] leading-relaxed text-neutral-500 dark:border-white/10">
        <b className="text-amber-600 dark:text-amber-300">Boundary.</b> H_norm = −Σ pᵢ ln(pᵢ) / ln(K). Class names mirror the HAM10000 task vocabulary for teaching context. SpyrosAlvanakis/DNN_Ham10000 is used only as a capability reference because repository-level reuse terms have not been verified; no code, weights, images, metrics, or claims are copied. Panacea does not classify the loaded image, estimate malignancy, or replace dermoscopy, histopathology, or clinician assessment.
      </div>
    </section>
  )
}

export default SkinLesionUncertaintyStudio
