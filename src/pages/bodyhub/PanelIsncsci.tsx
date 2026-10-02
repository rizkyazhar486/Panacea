import { useMemo, useState } from 'react'
import {
  klasifikasiIsncsci, sisiDariPola, DERMATOM, MIOTOM, OTOT_KUNCI, SUMBER_ISNCSCI,
  type Miotom, type SkorMotor, type Level,
} from '../../lib/isncsci'

// Latihan klasifikasi ISNCSCI (revisi 2011) di dalam domain Localization.
// Pengguna mengetik pola pemeriksaan; mesin menghitung level, NLI, AIS dan ZPP
// dari aturan sumber. Bukan diagnosis, tidak melihat pasien.

type Pola = { level: Level; bawah: 0 | 1; motor: Record<Miotom, SkorMotor> }
const MOTOR_PENUH = Object.fromEntries(MIOTOM.map((m) => [m, 5])) as Record<Miotom, SkorMotor>
const LEVEL: Level[] = ['C1', ...DERMATOM, 'INT']
const NILAI: SkorMotor[] = [0, 1, 2, 3, 4, 5, 'NT']

const KASUS: Array<{ judul: string; kanan: Pola; kiri: Pola; vac: boolean; dap: boolean }> = [
  { judul: 'C5, no sacral sparing', vac: false, dap: false,
    kanan: { level: 'C5', bawah: 0, motor: { ...MOTOR_PENUH, C6: 0, C7: 0, C8: 0, T1: 0, L2: 0, L3: 0, L4: 0, L5: 0, S1: 0 } },
    kiri: { level: 'C5', bawah: 0, motor: { ...MOTOR_PENUH, C6: 0, C7: 0, C8: 0, T1: 0, L2: 0, L3: 0, L4: 0, L5: 0, S1: 0 } } },
  { judul: 'T10, anal contraction, legs antigravity', vac: true, dap: true,
    kanan: { level: 'T10', bawah: 1, motor: { ...MOTOR_PENUH, L2: 3, L3: 3, L4: 3, L5: 2, S1: 3 } },
    kiri: { level: 'T10', bawah: 1, motor: { ...MOTOR_PENUH, L2: 3, L3: 2, L4: 3, L5: 3, S1: 3 } } },
]

