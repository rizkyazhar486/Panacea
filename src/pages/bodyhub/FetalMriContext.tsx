import { useEffect, useState } from 'react'
import { Prosa } from '../../components/ui/Prosa'
import { parseFetalMriContext, type FetalMriContext as Context, type FetalParcelDataset } from '../../domains/body-exposure'

const BASE = `${import.meta.env.BASE_URL}bodyexposure/dataset-inspection/fetal-parcels/mri/`

export function FetalMriContext({ dataset, selected }: { dataset: FetalParcelDataset; selected: number }) {
  const [context, setContext] = useState<Context | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const abort = new AbortController()
    setContext(null)
    setError('')
    fetch(`${BASE}manifest.json`, { signal: abort.signal }).then(response => {
      if (!response.ok) throw new Error('MRI context could not be loaded')
      return response.json()
    }).then(value => parseFetalMriContext(value, dataset)).then(value => {
      if (!abort.signal.aborted) setContext(value)
    })
      .catch(reason => { if (!abort.signal.aborted) setError(String(reason.message ?? reason)) })
    return () => abort.abort()
  }, [dataset, attempt])
  const region = context?.regions.find(r => r.source_label === selected)
  return <details className="fpi-mri">
    <summary>MRI source context · region {selected}</summary>
    <Prosa>Native source-grid planes at a voxel inside the selected label. Colours match the 3D numeric regions. Images use an 8-bit display window; anatomical interpretation and clinical review remain pending.</Prosa>
    {error && <>
      <p role="alert">{error}</p>
      <button type="button" className="rounded-lg border border-brand px-3 py-2 text-sm font-semibold" onClick={() => setAttempt(value => value + 1)}>Retry MRI context</button>
    </>}
    {!context && !error && <p role="status">Loading MRI context…</p>}
    {region && <>
      <div className="fpi-mri-images">{region.images.map(image => <figure key={image.axis}>
        <img src={`${BASE}${image.asset}`} width={image.width} height={image.height} loading="lazy" alt={`KCL T2 MRI and source-mask colours, region ${selected}, native ${'ijk'[image.axis]} plane at index ${image.index}`} />
        <figcaption>Source {'ijk'[image.axis]} plane · index {image.index}</figcaption>
      </figure>)}</div>
      <dl><dt>Source voxel (i, j, k)</dt><dd>{region.representative_voxel_ijk.join(', ')}</dd><dt>Source point (RAS mm)</dt><dd>{region.point_ras_mm.map(n => n.toFixed(2)).join(', ')}</dd></dl>
      <Prosa>Native planes are slightly oblique to RAS axes. Columns follow increasing source indices; rows follow decreasing indices. The mask and MRI use matching source grids, with no resampling, smoothing or changes to source files.</Prosa>
      <a href={`${BASE}manifest.json`} download>Download MRI source evidence</a>
    </>}
  </details>
}
