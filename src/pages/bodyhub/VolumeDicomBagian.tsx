import { useCallback, useRef, useState } from 'react'
import { bacaDicom, urutkanSeri, type Citra } from '../../lib/dicom'
import { buatVolumeMpr } from '../../lib/dicomMpr'
import {
  susunVolumeTekstur, jendelaAwalVolume, BATAS_VOLUME,
  type VolumeTekstur,
} from '../../lib/volumeTekstur'
import { VolumeDicom3D, MODE_RENDER, type ModeRender } from '../../components/VolumeDicom3D'

// Bagian yang BENAR-BENAR MEMBACA berkas dan merendernya dalam tiga dimensi.
//
// Sampai sekarang panel di sebelahnya menjelaskan pipeline DICOM -> 3D tanpa
// menjalankan satu langkahnya pun. Yang di bawah ini menjalankannya: berkas
// dipilih, diurai, disusun menjadi volume, diunggah ke GPU sebagai tekstur 3D,
// lalu ditembus sinar.
//
// Berkasnya TIDAK PERNAH MENINGGALKAN PERAMBAN. Tidak ada unggahan, tidak ada
// jaringan, tidak ada penyimpanan; ia hidup di memori tab ini dan hilang
// ketika tab ditutup.

type Keadaan =
  | { tahap: 'kosong' }
  | { tahap: 'membaca'; jumlah: number }
  | { tahap: 'gagal'; alasan: string }
  | { tahap: 'siap'; tekstur: VolumeTekstur; jumlah: number; modalitas: string; ditolak: string[] }

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

