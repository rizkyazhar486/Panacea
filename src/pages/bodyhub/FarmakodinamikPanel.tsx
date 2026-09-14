import { useEffect, useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import { hill, konsentrasiUntukEfek, blissIndependen, indeksKombinasiLoewe, bebanSetimbang, langkahBeban, type ParameterSenesens } from '../../lib/farmakodinamik'
import { FaersOrganMap } from './FaersOrganMap'

const W = 320
const H = 200
const KIRI = 34
const BAWAH = 26
const LOG_MIN = -2
const LOG_MAKS = 2
const x = (l: number) => KIRI + ((l - LOG_MIN) / (LOG_MAKS - LOG_MIN)) * (W - KIRI - 10)
const y = (e: number) => H - BAWAH - e * (H - BAWAH - 12)

function jalurHill(n: number) {
  const titik: string[] = []
  for (let l = LOG_MIN; l <= LOG_MAKS + 1e-9; l += 0.05) {
    const e = hill(Math.pow(10, l), 1, n)
    titik.push(`${titik.length ? 'L' : 'M'}${x(l).toFixed(1)} ${y(e).toFixed(1)}`)
  }
  return titik.join(' ')
}

function KurvaHill({ n, konsentrasi }: { n: number; konsentrasi: number }) {
  const logC = Math.log10(konsentrasi)
  const efek = hill(konsentrasi, 1, n)
  const c20 = konsentrasiUntukEfek(0.2, 1, n)
  const c80 = konsentrasiUntukEfek(0.8, 1, n)
  return <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`Dose-response curve. Hill coefficient ${n.toFixed(1)}. At ${konsentrasi.toFixed(2)} times EC50 the effect is ${(efek * 100).toFixed(0)} per cent of maximum.`}>
    <rect x={x(Math.log10(c20))} y={12} width={Math.max(x(Math.log10(c80)) - x(Math.log10(c20)), 0)} height={H - BAWAH - 12} fill="#00BF63" opacity={0.12} />
    {Math.abs(n - 1) > 0.05 && <path d={jalurHill(1)} fill="none" stroke="currentColor" strokeWidth={1} className="text-neutral-400" strokeDasharray="3 3" opacity={0.55} />}
    <path d={jalurHill(n)} fill="none" stroke="#00BF63" strokeWidth={2} />
    <line x1={KIRI} y1={H - BAWAH} x2={W - 10} y2={H - BAWAH} stroke="currentColor" className="text-neutral-400" />
    <line x1={KIRI} y1={12} x2={KIRI} y2={H - BAWAH} stroke="currentColor" className="text-neutral-400" />
    <line x1={x(0)} y1={12} x2={x(0)} y2={H - BAWAH} stroke="currentColor" className="text-neutral-500" strokeDasharray="2 3" opacity={0.7} />
    {[-2, -1, 0, 1, 2].map((l) => <text key={l} x={x(l)} y={H - BAWAH + 13} textAnchor="middle" className="fill-neutral-500 text-[8px] font-bold">{l === 0 ? 'EC50' : `${Math.pow(10, l)}×`}</text>)}
    {[0, 0.5, 1].map((e) => <text key={e} x={KIRI - 4} y={y(e) + 3} textAnchor="end" className="fill-neutral-500 text-[8px] font-bold">{(e * 100).toFixed(0)}</text>)}
    <circle cx={x(logC)} cy={y(efek)} r={6} fill="#00BF63" opacity={0.25} /><circle cx={x(logC)} cy={y(efek)} r={3.5} fill="#00BF63" />
  </svg>
}

function Geser({ label, nilai, min, maks, langkah, onUbah, satuan }: { label: string; nilai: number; min: number; maks: number; langkah: number; onUbah: (n: number) => void; satuan: string }) {
  return <div className="mt-2"><label className="flex items-baseline justify-between text-[11px] font-bold text-ink dark:text-white"><span>{label}</span><span className="font-[var(--font-angka)] text-neutral-500">{nilai} {satuan}</span></label><input type="range" min={min} max={maks} step={langkah} value={nilai} onChange={(e) => onUbah(Number(e.target.value))} aria-label={label} className="mt-1 w-full accent-[#00BF63]" /></div>
}

function Angka({ nilai, satuan, label }: { nilai: string; satuan?: string; label: string }) {
  return <div className="rounded-2xl bg-[var(--pelatih-alas-1,rgba(15,23,42,0.04))] px-3 py-2"><div className="font-[var(--font-angka)] text-[17px] font-black leading-none tracking-tight text-ink dark:text-white">{nilai}{satuan && <span className="ml-1 text-[10px] font-bold opacity-60">{satuan}</span>}</div><div className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-neutral-500">{label}</div></div>
}

