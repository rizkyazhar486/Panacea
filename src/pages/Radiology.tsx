import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconSearch, IconActivity } from '../components/icons'
import {
  bacaDicom, terapkanJendela, jendelaAwal, urutkanSeri, nilaiDi, tafsirHu,
  JENDELA_CT, type Citra,
} from '../lib/dicom'

// ─────────────────────────────────────────────────────────────────────────────
// RADIOLOGI — pembaca DICOM untuk berkas milik pengguna sendiri.
//
// Tidak ada satu pun citra bawaan di halaman ini, dan itu disengaja. Gambar
// contoh yang terlihat seperti CT tetapi bukan CT pasiennya tidak berguna bagi
// siapa pun, dan pada radiologi ia lebih buruk daripada kosong: gambar yang
// bukan miliknya tetap terbaca sebagai temuan.
//
// Seluruh pembacaan terjadi di dalam peramban. Berkas tidak pernah diunggah,
// karena citra medis adalah data paling mudah dikenali kembali yang dimiliki
// seseorang — mengirimnya ke server hanya untuk ditampilkan adalah risiko
// tanpa imbalan.
// ─────────────────────────────────────────────────────────────────────────────

interface Irisan { nama: string; citra: Citra }

export function Radiology() {
  const [irisan, setIrisan] = useState<Irisan[]>([])
  const [ditolak, setDitolak] = useState<Array<{ nama: string; alasan: string }>>([])
  const [indeks, setIndeks] = useState(0)
  const [bingkai, setBingkai] = useState(0)
  const [pusat, setPusat] = useState(40)
  const [lebar, setLebar] = useState(400)
  const [titik, setTitik] = useState<{ x: number; y: number; hu: number } | null>(null)
  const [memuat, setMemuat] = useState(false)
  const kanvas = useRef<HTMLCanvasElement>(null)

  const kini = irisan[Math.min(indeks, irisan.length - 1)]?.citra

  const muat = useCallback(async (berkas: FileList | null) => {
    if (!berkas || !berkas.length) return
    setMemuat(true)
    const baik: Irisan[] = []
    const buruk: Array<{ nama: string; alasan: string }> = []
    for (const f of Array.from(berkas)) {
      try {
        const hasil = bacaDicom(await f.arrayBuffer())
        if (hasil.ok) baik.push({ nama: f.name, citra: hasil.data })
        else buruk.push({ nama: f.name, alasan: hasil.alasan })
      } catch (e) {
        buruk.push({ nama: f.name, alasan: e instanceof Error ? e.message : 'Could not be read' })
      }
    }
    const urut = urutkanSeri(baik)
    setIrisan(urut)
    setDitolak(buruk)
    setIndeks(0)
    setBingkai(0)
    if (urut.length) {
      const a = jendelaAwal(urut[0].citra)
      setPusat(a.pusat); setLebar(a.lebar)
    }
    setMemuat(false)
  }, [])

  // Menggambar ulang setiap kali jendela atau irisan berubah. Kanvas dipakai
  // pada ukuran piksel aslinya lalu diregangkan lewat CSS, supaya tidak ada
  // penghalusan yang menambahkan detail yang tidak ada di datanya.
  useEffect(() => {
    const c = kanvas.current
    if (!c || !kini) return
    c.width = kini.kolom; c.height = kini.baris
    const ctx = c.getContext('2d')
    if (!ctx) return
    const abu = terapkanJendela(kini, pusat, lebar, bingkai)
    const gambar = ctx.createImageData(kini.kolom, kini.baris)
    for (let i = 0; i < abu.length; i++) {
      gambar.data[i * 4] = abu[i]; gambar.data[i * 4 + 1] = abu[i]
      gambar.data[i * 4 + 2] = abu[i]; gambar.data[i * 4 + 3] = 255
    }
    ctx.putImageData(gambar, 0, 0)
  }, [kini, pusat, lebar, bingkai])

  const ukur = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const c = kanvas.current
    if (!c || !kini) return
    const kotak = c.getBoundingClientRect()
    const p = 'touches' in e ? e.touches[0] : e
    if (!p) return
    const x = Math.floor(((p.clientX - kotak.left) / kotak.width) * kini.kolom)
    const y = Math.floor(((p.clientY - kotak.top) / kotak.height) * kini.baris)
    const v = nilaiDi(kini, x, y, bingkai)
    setTitik(v == null ? null : { x, y, hu: v })
  }

  const ct = kini?.modalitas === 'CT'
  const mm = useMemo(() => {
    if (!kini?.jarakPiksel) return null
    return `${(kini.kolom * kini.jarakPiksel[1]).toFixed(0)} × ${(kini.baris * kini.jarakPiksel[0]).toFixed(0)} mm`
  }, [kini])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle
          icon={<IconSearch size={20} />}
          title="Radiology viewer"
          subtitle="Opens your own DICOM files — nothing is uploaded, and no sample images are supplied"
        />

        <label className="mt-2 block cursor-pointer rounded-2xl border-2 border-dashed border-brand/40 bg-brand-50/40 px-4 py-6 text-center active:scale-[0.99]">
          <input
            type="file" multiple accept=".dcm,application/dicom" className="hidden"
            onChange={(e) => void muat(e.target.files)}
          />
          <div className="text-2xl">🩻</div>
          <div className="mt-1 text-sm font-bold text-brand-dark">
            {memuat ? 'Reading…' : 'Choose DICOM files'}
          </div>
          <div className="mt-1 text-[11px] leading-snug text-neutral-500">
            Select a whole folder of slices at once — they are ordered by position along the patient axis,
            not by filename. Uncompressed CT, MR, CR and DX.
          </div>
        </label>

        {ditolak.length > 0 && (
          <div className="mt-3 space-y-1 rounded-xl bg-amber-500/10 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
              {ditolak.length} file{ditolak.length > 1 ? 's' : ''} not read
            </div>
            {ditolak.slice(0, 4).map((r) => (
              <div key={r.nama} className="text-[11px] leading-snug text-amber-800 dark:text-amber-300">
                <b>{r.nama}</b> — {r.alasan}
              </div>
            ))}
            {ditolak.length > 4 && (
              <div className="text-[11px] text-amber-800 dark:text-amber-300">…and {ditolak.length - 4} more</div>
            )}
          </div>
        )}
      </Card>

      {kini && (
        <>
          <Card className="!p-3">
            <canvas
              ref={kanvas}
              onMouseMove={ukur}
              onTouchStart={ukur}
              onTouchMove={ukur}
              className="w-full rounded-xl bg-black"
              // Interpolasi dimatikan: menghaluskan citra medis menambahkan
              // tepi yang tidak ada di dalam datanya.
              style={{ imageRendering: 'pixelated', aspectRatio: `${kini.kolom} / ${kini.baris}` }}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500">
              <span>
                <b className="text-ink dark:text-ink">{kini.modalitas}</b> · {kini.kolom}×{kini.baris}
                {mm ? ` · ${mm}` : ''}{kini.tebalIrisMm ? ` · ${kini.tebalIrisMm} mm slice` : ''}
              </span>
              <span>{kini.deskripsiSeri}</span>
            </div>
            {titik && (
              <div className="mt-2 rounded-xl border border-neutral-100 p-2.5 dark:border-white/10">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                    at {titik.x}, {titik.y}
                  </span>
                  <span className="text-lg font-black text-brand-dark">
                    {titik.hu.toFixed(0)}<span className="ml-1 text-[10px] font-bold text-neutral-500">{ct ? 'HU' : 'raw'}</span>
                  </span>
                </div>
                {/* Tanpa satuan Hounsfield, "hipodens" hanyalah kesan. Dengan
                    angkanya, ia bisa dinamai — dan batas penamaannya ikut
                    disebutkan, karena rentangnya memang bertumpang tindih. */}
                <div className="text-[11px] leading-snug text-neutral-500">
                  {ct
                    ? tafsirHu(titik.hu)
                    : 'MR and radiograph values have no absolute scale — the same number means different tissue on a different scanner, so no tissue label is offered here.'}
                </div>
              </div>
            )}
          </Card>

          {irisan.length > 1 && (
            <Card className="!p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Slice</span>
                <span className="text-sm font-bold text-ink dark:text-ink">{indeks + 1} / {irisan.length}</span>
              </div>
              <input
                type="range" min={0} max={irisan.length - 1} value={indeks}
                onChange={(e) => { setIndeks(Number(e.target.value)); setBingkai(0) }}
                aria-label="Slice" className="mt-2 w-full accent-brand"
              />
              <div className="text-[11px] text-neutral-500">
                {kini.posisiZ != null ? `Position ${kini.posisiZ.toFixed(1)} mm along the patient axis` : irisan[indeks]?.nama}
              </div>
            </Card>
          )}

          {kini.bingkai > 1 && (
            <Card className="!p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Frame</span>
                <span className="text-sm font-bold text-ink dark:text-ink">{bingkai + 1} / {kini.bingkai}</span>
              </div>
              <input
                type="range" min={0} max={kini.bingkai - 1} value={bingkai}
                onChange={(e) => setBingkai(Number(e.target.value))}
                aria-label="Frame" className="mt-2 w-full accent-brand"
              />
            </Card>
          )}

          <Card className="!p-5">
            <SectionTitle
              icon={<IconActivity size={20} />}
              title="Window"
              subtitle="What you can see depends entirely on this — one scan holds several different images"
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                Level {Math.round(pusat)}
                <input
                  type="range" min={-1200} max={1500} value={pusat}
                  onChange={(e) => setPusat(Number(e.target.value))}
                  className="mt-1 w-full accent-brand" aria-label="Window level"
                />
              </label>
              <label className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                Width {Math.round(lebar)}
                <input
                  type="range" min={1} max={4000} value={lebar}
                  onChange={(e) => setLebar(Number(e.target.value))}
                  className="mt-1 w-full accent-brand" aria-label="Window width"
                />
              </label>
            </div>

            {ct ? (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  {JENDELA_CT.map((j) => {
                    const aktif = Math.round(pusat) === j.pusat && Math.round(lebar) === j.lebar
                    return (
                      <button
                        key={j.nama}
                        onClick={() => { setPusat(j.pusat); setLebar(j.lebar) }}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold active:scale-95 ${
                          aktif ? 'border-brand bg-brand text-white' : 'border-brand/30 bg-brand-50 text-brand-dark'
                        }`}
                      >
                        {j.nama}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-[11px] leading-snug text-neutral-500">
                  {JENDELA_CT.find((j) => Math.round(pusat) === j.pusat && Math.round(lebar) === j.lebar)?.catatan
                    ?? 'Presets are in Hounsfield units. A narrow window raises contrast and discards everything outside it — a pneumothorax invisible on a mediastinal window is obvious on a lung window.'}
                </p>
              </>
            ) : (
              <p className="mt-3 rounded-xl bg-neutral-100/60 px-3 py-2 text-[11px] leading-snug text-neutral-500 dark:bg-white/5">
                Hounsfield presets are offered for CT only. On {kini.modalitas} the pixel values have no absolute
                scale, so a preset built for CT would be meaningless here — adjust level and width by eye instead.
              </p>
            )}
          </Card>
        </>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        A viewer, not a reporting workstation and not a diagnosis. It performs no measurement calibration,
        no multiplanar reconstruction and no automated detection, and it is not a regulated medical device.
        Images are read in your browser and never leave your device.
      </div>
    </div>
  )
}

export default Radiology