function EditorSisi({ nama, pola, ubah }: { nama: string; pola: Pola; ubah: (p: Pola) => void }) {
  return (
    <fieldset className="min-w-0 space-y-1.5">
      <legend className="text-[11px] font-black uppercase text-neutral-500">{nama}</legend>
      <label className="flex flex-col gap-0.5 text-[11px]">Sensation intact to
        <select value={pola.level} onChange={(e) => ubah({ ...pola, level: e.target.value })} className="min-h-9 w-full rounded-lg border bg-transparent px-1 text-[12px]">
          {LEVEL.map((l) => <option key={l}>{l}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-0.5 text-[11px]">Below that
        <select value={pola.bawah} onChange={(e) => ubah({ ...pola, bawah: Number(e.target.value) as 0 | 1 })} className="min-h-9 w-full rounded-lg border bg-transparent px-1 text-[12px]">
          <option value={0}>absent (0)</option><option value={1}>altered (1)</option>
        </select>
      </label>
      {MIOTOM.map((m) => (
        <label key={m} className="flex items-center justify-between gap-1 text-[11px]" title={OTOT_KUNCI[m]}>{m}
          <select aria-label={`${nama} ${m} ${OTOT_KUNCI[m]}`} value={String(pola.motor[m])}
            onChange={(e) => ubah({ ...pola, motor: { ...pola.motor, [m]: e.target.value === 'NT' ? 'NT' : Number(e.target.value) as SkorMotor } })}
            className="min-h-9 rounded-lg border bg-transparent px-1 text-[12px]">
            {NILAI.map((v) => <option key={String(v)}>{String(v)}</option>)}
          </select>
        </label>
      ))}
    </fieldset>
  )
}

export function PanelIsncsci() {
  const [kanan, setKanan] = useState<Pola>(KASUS[0].kanan)
  const [kiri, setKiri] = useState<Pola>(KASUS[0].kiri)
  const [vac, setVac] = useState(false)
  const [dap, setDap] = useState(false)
  const hasil = useMemo(() => klasifikasiIsncsci({
    kanan: sisiDariPola(kanan.level, kanan.bawah, kanan.motor),
    kiri: sisiDariPola(kiri.level, kiri.bawah, kiri.motor), vac, dap,
  }), [kanan, kiri, vac, dap])

  return (
    <section data-isncsci className="space-y-2 rounded-2xl border border-neutral-200 p-3 dark:border-white/10" aria-label="Spinal cord injury classification (ISNCSCI)">
      <h3 className="text-sm font-black text-ink dark:text-white">Spinal cord level (ISNCSCI 2011)</h3>
      <p className="text-[11px] text-neutral-500">Type an exam pattern to practise classification — teaching only, not a diagnosis.</p>
      <div className="flex flex-wrap gap-1.5">
        {KASUS.map((k) => (
          <button key={k.judul} type="button" onClick={() => { setKanan(k.kanan); setKiri(k.kiri); setVac(k.vac); setDap(k.dap) }}
            className="min-h-9 rounded-full border px-3 text-[11px] font-bold">{k.judul}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <EditorSisi nama="Right" pola={kanan} ubah={setKanan} />
        <EditorSisi nama="Left" pola={kiri} ubah={setKiri} />
      </div>
      <div className="flex gap-3 text-[12px]">
        <label className="flex min-h-9 items-center gap-1.5"><input type="checkbox" checked={vac} onChange={(e) => setVac(e.target.checked)} />Voluntary anal contraction</label>
        <label className="flex min-h-9 items-center gap-1.5"><input type="checkbox" checked={dap} onChange={(e) => setDap(e.target.checked)} />Deep anal pressure</label>
      </div>
      <div role="status" data-isncsci-hasil className="rounded-xl bg-neutral-50 p-2.5 text-[12px] dark:bg-white/5">
        {hasil.ok ? (
          <>
            <p className="font-black text-ink dark:text-white">NLI {hasil.nilai.nli} · AIS {hasil.nilai.ais === 'tidak-berlaku' ? 'not applicable' : hasil.nilai.ais}</p>
            <p className="mt-0.5 text-neutral-600 dark:text-neutral-300">Sensory R {hasil.nilai.sensori.kanan} / L {hasil.nilai.sensori.kiri} · Motor R {hasil.nilai.motor.kanan} / L {hasil.nilai.motor.kiri}</p>
            <p className="mt-0.5 text-neutral-600 dark:text-neutral-300">{hasil.nilai.alasanAis}</p>
            {hasil.nilai.zpp !== 'NA' && <p className="mt-0.5 text-neutral-600 dark:text-neutral-300">ZPP sensory R {hasil.nilai.zpp.sensoriKanan} / L {hasil.nilai.zpp.sensoriKiri} · motor R {hasil.nilai.zpp.motorKanan} / L {hasil.nilai.zpp.motorKiri}</p>}
            {hasil.nilai.skor && <p className="mt-0.5 text-neutral-500">UEMS {hasil.nilai.skor.uemsKanan + hasil.nilai.skor.uemsKiri}/50 · LEMS {hasil.nilai.skor.lemsKanan + hasil.nilai.skor.lemsKiri}/50</p>}
          </>
        ) : <p className="font-bold text-amber-700 dark:text-amber-400">Cannot classify: {hasil.alasan}</p>}
      </div>
      <p className="text-[10px] text-neutral-400">
        Rules from {SUMBER_ISNCSCI.sitasi} (<a className="underline" href={`https://doi.org/${SUMBER_ISNCSCI.doi}`} target="_blank" rel="noreferrer">doi</a>). 2019 revision changes are not applied. Sensation is entered as one pattern for light touch and pin prick; non-key muscles are not entered.
      </p>
    </section>
  )
}