const RUJUKAN_SENESENS: ParameterSenesens = { produksi: 0.004, pembersihanAlami: 0.05 }

export function FarmakodinamikPanel() {
  const [n, setN] = useState(1)
  const [konsentrasi, setKonsentrasi] = useState(1)
  const [efekB, setEfekB] = useState(0.4)
  const [efekGabungan, setEfekGabungan] = useState(0.7)
  const [senolitik, setSenolitik] = useState(0)
  const [beban, setBeban] = useState(bebanSetimbang(RUJUKAN_SENESENS))
  const efekA = hill(konsentrasi, 1, n)
  const c20 = konsentrasiUntukEfek(0.2, 1, n)
  const c80 = konsentrasiUntukEfek(0.8, 1, n)
  const rasio = c80 / c20
  const bliss = blissIndependen(efekA, efekB)
  const ci = useMemo(() => indeksKombinasiLoewe(konsentrasi, 1, n, efekB, 1, n, efekGabungan), [konsentrasi, n, efekB, efekGabungan])

  useEffect(() => {
    const dt = 0.25
    const jam = setInterval(() => setBeban((b) => langkahBeban(b, RUJUKAN_SENESENS, dt, senolitik)), 60)
    return () => clearInterval(jam)
  }, [senolitik])

  const setimbangBaru = bebanSetimbang(RUJUKAN_SENESENS, senolitik)
  return <div className="space-y-4">
    <div><h3 className="text-sm font-black text-ink dark:text-white">Dose, response, and steepness</h3><Prosa kelas="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">The Hill coefficient does not move EC50, yet it changes the shape of the response window. The green band makes the 20–80% span visible instead of hiding it in a table.</Prosa></div>
    <KurvaHill n={n} konsentrasi={konsentrasi} />
    <Geser label="Hill coefficient" nilai={n} min={0.5} maks={4} langkah={0.1} onUbah={setN} satuan="" />
    <Geser label="Concentration" nilai={konsentrasi} min={0.05} maks={20} langkah={0.05} onUbah={setKonsentrasi} satuan="× EC50" />
    <div className="grid grid-cols-3 gap-2"><Angka nilai={(efekA * 100).toFixed(0)} satuan="%" label="Effect" /><Angka nilai={rasio.toFixed(1)} satuan="×" label="C80 / C20" /><Angka nilai={Math.pow(16, 1 / n).toFixed(1)} satuan="×" label="16^(1/n)" /></div>
    <p className="text-[11px] leading-relaxed text-neutral-500">C80/C20 = 16^(1/n). At n = 1 the 20–80% concentration span is sixteen-fold; at n = 4 it is two-fold.</p>

    <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3"><div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">Two agents together</div><Geser label="Effect of the second agent alone" nilai={efekB} min={0} maks={0.95} langkah={0.05} onUbah={setEfekB} satuan="" /><Geser label="Observed combined effect" nilai={efekGabungan} min={0} maks={0.99} langkah={0.01} onUbah={setEfekGabungan} satuan="" /><div className="mt-3 grid grid-cols-3 gap-2"><Angka nilai={(bliss * 100).toFixed(0)} satuan="%" label="Bliss expected" /><Angka nilai={(efekGabungan * 100).toFixed(0)} satuan="%" label="Observed" /><Angka nilai={Number.isFinite(ci) ? ci.toFixed(2) : '—'} label="Loewe index" /></div><p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">Bliss is an independence reference, not proof of synergy. The Loewe index asks how much of each dose is being spent relative to its own curve.</p></div>

    <div className="rounded-2xl border border-[var(--pelatih-garis,rgba(15,23,42,0.10))] p-3"><div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">A cleared pool refills</div><Geser label="Added clearance" nilai={senolitik} min={0} maks={0.4} langkah={0.01} onUbah={setSenolitik} satuan="/time" /><div className="mt-3 grid grid-cols-3 gap-2"><Angka nilai={(beban * 100).toFixed(2)} satuan="%" label="Burden now" /><Angka nilai={(setimbangBaru * 100).toFixed(2)} satuan="%" label="Settles at" /><Angka nilai={(bebanSetimbang(RUJUKAN_SENESENS) * 100).toFixed(2)} satuan="%" label="Untreated" /></div><p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">Production continues while clearance runs, so the pool approaches a new equilibrium rather than disappearing. Returning clearance to baseline carries it back toward baseline equilibrium.</p></div>

    <FaersOrganMap />

    <Prosa><p className="text-[11px] leading-relaxed text-neutral-500">Mechanism and reporting context, not medicine. The Hill/Bliss/Loewe controls are dimensionless teaching simulations. The FAERS panel shows public spontaneous-report aggregates and does not establish expected side effects, causality, incidence, comparative risk, diagnosis, or a prediction for any person.</p></Prosa>
  </div>
}
