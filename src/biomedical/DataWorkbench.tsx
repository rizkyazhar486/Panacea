import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Download, FileUp, FlaskConical, GitBranch, Layers3, LockKeyhole, Pause, Play, RotateCcw, Search, Trash2, X } from 'lucide-react'
import { ResearchScene, VolumeSlice, type SceneMode } from '../biomedical/ResearchScene'
import { demoDatasets, DEMO_VCF, DEMO_STATS, demoCells } from '../biomedical/demo'
import { researchReport, runEngine } from '../biomedical/engine'
import { MAX_BYTES } from './limits'
import { EXTERNAL_STAGES, PATHWAY_NODES, PATHWAY_SOURCE, RESEARCH_AREAS } from '../biomedical/knowledge'
import type { Dataset, DataKind } from '../biomedical/types'
import '../biomedical/engine.css'

type Repo = { repo: string; url: string; status: string; version: string | null; license: string; verification: string }
const DATA_LABELS: Record<DataKind, string> = { variants: 'DNA variants · VCF', cells: 'Cell expression · CSV', statistics: 'Hypothesis tests · CSV', imaging: 'Imaging volume · NIfTI' }
const EMPTY_CELLS: NonNullable<Dataset['cells']> = []

function download(name: string, body: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([body], { type }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function DataWorkbench() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [view, setView] = useState('workbench')
  const [scene, setScene] = useState<SceneMode>('cells')
  const [kind, setKind] = useState<DataKind>('variants')
  const [tab, setTab] = useState<DataKind>('variants')
  const [gene, setGene] = useState('KRAS')
  const [pick, setPick] = useState('')
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [speed, setSpeed] = useState(1)
  const [reset, setReset] = useState(0)
  const [threshold, setThreshold] = useState(0.25)
  const [slice, setSlice] = useState(0)
  const [minimumQuality, setMinimumQuality] = useState(20)
  const [alpha, setAlpha] = useState(0.05)
  const [study, setStudy] = useState('Research study 001')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [repos, setRepos] = useState<Repo[]>([])
  const [repoError, setRepoError] = useState('')
  const [repoQuery, setRepoQuery] = useState('')
  const [repositoryStatus, setRepositoryStatus] = useState('All')
  const [catalogAttempt, setCatalogAttempt] = useState(0)
  const worker = useRef<Worker | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const fileInput = useRef<HTMLInputElement>(null)
  const importEpoch = useRef(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const cells = useMemo(() => datasets.find(d => d.cells)?.cells ?? EMPTY_CELLS, [datasets])
  const volume = datasets.find(d => d.volume)?.volume
  const variants = useMemo(() => datasets.flatMap(d => d.variants ?? []), [datasets])
  const run = useMemo(() => runEngine(datasets, { minimumQuality, alpha }), [datasets, minimumQuality, alpha])
  const genes = useMemo(() => [...new Set([...PATHWAY_NODES.map(n => n.gene), ...cells.map(c => c.gene), ...variants.flatMap(v => v.genes)])].sort(), [cells, variants])
  const visibleVariants = variants.filter(v => `${v.chromosome} ${v.position} ${v.genes.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  const visibleCells = cells.filter(c => c.gene === gene && `${c.id} ${c.group}`.toLowerCase().includes(query.toLowerCase()))
  const visibleStats = run.adjusted.filter(s => s.gene.toLowerCase().includes(query.toLowerCase()))
  const count = tab === 'variants' ? visibleVariants.length : tab === 'cells' ? visibleCells.length : visibleStats.length
  const pageCount = Math.max(1, Math.ceil(count / 25)), currentPage = Math.min(page, pageCount - 1)
  const shownRepos = repos.filter(r => `${r.repo} ${r.status}`.toLowerCase().includes(repoQuery.toLowerCase()) && (repositoryStatus === 'All' || r.status === repositoryStatus))

  useEffect(() => {
    const controller = new AbortController()
    setRepoError('')
    fetch(`${import.meta.env.BASE_URL}biomedical-repositories.json`, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error(); return r.json() }).then(data => setRepos(data.repositories)).catch(e => { if (e.name !== 'AbortError') setRepoError('Repository catalog is unavailable.') })
    return () => controller.abort()
  }, [catalogAttempt])
  useEffect(() => () => { worker.current?.terminate(); clearTimeout(timer.current); importEpoch.current++ }, [])
  useEffect(() => {
    if (confirmClear || exportOpen) dialog.current?.showModal()
    else dialog.current?.close()
  }, [confirmClear, exportOpen])
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const changed = () => { if (preference.matches) setPlaying(false) }
    preference.addEventListener('change', changed)
    return () => preference.removeEventListener('change', changed)
  }, [])

  function stopImport() {
    importEpoch.current++; worker.current?.terminate(); worker.current = null; clearTimeout(timer.current); setBusy(false)
  }
  async function loadFile(file?: File) {
    if (!file) return
    stopImport(); setError('')
    if (file.size > MAX_BYTES || file.size === 0) { setError('Import a non-empty research subset up to 32 MiB.'); return }
    const epoch = importEpoch.current
    setBusy(true)
    try {
      const buffer = await file.arrayBuffer()
      if (epoch !== importEpoch.current) return
      const w = new Worker(new URL('../biomedical/import.worker.ts', import.meta.url), { type: 'module' })
      worker.current = w
      const finish = () => { w.terminate(); worker.current = null; clearTimeout(timer.current); setBusy(false) }
      w.onmessage = ({ data }: MessageEvent<{ result?: Dataset; error?: string }>) => {
        if (worker.current !== w) return
        if (data.result) {
          const result = data.result
          setDatasets(previous => [...previous.filter(d => d.source.kind !== result.source.kind), result])
          setTab(result.source.kind); setPage(0); setQuery('')
          if (result.cells) { setScene('cells'); setGene(result.cells[0].gene) }
          if (result.volume) { setScene('imaging'); setSlice(Math.floor(result.volume.dimensions[2] / 2)) }
          setPick('')
        } else setError(data.error ?? 'Import failed. Previous data is unchanged.')
        finish()
      }
      w.onerror = () => { if (worker.current === w) { setError('Import worker failed. Previous data is unchanged.'); finish() } }
      timer.current = setTimeout(() => { if (worker.current === w) { setError('Import timed out. Use a smaller research subset.'); finish() } }, 30000)
      w.postMessage({ name: file.name, kind, buffer }, [buffer])
    } catch { if (epoch === importEpoch.current) { setError('Could not read the selected file.'); setBusy(false) } }
  }
  async function loadDemo() {
    stopImport(); const epoch = importEpoch.current; setBusy(true); setError('')
    try {
      const result = await demoDatasets()
      if (epoch === importEpoch.current) { setDatasets(result); setScene('cells'); setGene('KRAS'); setTab('variants'); setPage(0); setQuery(''); setPick('') }
    } catch { setError('Could not load synthetic data.') }
    finally { if (epoch === importEpoch.current) setBusy(false) }
  }
  const clearAll = () => { stopImport(); setDatasets([]); setPick(''); setQuery(''); setPage(0); setScene('cells'); setConfirmClear(false); setError('') }
  const sourceKind = !datasets.length ? 'No data loaded' : datasets.every(d => d.source.synthetic) ? 'Synthetic data' : datasets.some(d => d.source.synthetic) ? 'Mixed synthetic / imported data' : 'Imported research data'

  return <section className="be-app" aria-label="Imported research data">
    <header className="be-header">
      <h3>Imported research data</h3>
      <div className="be-header-meta"><span className="be-research">Research only</span><span><LockKeyhole size={13} /> Local processing</span></div>
    </header>
    <nav className="be-nav" aria-label="Biomedical workspace">
      {[['workbench', 'Workbench'], ['workflow', 'Workflow'], ['evidence', 'Research context'], ['repositories', 'Repositories']].map(([id, label]) => <button key={id} aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}>{label}</button>)}
    </nav>
    <section className="be-commandbar">
      <label className="be-study">Study alias<input value={study} maxLength={80} onChange={e => setStudy(e.target.value)} /></label>
      <div className="be-command-actions"><button onClick={loadDemo} disabled={busy || datasets.some(d => !d.source.synthetic)}><FlaskConical size={16} /> Synthetic study</button><button disabled={!datasets.length || busy} onClick={() => setExportOpen(true)}><Download size={16} /> Export report</button><button className="be-icon" aria-label="Clear study data" title="Clear study data" disabled={!datasets.length && !busy} onClick={() => setConfirmClear(true)}><Trash2 size={17} /></button></div>
    </section>
    <div className="be-statusline"><span className={datasets.some(d => d.source.synthetic) ? 'be-synthetic' : ''}>{sourceKind}</span><span>Version 0.1 · no clinical inference</span></div>
    {error && <div className="be-alert" role="alert">{error}<button className="be-icon" aria-label="Dismiss import error" onClick={() => setError('')}><X size={15} /></button></div>}

    {view === 'workbench' && <>
      <section className="be-metrics" aria-label="Study measurements">
        {[['Variant records', run.counts.variants], ['QC-pass records', run.counts.passVariants], ['Cells', run.counts.cells], ['Gene labels', run.counts.genes], ['BH discoveries', run.counts.discoveries]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{typeof value === 'number' ? value.toLocaleString() : value}</strong></div>)}
      </section>
      <div className="be-workspace">
        <section className="be-visual">
          <div className="be-toolbar"><div className="be-segment" aria-label="Visualization mode">{(['cells', 'imaging'] as const).map(mode => <button key={mode} aria-pressed={scene === mode} onClick={() => { setScene(mode); setPick('') }}>{mode === 'cells' ? 'Expression points' : 'Volume'}</button>)}</div><div className="be-tools"><button className="be-icon" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause orbit' : 'Play orbit'} title={playing ? 'Pause orbit' : 'Play orbit'}>{playing ? <Pause size={17} /> : <Play size={17} />}</button><button className="be-icon" aria-label="Reset 3D view" title="Reset 3D view" onClick={() => setReset(n => n + 1)}><RotateCcw size={17} /></button></div></div>
          <ResearchScene mode={scene} cells={cells} volume={volume} playing={playing} speed={speed} gene={gene} reset={reset} threshold={threshold} onPick={value => { setPick(value); if (PATHWAY_NODES.some(n => n.gene === value)) setGene(value) }} />
          <div className="be-scene-controls"><label>Playback <input aria-label="Animation speed" type="range" min="0.25" max="2" step="0.25" value={speed} onChange={e => setSpeed(Number(e.target.value))} /><span>{speed}x</span></label>{scene === 'imaging' ? <label>Intensity threshold <input type="range" min="0" max="1" step="0.01" value={threshold} onChange={e => setThreshold(Number(e.target.value))} /><span>{Math.round(threshold * 100)}%</span></label> : <label>Gene label<select aria-label="Selected gene" value={gene} onChange={e => { setGene(e.target.value); setPick('') }}>{genes.map(g => <option key={g}>{g}</option>)}</select></label>}</div>
          <div className="be-picked" aria-live="polite">{pick || (scene === 'cells' && !cells.length ? 'No cell-expression data imported.' : scene === 'imaging' && !volume ? 'No volume imported.' : 'No point selected.')}</div>
        </section>
        <aside className="be-inspector">
          <h2><Layers3 size={17} /> Data sources</h2>
          <label>Import type<select value={kind} onChange={e => setKind(e.target.value as DataKind)}>{Object.entries(DATA_LABELS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <input hidden ref={fileInput} type="file" aria-label="Import research file" accept={kind === 'variants' ? '.vcf' : kind === 'imaging' ? '.nii' : '.csv'} onChange={e => { void loadFile(e.target.files?.[0]); e.currentTarget.value = '' }} />
          <button className="be-primary be-import" onClick={() => fileInput.current?.click()} disabled={busy}><FileUp size={17} /> {busy ? 'Processing locally...' : 'Import file'}</button>
          {busy && <button onClick={stopImport}>Cancel import</button>}
          <div className="be-source-list">{!datasets.length && <p className="be-muted">No sources</p>}{datasets.map(d => <div key={d.source.id}><span className="be-source-dot" /><div><strong>{d.source.name}</strong><small>{d.source.kind} · {(d.source.bytes / 1024).toFixed(1)} KiB{d.source.synthetic ? ' · synthetic' : ''}</small><code title={d.source.sha256}>SHA-256 {d.source.sha256.slice(0, 12)}</code></div></div>)}</div>
          <h2>Quality parameters</h2>
          <label>Minimum VCF QUAL<input type="number" min="0" max="999" value={minimumQuality} onChange={e => setMinimumQuality(Math.max(0, Math.min(999, Number(e.target.value))))} /></label>
          <label>False discovery rate<select value={alpha} onChange={e => setAlpha(Number(e.target.value))}><option value="0.01">1%</option><option value="0.05">5%</option><option value="0.1">10%</option></select></label>
          <div className="be-review-note"><LockKeyhole size={16} /><p>Research data stays in this tab's memory. Reloading closes the study. No diagnosis or treatment is generated.</p></div>
        </aside>
      </div>
      <section className="be-data">
        <div className="be-table-header"><div className="be-segment" aria-label="Data table">{(['variants', 'cells', 'statistics', 'imaging'] as const).map(id => <button key={id} aria-pressed={tab === id} onClick={() => { setTab(id); setPage(0); setQuery('') }}>{id === 'statistics' ? 'Statistics' : id.charAt(0).toUpperCase() + id.slice(1)}</button>)}</div>{tab !== 'imaging' && <label className="be-search"><Search size={15} /><input aria-label="Filter data rows" placeholder="Filter records" value={query} onChange={e => { setQuery(e.target.value); setPage(0) }} /></label>}</div>
        {tab === 'imaging' ? volume ? <div className="be-volume-detail"><VolumeSlice volume={volume} slice={slice} /><div><h2>Scalar volume</h2><p>{volume.dimensions.join(' x ')} voxels</p><p>World-coordinate units: {volume.units}</p><label>Voxel plane k: {slice}<input aria-label="Volume slice" type="range" min="0" max={volume.dimensions[2] - 1} value={slice} onChange={e => setSlice(Number(e.target.value))} /></label><p className="be-muted">Native voxel orientation. No patient-side labels, tissue segmentation or lesion inference.</p></div></div> : <div className="be-empty">No scalar NIfTI volume imported.</div> : <>
          <div className="be-table-scroll"><table><thead><tr>{(tab === 'variants' ? ['Locus · 1-based', 'REF / ALT', 'Gene assertion', 'QUAL', 'Filter'] : tab === 'cells' ? ['Cell', 'Gene', 'Expression', 'Group', 'Coordinates'] : ['Gene', 'p-value', 'BH q-value', 'log2 fold change', 'Threshold']).map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>
            {tab === 'variants' && visibleVariants.slice(currentPage * 25, currentPage * 25 + 25).map(v => <tr key={v.id}><td>{v.chromosome}:{v.position}</td><td>{v.reference} / {v.alternate.join(', ') || '.'}</td><td>{v.genes.join(', ') || 'Unannotated'}</td><td>{v.quality ?? 'Missing'}</td><td>{v.filter}</td></tr>)}
            {tab === 'cells' && visibleCells.slice(currentPage * 25, currentPage * 25 + 25).map(c => <tr key={`${c.id}-${c.gene}`}><td>{c.id}</td><td>{c.gene}</td><td>{c.expression}</td><td>{c.group}</td><td>{c.position.map(n => n.toFixed(2)).join(', ')}</td></tr>)}
            {tab === 'statistics' && visibleStats.slice(currentPage * 25, currentPage * 25 + 25).map(s => <tr key={s.gene}><td>{s.gene}</td><td>{s.p.toPrecision(3)}</td><td>{s.q.toPrecision(3)}</td><td>{s.log2fc}</td><td>{s.significant ? 'Within FDR threshold' : 'Above threshold'}</td></tr>)}
            {!count && <tr><td colSpan={5} className="be-empty">No matching records.</td></tr>}
          </tbody></table></div><div className="be-pagination"><span>{count.toLocaleString()} records · page {currentPage + 1}/{pageCount}</span><button className="be-icon" aria-label="Previous table page" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ArrowLeft size={16} /></button><button className="be-icon" aria-label="Next table page" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}><ArrowRight size={16} /></button></div>
        </>}
      </section>
    </>}

    {view === 'workflow' && <div className="be-content"><h2>Analysis workflow</h2><div className="be-stages">{run.stages.map((stage, i) => <div key={stage.id}><span className={`be-stage-icon ${stage.status}`}>{stage.status === 'complete' ? <Check size={16} /> : i + 1}</span><div><h3>{stage.name}</h3><p>{stage.detail}</p></div><span>{stage.status}</span></div>)}</div><h2>Oxford Nanopore handoff</h2><div className="be-table-scroll"><table><thead><tr><th>Stage</th><th>Input</th><th>Output</th><th>Execution status</th></tr></thead><tbody>{EXTERNAL_STAGES.map(s => <tr key={s.name}><td><a href={`https://github.com/${s.repo}`} target="_blank" rel="noreferrer">{s.name}</a></td><td>{s.input}</td><td>{s.output}</td><td>{s.status}</td></tr>)}</tbody></table></div><h2>Review queue</h2><ul className="be-warnings">{run.warnings.map(w => <li key={w}>{w}</li>)}<li>Drug, vaccine, serum, gene-editing and age-reversal efficacy are not computed. Models and protocols require independent validation.</li></ul><h2>Input templates</h2><div className="be-template-buttons"><button onClick={() => download('synthetic-variants.vcf', DEMO_VCF, 'text/plain')}><Download size={15} /> VCF example</button><button onClick={() => download('synthetic-cells.csv', demoCells(), 'text/csv')}><Download size={15} /> Cell CSV</button><button onClick={() => download('synthetic-hypotheses.csv', DEMO_STATS, 'text/csv')}><Download size={15} /> Statistics CSV</button></div></div>}
    {view === 'evidence' && <div className="be-content"><h2>Biological context, not patient findings</h2><div className="be-context-intro"><GitBranch size={22} /><div><h3>RAS / RAF / MEK / ERK signaling</h3><p>Curated schematic based on the <a href={PATHWAY_SOURCE} target="_blank" rel="noreferrer">Reactome RAF/MAP kinase cascade</a>. Edges summarize a pathway and do not estimate reaction rates or represent every intermediate.</p><p>Shared variant / expression gene labels: {run.sharedGenes.join(', ') || 'None'}. This is descriptive overlap, not a biomarker association test.</p></div></div>{RESEARCH_AREAS.map(area => <article className="be-evidence-row" key={area.id}><div><h3>{area.title}</h3><p className="be-muted">{area.focus}</p></div><p>{area.boundary}</p><a href={area.url} target="_blank" rel="noreferrer">Source <ArrowRight size={14} /></a></article>)}</div>}
    {view === 'repositories' && <div className="be-content"><div className="be-catalog-title"><div><h2>Integration inventory</h2><p>{repos.length} candidates · {repos.filter(r => r.status === 'Integrated package').length} installed packages · external model execution unavailable</p></div><label className="be-search"><Search size={16} /><input aria-label="Search repository inventory" placeholder="Search repositories" value={repoQuery} onChange={e => setRepoQuery(e.target.value)} /></label><select aria-label="Repository status" value={repositoryStatus} onChange={e => setRepositoryStatus(e.target.value)}><option>All</option><option>Integrated package</option><option>Reference only</option></select></div>{repoError && <div role="alert">{repoError}<button onClick={() => setCatalogAttempt(n => n + 1)}>Retry catalog</button></div>}<div className="be-table-scroll"><table><thead><tr><th>Repository</th><th>Status</th><th>Version</th><th>License review</th></tr></thead><tbody>{shownRepos.map(r => <tr key={r.repo}><td><a href={r.url} target="_blank" rel="noreferrer">{r.repo}</a></td><td title={r.verification}>{r.status}</td><td>{r.version ?? 'Not pinned'}</td><td>{r.license}</td></tr>)}{!shownRepos.length && <tr><td colSpan={4}>No matching repositories.</td></tr>}</tbody></table></div></div>}

    <footer className="be-footer"><span><LockKeyhole size={13} /> No automatic clinical release or self-deployment</span><Link to="/gene-info">Gene reference</Link><Link to="/body-explorer">Existing anatomy & molecular labs</Link></footer>
    <dialog ref={dialog} className="be-modal" aria-labelledby="be-dialog-title" onCancel={() => { setConfirmClear(false); setExportOpen(false) }}><h2 id="be-dialog-title">{confirmClear ? 'Clear this study?' : 'Export research report'}</h2><p>{confirmClear ? 'Imported files will be removed from this tab. Original files on your device are unchanged.' : 'The report contains research summaries, gene labels and source fingerprints. Filenames and raw genomic/cell/volume records are excluded. This report is not a clinical result.'}</p><div><button autoFocus onClick={() => { setConfirmClear(false); setExportOpen(false) }}>Cancel</button><button className="be-primary" onClick={() => { if (confirmClear) clearAll(); else { download('panacea-research-report.json', JSON.stringify(researchReport(run, study), null, 2)); setExportOpen(false) } }}>{confirmClear ? 'Clear study' : 'Download report'}</button></div></dialog>
  </section>
}