export function VolumeDicomBagian() {
  const [keadaan, setKeadaan] = useState<Keadaan>({ tahap: 'kosong' })
  const [bawah, setBawah] = useState(0)
  const [atas, setAtas] = useState(1)
  const [kepekatan, setKepekatan] = useState(0.12)
  const [mode, setMode] = useState<ModeRender>('volume')
  const [pajanan, setPajanan] = useState(1)
  const masukanRef = useRef<HTMLInputElement | null>(null)

  const muat = useCallback(async (berkas: FileList | null) => {
    if (!berkas || berkas.length === 0) return
    setKeadaan({ tahap: 'membaca', jumlah: berkas.length })

    const citra: Citra[] = []
    const ditolak: string[] = []
    for (const f of Array.from(berkas)) {
      try {
        const hasil = bacaDicom(await f.arrayBuffer())
        // Penolakan DISEBUT per berkas. Sebuah seri yang diam-diam kehilangan
        // separuh irisannya akan tetap dirender, dan lubang yang dihasilkannya
        // terlihat persis seperti temuan.
        if (hasil.ok) citra.push(hasil.data)
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
    setKeadaan({
      tahap: 'siap',
      tekstur: tekstur.tekstur,
      jumlah: citra.length,
      modalitas: citra[0].modalitas,
      ditolak,
    })
  }, [])

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white/70 p-3.5 dark:border-white/10 dark:bg-white/[.03]">
      <div className="text-[10px] font-black uppercase tracking-[.14em] text-neutral-500 dark:text-neutral-400">
        Render a series in 3D
      </div>
      <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-700 dark:text-neutral-200">
        Pick the slices of one uncompressed CT or MR series. They are decoded here, stacked into a volume and
        ray-cast on the GPU. Nothing is uploaded, and no anatomical model is loaded — what appears is the
        contents of those files and nothing else.
      </p>

      <input
        ref={masukanRef}
        type="file"
        multiple
        accept=".dcm,application/dicom"
        onChange={(e) => void muat(e.target.files)}
        className="sr-only"
        aria-label="DICOM slices to render in 3D"
      />
      <button
        type="button"
        onClick={() => masukanRef.current?.click()}
        className="mt-2.5 min-h-11 w-full rounded-xl bg-brand px-4 text-sm font-black text-white"
      >
        Choose DICOM slices
      </button>

      {keadaan.tahap === 'membaca' && (
        <p className="mt-2.5 text-[11.5px] text-neutral-600 dark:text-neutral-300">Decoding {keadaan.jumlah} files…</p>
      )}

      {keadaan.tahap === 'gagal' && (
        <p className="mt-2.5 rounded-xl border border-rose-500/25 bg-rose-500/[.06] p-2.5 text-[11.5px] leading-relaxed text-rose-800 dark:text-rose-200">
          {keadaan.alasan}
        </p>
      )}

      {keadaan.tahap === 'siap' && (
        <div className="mt-3">
          <div className="mb-2.5 flex flex-wrap gap-2">
            {MODE_RENDER.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                aria-pressed={mode === m.id}
                className={`min-h-11 rounded-full border px-4 text-xs font-black ${
                  mode === m.id ? 'border-brand bg-brand text-white' : 'border-neutral-300/70 text-neutral-600 dark:border-white/15 dark:text-neutral-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="mb-2.5 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            {MODE_RENDER.find((m) => m.id === mode)?.catatan}
          </p>
          <VolumeDicom3D
            tekstur={keadaan.tekstur}
            mode={mode}
            pajanan={pajanan}
            ambangBawah={bawah}
            ambangAtas={atas}
            kepekatan={kepekatan}
          />

          {mode === 'radiograf' ? (
            <label className="mt-2 block">
              <span className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white">
                <span>Exposure</span>
                <span className="tabular-nums text-neutral-500">×{pajanan.toFixed(1)}</span>
              </span>
              <input
                type="range" min={0.2} max={4} step={0.1} value={pajanan}
                onChange={(e) => setPajanan(Number(e.target.value))}
                aria-label="Exposure"
                className="mt-1.5 h-11 w-full accent-brand"
              />
              <span className="mt-1 block text-[11px] leading-relaxed text-neutral-500">
                Scales the integrated attenuation. It stands in for tube output and detector gain together, and is
                not a dose in milligray — no dose is computed anywhere here.
              </span>
            </label>
          ) : (
          <>
          <GeserHu
            label={`Lower threshold (${keadaan.modalitas === 'CT' ? 'HU' : 'relative value'})`}
            nilai={bawah} min={keadaan.tekstur.jendela.bawah} maks={atas - 1}
            onUbah={(n) => setBawah(Math.min(n, atas - 1))}
          />
          <GeserHu
            label={`Upper threshold (${keadaan.modalitas === 'CT' ? 'HU' : 'relative value'})`}
            nilai={atas} min={bawah + 1} maks={keadaan.tekstur.jendela.atas}
            onUbah={(n) => setAtas(Math.max(n, bawah + 1))}
          />
          </>
          )}
          {(mode === 'volume' || mode === 'keduanya') && (
          <label className="mt-2 block">
            <span className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white">
              <span>Opacity per step</span>
              <span className="tabular-nums text-neutral-500">{kepekatan.toFixed(2)}</span>
            </span>
            <input
              type="range" min={0.02} max={0.5} step={0.01} value={kepekatan}
              onChange={(e) => setKepekatan(Number(e.target.value))}
              aria-label="Opacity per step"
              className="mt-1.5 h-11 w-full accent-brand"
            />
          </label>
          )}

          <ul className="mt-2.5 space-y-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            <li>
              · {keadaan.jumlah} slices · {keadaan.tekstur.lebar}×{keadaan.tekstur.tinggi}×{keadaan.tekstur.dalam} voxels
              {keadaan.tekstur.susut.some((s) => s > 1) &&
                ` (every ${keadaan.tekstur.susut.join('/')}ᵗʰ voxel kept, to stay under ${BATAS_VOLUME.SISI_MAKS} per axis)`}
            </li>
            <li>
              · Box {keadaan.tekstur.fisikMm.map((m) => Math.round(m)).join(' × ')} mm, drawn to that proportion —
              slice spacing is usually far larger than pixel spacing, and ignoring it would flatten the body.
            </li>
            <li>
              · {keadaan.modalitas === 'CT'
                ? 'Thresholds are Hounsfield units, which are defined against water and air.'
                : `Modality is ${keadaan.modalitas}. Thresholds are raw stored values, NOT Hounsfield units — MRI intensity is not calibrated in HU and cannot be compared between studies.`}
            </li>
            {keadaan.ditolak.length > 0 && (
              <li className="text-amber-700 dark:text-amber-300">
                · {keadaan.ditolak.length} file{keadaan.ditolak.length === 1 ? '' : 's'} refused, and left out of the
                volume rather than interpolated over: {keadaan.ditolak.slice(0, 3).join(' · ')}
              </li>
            )}
            <li>· Educational and research use. This is not a diagnostic workstation and nothing here is a clinical finding.</li>
          </ul>
        </div>
      )}
    </div>
  )
}
