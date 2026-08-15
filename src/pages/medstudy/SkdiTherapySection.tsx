import { useMemo, useState } from 'react'
import { Prosa } from '../../components/Prosa'
import { Card, SectionTitle, Badge } from '../../components/ui'
import { IconActivity } from '../../components/icons'
import { SKDI_ENTRIES, SKDI_SYSTEMS, EPONYM_ENTRIES, type SkdiSystem } from '../../lib/skdiTherapyReference'
import { RantaiObat } from '../../components/RantaiObat'
import {
  BAGIAN_RESEP, SINGKATAN_RESEP, ATURAN_RESEP, CONTOH_RESEP, KESALAHAN_RESEP, PERINGATAN_RESEP,
} from '../../lib/resepDokter'

type TherapyTab = 'therapy' | 'eponym' | 'resep'
export default function SkdiTherapySection({ cariAwal = '' }: { cariAwal?: string }) {
  const [tab, setTab] = useState<TherapyTab>('therapy')
  const [query, setQuery] = useState(cariAwal)
  const [system, setSystem] = useState<SkdiSystem | null>(null)

  const filteredTherapy = useMemo(() => {
    const q = query.toLowerCase().trim()
    return SKDI_ENTRIES.filter((e) => {
      if (system && e.system !== system) return false
      if (!q) return true
      // Sinonim ikut dicari: yang diketik orang adalah singkatan yang dipakai
      // di stasiun ("UAP", "GNAPS", "BV"), bukan nama panjang di daftar SKDI.
      return `${e.diagnosis} ${e.classification ?? ''} ${e.therapy} ${e.system} ${(e.sinonim ?? []).join(' ')}`
        .toLowerCase()
        .includes(q)
    })
  }, [query, system])

  const groupedTherapy = useMemo(() => {
    const map = new Map<SkdiSystem, typeof SKDI_ENTRIES>()
    for (const e of filteredTherapy) {
      if (!map.has(e.system)) map.set(e.system, [])
      map.get(e.system)!.push(e)
    }
    return Array.from(map.entries())
  }, [filteredTherapy])

  const filteredEponym = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return EPONYM_ENTRIES
    return EPONYM_ENTRIES.filter((e) => `${e.diagnosis} ${e.keyword}`.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="space-y-4">
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="SKDI Therapy Reference" subtitle="Tatalaksana per diagnosis, dan kata kunci/eponim klasik" />
        <p className="mt-2 text-[13px] leading-relaxed text-amber-700 dark:text-amber-300">
          Materi belajar untuk persiapan ujian — <b>bukan alat resep</b>. Selalu cross-check dosis
          terkini terhadap PIONAS/farmakologi, formularium institusi, dan supervisor klinis sebelum
          pemakaian klinis nyata.
        </p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setTab('therapy')} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${tab === 'therapy' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Tatalaksana</button>
          <button onClick={() => setTab('eponym')} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${tab === 'eponym' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Kata Kunci / Eponim</button>
          <button onClick={() => setTab('resep')} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${tab === 'resep' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>✍️ Menulis Resep</button>
        </div>
        <input
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
          placeholder="Cari diagnosis atau terapi…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {tab === 'therapy' && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setSystem(null)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${!system ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>Semua</button>
            {SKDI_SYSTEMS.map((s) => (
              <button key={s} onClick={() => setSystem(s)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${system === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>{s}</button>
            ))}
          </div>
        )}
      </Card>

      {tab === 'therapy' && groupedTherapy.map(([sys, entries]) => (
        <Card key={sys} className="!p-4">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">{sys}</div>
          <div className="mt-2 space-y-2">
            {entries.map((e, i) => (
              <div key={i} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="text-[13px] font-bold text-ink dark:text-white">{e.diagnosis}{e.classification ? ` — ${e.classification}` : ''}</div>
                <p className="mt-1 text-[12px] text-neutral-500">{e.therapy}</p>
                {/* Mekanisme tiap obat yang disebut di atas — dilipat supaya
                    tidak mengubur dosisnya, yang justru paling sering dicari. */}
                <RantaiObat terapi={e.therapy} />
              </div>
            ))}
          </div>
        </Card>
      ))}
      {tab === 'resep' && <PanelResep />}

      {tab === 'therapy' && filteredTherapy.length === 0 && <p className="text-center text-[13px] text-neutral-500">Tidak ada hasil.</p>}

      {tab === 'eponym' && (
        <Card className="!p-4">
          <div className="space-y-2">
            {filteredEponym.map((e, i) => (
              <div key={i} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="text-[13px] font-bold text-ink dark:text-white">{e.diagnosis}</div>
                <p className="mt-1 text-[12px] text-neutral-500">{e.keyword}</p>
              </div>
            ))}
            {filteredEponym.length === 0 && <p className="text-center text-[13px] text-neutral-500">Tidak ada hasil.</p>}
          </div>
        </Card>
      )}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Direkap dari referensi tatalaksana SKDI/UKMPPD, digunakan dengan izin pemilik konten. Bantuan
        belajar untuk ujian — bukan pengganti panduan farmakologi resmi atau penilaian klinis.
      </div>
    </div>
  )
}

/**
 * Menulis resep — stasiun OSCE tersendiri yang sebelumnya tidak ada di sini.
 *
 * Yang diajarkan adalah CARA MENULIS, bukan obat apa yang dipilih. Karena itu
 * contohnya memakai isian kosong pada nama dokter, nomor SIP, dan nama pasien:
 * resep yang tampak sah dan dapat ditebus bukan hal yang pantas diedarkan
 * sebagai bahan belajar.
 */
function PanelResep() {
  return (
    <div className="space-y-4">
      <Card className="!border-amber-500/40 !bg-amber-500/5">
        <p className="text-[12px] leading-relaxed text-amber-800 dark:text-amber-200">{PERINGATAN_RESEP}</p>
      </Card>

      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Anatomi resep</div>
        <Prosa kelas="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">Enam bagian, ditulis dari atas ke bawah. Apotek membacanya dengan urutan ini, jadi bagian yang tertukar tempatnya memperlambat pembacaan justru saat resep paling perlu cepat.</Prosa>
        <div className="mt-3 space-y-2">
          {BAGIAN_RESEP.map((b, i) => (
            <div key={b.nama} className="rounded-xl bg-white/60 p-3 dark:bg-white/5">
              <div className="flex items-baseline gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[10px] font-black text-brand-dark">{i + 1}</span>
                <span className="text-[13px] font-black text-ink dark:text-white">{b.nama}</span>
                <span className="text-[11px] text-neutral-500">{b.arti}</span>
                {b.wajib && <Badge tone="critical">wajib</Badge>}
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{b.penjelasan}</p>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/5 p-2 font-mono text-[11px] leading-relaxed text-ink dark:bg-black/30 dark:text-white">{b.contoh}</pre>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Contoh resep</div>
        <p className="mt-1 text-[12px] text-neutral-500">Contoh BENTUK penulisan — bukan anjuran terapi.</p>
        <div className="mt-3 space-y-2">
          {CONTOH_RESEP.map((c) => (
            <div key={c.id} className="rounded-xl bg-white/60 p-3 dark:bg-white/5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-black text-ink dark:text-white">{c.kasus}</span>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-black uppercase text-neutral-600 dark:bg-white/10">{c.sistem}</span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{c.alasan}</p>
              <pre className="mt-2 overflow-x-auto whitespace-pre rounded-lg bg-black/5 p-3 font-mono text-[11px] leading-relaxed text-ink dark:bg-black/30 dark:text-white">{c.baris.join('\n') + '\n\n' + c.pro}</pre>
              {c.jebakan && (
                <p className="mt-2 rounded-lg bg-rose-500/10 p-2 text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
                  <b>Jebakan:</b> {c.jebakan}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Aturan yang membuat resep aman</div>
        <div className="mt-2 space-y-2">
          {ATURAN_RESEP.map((a) => (
            <div key={a.judul} className={`rounded-xl p-3 ${a.berat === 'wajib' ? 'bg-rose-500/10' : a.berat === 'penting' ? 'bg-amber-500/10' : 'bg-white/60 dark:bg-white/5'}`}>
              <div className="text-[12px] font-black text-ink dark:text-white">{a.judul}</div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{a.isi}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Salah vs benar</div>
        <div className="mt-2 space-y-1.5">
          {KESALAHAN_RESEP.map((k) => (
            <div key={k.salah} className="rounded-xl bg-white/60 p-2.5 dark:bg-white/5">
              <div className="font-mono text-[11px] text-rose-600 dark:text-rose-400">✗ {k.salah}</div>
              <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">✓ {k.benar}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{k.kenapa}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">Singkatan Latin</div>
        <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {SINGKATAN_RESEP.map((x) => (
            <div key={x.singkatan} className="flex items-baseline gap-2 rounded-lg bg-white/60 px-2.5 py-1.5 dark:bg-white/5">
              <span className="w-20 shrink-0 font-mono text-[11px] font-bold text-brand-dark">{x.singkatan}</span>
              <span className="min-w-0 flex-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                <i>{x.latin}</i> — {x.arti}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
