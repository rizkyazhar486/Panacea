import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconSearch, IconActivity } from '../components/icons'
import { DicomCrossplanes3D } from '../components/DicomCrossplanes3D'
import {
  bacaDicom, jendelaAwal, nilaiDi, tafsirHu,
  JENDELA_CT, type Citra,
} from '../lib/dicom'
import {
  ambilIrisanMpr,
  BATAS_MPR,
  buatVolumeMpr,
  jendelakanMpr,
  labelBidangMpr,
  type IrisanMpr,
} from '../lib/dicomMpr'
import {
  BATAS_KELOMPOK_DICOM,
  kelompokkanDicomUntukTampilan,
  type DicomDisplayGroup,
  type DicomSliceItem,
} from '../lib/dicomSeries'

type Irisan = DicomSliceItem

interface PlaneProps {
  title: string
  subtitle: string
  plane: IrisanMpr
  pusat: number
  lebar: number
  terbalik: boolean
  crossX?: number
  crossY?: number
  showCrosshair: boolean
  primary?: boolean
  onPick: (x: number, y: number) => void
}

function PlaneViewer({
  title, subtitle, plane, pusat, lebar, terbalik,
  crossX, crossY, showCrosshair, primary, onPick,
}: PlaneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = plane.kolom
    canvas.height = plane.baris
    const context = canvas.getContext('2d')
    if (!context) return

    const gray = jendelakanMpr(plane.nilai, pusat, lebar, terbalik)
    const image = context.createImageData(plane.kolom, plane.baris)
    for (let i = 0; i < gray.length; i++) {
      const offset = i * 4
      image.data[offset] = gray[i]
      image.data[offset + 1] = gray[i]
      image.data[offset + 2] = gray[i]
      image.data[offset + 3] = 255
    }
    context.putImageData(image, 0, 0)
  }, [plane, pusat, lebar, terbalik])

  const pick = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(plane.kolom - 1, Math.floor(((event.clientX - rect.left) / rect.width) * plane.kolom)))
    const y = Math.max(0, Math.min(plane.baris - 1, Math.floor(((event.clientY - rect.top) / rect.height) * plane.baris)))
    onPick(x, y)
  }

  const crossLeft = crossX == null || plane.kolom <= 1 ? 50 : (crossX / (plane.kolom - 1)) * 100
  const crossTop = crossY == null || plane.baris <= 1 ? 50 : (crossY / (plane.baris - 1)) * 100
  const safeAspect = Math.max(0.35, Math.min(3.2, plane.aspek || 1))

  return (
    <section className={`overflow-hidden rounded-2xl border border-white/10 bg-black/70 ${primary ? 'lg:row-span-2' : ''}`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5">
        <div>
          <div className="text-xs font-black text-white">{title}</div>
          <div className="text-[10px] text-white/45">{subtitle}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-white/55">
          {plane.kolom}×{plane.baris}
        </div>
      </div>
      <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-black p-2 sm:min-h-[280px]">
        <div className="relative w-full max-w-full" style={{ aspectRatio: String(safeAspect) }}>
          <canvas
            ref={canvasRef}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              pick(event)
            }}
            onPointerMove={(event) => { if (event.buttons === 1) pick(event) }}
            className="block h-full max-h-[560px] w-full cursor-crosshair select-none object-contain"
            style={{ imageRendering: 'pixelated', touchAction: 'none', aspectRatio: String(safeAspect) }}
            aria-label={`${title} DICOM plane`}
          />
          {showCrosshair && crossX != null && crossY != null && (
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute bottom-0 top-0 w-px bg-cyan-300/70" style={{ left: `${crossLeft}%` }} />
              <div className="absolute left-0 right-0 h-px bg-amber-300/70" style={{ top: `${crossTop}%` }} />
              <div
                className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-black/70"
                style={{ left: `${crossLeft}%`, top: `${crossTop}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function MiniSlice({ citra, pusat, lebar, aktif, onClick, label }: {
  citra: Citra
  pusat: number
  lebar: number
  aktif: boolean
  onClick: () => void
  label: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rows = citra.baris
    const cols = citra.kolom
    const values = citra.nilai.subarray(0, rows * cols)
    const gray = jendelakanMpr(values, pusat, lebar, citra.terbalik)
    canvas.width = cols
    canvas.height = rows
    const context = canvas.getContext('2d')
    if (!context) return
    const image = context.createImageData(cols, rows)
    for (let i = 0; i < gray.length; i++) {
      const offset = i * 4
      image.data[offset] = gray[i]
      image.data[offset + 1] = gray[i]
      image.data[offset + 2] = gray[i]
      image.data[offset + 3] = 255
    }
    context.putImageData(image, 0, 0)
  }, [citra, pusat, lebar])

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-20 shrink-0 overflow-hidden rounded-xl border text-left transition ${
        aktif ? 'border-cyan-300 bg-cyan-400/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
      }`}
    >
      <canvas ref={canvasRef} className="h-14 w-full bg-black object-cover" style={{ imageRendering: 'pixelated' }} />
      <div className="truncate px-2 py-1.5 text-[9px] font-bold text-white/70">{label}</div>
    </button>
  )
}

function SequenceStrip({ groups, activeId, onSelect }: {
  groups: readonly DicomDisplayGroup[]
  activeId: string
  onSelect: (group: DicomDisplayGroup) => void
}) {
  if (!groups.length) return null

  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black text-ink dark:text-white">Sequences / acquisitions</div>
          <div className="mt-0.5 text-[10px] text-neutral-500">Panacea separates obviously different loaded acquisitions before reconstruction.</div>
        </div>
        <div className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black text-neutral-500 dark:bg-white/10 dark:text-white/50">
          {groups.length}
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {groups.map((group) => {
          const active = group.id === activeId
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelect(group)}
              className={`min-w-[150px] shrink-0 rounded-2xl border p-3 text-left transition ${
                active
                  ? 'border-brand bg-brand-50 shadow-sm dark:bg-brand/10'
                  : 'border-neutral-100 bg-white hover:border-neutral-200 dark:border-white/10 dark:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[9px] font-black uppercase tracking-wide ${active ? 'text-brand-dark dark:text-brand' : 'text-neutral-400'}`}>
                  {group.modality}
                </span>
                <span className={`h-2 w-2 rounded-full ${group.linkedPlanesAvailable ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              </div>
              <div className="mt-1 truncate text-xs font-black text-ink dark:text-white">{group.label}</div>
              <div className="mt-1 text-[10px] text-neutral-500">{group.slices.length} slice{group.slices.length === 1 ? '' : 's'} · {group.columns}×{group.rows}</div>
              <div className={`mt-2 text-[9px] font-bold ${group.linkedPlanesAvailable ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>
                {group.linkedPlanesAvailable ? '3-plane navigation available' : 'Source view only'}
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

export function Radiology() {
  const [loaded, setLoaded] = useState<Irisan[]>([])
  const [ditolak, setDitolak] = useState<Array<{ nama: string; alasan: string }>>([])
  const [activeGroupId, setActiveGroupId] = useState('')
  const [indeks, setIndeks] = useState(0)
  const [bingkai, setBingkai] = useState(0)
  const [pusat, setPusat] = useState(40)
  const [lebar, setLebar] = useState(400)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const [memuat, setMemuat] = useState(false)
  const [crosshair, setCrosshair] = useState(true)
  const [catatan, setCatatan] = useState('')

  const groups = useMemo(() => kelompokkanDicomUntukTampilan(loaded), [loaded])
  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) ?? groups[0],
    [groups, activeGroupId],
  )
  const irisan = activeGroup?.slices ?? []
  const kini = irisan[Math.min(indeks, Math.max(0, irisan.length - 1))]?.citra
  const hasilMpr = useMemo(() => buatVolumeMpr(irisan.map((item) => item.citra)), [irisan])
  const volume = hasilMpr.ok ? hasilMpr.volume : null
  const labelBidang = useMemo(() => labelBidangMpr(kini?.deskripsiSeri), [kini?.deskripsiSeri])

  const resetViewFor = useCallback((slices: readonly Irisan[]) => {
    if (!slices.length) {
      setIndeks(0)
      setBingkai(0)
      setCursor({ x: 0, y: 0 })
      return
    }
    const middle = Math.max(0, Math.floor(slices.length / 2))
    const image = slices[middle]?.citra ?? slices[0].citra
    const window = jendelaAwal(image)
    setIndeks(middle)
    setBingkai(0)
    setPusat(window.pusat)
    setLebar(window.lebar)
    setCursor({ x: Math.floor(image.kolom / 2), y: Math.floor(image.baris / 2) })
    setCatatan('')
  }, [])

  const muat = useCallback(async (berkas: FileList | null) => {
    if (!berkas || !berkas.length) return
    setMemuat(true)
    const baik: Irisan[] = []
    const buruk: Array<{ nama: string; alasan: string }> = []

    for (const file of Array.from(berkas)) {
      try {
        const hasil = bacaDicom(await file.arrayBuffer())
        if (hasil.ok) baik.push({ nama: file.name, citra: hasil.data })
        else buruk.push({ nama: file.name, alasan: hasil.alasan })
      } catch (error) {
        buruk.push({ nama: file.name, alasan: error instanceof Error ? error.message : 'Could not be read' })
      }
    }

    const nextGroups = kelompokkanDicomUntukTampilan(baik)
    setLoaded(baik)
    setDitolak(buruk)
    setActiveGroupId(nextGroups[0]?.id ?? '')
    resetViewFor(nextGroups[0]?.slices ?? [])
    setMemuat(false)
  }, [resetViewFor])

  const pilihKelompok = useCallback((group: DicomDisplayGroup) => {
    setActiveGroupId(group.id)
    resetViewFor(group.slices)
  }, [resetViewFor])

  useEffect(() => {
    if (!kini) return
    setCursor((old) => ({
      x: Math.min(kini.kolom - 1, Math.max(0, old.x)),
      y: Math.min(kini.baris - 1, Math.max(0, old.y)),
    }))
  }, [kini?.kolom, kini?.baris])

  const sourcePlane = useMemo<IrisanMpr | null>(() => {
    if (!kini) return null
    if (volume) return ambilIrisanMpr(volume, 'source', { ...cursor, z: indeks })
    const count = kini.baris * kini.kolom
    const frame = Math.min(kini.bingkai - 1, Math.max(0, bingkai))
    return {
      bidang: 'source',
      baris: kini.baris,
      kolom: kini.kolom,
      nilai: kini.nilai.subarray(frame * count, (frame + 1) * count),
      aspek: kini.jarakPiksel
        ? (kini.kolom * kini.jarakPiksel[1]) / Math.max(1e-6, kini.baris * kini.jarakPiksel[0])
        : kini.kolom / kini.baris,
    }
  }, [kini, volume, cursor, indeks, bingkai])

  const crossRow = useMemo(
    () => volume ? ambilIrisanMpr(volume, 'cross-row', { ...cursor, z: indeks }) : null,
    [volume, cursor, indeks],
  )
  const crossColumn = useMemo(
    () => volume ? ambilIrisanMpr(volume, 'cross-column', { ...cursor, z: indeks }) : null,
    [volume, cursor, indeks],
  )

  const selectedValue = useMemo(() => {
    if (!kini) return null
    return nilaiDi(kini, cursor.x, cursor.y, bingkai)
  }, [kini, cursor, bingkai])

  const ct = kini?.modalitas === 'CT'
  const nilaiMin = volume?.minimum ?? kini?.minimum ?? -1200
  const nilaiMax = volume?.maksimum ?? kini?.maksimum ?? 1500
  const windowRange = Math.max(1, nilaiMax - nilaiMin)
  const thumbStep = Math.max(1, Math.ceil(irisan.length / 14))
  const thumbnails = irisan.filter((_, i) => i % thumbStep === 0 || i === irisan.length - 1).slice(0, 15)

  const setSlice = (next: number) => {
    setIndeks(Math.max(0, Math.min(irisan.length - 1, next)))
    setBingkai(0)
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle
          icon={<IconSearch size={20} />}
          title="MRI / CT workspace"
          subtitle="Load your own uncompressed DICOM study. Pixel data stays in this browser and is never uploaded."
        />
        <label className="mt-3 block cursor-pointer rounded-2xl border-2 border-dashed border-brand/40 bg-brand-50/40 px-4 py-5 text-center active:scale-[0.995] dark:bg-brand/5">
          <input
            type="file"
            multiple
            accept=".dcm,application/dicom"
            className="hidden"
            onChange={(event) => void muat(event.target.files)}
          />
          <div className="text-2xl">🩻</div>
          <div className="mt-1 text-sm font-black text-brand-dark dark:text-brand">{memuat ? 'Reading locally…' : 'Open DICOM files'}</div>
          <div className="mt-1 text-[11px] leading-snug text-neutral-500">
            You can select several acquisitions together. Panacea separates obvious sequences before building linked views.
          </div>
        </label>

        {ditolak.length > 0 && (
          <div className="mt-3 rounded-xl bg-amber-500/10 p-3">
            <div className="text-[11px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">
              {ditolak.length} file{ditolak.length > 1 ? 's' : ''} not read
            </div>
            {ditolak.slice(0, 4).map((item) => (
              <div key={item.nama} className="mt-1 text-[11px] leading-snug text-amber-800 dark:text-amber-300">
                <b>{item.nama}</b> — {item.alasan}
              </div>
            ))}
          </div>
        )}
      </Card>

      <SequenceStrip groups={groups} activeId={activeGroup?.id ?? ''} onSelect={pilihKelompok} />

      {kini && sourcePlane && (
        <section className="overflow-hidden rounded-[28px] border border-slate-700/60 bg-[#081017] text-white shadow-2xl shadow-black/20">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-sm font-black sm:text-base">{activeGroup?.label || kini.deskripsiSeri || 'Loaded DICOM study'}</h2>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-200">
                  local only
                </span>
                {volume && (
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-cyan-200">
                    linked planes
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[10px] text-white/45">
                {kini.modalitas} · {irisan.length} slice{irisan.length === 1 ? '' : 's'} · acquisition {Math.max(1, groups.indexOf(activeGroup!) + 1)}/{groups.length}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCrosshair((value) => !value)}
                className={`rounded-xl border px-3 py-2 text-[10px] font-black ${crosshair ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/5 text-white/60'}`}
              >
                Point guide {crosshair ? 'on' : 'off'}
              </button>
              <a
                href="#/body-explorer"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black text-white/75 hover:bg-white/10"
              >
                Open 3D anatomy ↗
              </a>
            </div>
          </header>

          <div className="grid xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0 p-3 sm:p-4">
              <div className={`grid gap-3 ${volume ? 'lg:grid-cols-2 lg:grid-rows-2' : 'grid-cols-1'}`}>
                <PlaneViewer
                  primary={Boolean(volume)}
                  title={labelBidang.source}
                  subtitle={`Slice ${indeks + 1}/${irisan.length}`}
                  plane={sourcePlane}
                  pusat={pusat}
                  lebar={lebar}
                  terbalik={kini.terbalik}
                  crossX={cursor.x}
                  crossY={cursor.y}
                  showCrosshair={crosshair}
                  onPick={(x, y) => setCursor({ x, y })}
                />

                {crossRow && (
                  <PlaneViewer
                    title={labelBidang['cross-row']}
                    subtitle="Reformatted from this loaded acquisition"
                    plane={crossRow}
                    pusat={pusat}
                    lebar={lebar}
                    terbalik={kini.terbalik}
                    crossX={cursor.x}
                    crossY={indeks}
                    showCrosshair={crosshair}
                    onPick={(x, z) => {
                      setCursor((old) => ({ ...old, x }))
                      setSlice(z)
                    }}
                  />
                )}

                {crossColumn && (
                  <PlaneViewer
                    title={labelBidang['cross-column']}
                    subtitle="Reformatted from this loaded acquisition"
                    plane={crossColumn}
                    pusat={pusat}
                    lebar={lebar}
                    terbalik={kini.terbalik}
                    crossX={cursor.y}
                    crossY={indeks}
                    showCrosshair={crosshair}
                    onPick={(y, z) => {
                      setCursor((old) => ({ ...old, y }))
                      setSlice(z)
                    }}
                  />
                )}
              </div>

              {volume && (
                <div className="mt-3">
                  <DicomCrossplanes3D
                    volume={volume}
                    cursor={cursor}
                    slice={indeks}
                    pusat={pusat}
                    lebar={lebar}
                    terbalik={kini.terbalik}
                  />
                </div>
              )}

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="text-[10px] font-bold text-white/55">
                    Slice {indeks + 1}/{irisan.length}
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, irisan.length - 1)}
                      value={indeks}
                      onChange={(event) => setSlice(Number(event.target.value))}
                      className="mt-2 w-full accent-cyan-400"
                      aria-label="Slice position"
                    />
                  </label>
                  <label className="text-[10px] font-bold text-white/55">
                    Horizontal position {cursor.x + 1}/{kini.kolom}
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, kini.kolom - 1)}
                      value={cursor.x}
                      onChange={(event) => setCursor((old) => ({ ...old, x: Number(event.target.value) }))}
                      className="mt-2 w-full accent-cyan-400"
                      aria-label="Horizontal point position"
                    />
                  </label>
                  <label className="text-[10px] font-bold text-white/55">
                    Vertical position {cursor.y + 1}/{kini.baris}
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, kini.baris - 1)}
                      value={cursor.y}
                      onChange={(event) => setCursor((old) => ({ ...old, y: Number(event.target.value) }))}
                      className="mt-2 w-full accent-amber-300"
                      aria-label="Vertical point position"
                    />
                  </label>
                </div>
              </div>

              {irisan.length > 1 && (
                <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/25 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Slice strip</div>
                    <div className="text-[9px] text-white/35">Tap a frame to jump</div>
                  </div>
                  <div className="flex gap-2">
                    {thumbnails.map((item) => {
                      const actualIndex = irisan.indexOf(item)
                      return (
                        <MiniSlice
                          key={`${item.nama}-${actualIndex}`}
                          citra={item.citra}
                          pusat={pusat}
                          lebar={lebar}
                          aktif={actualIndex === indeks}
                          onClick={() => setSlice(actualIndex)}
                          label={`${actualIndex + 1} · ${item.citra.posisiZ != null ? `${item.citra.posisiZ.toFixed(1)} mm` : item.nama}`}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <aside className="border-t border-white/10 bg-white/[0.025] p-4 xl:border-l xl:border-t-0">
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Selected point</div>
                  <div className="mt-2 rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-white/45">Voxel</div>
                        <div className="mt-0.5 font-mono text-xs text-white/80">x {cursor.x} · y {cursor.y} · z {indeks}</div>
                      </div>
                      {selectedValue != null && (
                        <div className="text-right">
                          <div className="text-xl font-black text-cyan-200">{selectedValue.toFixed(0)}</div>
                          <div className="text-[9px] font-black uppercase text-white/35">{ct ? 'HU' : 'raw signal'}</div>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-white/45">
                      {selectedValue == null
                        ? 'No pixel selected.'
                        : ct
                          ? tafsirHu(selectedValue)
                          : 'MR signal has no universal absolute tissue scale. Panacea does not turn this number into a tissue label or diagnosis.'}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                    <IconActivity size={14} /> Display
                  </div>
                  <div className="mt-2 space-y-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                    <label className="block text-[10px] font-bold text-white/55">
                      Level {Math.round(pusat)}
                      <input
                        type="range"
                        min={Math.floor(nilaiMin)}
                        max={Math.max(Math.ceil(nilaiMin + 1), Math.ceil(nilaiMax))}
                        value={Math.max(nilaiMin, Math.min(nilaiMax, pusat))}
                        onChange={(event) => setPusat(Number(event.target.value))}
                        className="mt-2 w-full accent-cyan-400"
                        aria-label="Window level"
                      />
                    </label>
                    <label className="block text-[10px] font-bold text-white/55">
                      Width {Math.round(lebar)}
                      <input
                        type="range"
                        min={1}
                        max={Math.max(2, Math.ceil(windowRange * 1.5))}
                        value={Math.max(1, Math.min(windowRange * 1.5, lebar))}
                        onChange={(event) => setLebar(Number(event.target.value))}
                        className="mt-2 w-full accent-cyan-400"
                        aria-label="Window width"
                      />
                    </label>
                    {ct && (
                      <div className="flex flex-wrap gap-1.5">
                        {JENDELA_CT.slice(0, 7).map((preset) => (
                          <button
                            key={preset.nama}
                            type="button"
                            onClick={() => { setPusat(preset.pusat); setLebar(preset.lebar) }}
                            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold text-white/60 hover:bg-white/10"
                          >
                            {preset.nama}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {kini.bingkai > 1 && (
                  <label className="block rounded-2xl border border-white/10 bg-black/25 p-3 text-[10px] font-bold text-white/55">
                    Frame {bingkai + 1}/{kini.bingkai}
                    <input
                      type="range"
                      min={0}
                      max={kini.bingkai - 1}
                      value={bingkai}
                      onChange={(event) => setBingkai(Number(event.target.value))}
                      className="mt-2 w-full accent-cyan-400"
                      aria-label="Frame"
                    />
                  </label>
                )}

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Study notes</div>
                  <textarea
                    value={catatan}
                    onChange={(event) => setCatatan(event.target.value)}
                    placeholder="Write your own educational observation…"
                    rows={5}
                    className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/25 focus:border-cyan-300/40"
                  />
                  <div className="mt-1 text-[9px] leading-relaxed text-white/30">Notes remain in this page session; no automated finding is generated.</div>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-3">
                  <div className="text-[10px] font-black text-cyan-100">3D anatomy correspondence</div>
                  <p className="mt-1 text-[10px] leading-relaxed text-cyan-100/55">
                    The anatomy atlas can be opened beside this study, but Panacea does not pretend that textbook geometry is registered to this person's scan.
                  </p>
                  <a href="#/body-explorer" className="mt-3 inline-flex rounded-xl bg-cyan-300 px-3 py-2 text-[10px] font-black text-slate-950">
                    Open Body Explorer
                  </a>
                </div>
              </div>
            </aside>
          </div>

          <footer className="border-t border-white/10 px-4 py-3 text-[9px] leading-relaxed text-white/35 sm:px-5">
            {volume ? BATAS_MPR : (hasilMpr.ok ? BATAS_MPR : hasilMpr.alasan)} {' '}
            {groups.length > 1 ? BATAS_KELOMPOK_DICOM : ''} {' '}
            This remains an educational viewer, not a reporting workstation, automated detector, or regulated medical device.
          </footer>
        </section>
      )}

      {!kini && (
        <div className="rounded-3xl border border-neutral-100 bg-white p-8 text-center dark:border-white/10 dark:bg-white/5">
          <div className="text-4xl">🧭</div>
          <h3 className="mt-3 text-base font-black text-ink dark:text-white">Three-plane workspace is ready for your study</h3>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-neutral-500">
            Load compatible DICOM files to browse separate acquisitions, navigate the source plane and linked orthogonal reformats with one shared point, use a slice strip, local notes and CT/MR-safe display controls.
          </p>
        </div>
      )}
    </div>
  )
}

export default Radiology
