import { useMemo, useState } from 'react'
import Molecule3D from '../../components/Molecule3D'
import { DRUG_TARGETS, moleculeOf, type DrugTarget } from '../../lib/drugTargets'
import { semuaObat, dosisSkdi } from '../../lib/obatKatalog'
import { ORGAN_FOCUS } from '../../lib/organFocus'
import { CARDIO_CONDITIONS } from '../../lib/cardioPathology'
import { SYSTEM_CONDITIONS } from '../../lib/specialtyPathology'

// ─────────────────────────────────────────────────────────────────────────────
// RUANG MOLEKUL — ujung terkecil dari rantai yang sama.
//
//   molekul 3D → target → apa yang terjadi di sana → organ pada figur
//   → penyakit di atlas patologi → catatan obat di katalog yang sudah ada
//
// Molekulnya bukan gambar: koordinatnya dihitung RDKit dari SMILES tiap obat
// dan hanya ditulis setelah rumus serta massa molekulnya cocok dengan nilai
// rujukan (scripts/molekul.py). Sifat di panel bawah dihitung dari struktur
// yang sama, jadi ia menerangkan molekul yang sedang diputar di layar — bukan
// angka yang disalin dari tempat lain.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onBukaOrgan?: (organKey: string) => void
  /** Obat yang langsung dibuka — dipakai saat datang dari pencarian atlas. */
  awal?: string | null
}

const KELAS: Array<{ key: DrugTarget['targetKelas'] | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'receptor', label: 'Receptors' },
  { key: 'enzyme', label: 'Enzymes' },
  { key: 'channel', label: 'Ion channels' },
  { key: 'transporter', label: 'Transporters' },
  { key: 'nucleic acid', label: 'DNA' },
  { key: 'cell wall', label: 'Cell wall' },
]

const labelOrgan = (k: string) => ORGAN_FOCUS.find((o) => o.key === k)?.label ?? k

function labelKondisi(id: string): { label: string; where: string } | null {
  const c = CARDIO_CONDITIONS.find((x) => x.id === id)
  if (c) return { label: c.label, where: 'Cardio lab' }
  const s = SYSTEM_CONDITIONS.find((x) => x.id === id)
  if (s) return { label: s.label, where: 'Specialty labs' }
  return null
}

