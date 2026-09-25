import { useCallback, useRef, useState } from 'react'
import { lapisanAwalCt, lapisanAwalRelatif, type LapisanVolume } from '../../lib/lapisanVolume'
import { buatResep, bacaResep, cocokkanResep, sha256Hex, BATAS_RESEP } from '../../lib/resepRender'
import { bacaDicom, urutkanSeri, type Citra } from '../../lib/dicom'
import { buatVolumeMpr } from '../../lib/dicomMpr'
import {
  susunVolumeTekstur, jendelaAwalVolume, BATAS_VOLUME,
  type VolumeTekstur,
} from '../../lib/volumeTekstur'
import {
  VolumeDicom3D, MODE_RENDER, type ModeRender, type PotongVolume,
} from '../../components/VolumeDicom3D'

type Keadaan =
  | { tahap: 'kosong' }
  | { tahap: 'membaca'; jumlah: number }
  | { tahap: 'gagal'; alasan: string }
  | { tahap: 'siap'; tekstur: VolumeTekstur; jumlah: number; modalitas: string; ditolak: string[]; sha256: string[]; seriesUid?: string }

function GeserHu({ label, nilai, min, maks, onUbah }: {
  label: string; nilai: number; min: number; maks: number; onUbah: (n: number) => void
}) {
  return (
    <label className="mt-2 block">
      <span className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white">
        <span>{label}</span>
        <span className="tabular-nums text-neutral-500">{Math.round(nilai)}</span>
      </span>
      <input
        type="range" min={Math.floor(min)} max={Math.ceil(maks)} step={1} value={nilai}
        onChange={(e) => onUbah(Number(e.target.value))}
        aria-label={label}
        className="mt-1.5 h-11 w-full accent-brand"
      />
    </label>
  )
}

function GeserPotong({ label, nilai, onUbah }: { label: string; nilai: number; onUbah: (n: number) => void }) {
  return (
    <label className="block min-w-0 flex-1">
      <span className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[.08em] text-neutral-500 dark:text-neutral-300">
        <span>{label}</span><span className="tabular-nums">{Math.round(nilai * 100)}%</span>
      </span>
      <input
        type="range" min={0.05} max={1} step={0.01} value={nilai}
        onChange={(e) => onUbah(Number(e.target.value))}
        aria-label={`${label} clipping plane`}
        className="h-11 w-full accent-brand"
      />
    </label>
  )
}

