import { useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import {
  tekananUltrafiltrasi, gfrDariStarling, fraksiFiltrasi, klirens,
  neracaTubulus, ekskresiFraksional, RUJUKAN,
} from '../../lib/nefron'

// Panel nefron untuk Body Exposure.
//
// Halaman fisiologi sudah menampilkan rumus klirens dan fraksi filtrasi
// sebagai teks. Rumus yang hanya ditulis tidak bisa dibantah: tidak ada yang
// bisa dimasukkan dan tidak ada yang bisa keluar salah. Di sini gaya Starling
// benar-benar digerakkan, dan GFR-nya ikut.

function Angka({ nilai, satuan, label, nada }: { nilai: string; satuan?: string; label: string; nada?: string }) {
  return (
    <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] px-3 py-2">
      <div className="font-[var(--font-angka)] text-[18px] font-black leading-none tracking-tight" style={{ color: nada }}>
        {nilai}{satuan && <span className="ml-1 text-[10px] font-bold opacity-60">{satuan}</span>}
      </div>
      <div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</div>
    </div>
  )
}

function Geser({ label, nilai, min, maks, onUbah, satuan }: {
  label: string; nilai: number; min: number; maks: number; onUbah: (n: number) => void; satuan: string
}) {
  return (
    <div className="mt-2">
      <label className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white">
        <span>{label}</span>
        <span className="font-[var(--font-angka)] text-neutral-500">{nilai} {satuan}</span>
      </label>
      <input type="range" min={min} max={maks} step={1} value={nilai}
        onChange={(e) => onUbah(Number(e.target.value))}
        aria-label={label} className="mt-1 w-full accent-[#00BF63]" />
    </div>
  )
}

export function NefronPanel() {
  const [pGc, setPGc] = useState(RUJUKAN.starling.hidrostatikKapiler)
  const [pBs, setPBs] = useState(RUJUKAN.starling.hidrostatikBowman)
  const [piGc, setPiGc] = useState(RUJUKAN.starling.onkotikKapiler)

  const starling = useMemo(() => ({
    hidrostatikKapiler: pGc, hidrostatikBowman: pBs, onkotikKapiler: piGc,
  }), [pGc, pBs, piGc])

  const pUf = tekananUltrafiltrasi(starling)
  const gfr = gfrDariStarling(starling, RUJUKAN.kf)
  const ff = fraksiFiltrasi(gfr, RUJUKAN.alirPlasmaGinjal)

  // Natrium sebagai contoh penanganan tubulus, dengan angka plasma/urin tetap.
  const natrium = useMemo(() => {
    const plasma = 140, urin = 70, alirUrin = 1
    const n = neracaTubulus(gfr, plasma, urin, alirUrin)
    const fe = ekskresiFraksional(klirens(urin, alirUrin, plasma), gfr)
    return { ...n, fe }
  }, [gfr])

  const berhenti = gfr === 0

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-black text-ink dark:text-white">Glomerular filtration, from the forces</h3>
        <Prosa kelas="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          GFR is not a property the kidney has; it is what three pressures leave over. Move any of them
          and watch filtration follow. Nothing here is measured from a person, and this does not estimate
          anyone&apos;s kidney function.
        </Prosa>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Angka nilai={pUf.toFixed(0)} satuan="mmHg" label="Net pressure" nada={pUf <= 0 ? '#FF3131' : undefined} />
        <Angka nilai={gfr.toFixed(0)} satuan="mL/min" label="GFR" />
        <Angka nilai={(ff * 100).toFixed(1)} satuan="%" label="Filtration fraction" />
      </div>

      {berhenti && (
        <p className="rounded-2xl border border-[#FF3131]/40 bg-[#FF3131]/[0.08] p-3 text-[12px] leading-relaxed text-[#b21c1c] dark:text-[#ff9b9b]">
          Net pressure has reached zero, so filtration stops. It does not reverse — plasma does not flow
          back out of Bowman&apos;s space, and the model returns zero rather than a negative flow.
        </p>
      )}

      <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <Geser label="Glomerular capillary hydrostatic" nilai={pGc} min={20} maks={80} onUbah={setPGc} satuan="mmHg" />
        <Geser label="Bowman's space hydrostatic" nilai={pBs} min={5} maks={45} onUbah={setPBs} satuan="mmHg" />
        <Geser label="Capillary oncotic" nilai={piGc} min={10} maks={55} onUbah={setPiGc} satuan="mmHg" />
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          Raising Bowman&apos;s pressure is what an obstructed outflow does. Raising capillary oncotic
          pressure is what happens along the length of the capillary as protein-free filtrate leaves —
          which is why filtration slows before the end of the glomerulus is reached.
        </p>
      </div>

      <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] p-3">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">Sodium handling at this GFR</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Angka nilai={natrium.tersaring.toFixed(0)} label="Filtered" />
          <Angka nilai={natrium.reabsorpsiNeto.toFixed(0)} label="Reabsorbed" />
          <Angka nilai={(natrium.fe * 100).toFixed(2)} satuan="%" label="Excreted fraction" />
        </div>
        <Prosa kelas="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
          Filtered minus reabsorbed equals excreted, exactly — the tubule cannot create or destroy
          sodium. Under 2% leaving is normal, and that number is the whole reason a kidney can filter
          the plasma volume many times a day without emptying the body of salt.
        </Prosa>
      </div>

      <p className="text-[11px] leading-relaxed text-neutral-500">
        One uniform nephron is a large simplification: cortical and juxtamedullary nephrons behave
        differently, the medullary gradient is absent here, and there is no tubuloglomerular feedback.
        The population eGFR equation answers a different question and lives elsewhere in the app.
      </p>
    </div>
  )
}

export default NefronPanel