function Chip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[32px] shrink-0 rounded-full border px-3 text-[11.5px] font-bold transition ${
        aktif ? 'border-brand bg-brand text-white'
              : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
      }`}
    >
      {children}
    </button>
  )
}

export function MolecularLab({ onBukaOrgan, awal = null }: Props) {
  const [kelas, setKelas] = useState<DrugTarget['targetKelas'] | 'all'>('all')
  const [pilih, setPilih] = useState<string>(awal ?? 'aspirin')
  const [tanpaH, setTanpaH] = useState(true)

  const daftar = useMemo(
    () => DRUG_TARGETS.filter((d) => kelas === 'all' || d.targetKelas === kelas),
    [kelas],
  )
  const obat = DRUG_TARGETS.find((d) => d.id === pilih) ?? daftar[0] ?? DRUG_TARGETS[0]
  const mol = moleculeOf(obat)
  const katalog = useMemo(() => semuaObat().find((o) => o.nama === obat.katalog), [obat])
  const dosis = useMemo(() => dosisSkdi(obat.katalog).slice(0, 3), [obat])

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-black text-ink dark:text-white">Molecular pharmacology</h2>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-500">
          {DRUG_TARGETS.length} drugs in real 3D. Follow one molecule to the protein it binds, the organ where that
          happens, and the disease in the pathology atlas it is used against.
        </p>
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {KELAS.map((k) => (
          <Chip key={k.key} aktif={kelas === k.key} onClick={() => setKelas(k.key)}>{k.label}</Chip>
        ))}
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {daftar.map((d) => (
          <Chip key={d.id} aktif={obat.id === d.id} onClick={() => setPilih(d.id)}>
            {moleculeOf(d)?.name ?? d.id}
          </Chip>
        ))}
      </div>

      <Molecule3D id={obat.id} tanpaH={tanpaH} />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-neutral-500">
          {mol?.name} · {mol?.formula}
        </span>
        <button
          onClick={() => setTanpaH(!tanpaH)}
          className="min-h-[32px] rounded-full border border-neutral-200 px-3 text-[11px] font-bold text-neutral-600 dark:border-white/10 dark:text-neutral-300"
        >
          {tanpaH ? 'Show hydrogens' : 'Hide hydrogens'}
        </button>
      </div>

      {mol && (
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { l: 'Mass', v: `${mol.mass}`, s: 'g/mol' },
            { l: 'Heavy atoms', v: `${mol.heavyAtoms}`, s: '' },
            { l: 'Rings', v: `${mol.rings}`, s: '' },
            { l: 'logP', v: `${mol.logP}`, s: '' },
            { l: 'H-bond donors', v: `${mol.hbd}`, s: '' },
            { l: 'Polar surface', v: `${mol.tpsa}`, s: 'Å²' },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-neutral-50 p-2 text-center dark:bg-white/5">
              <div className="text-[13px] font-black tabular-nums text-ink dark:text-white">{x.v}</div>
              <div className="t-mikro text-neutral-500">{x.l}{x.s ? ` (${x.s})` : ''}</div>
            </div>
          ))}
        </div>
      )}

      <section className="space-y-2.5 rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
        <div>
          <div className="t-mikro font-bold uppercase tracking-wide text-brand">Molecular target</div>
          <h3 className="text-sm font-black text-ink dark:text-white">{obat.target}</h3>
          <p className="mt-0.5 text-[10.5px] uppercase tracking-wide text-neutral-400">{obat.targetKelas}</p>
        </div>

        <div>
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">What happens when it binds</div>
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{obat.aksi}</p>
        </div>

        <div>
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Where it acts</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {obat.sites.map((s) => (
              <button
                key={s}
                onClick={() => onBukaOrgan?.(s)}
                className="rounded-full border border-brand/40 bg-brand/10 px-2 py-1 text-[10.5px] font-bold text-brand"
              >
                {labelOrgan(s)}
              </button>
            ))}
          </div>
        </div>

        {obat.efekSamping.length > 0 && (
          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-amber-500">Where the harm shows up</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {obat.efekSamping.map((s) => (
                <button
                  key={s}
                  onClick={() => onBukaOrgan?.(s)}
                  className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10.5px] font-semibold text-amber-700 dark:text-amber-300"
                >
                  {labelOrgan(s)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Used against</div>
          <ul className="mt-1 space-y-1">
            {obat.mengobati.map((id) => {
              const k = labelKondisi(id)
              if (!k) return null
              return (
                <li key={id} className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2 py-1.5 dark:bg-white/5">
                  <span className="text-[11.5px] font-semibold text-ink dark:text-white">{k.label}</span>
                  <span className="shrink-0 text-[10px] text-neutral-400">{k.where}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-xl bg-red-500/[0.06] p-2">
          <div className="t-mikro font-bold uppercase tracking-wide text-red-500">Safety</div>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-700 dark:text-neutral-200">{obat.peringatan}</p>
        </div>

        {katalog && (
          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">In the drug catalogue</div>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              <b>{katalog.nama}</b> — {katalog.kelas}. {katalog.untuk}
              {katalog.eml && <span className="ml-1 font-bold text-brand">WHO essential medicine</span>}
            </p>
            {katalog.catatan && (
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{katalog.catatan}</p>
            )}
            {dosis.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {dosis.map((d) => (
                  <li key={d.keluhan + d.dosis} className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                    <b>{d.keluhan}</b> — {d.dosis}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="text-[10px] leading-relaxed text-neutral-400">
          Conformer computed with RDKit (ETKDG + MMFF94) from the recorded SMILES; written only after the molecular
          formula and mass matched their reference values. Properties above are computed from that same structure.
          Educational material, not prescribing advice.
        </p>
      </section>
    </div>
  )
}

export default MolecularLab