export function VolumeDicomBagian() {
  const [keadaan, setKeadaan] = useState<Keadaan>({ tahap: 'kosong' })
  const [bawah, setBawah] = useState(0)
  const [atas, setAtas] = useState(1)
  const [kepekatan, setKepekatan] = useState(0.12)
  const [mode, setMode] = useState<ModeRender>('volume')
  const [pajanan, setPajanan] = useState(1)
  const [potong, setPotong] = useState<PotongVolume>([1, 1, 1])
  const [lapisan, setLapisan] = useState<LapisanVolume[]>([])
  const [halus, setHalus] = useState(1.5)
  const [pesanResep, setPesanResep] = useState<{ nada: 'ok' | 'peringatan'; teks: string } | null>(null)
  const resepRef = useRef<HTMLInputElement | null>(null)
  const masukanRef = useRef<HTMLInputElement | null>(null)

  const ubahPotong = (sumbu: 0 | 1 | 2, nilai: number) => {
    setPotong((lama) => lama.map((v, i) => i === sumbu ? nilai : v) as PotongVolume)
  }

  const muat = useCallback(async (berkas: FileList | null) => {
    if (!berkas || berkas.length === 0) return
    setKeadaan({ tahap: 'membaca', jumlah: berkas.length })

    const citra: Citra[] = []
    const ditolak: string[] = []
    const sidik: string[] = []
    for (const f of Array.from(berkas)) {
      try {
        const buf = await f.arrayBuffer()
        const hasil = bacaDicom(buf)
        if (hasil.ok) { citra.push(hasil.data); sidik.push(await sha256Hex(buf)) }
        else ditolak.push(`${f.name}: ${hasil.alasan}`)
      } catch {
        ditolak.push(`${f.name}: could not be read`)
      }
    }

    if (citra.length === 0) {
      setKeadaan({ tahap: 'gagal', alasan: ditolak.length ? ditolak.join(' · ') : 'No DICOM image was found in that selection.' })
      return
    }

    const volume = buatVolumeMpr(urutkanSeri(citra.map((c) => ({ citra: c }))).map((x) => x.citra))
    if (!volume.ok) {
      setKeadaan({ tahap: 'gagal', alasan: volume.alasan })
      return
    }

    const jendela = jendelaAwalVolume(volume.volume)
    const tekstur = susunVolumeTekstur(volume.volume, jendela)
    if (!tekstur.ok) {
      setKeadaan({ tahap: 'gagal', alasan: tekstur.alasan })
      return
    }

    setBawah(jendela.bawah + (jendela.atas - jendela.bawah) * 0.35)
    setAtas(jendela.atas)
    setPotong([1, 1, 1])
    // Lapisan awal: kelas HU bersumber untuk CT; pecahan jendela tanpa nama jaringan untuk MRI.
    setLapisan(citra[0].modalitas === 'CT' ? lapisanAwalCt() : lapisanAwalRelatif(jendela))
    setKeadaan({
      tahap: 'siap', tekstur: tekstur.tekstur, jumlah: citra.length,
      modalitas: citra[0].modalitas, ditolak, sha256: sidik, seriesUid: citra[0].seriesInstanceUid,
    })
    setPesanResep(null)
  }, [])

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white/70 p-3.5 dark:border-white/10 dark:bg-white/[.03]">
      <div className="text-[10px] font-black uppercase tracking-[.14em] text-neutral-500 dark:text-neutral-400">Render a series in 3D</div>
      <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-700 dark:text-neutral-200">
        Pick the slices of one uncompressed CT or MR series. They are decoded here, stacked into a volume and ray-cast on the GPU.
        Nothing is uploaded, and no anatomical model is loaded — what appears is the contents of those files and nothing else.
      </p>

      <input ref={masukanRef} type="file" multiple accept=".dcm,application/dicom" onChange={(e) => void muat(e.target.files)} className="sr-only" aria-label="DICOM slices to render in 3D" />
      <button type="button" onClick={() => masukanRef.current?.click()} className="mt-2.5 min-h-11 w-full rounded-xl bg-brand px-4 text-sm font-black text-white">
        Choose DICOM slices
      </button>

      {keadaan.tahap === 'membaca' && <p className="mt-2.5 text-[11.5px] text-neutral-600 dark:text-neutral-300">Decoding {keadaan.jumlah} files…</p>}
      {keadaan.tahap === 'gagal' && (
        <p className="mt-2.5 rounded-xl border border-rose-500/25 bg-rose-500/[.06] p-2.5 text-[11.5px] leading-relaxed text-rose-800 dark:text-rose-200">{keadaan.alasan}</p>
      )}

      {keadaan.tahap === 'siap' && (
        <div className="mt-3">
          <div className="mb-2.5 flex flex-wrap gap-2">
            {MODE_RENDER.map((m) => (
              <button key={m.id} type="button" onClick={() => setMode(m.id)} aria-pressed={mode === m.id}
                className={`min-h-11 rounded-full border px-4 text-xs font-black ${mode === m.id ? 'border-brand bg-brand text-white' : 'border-neutral-300/70 text-neutral-600 dark:border-white/15 dark:text-neutral-300'}`}>
                {m.label}
              </button>
            ))}
          </div>
          <p className="mb-2.5 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{MODE_RENDER.find((m) => m.id === mode)?.catatan}</p>

          <VolumeDicom3D tekstur={keadaan.tekstur} mode={mode} pajanan={pajanan} ambangBawah={bawah} ambangAtas={atas} kepekatan={kepekatan} potong={potong} lapisan={lapisan} halus={halus} />

          <div className="mt-2 flex flex-wrap items-center gap-2" data-render-recipe>
            <span className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500">Reproduce</span>
            <button type="button" className="min-h-11 rounded-lg border border-neutral-300/70 px-3 text-[11px] font-black dark:border-white/15"
              onClick={() => {
                const t = keadaan.tekstur
                const resep = buatResep(
                  { jumlahBerkas: keadaan.sha256.length, sha256: keadaan.sha256, modalitas: keadaan.modalitas, voxel: [t.lebar, t.tinggi, t.dalam], fisikMm: t.fisikMm },
                  { mode, ambangBawah: bawah, ambangAtas: atas, kepekatan, pajanan, potong, halus, lapisan },
                  new Date(),
                )
                const url = URL.createObjectURL(new Blob([JSON.stringify(resep, null, 2)], { type: 'application/json' }))
                const a = document.createElement('a'); a.href = url; a.download = `panacea-volume-recipe-${resep.dibuat.slice(0, 10)}.json`; a.click()
                setTimeout(() => URL.revokeObjectURL(url), 1000)
                setPesanResep({ nada: 'ok', teks: `Recipe saved: ${resep.data.jumlahBerkas} file fingerprints and every render setting. No pixels or patient tags are included.` })
              }}>Save recipe</button>
            <button type="button" className="min-h-11 rounded-lg border border-neutral-300/70 px-3 text-[11px] font-black dark:border-white/15" onClick={() => resepRef.current?.click()}>Load recipe</button>
            <input ref={resepRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Render recipe to load"
              onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = ''
                if (!f) return
                try {
                  const r = bacaResep(JSON.parse(await f.text()))
                  const p = r.parameter
                  setMode(p.mode); setBawah(p.ambangBawah); setAtas(p.ambangAtas); setKepekatan(p.kepekatan)
                  setPajanan(p.pajanan); setPotong(p.potong); setHalus(p.halus); if (p.lapisan.length) setLapisan(p.lapisan)
                  const c = cocokkanResep(r, { sha256: keadaan.sha256, seriesUid: keadaan.seriesUid })
                  setPesanResep(c.status === 'identik'
                    ? { nada: 'ok', teks: 'Same files, same renderer version: this view reproduces the recipe.' }
                    : { nada: 'peringatan', teks: `Settings applied, but this is NOT a reproduction — ${c.alasan.join('; ')}.` })
                } catch (err) {
                  setPesanResep({ nada: 'peringatan', teks: `Recipe not loaded: ${(err as Error).message}.` })
                }
              }} />
          </div>
          {pesanResep && <p role="status" data-recipe-status={pesanResep.nada} className={`mt-1 text-[11px] leading-snug ${pesanResep.nada === 'ok' ? 'text-emerald-700 dark:text-emerald-300' : 'font-bold text-amber-700 dark:text-amber-300'}`}>{pesanResep.teks}</p>}
          <p className="mt-0.5 text-[10px] text-neutral-500">{BATAS_RESEP}</p>

          <div className="mt-2.5 rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-2.5 dark:border-white/10 dark:bg-white/[.025]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500">3D clipping</div>
                <p className="mt-0.5 text-[10.5px] leading-snug text-neutral-500 dark:text-neutral-400">Trim the loaded voxels along each axis to inspect internal spatial relationships. This is a crop, not segmentation.</p>
              </div>
              <button type="button" onClick={() => setPotong([1, 1, 1])} className="min-h-11 shrink-0 rounded-lg border border-neutral-300/70 px-3 text-[11px] font-black dark:border-white/15">Reset</button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <GeserPotong label="X" nilai={potong[0]} onUbah={(n) => ubahPotong(0, n)} />
              <GeserPotong label="Y" nilai={potong[1]} onUbah={(n) => ubahPotong(1, n)} />
              <GeserPotong label="Z" nilai={potong[2]} onUbah={(n) => ubahPotong(2, n)} />
            </div>
          </div>

          {mode === 'radiograf' ? (
            <label className="mt-2 block">
              <span className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white"><span>Exposure</span><span className="tabular-nums text-neutral-500">×{pajanan.toFixed(1)}</span></span>
              <input type="range" min={0.2} max={4} step={0.1} value={pajanan} onChange={(e) => setPajanan(Number(e.target.value))} aria-label="Exposure" className="mt-1.5 h-11 w-full accent-brand" />
              <span className="mt-1 block text-[11px] leading-relaxed text-neutral-500">Scales the integrated attenuation. It stands in for tube output and detector gain together, and is not a dose in milligray — no dose is computed anywhere here.</span>
            </label>
          ) : mode === 'lapisan' ? (
            <div className="mt-2 space-y-2" data-volume-layers>
              {lapisan.map((l, i) => {
                const ubah = (p: Partial<LapisanVolume>) => setLapisan((xs) => xs.map((x, k) => (k === i ? { ...x, ...p } : x)))
                const satuan = keadaan.modalitas === 'CT' ? 'HU' : 'relative'
                return (
                  <div key={i} className="rounded-xl border border-neutral-200/70 p-2 dark:border-white/10" data-volume-layer={i}>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={l.aktif} onChange={(e) => ubah({ aktif: e.target.checked })} aria-label={`Show ${l.nama}`} className="h-5 w-5" />
                      <input type="color" value={l.warna} onChange={(e) => ubah({ warna: e.target.value })} aria-label={`${l.nama} colour`} className="h-7 w-9 rounded border-0 bg-transparent p-0" />
                      <span className="min-w-0 flex-1 truncate text-[11.5px] font-bold text-ink dark:text-white">{l.nama}</span>
                      <span className="shrink-0 text-[10.5px] tabular-nums text-neutral-500">{Math.round(l.bawah)}–{Math.round(l.atas)} {satuan}</span>
                    </div>
                    {l.aktif && (
                      <>
                        <GeserHu label={`${l.nama} lower (${satuan})`} nilai={l.bawah} min={keadaan.tekstur.jendela.bawah} maks={l.atas - 1} onUbah={(n) => ubah({ bawah: Math.min(n, l.atas - 1) })} />
                        <GeserHu label={`${l.nama} upper (${satuan})`} nilai={l.atas} min={l.bawah + 1} maks={keadaan.tekstur.jendela.atas} onUbah={(n) => ubah({ atas: Math.max(n, l.bawah + 1) })} />
                        <label className="mt-1 block">
                          <span className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white"><span>Opacity</span><span className="tabular-nums text-neutral-500">{Math.round(l.opasitas * 100)}%</span></span>
                          <input type="range" min={0.05} max={1} step={0.05} value={l.opasitas} onChange={(e) => ubah({ opasitas: Number(e.target.value) })} aria-label={`${l.nama} opacity`} className="mt-1 h-11 w-full accent-brand" />
                        </label>
                      </>
                    )}
                  </div>
                )
              })}
              <p className="text-[10.5px] leading-snug text-neutral-500">
                {keadaan.modalitas === 'CT'
                  ? 'Starting ranges come from typical CT Hounsfield classes, not from this patient; tune them to the scan. Contrast vessels exist only if contrast was given.'
                  : 'MR intensity has no absolute scale, so layers start as fractions of this series’ range and carry no tissue names.'}
              </p>
            </div>
          ) : (
            <>
              <GeserHu label={`Lower threshold (${keadaan.modalitas === 'CT' ? 'HU' : 'relative value'})`} nilai={bawah} min={keadaan.tekstur.jendela.bawah} maks={atas - 1} onUbah={(n) => setBawah(Math.min(n, atas - 1))} />
              <GeserHu label={`Upper threshold (${keadaan.modalitas === 'CT' ? 'HU' : 'relative value'})`} nilai={atas} min={bawah + 1} maks={keadaan.tekstur.jendela.atas} onUbah={(n) => setAtas(Math.max(n, bawah + 1))} />
            </>
          )}

          {(mode === 'lapisan' || mode === 'permukaan' || mode === 'keduanya') && (
            <label className="mt-2 block">
              <span className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white"><span>Smoothing (surface shading)</span><span className="tabular-nums text-neutral-500">×{halus.toFixed(1)}</span></span>
              <input type="range" min={1} max={4} step={0.5} value={halus} onChange={(e) => setHalus(Number(e.target.value))} aria-label="Surface smoothing" className="mt-1.5 h-11 w-full accent-brand" />
              <span className="mt-1 block text-[11px] leading-relaxed text-neutral-500">Widens the gradient used for lighting. It smooths how the surface is shaded; it does not change which voxels are inside a layer.</span>
            </label>
          )}

          {(mode === 'volume' || mode === 'keduanya') && (
            <label className="mt-2 block">
              <span className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white"><span>Opacity per step</span><span className="tabular-nums text-neutral-500">{kepekatan.toFixed(2)}</span></span>
              <input type="range" min={0.02} max={0.5} step={0.01} value={kepekatan} onChange={(e) => setKepekatan(Number(e.target.value))} aria-label="Opacity per step" className="mt-1.5 h-11 w-full accent-brand" />
            </label>
          )}

          <ul className="mt-2.5 space-y-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            <li>· {keadaan.jumlah} slices · {keadaan.tekstur.lebar}×{keadaan.tekstur.tinggi}×{keadaan.tekstur.dalam} voxels{keadaan.tekstur.susut.some((s) => s > 1) && ` (every ${keadaan.tekstur.susut.join('/')}ᵗʰ voxel kept, to stay under ${BATAS_VOLUME.SISI_MAKS} per axis)`}</li>
            <li>· Box {keadaan.tekstur.fisikMm.map((m) => Math.round(m)).join(' × ')} mm, drawn to that proportion — slice spacing is usually far larger than pixel spacing, and ignoring it would flatten the body.</li>
            <li>· {keadaan.modalitas === 'CT' ? 'Thresholds are Hounsfield units, which are defined against water and air.' : `Modality is ${keadaan.modalitas}. Thresholds are raw stored values, NOT Hounsfield units — MRI intensity is not calibrated in HU and cannot be compared between studies.`}</li>
            {keadaan.ditolak.length > 0 && <li className="text-amber-700 dark:text-amber-300">· {keadaan.ditolak.length} file{keadaan.ditolak.length === 1 ? '' : 's'} refused and left out rather than interpolated over: {keadaan.ditolak.slice(0, 3).join(' · ')}</li>}
            <li>· Educational and research use. This is not a diagnostic workstation and nothing here is a clinical finding.</li>
          </ul>
        </div>
      )}
    </div>
  )
}
